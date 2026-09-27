# SENTINEL Model Comparison

Walk-forward validation, 4 temporal folds, synthetic calibrated dataset (`ml/synthetic_complaints.csv`). PR-AUC is the primary selection metric (the positive class is a minority, so ROC-AUC would overstate performance). Precision/Recall/F1 are reported at each model's own F1-optimal threshold (a fixed 0.5 cutoff is not meaningful on ~1:4 imbalanced data) - that threshold is also what would be deployed as the dispatch cutoff.

| Model | Source | Opt. threshold | Precision | Recall | F1 | PR-AUC | Brier | Latency (ms/sample) |
|---|---|---|---|---|---|---|---|---|
| RandomForest (baseline) | real | 0.282 | 0.441 | 0.672 | 0.528 | 0.522 | 0.1764 | 0.0309 |
| CatBoost | real | 0.252 | 0.415 | 0.716 | 0.524 | 0.517 | 0.1752 | 0.0017 |
| LightGBM | real | 0.259 | 0.416 | 0.670 | 0.512 | 0.497 | 0.1810 | 0.0031 |
| XGBoost | real | 0.232 | 0.398 | 0.717 | 0.512 | 0.496 | 0.1815 | 0.0064 |

**Selected model: RandomForest (baseline)** (highest PR-AUC = 0.522).

Rows marked `fallback:*` used a scikit-learn substitute because lightgbm/catboost/xgboost could not be installed in the sandbox this benchmark was built in (no network egress). The harness auto-detects the real library via `try/except ImportError` - installing the real packages and re-running `benchmark_models.py` swaps them in with no code changes and will shift these numbers.

**Dataset note:** Evaluated on the enriched 18,000-sample Maharashtra cyber-fraud dataset incorporating multi-tier structuring (<Rs. 50k splits), diurnal dark-hour banking windows, payment channel heterogeneity (UPI, IMPS, AePS, Cardless ATM), and telecom risk signals (SIM-swap, remote APK accessibility). The non-linear operational race condition enables tree ensembles to achieve high discriminative power (>0.50 PR-AUC out-of-sample).