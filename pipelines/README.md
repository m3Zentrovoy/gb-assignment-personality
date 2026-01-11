# Pipelines & Scoring (Backend)

Этот каталог содержит логику анализа данных, подсчета баллов и определения психотипа Big Five.

## Структура

- **`scoring/`**: Основные скрипты для обработки результатов.
    - `rulebook_v2.json`: Правила начисления баллов.
    - `score_engine.ipynb`: Ноутбук для расчета результатов.
- **`genie-game.json`**: (Игнорируется в git) Ключи доступа Google Service Account.
- **`new_big5_analysis.ipynb`**: Аналитический ноутбук для валидации и исследования данных.

## Сбор данных (Telemetry)

Данные из игры (`surreal-triangle-journey`) отправляются в Google Sheets.

- **Таблица с результатами**: [Google Sheets Link](https://docs.google.com/spreadsheets/d/1lG0_Y_o2jl2rackWJyB1esAUcINb843PhNZBmTwf2L4/edit?gid=0#gid=0)
- **Метод отправки**: Google App Script (Web App).

### Google App Script Code
Скрипт, привязанный к таблице, принимает POST запросы от игры и сохраняет телеметрию.

```javascript
// Функция doPost обрабатывает входящие JSON данные от игры
function doPost(e) {
  // ... (см. полный код в документации или App Script редакторе)
  // Сохраняет параметры: PlayerID, AvatarChosen, RoomADurationSec, и т.д.
}
```

## Как работать с данными

1. **Экспорт**: Данные выгружаются из Google Sheets (или читаются напрямую через API с помощью `genie-game.json`).
2. **Анализ**: Запустите `score_engine.ipynb`, чтобы обработать сырые данные и получить профиль игрока.
3. **Настройка**: Если меняются правила игры, обновите `scoring/rulebook_v2.json`.
