// Minimal runnable examples use their own seeded data; share links preserve the live lab.
export const examples: Record<string, string> = {
  "linear-regression": `import numpy as np
rng = np.random.default_rng(42)
x = rng.uniform(0, 10, 36)
y = 1.2 + 0.65 * x + rng.normal(0, 0.9, len(x))
X = np.column_stack([np.ones(len(x)), x])
beta, *_ = np.linalg.lstsq(X, y, rcond=None)
residuals = y - X @ beta
print("intercept, slope:", beta)
print("RSS:", residuals @ residuals)`,
  "gradient-descent": `from ml_handbook.algorithms import gradient_descent
history = gradient_descent(rate=0.3, iterations=40)
print("x, y, loss:", history[-1])
# For J=x²+2y², convergence requires 0 < rate < 0.5.`,
  regularization: `from sklearn.datasets import make_regression
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import Ridge, Lasso
X, y = make_regression(n_samples=120, n_features=2,
                       noise=10, random_state=42)
X = StandardScaler().fit_transform(X)
y = y - y.mean()
lam = 0.4  # Objective: RSS/(2n) + lam * R(w)
ridge = Ridge(alpha=2 * len(y) * lam, fit_intercept=False)
lasso = Lasso(alpha=lam, fit_intercept=False)
print(ridge.fit(X, y).coef_, lasso.fit(X, y).coef_)`,
  "logistic-regression": `from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import confusion_matrix
X, y = make_classification(n_features=2, n_redundant=0,
                           n_clusters_per_class=1, random_state=42)
Xt, Xv, yt, yv = train_test_split(X, y, test_size=0.3,
                                stratify=y, random_state=42)
model = LogisticRegression(C=1).fit(Xt, yt)
probabilities = model.predict_proba(Xv)[:, 1]
print(confusion_matrix(yv, probabilities >= 0.5))
# This sklearn example uses its C convention.
# The browser lab uses mean log-loss + lambda/2 * ||w||².`,
  "k-means": `from sklearn.datasets import make_blobs
from sklearn.cluster import KMeans
X, _ = make_blobs(n_samples=75, centers=3, random_state=42)
model = KMeans(n_clusters=3, init="k-means++",
               n_init=10, random_state=42).fit(X)
print(model.cluster_centers_)
print("within-cluster SSE:", model.inertia_)`,
  "expectation-maximization": `from sklearn.datasets import make_blobs
from ml_handbook.algorithms import GMM_EM
X, _ = make_blobs(n_samples=180, centers=3, random_state=42)
model = GMM_EM(X, K=3, seed=42)
for _ in range(30):
    responsibilities = model.step()
print(model.pi, model.mu)
print("log likelihood:", model.likelihood[-1])`,
  mcmc: `from ml_handbook.algorithms import metropolis
chain = metropolis(n_samples=1000, burn_in=100,
                   width=0.5, seed=42)
print("retained:", len(chain["retained"]))
print("acceptance:", chain["acceptance"])
print("approximate ESS:", chain["ess"])
# No single statistic here establishes convergence.`,
};
const classifiers: Record<string, [string, string]> = {
  "naive-bayes": [
    "from sklearn.naive_bayes import GaussianNB",
    "GaussianNB(var_smoothing=1e-9)",
  ],
  svm: [
    "from sklearn.svm import SVC\nfrom sklearn.pipeline import make_pipeline\nfrom sklearn.preprocessing import StandardScaler",
    'make_pipeline(StandardScaler(), SVC(C=1, gamma=1, kernel="rbf"))',
  ],
  "decision-trees": [
    "from sklearn.tree import DecisionTreeClassifier",
    "DecisionTreeClassifier(max_depth=3, random_state=42)",
  ],
  bagging: [
    "from sklearn.tree import DecisionTreeClassifier\nfrom sklearn.ensemble import BaggingClassifier",
    "BaggingClassifier(estimator=DecisionTreeClassifier(max_depth=3),\n                          n_estimators=20, random_state=42)",
  ],
  "random-forests": [
    "from sklearn.ensemble import RandomForestClassifier",
    "RandomForestClassifier(n_estimators=20, max_depth=3,\n                               max_features=1, random_state=42)",
  ],
};
for (const [slug, [imports, model]] of Object.entries(classifiers))
  examples[slug] = `from sklearn.datasets import make_moons
from sklearn.model_selection import train_test_split
${imports}
X, y = make_moons(n_samples=240, noise=0.2, random_state=42)
Xt, Xv, yt, yv = train_test_split(X, y, test_size=0.3,
                                stratify=y, random_state=42)
model = ${model}
model.fit(Xt, yt)
print("training accuracy:", model.score(Xt, yt))
print("validation accuracy:", model.score(Xv, yv))`;
