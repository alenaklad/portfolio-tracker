import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, PiggyBank, DollarSign } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function MonthlyDashboard() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [savingsGoal, setSavingsGoal] = useState('');
  const [fixedExpenses, setFixedExpenses] = useState('');

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load summary
      const { data: summaryData } = await supabase
        .from('monthly_summaries')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', selectedMonth)
        .eq('year', selectedYear)
        .single();

      if (summaryData) {
        setSummary(summaryData);
        setSavingsGoal(summaryData.savings_goal || '');
        setFixedExpenses(summaryData.fixed_expenses || '');
      } else {
        setSummary(null);
        setSavingsGoal('');
        setFixedExpenses('');
      }

      // Load transactions
      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];

      const { data: transData } = await supabase
        .from('finance_transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate);

      setTransactions(transData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSummary = async () => {
    if (!savingsGoal && !fixedExpenses) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const summaryData = {
        user_id: user.id,
        month: selectedMonth,
        year: selectedYear,
        savings_goal: parseFloat(savingsGoal) || 0,
        fixed_expenses: parseFloat(fixedExpenses) || 0
      };

      const { error } = await supabase
        .from('monthly_summaries')
        .upsert(summaryData, { onConflict: 'user_id,month,year' });

      if (error) throw error;
      
      alert('Данные сохранены!');
      loadData();
    } catch (error) {
      console.error('Error saving summary:', error);
      alert('Ошибка при сохранении');
    }
  };

  const incomes = transactions.filter(t => t.type === 'income');
  const expenses = transactions.filter(t => t.type === 'expense');
  const totalIncome = incomes.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalExpense = expenses.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const balance = totalIncome - totalExpense;
  const savingsProgress = savingsGoal ? (balance / parseFloat(savingsGoal)) * 100 : 0;

  const formatNumber = (num) => num.toLocaleString('ru-RU', { maximumFractionDigits: 0 });
  const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

  return (
    <div>
      <h2 className="page-title">📊 Ежемесячные итоги</h2>
      <p className="page-subtitle">Анализ финансов по месяцам</p>

      {/* Month/Year selector */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', background: 'white', padding: '20px', borderRadius: '12px' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Месяц</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            style={{ width: '100%', padding: '12px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '16px' }}
          >
            {months.map((month, idx) => (
              <option key={idx} value={idx + 1}>{month}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Год</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={{ width: '100%', padding: '12px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '16px' }}
          >
            {[2024, 2025, 2026, 2027, 2028].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="results-grid" style={{ marginBottom: '30px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div className="result-card">
          <div className="result-label">
            <TrendingUp size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
            Доходы
          </div>
          <div className="result-value" style={{ color: '#2ecc71' }}>{formatNumber(totalIncome)} ₽</div>
        </div>
        <div className="result-card">
          <div className="result-label">
            <TrendingDown size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
            Расходы
          </div>
          <div className="result-value" style={{ color: '#e74c3c' }}>{formatNumber(totalExpense)} ₽</div>
        </div>
        <div className={`result-card ${balance >= 0 ? 'highlight' : ''}`}>
          <div className="result-label">
            <PiggyBank size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
            Сохранено
          </div>
          <div className="result-value">{formatNumber(balance)} ₽</div>
        </div>
        <div className="result-card">
          <div className="result-label">
            <DollarSign size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
            Постоянные расходы
          </div>
          <div className="result-value">{formatNumber(fixedExpenses || 0)} ₽</div>
        </div>
      </div>

      {/* Goals section */}
      <div className="calculator-form" style={{ marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '20px' }}>Цели и планы</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Цель по накоплениям (₽)</label>
            <input
              type="number"
              value={savingsGoal}
              onChange={(e) => setSavingsGoal(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="form-group">
            <label>Постоянные расходы (₽)</label>
            <input
              type="number"
              value={fixedExpenses}
              onChange={(e) => setFixedExpenses(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        <button className="btn btn-primary btn-full" onClick={saveSummary}>
          Сохранить
        </button>

        {savingsGoal && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontWeight: '600' }}>Прогресс накоплений:</span>
              <span style={{ fontWeight: '600', color: savingsProgress >= 100 ? '#2ecc71' : '#667eea' }}>
                {savingsProgress.toFixed(0)}%
              </span>
            </div>
            <div style={{ height: '30px', background: '#e9ecef', borderRadius: '15px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(savingsProgress, 100)}%`,
                  background: savingsProgress >= 100 ? 'linear-gradient(90deg, #2ecc71, #27ae60)' : 'linear-gradient(90deg, #667eea, #764ba2)',
                  transition: 'width 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                {savingsProgress >= 10 && `${formatNumber(balance)} / ${formatNumber(savingsGoal)} ₽`}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Category breakdown */}
      <div style={{ background: 'white', padding: '30px', borderRadius: '12px' }}>
        <h3 style={{ marginBottom: '20px' }}>Расходы по категориям</h3>
        
        {loading ? (
          <p>Загрузка...</p>
        ) : expenses.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666' }}>Нет расходов за выбранный период</p>
        ) : (
          <div>
            {Object.entries(
              expenses.reduce((acc, exp) => {
                acc[exp.category] = (acc[exp.category] || 0) + parseFloat(exp.amount);
                return acc;
              }, {})
            )
            .sort((a, b) => b[1] - a[1])
            .map(([category, amount]) => {
              const percent = (amount / totalExpense * 100).toFixed(1);
              return (
                <div key={category} style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontWeight: '600' }}>{category}</span>
                    <span>{formatNumber(amount)} ₽ ({percent}%)</span>
                  </div>
                  <div style={{ height: '8px', background: '#e9ecef', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${percent}%`,
                        background: 'linear-gradient(90deg, #667eea, #764ba2)',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
