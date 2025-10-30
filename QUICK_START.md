# ⚡ БЫСТРАЯ ШПАРГАЛКА

## 🎯 Что делать ПРЯМО СЕЙЧАС

### 1️⃣ Настройте базу данных (5 минут)

1. Откройте Supabase: https://supabase.com/dashboard/project/azhfsyaolfogmuyulwug
2. **SQL Editor** (в левом меню)
3. **New query**
4. Откройте файл `supabase_setup.sql` из архива
5. Скопируйте весь текст и вставьте в SQL Editor
6. Нажмите **Run** (Ctrl+Enter)
7. Должно быть: "Success. No rows returned" ✅

---

### 2️⃣ Настройте Authentication (2 минуты)

1. **Authentication** → **Settings** (в левом меню)
2. Найдите "Email Auth"
3. **Отключите** "Confirm email" (чтобы не подтверждать почту при регистрации)
4. **Save**

5. **Authentication** → **URL Configuration**
6. **Site URL:** `https://alenaklad.github.io/portfolio-tracker/`
7. **Redirect URLs:** добавьте `https://alenaklad.github.io/portfolio-tracker/`
8. **Save**

---

### 3️⃣ Загрузите на GitHub (5 минут)

1. Откройте GitHub: https://github.com/alenaklad/portfolio-tracker
2. Удалите все старые файлы (кроме `.github`)
3. **Add file** → **Upload files**
4. Перетащите все файлы из распакованного архива `portfolio-supabase`
5. **Commit changes**
6. Перейдите в **Actions** → дождитесь ✅
7. Откройте: https://alenaklad.github.io/portfolio-tracker/

---

## ✅ Проверка

1. Откройте сайт
2. Зарегистрируйтесь (любой email + пароль 6+ символов)
3. Создайте портфель
4. Добавьте активы
5. **Закройте браузер**
6. **Откройте снова и войдите**
7. Всё должно сохраниться! 🎉

---

## 🆘 Что-то не работает?

### Ошибка при входе
→ Проверьте, что Site URL правильный в Authentication → URL Configuration

### Данные не сохраняются
→ Проверьте, что SQL скрипт выполнен (Шаг 1)

### "Invalid login credentials"
→ Проверьте email и пароль, или зарегистрируйтесь заново

### Другие проблемы
→ Откройте консоль (F12), скопируйте ошибку и напишите мне

---

## 📞 Нужна помощь?

Пришлите скриншот проблемы - помогу разобраться!

---

**Всё готово! Настройка займет ~10 минут** ⏱️

**После этого у вас будет полноценное приложение с:**
- ✅ Авторизацией
- ✅ Облачным хранилищем
- ✅ Синхронизацией между устройствами
- ✅ Защитой данных

**Поехали! 🚀**
