# Machine Learning Handbook

A bilingual, interactive introduction to statistics and machine learning. The rebuilt site separates authored lessons, visual experiments and scientific computing. English and Chinese versions include 14 lessons, 12 algorithm laboratories and two foundational experiments.

**Project goals and roadmap:** [GOAL.md](GOAL.md) is the source of truth for implemented features, remaining gaps, ordered milestones and acceptance criteria. Future work follows that plan unless the user changes direction. The next milestone strengthens foundational teaching and local startup reliability; v1.0 targets a publicly accessible, bilingual core curriculum. Cloud accounts and advanced topics follow later.

## Run locally

Use Node.js 22+ (Next.js requires at least 20.9) and Python 3.11+. Commands below run from this directory.

```bash
npm ci
python3 -m venv .venv
.venv/bin/python -m pip install -c requirements.lock -e '.[legacy,dev]'
npm run dev
```

Open **http://localhost:3000/en** or **http://localhost:3000/zh-CN**. `npm run dev` starts both the website and the Python API. Ctrl+C stops both. The API binds to the local machine and the Next.js server proxies requests to it, so browser CORS configuration is unnecessary.

If another service uses port 8000:

```bash
HANDBOOK_API_PORT=8001 npm run dev
```

To start services separately:

```bash
.venv/bin/python -m uvicorn ml_handbook.api:app --host 127.0.0.1 --port 8000 --limit-concurrency 16
# In a second terminal:
npm run dev:web
```

The lightweight browser laboratories work without the Python service. The SVM, Naive Bayes, tree ensembles, EM and MCMC laboratories show a recoverable error if the service is unavailable.

## Production build and checks

```bash
npm run build
npm start
# Keep the Python API running separately as above.

npm run typecheck
npm test
.venv/bin/python -m pytest -q

# With both servers running at their default ports:
npx playwright install chromium
npm run test:e2e
```

`npm start` starts only the website. Set `HANDBOOK_API_URL` in the website server environment if the Python service runs elsewhere. Do not expose an unrestricted code execution endpoint: the API accepts only bounded, named algorithms. No public deployment is configured or performed by this migration.

`package-lock.json` pins JavaScript dependencies. `requirements.lock` pins the Python environment used for verification (Python 3.12 on macOS); installation resolves platform-specific wheels normally. `pyproject.toml` declares the supported direct dependency ranges and optional legacy/dev dependencies. Update locks deliberately, then rerun the checks.

## Project structure

```text
src/app/                    Next.js routes, locale pages and API proxy
src/components/             Course shell, experiments, charts and quizzes
src/lib/                    Course types and pure TypeScript algorithms
src/workers/                Background browser computation
content/lessons.json         Single course registry, prerequisites and quizzes
content/en/*.mdx             English lesson prose and mathematics
content/zh-CN/*.mdx          Chinese lesson prose and mathematics
python/ml_handbook/          Pure Python numerics and bounded FastAPI service
legacy/streamlit/pages/      Original Streamlit tutorials, with correctness fixes
Home.py                     Legacy entry point
tests/                      Numerical, API, content and browser checks
docs/                       Architecture review and migration notes
```

The original root `pages/` was moved under `legacy/streamlit/` because Next.js reserves `pages/` for its Pages Router. Existing Streamlit navigation in `Home.py` now points to the new location. This compact starter does not require a multi-package monorepo build system.

## Teaching and implementation conventions

- Public reading requires no account. Completion is saved in localStorage on the current device; clearing browser storage removes it.
- Every lesson has a guiding question, prerequisites, experiment, mathematics, limitations and an explanatory quiz.
- `content/lessons.json` generates both navigation and the learning path. Add a complete MDX file in both languages when adding a lesson.
- Share links carry a versioned, validated experiment configuration, seed and any manually edited points. A shared animated experiment starts at the initial frame so it can be replayed.
- Browser workers calculate Logistic Regression, K-means and regularization. Very small OLS fits and quadratic updates are synchronous. Heavy/scientific library work remains in Python.
- Classifier holdouts are called **validation** in the UI: students repeatedly tune against them. They are not an untouched final test set, even where library variable names use `test`.
- K-means separates assignment/update frames. EM currently presents completed iterations with responsibilities recomputed under the displayed parameters.
- EM uses log-domain responsibilities and a covariance eigenvalue floor. MCMC retains rejected states, bounds burn-in, uses log acceptance, and presents diagnostics without claiming convergence.
- Probabilistic visuals are accompanied by numeric summaries. Editable SVG points support arrow keys. Animation is manually started, and layout respects reduced-motion preferences.
- Author-provided MDX is trusted source code in this repository. It is never accepted from public input.

## Legacy app

```bash
.venv/bin/python -m streamlit run Home.py
```

The old tutorials remain available for their longer derivations and existing Plotly views. The new lessons are rewritten guided introductions; this is not a claim that every advanced legacy visual has been ported. Dependencies are installed with the `legacy` extra above. Run from the repository root.

## Scope of this migration

Implemented: the new bilingual platform and all existing topic entry points, K-means and two introductory lessons, local progress, shareable experiment state, worker computation, Python service, correctness fixes, and automated checks.

Still on the curriculum roadmap: dedicated Bootstrap/CLT lessons, kNN, PCA/SVD, boosting, MLP/backpropagation and later advanced topics. Cloud accounts, cross-device progress, arbitrary Python notebooks and production infrastructure are intentionally later stages, not hidden or nonfunctional buttons.

See [migration notes](docs/migration.md) for design decisions and current boundaries, and [the original review](docs/architecture-review.zh-CN.md) for the research rationale.
