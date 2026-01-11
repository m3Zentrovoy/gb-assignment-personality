# Genie Game — Big Five Personality Prediction

An interactive questionnaire game that analyzes player behavior (path choice, risk reaction, interaction with NPCs) to predict a personality profile based on the Big Five (OCEAN) model.

## 📂 Project Structure

- **`surreal-triangle-journey/`**: **Frontend (Game Client)**. Built with p5.js.
- **`pipelines/`**: **Backend & Analysis**. Python scripts and Jupyter notebooks for scoring and data processing.
- **`archive/`**: Legacy code.

---

## 🚀 Setup & Installation

### 1. Game Client (Frontend)
To run the game locally, you need a simple HTTP server to avoid CORS issues with assets.

```bash
cd surreal-triangle-journey
python3 -m http.server 8001
```
Open **[http://localhost:8001](http://localhost:8001)** in your browser.

### 2. Backend (pipelines)
Install dependencies:
```bash
pip install -r pipelines/scoring/requirements.txt
```

---

## 🔐 Credentials & Security (IMPORTANT)

This project interacts with Google Sheets to store telemetry. To make it work, you need a **Google Service Account**.

1.  **Create a Service Account** in Google Cloud Console.
2.  **Download the JSON key**.
3.  **Rename/Place it**:
    -   File path: `pipelines/genie-game.json`
4.  **Do NOT commit this file!**
    -   The `.gitignore` is already set up to exclude `genie-game.json`.
    -   **Double-check** before pushing to ensure your keys remain private.

---

## 📊 Data Pipeline & Telemetry

The system follows a specific flow to collect data, gather ground truth (Big Five test results), and generate predictions.

### 1. Telemetry Collection (Game -> Google Sheets)
*   **Source**: `surreal-triangle-journey/sketch.js`
*   **Destination**: [Google Telemetry Sheet](https://docs.google.com/spreadsheets/d/1lG0_Y_o2jl2rackWJyB1esAUcINb843PhNZBmTwf2L4/edit?gid=0#gid=0)
*   **Mechanism**:
    -   The game sends a POST request with JSON data (`PlayerID`, `RoomADuration`, `CoinsCollected`, `Big5TestID`, etc.) to a **Google Apps Script** endpoint.
    -   The Apps Script saves the row into **Sheet1** (Telemetry).

### 2. Ground Truth Scraping (Big 5 Results)
*   **Script**: `pipelines/scraping_define_BIG5.ipynb`
*   **Purpose**: Fetches official Big Five test results for validation.
*   **Process**:
    1.  The script reads `Big5TestID` from the Google Sheet.
    2.  It uses **Playwright** to visit `https://bigfive-test.com/result/{Big5TestID}`.
    3.  It scrapes the raw scores (Traits & Facets) and saves them back to the **second sheet** (`OCEAN_Facets`).

### 3. Prediction & Scoring
*   **Script**: `pipelines/scoring/score_engine.ipynb` (or `score_engine.ipynb` inside `pipelines/scoring`)
*   **Purpose**: Calculates personality scores based *only* on game telemetry.
*   **Logic**:
    -   Reads raw telemetry from **Sheet1**.
    -   Applies rules from `rulebook_v2.json` (e.g., "Exploring foggy path increases Openness").
    -   Outputs the predicted OCEAN scores back to the Google Sheet (columns AH-AL).

---

## 📝 Usage Summary

1.  **Play the Game**: Generates telemetry in Sheet1.
2.  **Run Scraper**: Execute `pipelines/scraping_define_BIG5.ipynb` to fill in the "Real" personality scores (Ground Truth).
3.  **Run Predictor**: Execute `pipelines/scoring/score_engine.ipynb` to generate "Predicted" scores based on game behavior.