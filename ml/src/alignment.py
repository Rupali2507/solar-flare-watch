

import pandas as pd


def _normalize_datetime(df):
    """
    Ensure DATETIME has datetime64[ns] dtype.
    """

    df = df.copy()

    df["DATETIME"] = pd.to_datetime(df["DATETIME"])

    df["DATETIME"] = pd.DatetimeIndex(
        df["DATETIME"].values.astype("datetime64[ns]")
    )

    return df


def align_all_sources(
    lightcurve_features,
    spectral_features,
    hk_features,
    tolerance="30s",
):
    """
    Align all datasets using merge_asof().
    """

    lightcurve_features = _normalize_datetime(
        lightcurve_features
    )

    spectral_features = _normalize_datetime(
        spectral_features
    )

    hk_features = _normalize_datetime(
        hk_features
    )

    lightcurve_features = (
        lightcurve_features
        .sort_values("DATETIME")
    )

    spectral_features = (
        spectral_features
        .sort_values("DATETIME")
    )

    hk_features = (
        hk_features
        .sort_values("DATETIME")
    )

    dataset = pd.merge_asof(
        lightcurve_features,
        spectral_features,
        on="DATETIME",
        direction="nearest",
        tolerance=pd.Timedelta(tolerance),
    )

    dataset = pd.merge_asof(
        dataset,
        hk_features,
        on="DATETIME",
        direction="nearest",
        tolerance=pd.Timedelta(tolerance),
    )

    # Fill only spectral columns (boundary NaNs)
    spectral_cols = [
        c
        for c in spectral_features.columns
        if c != "DATETIME"
    ]

    dataset[spectral_cols] = (
        dataset[spectral_cols]
        .ffill()
        .bfill()
    )

    return dataset