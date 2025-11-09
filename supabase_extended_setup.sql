-- Таблица для учета доходов и расходов
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

-- Таблица для ежемесячных итогов
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

-- Таблица для балансовой стоимости
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

-- Enable Row Level Security
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_records ENABLE ROW LEVEL SECURITY;

-- Policies for finance_transactions
CREATE POLICY "Users can view own transactions" ON finance_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON finance_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON finance_transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON finance_transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for monthly_summaries
CREATE POLICY "Users can view own summaries" ON monthly_summaries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own summaries" ON monthly_summaries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own summaries" ON monthly_summaries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own summaries" ON monthly_summaries
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for balance_records
CREATE POLICY "Users can view own balance records" ON balance_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own balance records" ON balance_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own balance records" ON balance_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own balance records" ON balance_records
  FOR DELETE USING (auth.uid() = user_id);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_finance_transactions_user_date ON finance_transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_monthly_summaries_user_period ON monthly_summaries(user_id, year DESC, month DESC);
CREATE INDEX IF NOT EXISTS idx_balance_records_user_date ON balance_records(user_id, record_date DESC);
