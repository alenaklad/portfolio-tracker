-- Создание таблицы portfolios в Supabase
-- Этот скрипт нужно выполнить в SQL Editor на Supabase

-- Создаем таблицу
CREATE TABLE portfolios (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL DEFAULT 'Новый портфель',
  broker TEXT,
  account_type TEXT DEFAULT 'Брокерский счет',
  planned_contribution TEXT,
  contribution_period TEXT DEFAULT 'Месяц',
  goal TEXT,
  goal_years NUMERIC DEFAULT 5,
  risk_profile JSONB DEFAULT '{"stocks": "", "bonds": "", "cash": "", "commodities": "", "crypto": "", "realestate": ""}',
  current_value TEXT,
  additional_investment TEXT,
  assets JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Включаем Row Level Security (RLS)
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

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

CREATE TRIGGER update_portfolios_updated_at 
  BEFORE UPDATE ON portfolios 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Готово! Таблица создана с правильными правами доступа
