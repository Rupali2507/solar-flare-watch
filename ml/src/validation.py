"""
validation.py

Validation utilities for HEL1OS datasets.


Project : Solar Flare Watch
"""

import numpy as np
import pandas as pd


# ==========================================================
# Lightcurve Validation
# ==========================================================

def validate_lightcurve(df: pd.DataFrame):

    print("=" * 60)
    print("LIGHTCURVE VALIDATION")
    print("=" * 60)

    print(f"Rows    : {len(df)}")
    print(f"Columns : {len(df.columns)}")

    print("\nMissing Values")
    print(df.isna().sum())

    if "DATETIME" in df.columns:

        print("\nObservation Window")

        print("Start :", df["DATETIME"].min())
        print("End   :", df["DATETIME"].max())
        print("Duration :", df["DATETIME"].max() - df["DATETIME"].min())

        print("\nDuplicate timestamps :", df["DATETIME"].duplicated().sum())

        print(
            "Time sorted :",
            df["DATETIME"].is_monotonic_increasing
        )

    if "COUNTS" in df.columns:

        print("\nCount Statistics")

        print(df["COUNTS"].describe())

        print("\nNegative counts :",
              (df["COUNTS"] < 0).sum())

        print("Infinite values :",
              np.isinf(df["COUNTS"]).sum())

    print("\nValidation Complete.\n")


# ==========================================================
# Spectra Validation
# ==========================================================

def validate_spectra(metadata, counts):

    print("=" * 60)
    print("SPECTRA VALIDATION")
    print("=" * 60)

    print("Metadata Shape :", metadata.shape)
    print("Counts Shape   :", counts.shape)

    print()

    print("NaN Values :", np.isnan(counts).sum())

    print("Infinite Values :", np.isinf(counts).sum())

    print("Minimum :", counts.min())

    print("Maximum :", counts.max())

    print("Mean :", counts.mean())

    print("Median :", np.median(counts))

    print("Zero Percentage : {:.2f}%".format(
        (counts == 0).mean() * 100
    ))

    if "EXPOSURE" in metadata.columns:

        print()

        print("Exposure")

        print(metadata["EXPOSURE"].describe())

    print("\nValidation Complete.\n")


# ==========================================================
# Housekeeping Validation
# ==========================================================

def validate_housekeeping(df):

    print("=" * 60)
    print("HOUSEKEEPING VALIDATION")
    print("=" * 60)

    print(df.info())

    print()

    print("Missing Values")

    print(df.isna().sum().sort_values(ascending=False).head())

    print()

    numeric = df.select_dtypes(include=np.number)

    print("Infinite values :")

    print(np.isinf(numeric).sum().sum())

    print("\nValidation Complete.\n")


# ==========================================================
# GTI Validation
# ==========================================================

def validate_gti(df):

    print("=" * 60)
    print("GTI VALIDATION")
    print("=" * 60)

    print(df.head())

    print()

    print(df.describe())

    print()

    print("Missing Values")

    print(df.isna().sum())

    print("\nValidation Complete.\n")


# ==========================================================
# Event Validation
# ==========================================================

def validate_events(df):

    print("=" * 60)
    print("EVENT VALIDATION")
    print("=" * 60)

    print("Rows :", len(df))

    print()

    print(df.isna().sum())

    if "ener" in df.columns:

        print()

        print(df["ener"].describe())

        print()

        print("Negative energies :",
              (df["ener"] < 0).sum())

    print("\nValidation Complete.\n")