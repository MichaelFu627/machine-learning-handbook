"""Bounded numerical API; run with uvicorn ml_handbook.api:app."""
from typing import Literal
import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel, Field
from sklearn.datasets import make_moons, make_circles, make_classification, make_blobs
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import GaussianNB
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import BaggingClassifier, RandomForestClassifier
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from threadpoolctl import threadpool_limits
from .algorithms import GMM_EM, metropolis

app = FastAPI(title="ML Handbook numerical API", version="0.2.0")


class Experiment(BaseModel):
    algorithm: Literal["bayes", "svm", "tree", "bagging", "forest", "em", "mcmc"]
    seed: int = Field(default=42, ge=0, le=2147483647)
    dataset: Literal["moons", "circles", "linear"] = "moons"
    noise: float = Field(default=.2, ge=.01, le=1)
    depth: int = Field(default=3, ge=1, le=10)
    trees: int = Field(default=20, ge=1, le=100)
    features: int = Field(default=1, ge=1, le=2)
    c: float = Field(default=1., ge=.01, le=100)
    gamma: float = Field(default=1., ge=.01, le=10)
    kernel: Literal["linear", "rbf", "poly"] = "rbf"
    smoothing: float = Field(default=1e-9, ge=1e-9, le=1)
    clusters: int = Field(default=3, ge=2, le=5)
    iterations: int = Field(default=30, ge=1, le=60)
    width: float = Field(default=.5, ge=.05, le=5)
    samples: int = Field(default=1000, ge=100, le=5000)
    burn: int = Field(default=100, ge=0, le=4999)


@app.get('/health')
def health():
    return {"status": "ok", "version": "0.2.0"}


@app.post('/v1/experiment')
def experiment(p: Experiment):
    from fastapi import HTTPException
    if p.algorithm == 'mcmc':
        if p.burn >= p.samples:
            raise HTTPException(422, "burn must be smaller than samples")
        return {"kind": "mcmc", **metropolis(p.samples, p.burn, p.width, seed=p.seed)}
    with threadpool_limits(limits=1):
        if p.algorithm == 'em':
            X, _ = make_blobs(n_samples=180, centers=[[-2., -1.], [2., -1.], [0., 2.]], cluster_std=p.noise * 2, random_state=p.seed)
            model = GMM_EM(X, p.clusters, p.seed)
            gamma, likelihood = model.expectation()
            snapshots = [{"centers": model.mu.tolist(), "responsibilities": gamma.tolist(), "loss": likelihood}]
            for _ in range(p.iterations):
                gamma = model.step()
                snapshots.append({"centers": model.mu.tolist(), "responsibilities": gamma.tolist(), "loss": model.likelihood[-1]})
            return {"kind": "em", "points": X.tolist(), "snapshots": snapshots}
        if p.dataset == 'moons':
            X, y = make_moons(240, noise=p.noise, random_state=p.seed)
        elif p.dataset == 'circles':
            X, y = make_circles(240, noise=p.noise, factor=.45, random_state=p.seed)
        else:
            X, y = make_classification(n_samples=240, n_features=2, n_informative=2, n_redundant=0,
                n_clusters_per_class=1, class_sep=2 - p.noise, random_state=p.seed)
        train, test = train_test_split(np.arange(len(X)), test_size=.3, stratify=y, random_state=p.seed)
        models = {
            'bayes': GaussianNB(var_smoothing=p.smoothing),
            'svm': make_pipeline(StandardScaler(), SVC(C=p.c, gamma=p.gamma, kernel=p.kernel)),
            'tree': DecisionTreeClassifier(max_depth=p.depth, random_state=p.seed),
            'bagging': BaggingClassifier(estimator=DecisionTreeClassifier(max_depth=p.depth), n_estimators=p.trees, random_state=p.seed),
            'forest': RandomForestClassifier(n_estimators=p.trees, max_depth=p.depth, max_features=p.features, random_state=p.seed),
        }
        model = models[p.algorithm]
        model.fit(X[train], y[train])
        bounds = [float(X[:, 0].min() - .5), float(X[:, 0].max() + .5), float(X[:, 1].min() - .5), float(X[:, 1].max() + .5)]
        n = 42
        gx = np.linspace(bounds[0], bounds[1], n)
        gy = np.linspace(bounds[2], bounds[3], n)
        xx, yy = np.meshgrid(gx, gy)
        grid = model.predict(np.column_stack((xx.ravel(), yy.ravel())))
        test_set = set(test.tolist())
        result = {"kind": "classifier", "points": [[float(x[0]), float(x[1]), int(label), i in test_set] for i, (x, label) in enumerate(zip(X, y))],
            "bounds": bounds, "grid": grid.tolist(), "gridSize": n,
            "trainAccuracy": float(model.score(X[train], y[train])), "testAccuracy": float(model.score(X[test], y[test])),
            "testCount": len(test), "trainCount": len(train)}
        if p.algorithm == 'svm':
            result['support'] = X[train][model[-1].support_].tolist()
        return result
