import json
from pathlib import Path
import subprocess
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.cluster import KMeans


def test_browser_algorithms_match_numpy_and_sklearn_reference():
    root = Path(__file__).resolve().parents[2]
    payload = subprocess.check_output(['node', '--import', 'tsx', 'scripts/numerical-fixtures.ts'], cwd=root, text=True)
    fixtures = json.loads(payload)
    case = fixtures['regression']
    x = np.array([p['x'] for p in case['points']])
    y = np.array([p['y'] for p in case['points']])
    beta = np.linalg.lstsq(np.column_stack([np.ones(len(x)), x]), y, rcond=None)[0]
    np.testing.assert_allclose([case['fit']['intercept'], case['fit']['slope']], beta, atol=1e-10)

    case = fixtures['classification']
    points = [p for p in case['points'] if not p['validation']]
    X = np.array([[p['x'], p['y']] for p in points])
    y = np.array([p['label'] for p in points])
    model = LogisticRegression(C=1 / (len(y) * case['lambda']), tol=1e-12, max_iter=2000).fit(X, y)
    np.testing.assert_allclose([case['fit']['w1'], case['fit']['w2']], model.coef_[0], atol=5e-4)
    np.testing.assert_allclose(case['fit']['b'], model.intercept_[0], atol=5e-4)

    case = fixtures['clustering']
    X = np.array([[p['x'], p['y']] for p in case['points']])
    initial = np.array([[p['x'], p['y']] for p in case['history'][0]['centers']])
    reference = KMeans(n_clusters=3, init=initial, n_init=1, tol=1e-12, random_state=19).fit(X)
    result = case['history'][-1]
    np.testing.assert_allclose(result['loss'], reference.inertia_, atol=1e-8)
    np.testing.assert_allclose([[p['x'], p['y']] for p in result['centers']], reference.cluster_centers_, atol=1e-8)
