

from __future__ import annotations

import numpy as np
import pandas as pd

# ============================================================
# Generic Utilities
# ============================================================

def fix_endianness(df: pd.DataFrame) -> pd.DataFrame:
    """
    Fix FITS big-endian issue.
    """

    return (
        df
        .apply(
            lambda col:
            col.astype(col.dtype.newbyteorder("="))
            if hasattr(col.dtype, "byteorder")
            else col
        )
        .copy()
    )


def convert_datetime(df: pd.DataFrame,
                     time_column: str = "TIME") -> pd.DataFrame:
    """
    Convert UNIX timestamp into datetime.
    """

    df = df.copy()

    if time_column in df.columns:

        df["DATETIME"] = pd.to_datetime(
            df[time_column],
            unit="s"
        )

    return df


def remove_duplicates(df: pd.DataFrame) -> pd.DataFrame:

    return (
        df
        .drop_duplicates()
        .reset_index(drop=True)
    )


def sort_by_time(df: pd.DataFrame,
                 time_column="TIME"):

    if time_column in df.columns:

        df = (
            df
            .sort_values(time_column)
            .reset_index(drop=True)
        )

    return df


def validate_dataframe(df: pd.DataFrame):

    print("=" * 60)

    print("Shape :", df.shape)

    print()

    print(df.info())

    print()

    print("Missing Values")

    print(df.isna().sum())

    print("=" * 60)


def fill_missing(df: pd.DataFrame) -> pd.DataFrame:

    df = df.copy()

    numeric_cols = df.select_dtypes(
        include=np.number
    ).columns

    df[numeric_cols] = (
        df[numeric_cols]
        .interpolate(limit_direction="both")
        .ffill()
        .bfill()
    )

    return df   


# ============================================================
# Lightcurve
# ============================================================

def preprocess_lightcurve(df):

    df = df.copy()

    df["DATETIME"] = pd.to_datetime(df["ISOT"])

    # Force nanosecond precision
    df["DATETIME"] = pd.DatetimeIndex(
        df["DATETIME"].values.astype("datetime64[ns]")
    )

    df = df.sort_values("DATETIME").reset_index(drop=True)

    return df

# ============================================================
# Spectra
# ============================================================
def preprocess_spectra(
    metadata_df,
    counts_matrix,
    observation_start,
):
    """
    Preprocess spectral metadata.
    TSTART and TSTOP are seconds from observation start.
    """

    metadata_df = metadata_df.copy()

    metadata_df = metadata_df.drop_duplicates()

    counts_matrix = np.where(
        counts_matrix < 0,
        0,
        counts_matrix
    )

    metadata_df["MID_TIME"] = (
        metadata_df["TSTART"] +
        metadata_df["TSTOP"]
    ) / 2

    metadata_df["DATETIME"] = (
        observation_start
        +
        pd.to_timedelta(
            metadata_df["MID_TIME"],
            unit="s"
        )
    )

    metadata_df["DATETIME"] = metadata_df["DATETIME"].astype("datetime64[ns]")

    return metadata_df, counts_matrix
# ============================================================
# Housekeeping
# ============================================================

def preprocess_housekeeping(
        hk_df: pd.DataFrame
):

    df = hk_df.copy()

    df = fix_endianness(df)

    df = remove_duplicates(df)

    numeric_cols = df.select_dtypes(
        include=np.number
    ).columns

    df[numeric_cols] = (
        df[numeric_cols]
        .astype(float)
    )
    df["DATETIME"] = pd.to_datetime(
        df["mjd"],
        unit="D",
        origin="1858-11-17"
    ).astype("datetime64[ns]")

    return df

# ============================================================
# GTI
# ============================================================

def preprocess_gti(
        gti_df: pd.DataFrame
):

    df = gti_df.copy()

    df = fix_endianness(df)

    df = remove_duplicates(df)

    return df

# ============================================================
# Events
# ============================================================

def preprocess_events(
        events_df: pd.DataFrame
):

    df = events_df.copy()

    df = fix_endianness(df)

    df = remove_duplicates(df)

    return df

# ============================================================
# Complete Pipeline
# ============================================================

def preprocess_all(
    lightcurve_df,
    spectra_metadata,
    counts_matrix,
    hk_df,
    gti_df=None,
    events_df=None
):

    lightcurve_df = preprocess_lightcurve(
        lightcurve_df
    )

    spectra_metadata, counts_matrix = (
        preprocess_spectra(
            spectra_metadata,
            counts_matrix
        )
    )

    hk_df = preprocess_housekeeping(
        hk_df
    )

    if gti_df is not None:

        gti_df = preprocess_gti(
            gti_df
        )

    if events_df is not None:

        events_df = preprocess_events(
            events_df
        )

    return {
        "lightcurve": lightcurve_df,
        "spectra_metadata": spectra_metadata,
        "spectra": counts_matrix,
        "housekeeping": hk_df,
        "gti": gti_df,
        "events": events_df,
    }