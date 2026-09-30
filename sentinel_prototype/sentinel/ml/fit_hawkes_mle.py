"""
Maximum Likelihood Estimation (MLE) Parameter Calibration for Spatio-Temporal Hawkes Process.
Calibrates excitation magnitude (alpha), temporal decay (beta), and spatial bandwidth (decay_km)
against historical cash-out burst sequences in Maharashtra.
"""

import json
import math
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np
from scipy.optimize import minimize
from scipy.spatial.distance import cdist

_ML_ROOT = str(Path(__file__).resolve().parent)
if _ML_ROOT not in sys.path:
    sys.path.insert(0, _ML_ROOT)

OUTPUT_PARAMS_PATH = Path(__file__).resolve().parent / "models" / "hawkes_params.json"


def generate_synthetic_burst_history(
    n_events: int = 150,
    center_lat: float = 18.5204,
    center_lon: float = 73.8567,
    seed: int = 42,
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Generates realistic spatio-temporal cash-out cascade episodes
    centered around urban ATM corridors (Pune - Mumbai axis).
    Returns (coords [N, 2], timestamps [N,]).
    """
    rng = np.random.default_rng(seed)
    times = [0.0]
    coords = [[center_lat, center_lon]]

    cur_t = 0.0
    cur_lat, cur_lon = center_lat, center_lon

    for _ in range(n_events - 1):
        # Cascading inter-arrival time: 2 to 25 minutes
        dt = rng.exponential(scale=600.0) + 120.0
        cur_t += dt

        # Spatial step within 0.5 - 3.5 km
        d_km = rng.exponential(scale=1.8) + 0.3
        bearing = rng.uniform(0, 2 * math.pi)
        d_lat = (d_km / 111.0) * math.cos(bearing)
        d_lon = (d_km / (111.0 * math.cos(math.radians(cur_lat)))) * math.sin(bearing)

        cur_lat += d_lat
        cur_lon += d_lon

        times.append(cur_t)
        coords.append([cur_lat, cur_lon])

    return np.array(coords), np.array(times)


def hawkes_neg_log_likelihood(
    params: np.ndarray,
    coords: np.ndarray,
    times: np.ndarray,
    T: float,
) -> float:
    """
    Computes negative log-likelihood for spatio-temporal Hawkes process:
    ln L = sum_{i=1}^n ln lambda(t_i, x_i) - Lambda(T)
    """
    alpha, beta, gamma = params
    n = len(times)
    mu = 0.01  # baseline background rate

    # Distance matrix in km
    cos_lat = math.cos(math.radians(float(np.mean(coords[:, 0]))))
    d_lat = (coords[:, 0, None] - coords[None, :, 0]) * 111.0
    d_lon = (coords[:, 1, None] - coords[None, :, 1]) * 111.0 * cos_lat
    dist_km = np.sqrt(d_lat**2 + d_lon**2)

    # Time delta matrix: dt[i, j] = times[i] - times[j]
    dt = times[:, None] - times[None, :]

    # Strictly causal lower triangular mask (j < i)
    mask = (dt > 0) & (dt <= 7200.0)

    # Intensity at each event point
    spatial_kernel = np.exp(-dist_km / gamma)
    temporal_kernel = np.exp(-beta * dt)
    kernel_matrix = alpha * temporal_kernel * spatial_kernel

    intensities = np.full(n, mu)
    for i in range(1, n):
        valid_j = mask[i, :i]
        if np.any(valid_j):
            intensities[i] += np.sum(kernel_matrix[i, :i][valid_j])

    # Log intensity sum
    intensities = np.maximum(intensities, 1e-9)
    log_sum = float(np.sum(np.log(intensities)))

    # Compensator integral: Lambda(T) = mu * T + sum_i (alpha / beta) * (1 - exp(-beta*(T - t_i)))
    decay_integral = np.sum((alpha / beta) * (1.0 - np.exp(-beta * (T - times))))
    compensator = mu * T + decay_integral

    neg_ll = compensator - log_sum
    if math.isnan(neg_ll) or math.isinf(neg_ll):
        return 1e9
    return neg_ll


def fit_hawkes_mle(
    coords: Optional[np.ndarray] = None,
    times: Optional[np.ndarray] = None,
) -> Dict[str, float]:
    """
    Fits Hawkes parameters using L-BFGS-B optimization.
    """
    if coords is None or times is None:
        coords, times = generate_synthetic_burst_history(n_events=120)

    T = float(np.max(times) + 600.0)

    # Initial parameter guess: alpha=0.6, beta=1/600, gamma=2.0
    init_params = np.array([0.60, 1.0 / 600.0, 2.0])

    bounds = [
        (0.01, 3.0),         # alpha: excitation magnitude
        (1.0 / 3600.0, 1.0 / 60.0),  # beta: relaxation rate (1h half-life to 1m)
        (0.5, 10.0),        # gamma: spatial bandwidth in km
    ]

    res = minimize(
        fun=hawkes_neg_log_likelihood,
        x0=init_params,
        args=(coords, times, T),
        method="L-BFGS-B",
        bounds=bounds,
        options={"maxiter": 200, "ftol": 1e-7, "disp": False},
    )

    opt_alpha, opt_beta, opt_gamma = res.x
    calibrated = {
        "alpha": round(float(opt_alpha), 4),
        "beta": round(float(opt_beta), 6),
        "spatial_decay_km": round(float(opt_gamma), 3),
        "baseline_mu": 0.01,
        "half_life_seconds": round(float(math.log(2) / opt_beta), 1),
        "neg_log_likelihood": round(float(res.fun), 3),
        "convergence_status": "CONVERGED" if res.success else "ITERATION_LIMIT",
        "optimization_message": str(res.message),
    }

    OUTPUT_PARAMS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PARAMS_PATH, "w", encoding="utf-8") as f:
        json.dump(calibrated, f, indent=2)

    return calibrated


if __name__ == "__main__":
    print("=" * 65)
    print("SENTINEL: Maximum Likelihood Estimation of Hawkes Parameters")
    print("=" * 65)

    params = fit_hawkes_mle()
    print(f"Convergence:        {params['convergence_status']} ({params['optimization_message']})")
    print(f"Alpha (Excitation): {params['alpha']:.4f}")
    print(f"Beta (Decay Rate):  {params['beta']:.6f} (Half-life: {params['half_life_seconds']:.1f}s)")
    print(f"Decay Distance:     {params['spatial_decay_km']:.3f} km")
    print(f"Negative Log-L:     {params['neg_log_likelihood']:.3f}")
    print(f"Saved calibrated parameters to: {OUTPUT_PARAMS_PATH}")
    print("=" * 65)
