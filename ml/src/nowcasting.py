from __future__ import annotations

import numpy as np
import pandas as pd

from scipy.signal import find_peaks


# ============================================================
# Background
# ============================================================

def estimate_background(
    counts: pd.Series,
    window: int = 300,
) -> pd.Series:
    """
    Estimate slowly varying background using rolling median.
    """

    return (
        counts
        .rolling(
            window=window,
            center=True,
            min_periods=1,
        )
        .median()
    )


# ============================================================
# Noise
# ============================================================

def estimate_noise(
    counts: pd.Series,
    background: pd.Series,
) -> float:
    """
    Robust noise estimate using MAD.
    """

    residual = counts - background

    mad = np.median(
        np.abs(
            residual - np.median(residual)
        )
    )

    return float(1.4826 * mad)


# ============================================================
# Threshold
# ============================================================

def adaptive_threshold(
    background: pd.Series,
    sigma: float,
    k: float = 4.0,
) -> pd.Series:

    return background + k * sigma


# ============================================================
# Peak Detection
# ============================================================

from scipy.signal import find_peaks

def detect_candidate_peaks(
    df,
    prominence=10,
    distance=180,
):
    """
    Detect candidate peaks and filter them using
    an adaptive threshold.
    """

    peaks, properties = find_peaks(
        df["COUNTS"].values,
        prominence=prominence,
        distance=distance,
    )

    keep = (
        df["COUNTS"].iloc[peaks].values
        >
        df["THRESHOLD"].iloc[peaks].values
    )

    peaks = peaks[keep]

    for key in properties:
        properties[key] = properties[key][keep]

    return peaks, properties

def merge_nearby_peaks(
    flare_df,
    peaks,
    gap_seconds=300,
):
    """
    Merge nearby peaks into a single flare event.
    """

    if len(peaks) == 0:
        return pd.DataFrame()

    events = []

    start = peaks[0]
    peak = peaks[0]
    end = peaks[0]

    for current in peaks[1:]:

        gap = (
            flare_df.iloc[current]["DATETIME"]
            -
            flare_df.iloc[end]["DATETIME"]
        ).total_seconds()

        if gap <= gap_seconds:

            end = current

            if (
                flare_df.iloc[current]["COUNTS"]
                >
                flare_df.iloc[peak]["COUNTS"]
            ):
                peak = current

        else:

            events.append({
                "start_idx": start,
                "peak_idx": peak,
                "end_idx": end,
            })

            start = current
            peak = current
            end = current

    events.append({
        "start_idx": start,
        "peak_idx": peak,
        "end_idx": end,
    })

    return pd.DataFrame(events)

# ============================================================
# Flare Event Detection
# ============================================================

def detect_flare_events(
    flare_df: pd.DataFrame,
    sigma_factor: float = 1.0,
):
    """
    Detect complete flare events using adaptive threshold crossing.

    Returns
    -------
    DataFrame
    """

    threshold = (
        flare_df["BACKGROUND"] +
        sigma_factor * (
            flare_df["THRESHOLD"] -
            flare_df["BACKGROUND"]
        )
    )

    above = flare_df["COUNTS"] > threshold

    events = []

    in_event = False
    start = None

    for i in range(len(flare_df)):

        if above.iloc[i] and not in_event:

            start = i
            in_event = True

        elif (not above.iloc[i]) and in_event:

            end = i

            segment = flare_df.iloc[start:end]

            peak_idx = segment["COUNTS"].idxmax()

            events.append({

                "start_idx": start,

                "peak_idx": peak_idx,

                "end_idx": end,

            })

            in_event = False

    if in_event:

        end = len(flare_df) - 1

        segment = flare_df.iloc[start:end]

        peak_idx = segment["COUNTS"].idxmax()

        events.append({

            "start_idx": start,

            "peak_idx": peak_idx,

            "end_idx": end,

        })

    return pd.DataFrame(events)


def find_flare_boundaries(
    flare_df,
    peak_idx,
    fraction=0.25,
):
    """
    Find flare start/end where the signal falls below
    a fraction of the peak above the local background.
    """

    peak = flare_df.iloc[peak_idx]["SMOOTH"]
    background = flare_df.iloc[peak_idx]["BACKGROUND"]

    level = background + fraction * (peak - background)

    start = peak_idx
    while start > 0 and flare_df.iloc[start]["SMOOTH"] > level:
        start -= 1

    end = peak_idx
    while end < len(flare_df) - 1 and flare_df.iloc[end]["SMOOTH"] > level:
        end += 1

    return start, end

