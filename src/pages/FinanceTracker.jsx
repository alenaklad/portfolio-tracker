import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Download, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { supabase } from '../supabaseClient';

const INCOME_CATEGORIES = [
  'Зарплата', 'Фриланс', 'Бизнес', 'Инвестиции', 'Подарки',
  'Продажа вещей', 'Возврат долга', 'Пассивный доход', 'Стипендия', 'Прочее'
];

const EXPENSE_CATEGORIES = [
  'Продукты', 'Транспорт', 'Жилье', 'Коммунальные услуги', 'Одежда',
  'Здоровье', 'Образование', 'Развлечения', 'Рестораны и кафе', 'Путешествия',
  'Спорт', 'Красота', 'Подарки', 'Техника', 'Связь и интернет',
  'Страхование', 'Долги и кредиты', 'Инвестиции', 'Благотворительность', 'Прочее'
];

export default function FinanceTracker() {
  const [transactions, setTransactions] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState('income');
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadTransactions();
  }, [selectedMonth, selectedYear]);

  const loadTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('finance_transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async () => {
    if (!amount || !category) {
      alert('Заполните сумму и категорию');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('finance_transactions')
        .insert([{
          user_id: user.id,
          type: activeTab,
          amount: parseFloat(amount),
          category,
          description,
          date
        }]);

      if (error) throw error;

      // Reset form
      setAmount('');
      setCategory('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      
      loadTransactions();
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Ошибка при добавлении записи');
    }
  };

  const deleteTransaction = async (id) => {
    if (!confirm('Удалить запись?')) return;

    try {
      const { error } = await supabase
        .from('finance_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const incomes = transactions.filter(t => t.type === 'income');
  const expenses = transactions.filter(t => t.type === 'expense');
  const totalIncome = incomes.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalExpense = expenses.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const balance = totalIncome - totalExpense;

  const formatNumber = (num) => num.toLocaleString('ru-RU', { maximumFractionDigits: 0 });
  const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

  return (
    <div>
      <h2 className="page-title">💰 Учет доходов и расходов</h2>
      <p className="page-subtitle">Ведите учет финансов по месяцам</p>

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
      <div className="results-grid" style={{ marginBottom: '30px' }}>
        <div className="result-card">
          <div className="result-label">Доходы</div>
          <div className="result-value" style={{ color: '#2ecc71' }}>{formatNumber(totalIncome)} ₽</div>
        </div>
        <div className="result-card">
          <div className="result-label">Расходы</div>
          <div className="result-value" style={{ color: '#e74c3c' }}>{formatNumber(totalExpense)} ₽</div>
        </div>
        <div className={`result-card ${balance >= 0 ? 'highlight' : ''}`}>
          <div className="result-label">Баланс</div>
          <div className="result-value">{formatNumber(balance)} ₽</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          className={`tab ${activeTab === 'income' ? 'active' : ''}`}
          onClick={() => setActiveTab('income')}
          style={{ flex: 1, padding: '15px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '600', background: activeTab === 'income' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f8f9fa', color: activeTab === 'income' ? 'white' : '#495057' }}
        >
          <TrendingUp size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Доходы
        </button>
        <button
          className={`tab ${activeTab === 'expense' ? 'active' : ''}`}
          onClick={() => setActiveTab('expense')}
          style={{ flex: 1, padding: '15px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '600', background: activeTab === 'expense' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f8f9fa', color: activeTab === 'expense' ? 'white' : '#495057' }}
        >
          <TrendingDown size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Расходы
        </button>
      </div>

      {/* Add form */}
      <div className="calculator-form" style={{ marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '20px' }}>Добавить {activeTab === 'income' ? 'доход' : 'расход'}</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Сумма (₽)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="form-group">
            <label>Дата</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Категория</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Выберите категорию</option>
            {(activeTab === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Описание (необязательно)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Комментарий к записи"
          />
        </div>

        <button className="btn btn-primary btn-full" onClick={addTransaction}>
          <Plus size={18} />
          Добавить
        </button>
      </div>

      {/* Transactions list */}
      <div style={{ background: 'white', padding: '30px', borderRadius: '12px' }}>
        <h3 style={{ marginBottom: '20px' }}>История операций</h3>
        
        {loading ? (
          <p>Загрузка...</p>
        ) : transactions.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666' }}>Нет операций за выбранный период</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {transactions.map(transaction => (
              <div
                key={transaction.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '15px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  borderLeft: `4px solid ${transaction.type === 'income' ? '#2ecc71' : '#e74c3c'}`
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', marginBottom: '5px' }}>{transaction.category}</div>
                  {transaction.description && (
                    <div style={{ fontSize: '14px', color: '#666' }}>{transaction.description}</div>
                  )}
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                    {new Date(transaction.date).toLocaleDateString('ru-RU')}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: transaction.type === 'income' ? '#2ecc71' : '#e74c3c' }}>
                    {transaction.type === 'income' ? '+' : '-'}{formatNumber(transaction.amount)} ₽
                  </div>
                  <button
                    className="btn-icon"
                    onClick={() => deleteTransaction(transaction.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
