-- ПОЛНАЯ УСТАНОВКА SUPABASE ДЛЯ PORTFOLIO TRACKER
-- Выполните этот скрипт ОДИН РАЗ в SQL Editor на Supabase

-- ============================================
-- 1. ТАБЛИЦА ПОРТФЕЛЕЙ
-- ============================================

-- Удаляем старую таблицу если есть (ОСТОРОЖНО! Удалит все данные)
-- Раскомментируйте только если нужно пересоздать таблицу с нуля
-- DROP TABLE IF EXISTS portfolios CASCADE;

-- Создаем таблицу portfolios
CREATE TABLE IF NOT EXISTS portfolios (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL DEFAULT 'Новый портфель',
  broker TEXT DEFAULT '',
  account_type TEXT DEFAULT 'Брокерский счет',
  planned_contribution TEXT DEFAULT '',
  contribution_period TEXT DEFAULT 'Месяц',
  goal TEXT DEFAULT '',
  goal_years TEXT DEFAULT '',
  risk_profile JSONB DEFAULT '{"stocks": "", "bonds": "", "cash": "", "commodities": "", "crypto": "", "realestate": ""}',
  current_value TEXT DEFAULT '',
  additional_investment TEXT DEFAULT '',
  assets JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Включаем Row Level Security (RLS)
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики если есть
DROP POLICY IF EXISTS "Users can view own portfolios" ON portfolios;
DROP POLICY IF EXISTS "Users can create own portfolios" ON portfolios;
DROP POLICY IF EXISTS "Users can update own portfolios" ON portfolios;
DROP POLICY IF EXISTS "Users can delete own portfolios" ON portfolios;

-- Политика: пользователи могут видеть только свои портфели
CREATE POLICY "Users can view own portfolios" 
  ON portfolios FOR SELECT 
  USING (auth.uid() = user_id);

-- Политика: пользователи могут создавать свои портфели
CREATE POLICY "Users can create own portfolios" 
  ON portfolios FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Политика: пользователи могут обновлять свои портфели
CREATE POLICY "Users can update own portfolios" 
  ON portfolios FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Политика: пользователи могут удалять свои портфели
CREATE POLICY "Users can delete own portfolios" 
  ON portfolios FOR DELETE 
  USING (auth.uid() = user_id);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_portfolios_updated_at ON portfolios;
CREATE TRIGGER update_portfolios_updated_at 
  BEFORE UPDATE ON portfolios 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_updated_at ON portfolios(updated_at DESC);

-- ============================================
-- 2. ТАБЛИЦА ДОХОДОВ И РАСХОДОВ
-- ============================================

CREATE TABLE IF NOT EXISTS finance_transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(12, 2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON finance_transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON finance_transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON finance_transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON finance_transactions;

CREATE POLICY "Users can view own transactions" ON finance_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON finance_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON finance_transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON finance_transactions
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_finance_transactions_user_date ON finance_transactions(user_id, date DESC);

-- ============================================
-- 3. ТАБЛИЦА ЕЖЕМЕСЯЧНЫХ ИТОГОВ
-- ============================================

CREATE TABLE IF NOT EXISTS monthly_summaries (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  savings_goal DECIMAL(12, 2),
  fixed_expenses DECIMAL(12, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, month, year)
);

ALTER TABLE monthly_summaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own summaries" ON monthly_summaries;
DROP POLICY IF EXISTS "Users can insert own summaries" ON monthly_summaries;
DROP POLICY IF EXISTS "Users can update own summaries" ON monthly_summaries;
DROP POLICY IF EXISTS "Users can delete own summaries" ON monthly_summaries;

CREATE POLICY "Users can view own summaries" ON monthly_summaries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own summaries" ON monthly_summaries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own summaries" ON monthly_summaries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own summaries" ON monthly_summaries
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_monthly_summaries_user_period ON monthly_summaries(user_id, year DESC, month DESC);

-- ============================================
-- 4. ТАБЛИЦА БАЛАНСОВОЙ СТОИМОСТИ
-- ============================================

CREATE TABLE IF NOT EXISTS balance_records (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  record_date DATE NOT NULL,
  asset_name TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  purchase_price DECIMAL(12, 2) NOT NULL,
  current_price DECIMAL(12, 2) NOT NULL,
  quantity DECIMAL(12, 4) DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE balance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own balance records" ON balance_records;
DROP POLICY IF EXISTS "Users can insert own balance records" ON balance_records;
DROP POLICY IF EXISTS "Users can update own balance records" ON balance_records;
DROP POLICY IF EXISTS "Users can delete own balance records" ON balance_records;

CREATE POLICY "Users can view own balance records" ON balance_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own balance records" ON balance_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own balance records" ON balance_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own balance records" ON balance_records
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_balance_records_user_date ON balance_records(user_id, record_date DESC);

-- ============================================
-- ГОТОВО! ✅
-- ============================================
-- Все таблицы созданы с правильными правами доступа
-- Теперь можно использовать приложение
