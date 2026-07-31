"""
Batch-process shadow .tif files into web-friendly PNG overlays.

Reads ground and facade shadow TIFs from the shadow_output directory,
reprojects to EPSG:4326, renders as transparent PNGs, and writes a
metadata.json with bounds and time-step info for the frontend.
"""

import json
import os
import re
import sys
from pathlib import Path

import numpy as np
import rasterio
from rasterio.warp import calculate_default_transform, reproject, Resampling
from PIL import Image

SHADOW_INPUT_DIR = Path(__file__).resolve().parent.parent.parent / "shadow_output"
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "frontend" / "public" / "data"

GROUND_PATTERN = re.compile(r"Shadow_ground_(\d{8})_(\d{4})_LST\.tif$")
FACADE_PATTERN = re.compile(r"Facadeshadow_frombuilding_(\d{8})_(\d{4})_LST\.tif$")

GROUND_COLOR = (30, 30, 30)
GROUND_ALPHA = 180

FACADE_COLOR_LOW = (255, 122, 24)
FACADE_COLOR_HIGH = (200, 50, 10)
FACADE_ALPHA = 200


def reproject_to_4326(src):
    dst_crs = "EPSG:4326"
    transform, width, height = calculate_default_transform(
        src.crs, dst_crs, src.width, src.height, *src.bounds
    )
    data = np.empty((1, height, width), dtype=src.dtypes[0])
    reproject(
        source=rasterio.band(src, 1),
        destination=data[0],
        src_transform=src.transform,
        src_crs=src.crs,
        dst_transform=transform,
        dst_crs=dst_crs,
        resampling=Resampling.nearest,
    )
    bounds_4326 = rasterio.transform.array_bounds(height, width, transform)
    return data[0], bounds_4326


def process_ground_shadow(tif_path, output_path):
    with rasterio.open(tif_path) as src:
        data, bounds = reproject_to_4326(src)
        nodata = src.nodata if src.nodata is not None else -9999.0

    h, w = data.shape
    rgba = np.zeros((h, w, 4), dtype=np.uint8)

    shadow_mask = (data == 0.0) & (data != nodata)
    rgba[shadow_mask, 0] = GROUND_COLOR[0]
    rgba[shadow_mask, 1] = GROUND_COLOR[1]
    rgba[shadow_mask, 2] = GROUND_COLOR[2]
    rgba[shadow_mask, 3] = GROUND_ALPHA

    img = Image.fromarray(rgba, "RGBA")
    img.save(output_path, "PNG", optimize=True)
    return bounds


def process_facade_shadow(tif_path, output_path):
    with rasterio.open(tif_path) as src:
        data, bounds = reproject_to_4326(src)
        nodata = src.nodata if src.nodata is not None else -9999.0

    valid = (data != nodata) & (data > 0) & (data < 1e10)

    h, w = data.shape
    rgba = np.zeros((h, w, 4), dtype=np.uint8)

    if valid.any():
        vmin = data[valid].min()
        vmax = data[valid].max()
        if vmax > vmin:
            norm = (data[valid] - vmin) / (vmax - vmin)
        else:
            norm = np.zeros(valid.sum())

        rgba[valid, 0] = (FACADE_COLOR_LOW[0] + norm * (FACADE_COLOR_HIGH[0] - FACADE_COLOR_LOW[0])).astype(np.uint8)
        rgba[valid, 1] = (FACADE_COLOR_LOW[1] + norm * (FACADE_COLOR_HIGH[1] - FACADE_COLOR_LOW[1])).astype(np.uint8)
        rgba[valid, 2] = (FACADE_COLOR_LOW[2] + norm * (FACADE_COLOR_HIGH[2] - FACADE_COLOR_LOW[2])).astype(np.uint8)
        rgba[valid, 3] = (100 + norm * (FACADE_ALPHA - 100)).astype(np.uint8)

    img = Image.fromarray(rgba, "RGBA")
    img.save(output_path, "PNG", optimize=True)
    return bounds


def format_time(code):
    return f"{code[:2]}:{code[2:]}"


def main():
    ground_dir = OUTPUT_DIR / "ground"
    facade_dir = OUTPUT_DIR / "facade"
    ground_dir.mkdir(parents=True, exist_ok=True)
    facade_dir.mkdir(parents=True, exist_ok=True)

    tif_files = sorted(SHADOW_INPUT_DIR.glob("*.tif"))
    if not tif_files:
        print(f"No .tif files found in {SHADOW_INPUT_DIR}")
        sys.exit(1)

    ground_files = []
    facade_files = []
    for f in tif_files:
        gm = GROUND_PATTERN.match(f.name)
        fm = FACADE_PATTERN.match(f.name)
        if gm:
            ground_files.append((f, gm.group(1), gm.group(2)))
        elif fm:
            facade_files.append((f, fm.group(1), fm.group(2)))

    print(f"Found {len(ground_files)} ground shadow files")
    print(f"Found {len(facade_files)} facade shadow files")

    metadata = {"bounds": None, "date": None, "timeSteps": [], "layers": {"ground": [], "facade": []}}
    bounds_ref = None

    for i, (fpath, date_str, time_code) in enumerate(ground_files):
        out_name = f"ground_{time_code}.png"
        out_path = ground_dir / out_name
        print(f"  [{i+1}/{len(ground_files)}] Processing {fpath.name} -> {out_name}")
        bounds = process_ground_shadow(fpath, out_path)
        if bounds_ref is None:
            bounds_ref = bounds
            metadata["date"] = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}"
        metadata["layers"]["ground"].append({
            "time": format_time(time_code),
            "file": f"data/ground/{out_name}",
        })

    for i, (fpath, date_str, time_code) in enumerate(facade_files):
        out_name = f"facade_{time_code}.png"
        out_path = facade_dir / out_name
        print(f"  [{i+1}/{len(facade_files)}] Processing {fpath.name} -> {out_name}")
        bounds = process_facade_shadow(fpath, out_path)
        metadata["layers"]["facade"].append({
            "time": format_time(time_code),
            "file": f"data/facade/{out_name}",
        })

    if bounds_ref is not None:
        metadata["bounds"] = {
            "south": bounds_ref[1],
            "west": bounds_ref[0],
            "north": bounds_ref[3],
            "east": bounds_ref[2],
        }

    all_times = sorted(set(
        entry["time"] for entries in metadata["layers"].values() for entry in entries
    ))
    metadata["timeSteps"] = all_times

    meta_path = OUTPUT_DIR / "metadata.json"
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\nDone! Wrote {len(ground_files) + len(facade_files)} PNGs + metadata.json to {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
