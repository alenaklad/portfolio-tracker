# 📊 Инвестиционный Портфель - Investment Portfolio Tracker

Современное веб-приложение для управления инвестиционным портфелем с автоматическим обновлением цен активов.

## ✨ Основные возможности

- 📈 **Автоматическое обновление цен** - цены активов обновляются по тикерам
- 💼 **Управление портфелем** - добавление, редактирование и удаление активов
- 📊 **Аналитика и визуализация** - графики распределения активов
- 🔄 **Ребалансировка** - автоматический расчет рекомендаций по ребалансировке
- 💾 **Импорт/Экспорт** - сохранение и загрузка данных портфеля
- 📱 **Адаптивный дизайн** - работает на всех устройствах

## 🚀 Быстрый старт

### Установка зависимостей

```bash
npm install
```

### Запуск в режиме разработки

```bash
npm run dev
```

Приложение будет доступно по адресу: `http://localhost:5173`

### Сборка для продакшена

```bash
npm run build
```

Готовые файлы будут в папке `dist/`

## 📦 Развертывание на GitHub Pages

### 1. Подготовка репозитория

```bash
# Инициализация git (если еще не сделано)
git init

# Добавление файлов
git add .
git commit -m "Initial commit"

# Создайте репозиторий на GitHub и добавьте remote
git remote add origin https://github.com/ваш-username/portfolio-tracker.git
git branch -M main
git push -u origin main
```

### 2. Настройка GitHub Pages

1. Перейдите в Settings → Pages вашего репозитория
2. В разделе "Source" выберите "GitHub Actions"

### 3. Создание GitHub Actions workflow

Создайте файл `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
          
      - name: Install dependencies
        run: npm install
        
      - name: Build
        run: npm run build
        
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
```

### 4. Обновление vite.config.js

Замените `base: './'` на `base: '/название-вашего-репозитория/'`:

```javascript
export default defineConfig({
  plugins: [react()],
  base: '/portfolio-tracker/', // замените на название вашего репо
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
```

### 5. Деплой

```bash
git add .
git commit -m "Add GitHub Pages deployment"
git push
```

Ваше приложение будет доступно по адресу:
`https://ваш-username.github.io/portfolio-tracker/`

## 🔧 Интеграция с реальными API для цен

В текущей версии используются mock-данные для цен. Для интеграции с реальными API:

### Alpha Vantage (бесплатный API)

```javascript
const fetchPrice = async (ticker, currency = 'RUB') => {
  const API_KEY = 'ваш_ключ';
  const response = await fetch(
    `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${API_KEY}`
  );
  const data = await response.json();
  return parseFloat(data['Global Quote']['05. price']);
};
```

### Yahoo Finance (через yfinance API)

```javascript
const fetchPrice = async (ticker) => {
  const response = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`
  );
  const data = await response.json();
  return data.chart.result[0].meta.regularMarketPrice;
};
```

## 📱 Структура проекта

```
portfolio-tracker/
├── public/
├── src/
│   ├── App.jsx          # Основной компонент приложения
│   ├── App.css          # Стили
│   ├── main.jsx         # Точка входа
│   └── index.css        # Глобальные стили
├── index.html           # HTML шаблон
├── package.json         # Зависимости
├── vite.config.js       # Конфигурация Vite
└── README.md           # Документация
```

## 🎨 Основные компоненты

- **Portfolio Summary** - общая информация о портфеле
- **Assets Table** - таблица активов с возможностью редактирования
- **Analytics Dashboard** - графики и статистика
- **Auto Price Update** - автоматическое обновление цен

## 💾 Хранение данных

Данные сохраняются в `localStorage` браузера автоматически при каждом изменении.

## 🔐 Безопасность

- Все данные хранятся локально в браузере
- Нет передачи данных на внешние серверы
- Экспорт/импорт данных в формате JSON

## 🐛 Известные проблемы и решения

### Проблема: Приложение не открывается на GitHub Pages

**Решение**: Убедитесь, что в `vite.config.js` правильно указан `base` путь:
```javascript
base: '/название-репозитория/'
```

### Проблема: Цены не обновляются

**Решение**: Реализуйте интеграцию с реальным API (см. раздел выше)

## 📄 Лицензия

MIT License - свободное использование

## 👤 Автор

Создано для управления личным инвестиционным портфелем

## 🤝 Вклад в проект

Форки, пулл-реквесты и предложения приветствуются!
