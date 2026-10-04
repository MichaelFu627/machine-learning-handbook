"""Reproducible algorithms. No UI imports or global random state."""
from __future__ import annotations

import numpy as np
from scipy.special import logsumexp
from scipy.stats import multivariate_normal, norm, poisson


def ols(x, y):
    x, y = np.asarray(x, dtype=float), np.asarray(y, dtype=float)
    if len(x) < 3 or x.shape != y.shape or not np.isfinite([x, y]).all():
        raise ValueError("At least three finite paired observations are required")
    design = np.column_stack((np.ones(len(x)), x))
    coefficients, _, rank, _ = np.linalg.lstsq(design, y, rcond=None)
    if rank != 2:
        raise ValueError("Predictor must have nonzero variance")
    residuals = y - design @ coefficients
    rss = float(residuals @ residuals)
    return {"intercept": float(coefficients[0]), "slope": float(coefficients[1]),
            "rss": rss, "rmse": float(np.sqrt(rss / len(x)))}


def gradient_descent(rate=0.1, iterations=40, start=(8., -8.)):
    if not 0 < rate <= .7 or not 1 <= iterations <= 200:
        raise ValueError("Invalid learning rate or iteration count")
    state = np.array(start, dtype=float)
    history = []
    for _ in range(iterations + 1):
        history.append([*state.tolist(), float(state[0] ** 2 + 2 * state[1] ** 2)])
        state -= rate * np.array([2 * state[0], 4 * state[1]])
    return np.array(history)


def rss_grid(X, y, weights):
    X, y, weights = np.asarray(X), np.asarray(y), np.asarray(weights)
    return y @ y - 2 * weights @ (X.T @ y) + np.einsum("...i,ij,...j->...", weights, X.T @ X, weights)


class GMM_EM:
    """Full-covariance EM with log-domain responsibilities and covariance floor."""
    def __init__(self, X, K, seed=42):
        self.X = np.asarray(X, dtype=float)
        self.N, self.D = self.X.shape
        self.K = K
        if not 1 <= K <= self.N:
            raise ValueError("Invalid component count")
        rng = np.random.default_rng(seed)
        self.mu = self.X[rng.choice(self.N, K, replace=False)].copy()
        self.covs = np.repeat(np.eye(self.D)[None, :, :], K, axis=0)
        self.pi = np.ones(K) / K
        self.history_mu = [self.mu.copy()]
        self.likelihood = []

    def expectation(self):
        joint = np.column_stack([
            np.log(max(self.pi[k], 1e-300)) + multivariate_normal.logpdf(
                self.X, mean=self.mu[k], cov=self.covs[k]) for k in range(self.K)
        ])
        log_total = logsumexp(joint, axis=1)
        return np.exp(joint - log_total[:, None]), float(log_total.sum())

    def step(self):
        gamma, _ = self.expectation()
        counts = gamma.sum(axis=0)
        for k in range(self.K):
            if counts[k] > 1e-12:
                self.mu[k] = gamma[:, k] @ self.X / counts[k]
                diff = self.X - self.mu[k]
                cov = (gamma[:, k, None] * diff).T @ diff / counts[k]
                values, vectors = np.linalg.eigh(cov)
                self.covs[k] = (vectors * np.maximum(values, 1e-6)) @ vectors.T
        self.pi = np.maximum(counts, 1e-12)
        self.pi /= self.pi.sum()
        self.history_mu.append(self.mu.copy())
        current_gamma, likelihood = self.expectation()
        self.likelihood.append(likelihood)
        return current_gamma


class Poisson_EM:
    def __init__(self, X, K, seed=42):
        self.X = np.asarray(X)
        self.N, self.K = len(X), K
        self.lambdas = np.random.default_rng(seed).uniform(.1, max(float(self.X.max()), .2), K)
        self.pi = np.ones(K) / K
        self.history_lambda = [self.lambdas.copy()]

    def expectation(self):
        joint = poisson.logpmf(self.X[:, None], self.lambdas) + np.log(np.maximum(self.pi, 1e-300))
        total = logsumexp(joint, axis=1)
        return np.exp(joint - total[:, None])

    def step(self):
        gamma = self.expectation()
        counts = gamma.sum(axis=0)
        self.lambdas = np.maximum((gamma.T @ self.X) / np.maximum(counts, 1e-12), 1e-8)
        self.pi = np.maximum(counts, 1e-12)
        self.pi /= self.pi.sum()
        self.history_lambda.append(self.lambdas.copy())
        return self.expectation()


def target_logpdf(x):
    return np.logaddexp(np.log(.3) + norm.logpdf(x, -2, .8), np.log(.7) + norm.logpdf(x, 2, .8))


def metropolis(n_samples=1000, burn_in=100, width=.5, start=0., seed=42):
    if not 10 <= n_samples <= 5000 or not 0 <= burn_in < n_samples or not .05 <= width <= 5:
        raise ValueError("Require 0 <= burn_in < n_samples and a positive bounded width")
    rng = np.random.default_rng(seed)
    current = float(start)
    states, proposals, accepted = [], [], []
    for _ in range(n_samples):
        proposal = float(rng.normal(current, width))
        accept = bool(np.log(max(rng.random(), 1e-300)) < min(0., target_logpdf(proposal) - target_logpdf(current)))
        if accept:
            current = proposal
        states.append(current)
        proposals.append(proposal)
        accepted.append(accept)
    retained = np.array(states[burn_in:])
    crossings = int(np.sum(retained[:-1] * retained[1:] < 0))
    centered = retained - retained.mean()
    variance = centered @ centered
    acf = [1.]
    for lag in range(1, min(100, len(retained))):
        acf.append(float(centered[:-lag] @ centered[lag:] / variance) if variance > 0 else 1.)
    # Initial positive paired autocorrelation sum; exploratory single-chain ESS.
    positive_pairs = 0.
    for i in range(1, len(acf) - 1, 2):
        pair = acf[i] + acf[i + 1]
        if pair <= 0:
            break
        positive_pairs += pair
    ess = min(len(retained), len(retained) / (1 + 2 * positive_pairs))
    return {"states": states, "proposals": proposals, "accepted": accepted,
            "acceptance": float(np.mean(accepted)), "retained": retained.tolist(),
            "crossings": crossings, "negative_fraction": float(np.mean(retained < 0)),
            "acf": acf, "ess": float(ess)}
