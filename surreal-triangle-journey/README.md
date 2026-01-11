# Surreal Triangle Journey (Game Client)

This is the active version of the game (Frontend), built with **p5.js**.

## Running the Game

You need a local web server to run the game (to load assets and avoid CORS errors).

### Option 1 (Python)
From the root directory:
```bash
python3 -m http.server 8001 --directory surreal-triangle-journey
```
Then open: [http://localhost:8001](http://localhost:8001)

### Option 2 (VS Code Live Server)
1. Open `index.html` in VS Code.
2. Click "Go Live" (Live Server extension).

## Structure

- **`sketch.js`**: Core game logic, state machine.
- **`avatarSelect.js`**: Avatar selection screen logic.
- **`assets/`**: Images, audio files.
- **`index.html`**: Entry point.

## Telemetry
The game tracks player behavior (time in rooms, coins, path choices) and sends it to the Backend (Google Sheets) at the end of the session.
