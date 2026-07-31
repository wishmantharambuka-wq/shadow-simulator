# Shadow Simulator — Dehiwala

Interactive shadow analysis simulation tool. Animates ground and facade shadow footprints over a base map with smooth time-slider playback.

## Structure

- `processing/process_shadows.py` — batch-converts `.tif` shadow rasters into web-friendly PNG overlays + `metadata.json`
- `frontend/` — Next.js app (Leaflet map, glassmorphism UI, playback controls)

## Setup

### 1. Process shadow TIFs

Place source `.tif` files in a `shadow_output/` folder one level above this project, then run:

```bash
cd processing
python process_shadows.py
```

This writes PNGs + `metadata.json` into `frontend/public/data/`.

### 2. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

### 3. Reload after adding new TIFs

Use the "🔄 Reload TIFs" button in the UI, which calls `POST /api/process` to re-run the Python script and refresh the data.

## Features

- Smooth interpolated playback between time steps (no 15-min jumps)
- Ground shadow + facade shadow layer toggles
- Base map on/off toggle
- Dark/light base map mode switch
- Play/pause, step, and speed controls (0.5x–8x)
