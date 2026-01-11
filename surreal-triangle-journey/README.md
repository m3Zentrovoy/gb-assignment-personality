# Surreal Triangle Journey (Game Client)

Это активная версия игры (Frontend). Написана на **p5.js**.

## Запуск

Для работы игры требуется локальный веб-сервер (чтобы загружать ассеты и избежать CORS ошибок).

### Вариант 1 (Python)
Находясь в корневой папке проекта:
```bash
python3 -m http.server 8001 --directory surreal-triangle-journey
```
Затем откройте в браузере: [http://localhost:8001](http://localhost:8001)

### Вариант 2 (VS Code Live Server)
1. Откройте файл `index.html` в VS Code.
2. Нажмите "Go Live" (расширение Live Server).

## Структура

- **`sketch.js`**: Основная логика игры, сцены, управление.
- **`avatarSelect.js`**: Логика экрана выбора аватара.
- **`assets/`**: Картинки, звуки.
- **`index.html`**: Входная точка.

## Телеметрия
Игра собирает данные о поведении игрока (время в комнатах, монеты, выбор пути) и отправляет их на Backend (Google Sheets) в конце сессии.
