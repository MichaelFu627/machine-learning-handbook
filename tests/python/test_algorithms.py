import numpy as np
import pytest
from fastapi.testclient import TestClient
from sklearn.datasets import make_blobs
from ml_handbook.algorithms import GMM_EM, Poisson_EM, gradient_descent, metropolis, ols, rss_grid
from ml_handbook.api import app


def test_ols_known_solution_and_singular_case():
    result = ols([-2, -1, 0, 1, 2], [-1, 1, 3, 5, 7])
    assert result['slope'] == pytest.approx(2)
    assert result['intercept'] == pytest.approx(3)
    with pytest.raises(ValueError):
        ols([1, 1, 1], [1, 2, 3])


def test_gradient_stability():
    stable = gradient_descent(.2)
    assert np.all(np.diff(stable[:, 2]) <= 0)
    assert gradient_descent(.55)[-1, 2] > gradient_descent(.55)[0, 2]


def test_quadratic_grid_matches_direct_residuals():
    rng = np.random.default_rng(2)
    X, y, weights = rng.normal(size=(20, 2)), rng.normal(size=20), rng.normal(size=(6, 7, 2))
    direct = ((y[:, None, None] - np.einsum('ni,abi->nab', X, weights)) ** 2).sum(axis=0)
    np.testing.assert_allclose(rss_grid(X, y, weights), direct)


def test_em_normalization_and_likelihood():
    X, _ = make_blobs(n_samples=150, centers=3, random_state=42)
    model = GMM_EM(X, 3)
    for _ in range(25):
        gamma = model.step()
        np.testing.assert_allclose(gamma.sum(axis=1), 1, atol=1e-10)
        assert model.pi.sum() == pytest.approx(1)
        assert np.linalg.eigvalsh(model.covs).min() >= 1e-6 - 1e-10
    assert np.min(np.diff(model.likelihood)) >= -1e-7


def test_poisson_constant_data_remains_finite():
    model = Poisson_EM(np.zeros(100), 3)
    for _ in range(5):
        gamma = model.step()
        assert np.isfinite(gamma).all()
        np.testing.assert_allclose(gamma.sum(axis=1), 1)


def test_metropolis_retention_rejections_and_seed():
    result = metropolis(200, 50, 4, seed=1)
    assert result == metropolis(200, 50, 4, seed=1)
    assert len(result['retained']) == 150
    for i in range(1, 200):
        if not result['accepted'][i]:
            assert result['states'][i] == result['states'][i - 1]
    with pytest.raises(ValueError):
        metropolis(100, 100)


@pytest.mark.parametrize('algorithm', ['bayes', 'svm', 'tree', 'bagging', 'forest', 'em', 'mcmc'])
def test_api_computes_bounded_finite_results(algorithm):
    client = TestClient(app)
    response = client.post('/v1/experiment', json={'algorithm': algorithm, 'seed': 7})
    assert response.status_code == 200
    result = response.json()
    if result['kind'] == 'classifier':
        assert 0 <= result['testAccuracy'] <= 1
        assert result['trainCount'] + result['testCount'] == len(result['points'])
        assert len(result['grid']) == result['gridSize'] ** 2
    assert response.json() == client.post('/v1/experiment', json={'algorithm': algorithm, 'seed': 7}).json()


@pytest.mark.parametrize('body', [{'algorithm': 'unknown'}, {'algorithm': 'forest', 'trees': 10000}, {'algorithm': 'mcmc', 'samples': 100, 'burn': 100}, {'algorithm': 'svm', 'kernel': 'arbitrary'}])
def test_api_rejects_invalid_requests(body):
    assert TestClient(app).post('/v1/experiment', json=body).status_code == 422
