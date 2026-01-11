# Pipelines & Scoring (Backend)

This directory contains the logic for data analysis, scoring, and Big Five profiling.

## Structure

- **`scoring/`**: Core scripts for processing results.
    - `rulebook_v2.json`: Scoring rules definitions.
    - `config.py`: Configuration settings.
    - `score_engine.ipynb`: Notebook for calculation.
- **`genie-game.json`**: (Ignored in git) Google Service Account credentials.
- **`new_big5_analysis.ipynb`**: Analysis notebook for validation and research.
- **`scraping_define_BIG5.ipynb`**: Scraper for fetching ground truth data from bigfive-test.com.

## Data Collection (Telemetry)

Data from the game (`surreal-triangle-journey`) is sent to Google Sheets.

- **Results Table**: [Google Sheets Link](https://docs.google.com/spreadsheets/d/1lG0_Y_o2jl2rackWJyB1esAUcINb843PhNZBmTwf2L4/edit?gid=0#gid=0)
- **Method**: Google App Script (Web App).

## Workflow

1. **Export**: Data is read from Google Sheets via API (using `genie-game.json`).
2. **Analysis**: Run `score_engine.ipynb` to process raw telemetry and generate a player profile.
3. **Configuration**: If game rules change, update `scoring/rulebook_v2.json`.
