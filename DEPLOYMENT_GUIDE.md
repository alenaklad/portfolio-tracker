# 🚀 Руководство по развертыванию на GitHub

## Шаг 1: Создание репозитория на GitHub

1. Зайдите на [github.com](https://github.com)
2. Нажмите кнопку "+" в правом верхнем углу
3. Выберите "New repository"
4. Заполните данные:
   - Repository name: `portfolio-tracker` (или любое другое имя)
   - Description: "Investment Portfolio Tracker"
   - Оставьте публичным (Public)
   - НЕ добавляйте README, .gitignore или license (они уже есть в проекте)
5. Нажмите "Create repository"

## Шаг 2: Важное изменение в конфигурации

⚠️ **ПЕРЕД загрузкой на GitHub** обязательно измените файл `vite.config.js`:

Откройте файл `vite.config.js` и замените:
```javascript
base: './',
```

на:
```javascript
base: '/название-вашего-репозитория/',
```

Например, если вы назвали репозиторий `portfolio-tracker`:
```javascript
base: '/portfolio-tracker/',
```

## Шаг 3: Загрузка кода на GitHub

Откройте терминал в папке проекта и выполните команды:

```bash
# Инициализация git репозитория
git init

# Добавление всех файлов
git add .

# Создание первого коммита
git commit -m "Initial commit: Investment Portfolio Tracker"

# Добавление ссылки на ваш GitHub репозиторий
# Замените YOUR-USERNAME и YOUR-REPO на ваши данные
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git

# Переименование ветки в main
git branch -M main

# Отправка кода на GitHub
git push -u origin main
```

## Шаг 4: Настройка GitHub Pages

1. Перейдите в ваш репозиторий на GitHub
2. Нажмите на вкладку "Settings" (⚙️)
3. В левом меню найдите "Pages"
4. В разделе "Source" выберите:
   - Source: **GitHub Actions**
5. Сохраните настройки

## Шаг 5: Автоматический деплой

После выполнения `git push`:
1. Перейдите на вкладку "Actions" в вашем репозитории
2. Вы увидите запущенный workflow "Deploy to GitHub Pages"
3. Дождитесь завершения (обычно 1-2 минуты)
4. При успешном завершении увидите зеленую галочку ✅

## Шаг 6: Открытие сайта

Ваш сайт будет доступен по адресу:
```
https://ваш-username.github.io/название-репозитория/
```

Например:
```
https://john-doe.github.io/portfolio-tracker/
```

## 🔄 Обновление сайта

Когда вы вносите изменения:

```bash
# Сохраните изменения
git add .
git commit -m "Описание изменений"
git push
```

Сайт автоматически обновится через 1-2 минуты!

## ⚡ Быстрый старт (все команды разом)

Скопируйте и выполните эти команды, заменив YOUR-USERNAME и YOUR-REPO:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git branch -M main
git push -u origin main
```

## 🐛 Решение проблем

### Проблема: Сайт показывает пустую страницу

**Решение**: Проверьте `vite.config.js` - убедитесь, что `base` соответствует названию репозитория:
```javascript
base: '/ваш-репозиторий/',
```

### Проблема: 404 на GitHub Pages

**Решение**: 
1. Проверьте в Settings → Pages, что выбран "GitHub Actions"
2. Убедитесь, что workflow выполнился успешно (зеленая галочка в Actions)
3. Подождите 5-10 минут после первого деплоя

### Проблема: CSS не загружается

**Решение**: Это означает неправильный `base` в `vite.config.js`. Исправьте и сделайте push снова.

### Проблема: git push выдает ошибку

**Решение**: Возможно, у вас еще нет SSH ключа. Используйте HTTPS:
```bash
git remote set-url origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
```

## 📝 Checklist перед деплоем

- [ ] Изменен `base` в `vite.config.js`
- [ ] Создан репозиторий на GitHub
- [ ] Выполнены все git команды
- [ ] В Settings → Pages выбран "GitHub Actions"
- [ ] Workflow выполнился успешно
- [ ] Прошло 5-10 минут после первого деплоя

## 🎉 Готово!

Теперь у вас есть работающий сайт для управления инвестиционным портфелем!

## 📧 Поделиться ссылкой

Вы можете отправить ссылку на ваш сайт кому угодно:
```
https://ваш-username.github.io/portfolio-tracker/
```

Данные портфеля хранятся локально в браузере каждого пользователя.
