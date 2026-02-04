#!/usr/bin/env python3
"""
GeoPackage ↔ GeoJSON Converter
Handles conversion between geo formats using GeoPandas
"""

import sys
import json
import geopandas as gpd
from pathlib import Path
import traceback
import fiona
import tempfile
import zipfile

fiona.supported_drivers["KML"] = "rw"  # type: ignore


# Currently poorly supported, we don't rely on it
def emit_progress(status, progress, message=""):
    """Emit progress as JSON to stdout"""
    print(
        json.dumps(
            {
                "type": "progress",
                "status": status,
                "progress": progress,
                "message": message,
            }
        ),
        flush=True,
    )


def emit_result(success, **kwargs):
    """Emit final result as JSON to stdout"""
    result = {"success": success, **kwargs}
    print(json.dumps({"type": "result", **result}), flush=True)


def convert_file(input_path, output_path, source_format, target_format):
    """Main conversion logic"""
    temp_dir = None
    try:
        emit_progress("processing", 0, "Starting conversion")

        if not Path(input_path).exists():
            raise FileNotFoundError(f"Input file not found: {input_path}")

        emit_progress("processing", 5, f"Opening {source_format} file")

        normalized_source_format = source_format.lower()
        input_path_to_read = input_path

        if normalized_source_format == "kmz":
            emit_progress("processing", 7, "Extracting KMZ container")
            temp_dir = tempfile.TemporaryDirectory()
            with zipfile.ZipFile(input_path) as kmz_file:
                kml_candidates = [
                    name
                    for name in kmz_file.namelist()
                    if name.lower().endswith(".kml")
                ]
                if not kml_candidates:
                    raise ValueError("KMZ archive does not contain a .kml file")
                kml_name = kml_candidates[0]
                kmz_file.extract(kml_name, temp_dir.name)

            input_path_to_read = str(Path(temp_dir.name) / kml_name)
            normalized_source_format = "kml"
            emit_progress("processing", 9, f"Extracted KMZ to {Path(kml_name).name}")

        try:
            file_size = Path(input_path_to_read).stat().st_size
            emit_progress(
                "processing", 10, f"Reading {source_format} file ({file_size:,} bytes)"
            )
        except:
            emit_progress("processing", 10, f"Reading {source_format} file")

        preferred_engine = "pyogrio"
        try:
            gdf = gpd.read_file(input_path, engine=preferred_engine)
        except Exception:
            gdf = gpd.read_file(input_path, engine="fiona")

        feature_count = len(gdf)
        emit_progress("processing", 30, f"Loaded {feature_count:,} features")

        column_count = len(gdf.columns)

        emit_progress(
            "processing",
            40,
            f"Processing {feature_count:,} features with {column_count} attributes",
        )

        driver_map = {
            "geojson": ["GeoJSON"],
            "gpkg": ["GPKG"],
            "shp": ["ESRI Shapefile"],
            "kml": ["KML"],  # Try LIBKML first, fallback to KML driver
            "kmz": ["KML"],  # Same for KMZ
            "gpx": ["GPX"],
            "gml": ["GML"],
            "wkt": ["WKT"],  # WKT is exported as plain .wkt text
        }

        available_drivers = set(fiona.supported_drivers.keys())

        driver_options = driver_map.get(target_format.lower(), ["GeoJSON"])

        driver = None
        for d in driver_options:
            if d in available_drivers:
                driver = d
                break

        if driver is None:
            driver = driver_options[0]

        emit_progress("processing", 50, f"Preparing output format: {driver}")

        # For shapefiles, create a folder and save the shapefile inside
        final_output_path = output_path
        result_output_path = output_path
        if target_format.lower() == "shp":
            output_path_obj = Path(output_path)
            # Create a folder with the same name as the shapefile (without extension)
            shapefile_folder = output_path_obj.parent / output_path_obj.stem
            shapefile_folder.mkdir(parents=True, exist_ok=True)
            # Save the shapefile inside the folder
            final_output_path = str(shapefile_folder / output_path_obj.name)
            # Return the folder path, not the .shp file path
            result_output_path = str(shapefile_folder)

        emit_progress(
            "processing", 60, f"Writing {feature_count:,} features to {target_format}"
        )

        if target_format.lower() == "wkt":
            emit_progress("processing", 70, "Converting geometries to WKT format")
            wkt_series = gdf.geometry.to_wkt()
            emit_progress("processing", 90, "Writing WKT data to .wkt file")
            with open(final_output_path, "w", encoding="utf-8") as wkt_file:
                for geom in wkt_series:
                    if geom is None:
                        wkt_file.write("\n")
                    else:
                        wkt_file.write(f"{geom}\n")
        else:
            emit_progress("processing", 70, f"Encoding {feature_count:,} features")
            try:
                gdf.to_file(final_output_path, driver=driver, engine=preferred_engine)
            except Exception as e:
                print(e)
                gdf.to_file(final_output_path, driver=driver, engine="fiona")
            emit_progress("processing", 90, "Finalizing output file")

        try:
            output_size = (
                Path(final_output_path).stat().st_size
                if Path(final_output_path).is_file()
                else 0
            )
            if output_size > 0:
                emit_progress("processing", 95, f"Output file: {output_size:,} bytes")
            else:
                if target_format.lower() == "shp":
                    total_size = sum(
                        f.stat().st_size
                        for f in Path(result_output_path).rglob("*")
                        if f.is_file()
                    )
                    emit_progress(
                        "processing", 95, f"Output bundle: {total_size:,} bytes"
                    )
        except:
            emit_progress("processing", 95, "Finalizing conversion")

        emit_progress(
            "completed", 100, f"Successfully converted {feature_count:,} features"
        )
        emit_result(True, output_path=result_output_path, features_count=feature_count)

        sys.exit(0)

    except Exception as e:
        error_msg = str(e)
        stack_trace = traceback.format_exc()

        emit_progress("failed", 100, f"Error: {error_msg}")
        emit_result(False, error=error_msg, traceback=stack_trace)

        sys.exit(1)
    finally:
        if temp_dir is not None:
            temp_dir.cleanup()


if __name__ == "__main__":
    if len(sys.argv) != 5:
        emit_result(
            False,
            error="Invalid arguments. Usage: script.py <input> <output> <source_format> <target_format>",
        )
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]
    source_format = sys.argv[3]
    target_format = sys.argv[4]

    convert_file(input_path, output_path, source_format, target_format)
