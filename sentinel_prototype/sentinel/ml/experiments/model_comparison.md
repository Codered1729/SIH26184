# SENTINEL Model Comparison

Walk-forward validation, 4 temporal folds, synthetic calibrated dataset (`ml/synthetic_complaints.csv`). PR-AUC is the primary selection metric (the positive class is a minority, so ROC-AUC would overstate performance). Precision/Recall/F1 are reported at each model's own F1-optimal threshold (a fixed 0.5 cutoff is not meaningful on ~1:4 imbalanced data) - that threshold is also what would be deployed as the dispatch cutoff.

| Model | Source | Opt. threshold | Precision | Recall | F1 | PR-AUC | Brier | Latency (ms/sample) |
|---|---|---|---|---|---|---|---|---|
| XGBoost | fallback:RandomForest(tuned) | 0.197 | 0.278 | 0.894 | 0.422 | 0.322 | 0.1888 | 0.0206 |
| RandomForest (baseline) | real | 0.199 | 0.276 | 0.898 | 0.421 | 0.321 | 0.1888 | 0.0161 |
| LogisticRegression (baseline) | real | 0.188 | 0.276 | 0.893 | 0.421 | 0.318 | 0.1902 | 0.0004 |
| CatBoost | fallback:GradientBoosting | 0.116 | 0.269 | 0.910 | 0.414 | 0.296 | 0.2012 | 0.0036 |
| LightGBM | fallback:HistGradientBoosting | 0.089 | 0.268 | 0.929 | 0.415 | 0.294 | 0.2034 | 0.0034 |

**Selected model: XGBoost** (highest PR-AUC = 0.322).

Rows marked `fallback:*` used a scikit-learn substitute because lightgbm/catboost/xgboost could not be installed in the sandbox this benchmark was built in (no network egress). The harness auto-detects the real library via `try/except ImportError` - installing the real packages and re-running `benchmark_models.py` swaps them in with no code changes and will shift these numbers.

**Caveat on this particular result:** the synthetic label in `generate_synthetic_data.py` is generated from a roughly logistic function of linear features, which gives logistic regression a structural home-field advantage it won't have on real complaint data (which will have non-linear interactions boosted trees are built to capture). Treat this run as validation that the *harness* works end to end, not as the final model verdict - re-run against real or better-simulated data before presenting a winner as final.