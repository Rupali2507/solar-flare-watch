"""
feature_engineering.py

Feature engineering utilities for HEL1OS Solar Flare Watch.

Author : Rupali Jha
Project : Solar Flare Watch
"""

import numpy as np
import pandas as pd

from scipy.signal import (
    find_peaks,
    peak_widths,
)


# ==========================================================
# Configuration
# ==========================================================

ROLLING_WINDOW = 30
PEAK_PROMINENCE = 20
PEAK_DISTANCE = 20


# ==========================================================
# Lightcurve Feature Engineering
# ==========================================================

def engineer_lightcurve_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Generate statistical and temporal features
    from the lightcurve.

    Parameters
    ----------
    df : pd.DataFrame

    Returns
    -------
    pd.DataFrame
    """

    df = df.copy()

    # ------------------------------------------------------
    # Rolling Statistics
    # ------------------------------------------------------

    df["rolling_mean"] = (
        df["COUNTS"]
        .rolling(ROLLING_WINDOW, min_periods=1)
        .mean()
    )

    df["rolling_std"] = (
        df["COUNTS"]
        .rolling(ROLLING_WINDOW, min_periods=1)
        .std()
    )

    df["rolling_max"] = (
        df["COUNTS"]
        .rolling(ROLLING_WINDOW, min_periods=1)
        .max()
    )

    df["rolling_min"] = (
        df["COUNTS"]
        .rolling(ROLLING_WINDOW, min_periods=1)
        .min()
    )

    # ------------------------------------------------------
    # Exponential Moving Average
    # ------------------------------------------------------

    df["ema_10"] = (
        df["COUNTS"]
        .ewm(span=10)
        .mean()
    )

    df["ema_30"] = (
        df["COUNTS"]
        .ewm(span=30)
        .mean()
    )

    # ------------------------------------------------------
    # Differences
    # ------------------------------------------------------

    df["diff1"] = df["COUNTS"].diff()

    df["diff2"] = df["COUNTS"].diff(2)

    df["gradient"] = np.gradient(
        df["COUNTS"]
    )

    # ------------------------------------------------------
    # Lag Features
    # ------------------------------------------------------

    for lag in [1, 2, 5, 10]:

        df[f"lag_{lag}"] = (
            df["COUNTS"]
            .shift(lag)
        )

    # ------------------------------------------------------
    # Window Energy
    # ------------------------------------------------------

    df["window_energy"] = (
        df["COUNTS"] ** 2
    ).rolling(
        ROLLING_WINDOW,
        min_periods=1
    ).sum()

    # ------------------------------------------------------
    # Variance
    # ------------------------------------------------------

    df["window_variance"] = (
        df["COUNTS"]
        .rolling(
            ROLLING_WINDOW,
            min_periods=1
        )
        .var()
    )

    # ------------------------------------------------------
    # Higher Order Statistics
    # ------------------------------------------------------

    df["rolling_skew"] = (
        df["COUNTS"]
        .rolling(
            ROLLING_WINDOW,
            min_periods=1
        )
        .skew()
    )

    df["rolling_kurtosis"] = (
        df["COUNTS"]
        .rolling(
            ROLLING_WINDOW,
            min_periods=1
        )
        .kurt()
    )

    # ------------------------------------------------------
    # RMS
    # ------------------------------------------------------

    df["rolling_rms"] = np.sqrt(

        (
            df["COUNTS"] ** 2
        )

        .rolling(
            ROLLING_WINDOW,
            min_periods=1
        )

        .mean()

    )

    # ------------------------------------------------------
    # Median
    # ------------------------------------------------------

    df["rolling_median"] = (

        df["COUNTS"]

        .rolling(
            ROLLING_WINDOW,
            min_periods=1
        )

        .median()

    )

    # ------------------------------------------------------
    # Median Absolute Deviation
    # ------------------------------------------------------

    df["rolling_mad"] = (

        df["COUNTS"]

        .rolling(
            ROLLING_WINDOW,
            min_periods=1
        )

        .apply(

            lambda x:
            np.median(
                np.abs(
                    x - np.median(x)
                )
            ),

            raw=True

        )

    )

    # ------------------------------------------------------
    # Coefficient of Variation
    # ------------------------------------------------------

    df["rolling_cv"] = (

        df["rolling_std"]

        /

        (
            df["rolling_mean"]

            + 1e-8

        )

    )

    # ------------------------------------------------------
    # Z Score
    # ------------------------------------------------------

    df["z_score"] = (

        df["COUNTS"]

        -

        df["rolling_mean"]

    ) / (

        df["rolling_std"]

        + 1e-8

    )

    # ------------------------------------------------------
    # Robust Z
    # ------------------------------------------------------

    df["robust_z"] = (

        0.6745

        *

        (

            df["COUNTS"]

            -

            df["rolling_median"]

        )

        /

        (

            df["rolling_mad"]

            + 1e-8

        )

    )

    # ------------------------------------------------------
    # Peak-to-Peak
    # ------------------------------------------------------

    df["peak_to_peak"] = (

        df["rolling_max"]

        -

        df["rolling_min"]

    )

    # ------------------------------------------------------
    # Local Energy
    # ------------------------------------------------------

    df["local_energy"] = (

        df["COUNTS"] ** 2

    ).rolling(

        10,

        min_periods=1

    ).sum()

    # ------------------------------------------------------
    # Cleanup
    # ------------------------------------------------------

    df = df.bfill().ffill()

    return df


# ==========================================================
# Peak & Flare Feature Engineering
# ==========================================================

def engineer_peak_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Generate peak-based features from the lightcurve.

    Parameters
    ----------
    df : pd.DataFrame

    Returns
    -------
    pd.DataFrame
    """

    df = df.copy()

    # ------------------------------------------------------
    # Peak Detection
    # ------------------------------------------------------

    peak_indices, properties = find_peaks(
        df["COUNTS"],
        prominence=PEAK_PROMINENCE,
        distance=PEAK_DISTANCE
    )

    df["is_peak"] = 0

    df.loc[peak_indices, "is_peak"] = 1

    # ------------------------------------------------------
    # Peak Prominence
    # ------------------------------------------------------

    df["peak_prominence"] = 0.0

    df.loc[
        peak_indices,
        "peak_prominence"
    ] = properties["prominences"]

    # ------------------------------------------------------
    # Peak Height
    # ------------------------------------------------------

    df["peak_height"] = 0.0

    df.loc[
        peak_indices,
        "peak_height"
    ] = df.loc[
        peak_indices,
        "COUNTS"
    ]

    # ------------------------------------------------------
    # Peak Width
    # ------------------------------------------------------

    widths = peak_widths(
        df["COUNTS"],
        peak_indices,
        rel_height=0.5
    )

    df["peak_width"] = 0.0

    df.loc[
        peak_indices,
        "peak_width"
    ] = widths[0]

    # ------------------------------------------------------
    # Time Since Previous Peak
    # ------------------------------------------------------

    df["time_since_last_peak"] = 0.0

    previous = None

    for idx in peak_indices:

        if previous is None:

            df.loc[idx, "time_since_last_peak"] = 0

        else:

            delta = (

                df.loc[idx, "DATETIME"]

                -

                df.loc[previous, "DATETIME"]

            ).total_seconds()

            df.loc[idx, "time_since_last_peak"] = delta

        previous = idx

    df["time_since_last_peak"] = (
        df["time_since_last_peak"]
        .replace(0, np.nan)
        .ffill()
        .fillna(0)
    )

    # ------------------------------------------------------
    # Rise / Decay Rates
    # ------------------------------------------------------

    df["rise_rate"] = (
        df["COUNTS"]
        -
        df["lag_1"]
    )

    df["decay_rate"] = (
        df["lag_1"]
        -
        df["COUNTS"]
    )

    # ------------------------------------------------------
    # Peak Density
    # ------------------------------------------------------

    df["peak_density"] = (

        df["is_peak"]

        .rolling(
            300,
            min_periods=1
        )

        .sum()

    )

    # ------------------------------------------------------
    # Integrated Counts
    # ------------------------------------------------------

    df["integrated_counts"] = (

        df["COUNTS"]

        .rolling(
            30,
            min_periods=1
        )

        .sum()

    )

    # ------------------------------------------------------
    # Peak Rank
    # ------------------------------------------------------

    df["peak_rank"] = (

        df["COUNTS"]

        /

        (
            df["rolling_max"]

            + 1e-8

        )

    )

    # ------------------------------------------------------
    # Strong Peaks
    # ------------------------------------------------------

    threshold = df["COUNTS"].quantile(0.99)

    df["strong_peak"] = (

        df["COUNTS"] >= threshold

    ).astype(int)

    # ------------------------------------------------------
    # Adaptive Flare Candidate
    # ------------------------------------------------------

    flare_threshold = (

        df["rolling_mean"]

        +

        3 *

        df["rolling_std"]

    )

    df["flare_candidate"] = (

        df["COUNTS"]

        >

        flare_threshold

    ).astype(int)

    df = df.bfill().ffill()

    return df

# ==========================================================
# Spectral Feature Engineering
# ==========================================================

def engineer_spectral_features(
    metadata_df,
    counts_matrix,
    channels
)-> pd.DataFrame:
    """
    Generate spectral features.

    Parameters
    ----------
    metadata_df : pd.DataFrame
        Spectral metadata.

    counts_matrix : np.ndarray
        Spectrum counts (N x Channels)

    Returns
    -------
    pd.DataFrame
    """

    spectral = metadata_df.copy()

    counts = counts_matrix.astype(float)

    # ------------------------------------------------------
    # Basic Statistics
    # ------------------------------------------------------

    spectral["spec_total_counts"] = counts.sum(axis=1)

    spectral["spec_mean_counts"] = counts.mean(axis=1)

    spectral["spec_std_counts"] = counts.std(axis=1)

    spectral["spec_max"] = counts.max(axis=1)

    spectral["spec_min"] = counts.min(axis=1)

    # ------------------------------------------------------
    # Peak Channel
    # ------------------------------------------------------

    spectral["peak_channel"] = np.argmax(counts, axis=1)

    # ------------------------------------------------------
    # Spectral Centroid
    # ------------------------------------------------------

    channels = np.asarray(channels, dtype=float)
    spectral["spectral_centroid"] = (

        counts @ channels

    ) / (

        counts.sum(axis=1) + 1e-8

    )

    # ------------------------------------------------------
    # Spectral Spread
    # ------------------------------------------------------

    centroid = spectral["spectral_centroid"].values

    spectral["spectral_spread"] = np.sqrt(

        (

            counts

            *

            (channels - centroid[:, None]) ** 2

        ).sum(axis=1)

        /

        (counts.sum(axis=1) + 1e-8)

    )

    # ------------------------------------------------------
    # Spectral Entropy
    # ------------------------------------------------------

    probability = counts / (

        counts.sum(axis=1, keepdims=True)

        + 1e-8

    )

    spectral["spectral_entropy"] = -np.sum(

        probability

        *

        np.log2(probability + 1e-8),

        axis=1

    )

    # ------------------------------------------------------
    # Energy Bands
    # ------------------------------------------------------

    n = counts.shape[1]

    low = counts[:, : n // 3]

    mid = counts[:, n // 3 : 2 * n // 3]

    high = counts[:, 2 * n // 3 :]

    spectral["low_energy"] = low.sum(axis=1)

    spectral["mid_energy"] = mid.sum(axis=1)

    spectral["high_energy"] = high.sum(axis=1)

    # ------------------------------------------------------
    # Hardness Ratios
    # ------------------------------------------------------

    spectral["hardness_ratio1"] = (

        spectral["mid_energy"]

        /

        (

            spectral["low_energy"]

            + 1e-8

        )

    )

    spectral["hardness_ratio2"] = (

        spectral["high_energy"]

        /

        (

            spectral["mid_energy"]

            + 1e-8

        )

    )

    # ------------------------------------------------------
    # Dominant Fraction
    # ------------------------------------------------------

    spectral["dominant_fraction"] = (

        spectral["spec_max"]

        /

        (

            spectral["spec_total_counts"]

            + 1e-8

        )

    )

    # ------------------------------------------------------
    # Active Channels
    # ------------------------------------------------------

    spectral["active_channels"] = (

        counts > 0

    ).sum(axis=1)

    return spectral

# ==========================================================
# Housekeeping Feature Engineering
# ==========================================================

def engineer_housekeeping_features(hk_df: pd.DataFrame) -> pd.DataFrame:
    """
    Generate engineering features from
    housekeeping telemetry.

    Parameters
    ----------
    hk_df : pd.DataFrame

    Returns
    -------
    pd.DataFrame
    """

    hk = hk_df.copy()

    # ------------------------------------------------------
    # Mean Temperatures
    # ------------------------------------------------------

    hk["czt_temp_mean"] = (
        hk["czt1temp"] +
        hk["czt2temp"]
    ) / 2

    hk["cdte_temp_mean"] = (
        hk["cdte1temp"] +
        hk["cdte2temp"]
    ) / 2

    # ------------------------------------------------------
    # Temperature Difference
    # ------------------------------------------------------

    hk["czt_temp_diff"] = (
        hk["czt1temp"]
        -
        hk["czt2temp"]
    )

    hk["cdte_temp_diff"] = (
        hk["cdte1temp"]
        -
        hk["cdte2temp"]
    )

    # ------------------------------------------------------
    # Rolling Temperature Stability
    # ------------------------------------------------------

    for col in [
        "czt1temp",
        "czt2temp",
        "cdte1temp",
        "cdte2temp",
    ]:

        hk[f"{col}_rolling_std"] = (

            hk[col]

            .rolling(
                30,
                min_periods=1
            )

            .std()

        )

        hk[f"{col}_gradient"] = np.gradient(
            hk[col]
        )

    # ------------------------------------------------------
    # Voltage Monitoring
    # ------------------------------------------------------

    hk["hv_difference"] = (

        hk["cdtehvmon"]

        -

        hk["czthvmon"]

    )

    hk["hv_ratio"] = (

        hk["cdtehvmon"]

        /

        (

            hk["czthvmon"]

            + 1e-8

        )

    )

    # ------------------------------------------------------
    # Sun Angle
    # ------------------------------------------------------

    hk["sun_angle"] = np.sqrt(

        hk["sun2yawdeg"] ** 2

        +

        hk["sun2rolldeg"] ** 2

        +

        hk["sun2pitchdeg"] ** 2

    )

    # ------------------------------------------------------
    # Spacecraft Motion
    # ------------------------------------------------------

    for col in [

        "sun2yawdeg",

        "sun2rolldeg",

        "sun2pitchdeg",

    ]:

        hk[f"{col}_gradient"] = np.gradient(
            hk[col]
        )

    # ------------------------------------------------------
    # Detector Balance
    # ------------------------------------------------------

    hk["czt_balance"] = (

        hk["czt1ctr"]

        -

        hk["czt2ctr"]

    )

    hk["cdte_balance"] = (

        hk["cdte1ctr"]

        -

        hk["cdte2ctr"]

    )

    hk["total_detector_counts"] = (

        hk["czt1ctr"]

        +

        hk["czt2ctr"]

        +

        hk["cdte1ctr"]

        +

        hk["cdte2ctr"]

    )

    # ------------------------------------------------------
    # Rolling Detector Means
    # ------------------------------------------------------

    for col in [

        "czt1ctr",

        "czt2ctr",

        "cdte1ctr",

        "cdte2ctr",

    ]:

        hk[f"{col}_rolling_mean"] = (

            hk[col]

            .rolling(
                30,
                min_periods=1
            )

            .mean()

        )

    hk = hk.bfill().ffill()

    return hk


# ==========================================================
# Complete Pipeline
# ==========================================================
def engineer_all_features(
    lightcurve_df,
    metadata_df,
    counts_matrix,
    channels,
    hk_df,
):
    """
    Generate all engineered features.
    """

    # Lightcurve
    lightcurve_features = engineer_lightcurve_features(
        lightcurve_df
    )

    lightcurve_features = engineer_peak_features(
        lightcurve_features
    )

    # Spectra
    spectral_features = engineer_spectral_features(
        metadata_df,
        counts_matrix,
        channels,
    )

    # Housekeeping
    hk_features = engineer_housekeeping_features(
        hk_df
    )

    return (
        lightcurve_features,
        spectral_features,
        hk_features,
    )