"""
data_loader.py

Utility functions for loading HEL1OS FITS datasets.

Author : Rupali Jha
Project : Solar Flare Watch
"""

from pathlib import Path

import numpy as np
import pandas as pd
from astropy.io import fits

from .config import RAW_DATA_DIR


def _find_file(filename: str) -> Path:
    """
    Recursively search RAW_DATA_DIR for a file.
    """
    files = list(RAW_DATA_DIR.rglob(filename))

    if not files:
        raise FileNotFoundError(f"{filename} not found inside {RAW_DATA_DIR}")

    return files[0]


def _to_dataframe(fits_data):
    """
    Convert FITS record array to pandas DataFrame.
    Compatible with NumPy 2.x.
    """

    arr = np.array(fits_data)

    # Convert byte order only if needed
    if arr.dtype.byteorder == ">":
        arr = arr.byteswap().view(arr.dtype.newbyteorder("<"))

    return pd.DataFrame(arr)


def _find_column(columns, candidates):
    """
    Find the first matching column (case-insensitive).
    """
    cols = {c.upper(): c for c in columns}

    for candidate in candidates:
        if candidate.upper() in cols:
            return cols[candidate.upper()]

    raise KeyError(
        f"Could not find any of {candidates}\n"
        f"Available columns:\n{list(columns)}"
    )

def load_lightcurve(detector="czt1"):

    file = _find_file(f"lightcurve_{detector}.fits")

    with fits.open(file) as hdul:

        data = hdul[1].data

        df = pd.DataFrame({
            "MJD": data["MJD"].astype(float),
            "ISOT": data["ISOT"].astype(str),
            "COUNTS": data["CTR"].astype(float),
            "STAT_ERR": data["STAT_ERR"].astype(float)
        })

    return df
def load_spectra(detector="czt1"):

    file = _find_file(f"hel1os_czt_spectra_{detector}.fits")

    with fits.open(file) as hdul:

        data = hdul[1].data

        metadata = pd.DataFrame({
            "SPEC_NUM": data["SPEC_NUM"].astype(int),
            "ROWID": data["ROWID"].astype(str),
            "TSTART": data["TSTART"].astype(float),
            "TSTOP": data["TSTOP"].astype(float),
            "EXPOSURE": data["EXPOSURE"].astype(float),
        })

        counts = np.vstack(data["COUNTS"]).astype(np.float32)

        stat_err = np.vstack(data["STAT_ERR"]).astype(np.float32)

        channels = np.array(data["CHANNEL"][0], dtype=np.int32)

    return metadata, counts, stat_err, channels
def load_housekeeping():

    file = _find_file("hk.fits")

    with fits.open(file) as hdul:

        hk = _to_dataframe(hdul[1].data)

    print(f"\nLoaded {file.name}")

    return hk


def load_gti(detector="czt1"):

    file = _find_file(f"gti{detector}.fits")

    with fits.open(file) as hdul:

        gti = _to_dataframe(hdul[1].data)

    print(f"\nLoaded {file.name}")

    return gti


def load_events(detector="czt1"):
    """
    Load detector event list.
    """

    file = _find_file("evt.fits")

    detector = detector.lower()

    hdu_map = {
        "cdte1": 1,
        "cdte2": 2,
        "czt1": 3,
        "czt2": 4,
    }

    with fits.open(file) as hdul:

        events = _to_dataframe(
            hdul[hdu_map[detector]].data
        )

    print(f"Loaded {detector.upper()} events")

    return events


def load_all(detector="czt1"):

    lightcurve = load_lightcurve(detector)

    metadata, spectra, stat_err, channels = load_spectra(detector)

    hk = load_housekeeping()

    gti = load_gti(detector)

    events = load_events()

    return {
        "lightcurve": lightcurve,
        "spectra_metadata": metadata,
        "spectra": spectra,
        "spectra_errors": stat_err,
        "channels": channels,
        "housekeeping": hk,
        "gti": gti,
        "events": events,
    }