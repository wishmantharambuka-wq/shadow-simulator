# Shadow Simulator — Dehiwala

Interactive shadow analysis simulation tool. Animates ground and facade shadow footprints over a base map with smooth time-slider playback.

## Structure

- `processing/process_shadows.py` — batch-converts `.tif` shadow rasters into web-friendly PNG overlays + `metadata.json`
- `frontend/` — Next.js app (Leaflet map, glassmorphism UI, playback controls)

## Features

- Smooth interpolated playback between time steps (no 15-min jumps)
- Ground shadow + facade shadow layer toggles
- Base map on/off toggle
- Dark/light base map mode switch
- Play/pause, step, and speed controls (0.5x–8x)
