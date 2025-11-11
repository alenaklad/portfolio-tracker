import React, { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';

export default function CreditAnalyzer() {
  const [monthlyIncome, setMonthlyIncome] = useState(100000);
  const [credits, setCredits] = useState([
    { id: 1, name: '', monthlyPayment: 0, interestRate: 0, balance: 0 }
  ]);
  const [results, setResults] = useState(null);

  const addCredit = () => {
    setCredits([...credits, { id: Date.now(), name: '', monthlyPayment: 0, interestRate: 0, balance: 0 }]);
  };

  const removeCredit = (id) => {
    if (credits.length > 1) {
      setCredits(credits.filter(c => c.id !== id));
    }
  };

  const updateCredit = (id, field, value) => {
    setCredits(credits.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const calculate = () => {
    const totalPayment = credits.reduce((sum, c) => sum + Number(c.monthlyPayment), 0);
    const loadPercentage = (totalPayment / monthlyIncome * 100).toFixed(2);
    
    const priorityCredit = [...credits].sort((a, b) => b.interestRate - a.interestRate)[0];
    
    let status = '';
    let statusClass = '';
    if (loadPercentage <= 30) {
      status = 'Низкая нагрузка - всё под контролем! ✅';
      statusClass = 'success';
    } else if (loadPercentage <= 50) {
      status = 'Умеренная нагрузка - стоит быть осторожнее ⚠️';
      statusClass = 'warning';
    } else {
      status = 'Высокая нагрузка - требуется оптимизация! ❌';
      statusClass = 'danger';
    }

    setResults({ totalPayment, loadPercentage, priorityCredit, status, statusClass });
  };

  const formatNumber = (num) => num.toLocaleString('ru-RU', { maximumFractionDigits: 0 });

  return (
    <div>
      <h2 className="page-title">💳 Анализатор кредитной нагрузки</h2>
      <p className="page-subtitle">Оцените свою платежеспособность и оптимизируйте долги</p>

      <div className="calculator-form">
        <div className="form-group">
          <label>Ежемесячный доход (₽)</label>
          <input type="number" value={monthlyIncome} onChange={(e) => setMonthlyIncome(Number(e.target.value))} />
        </div>

        <div style={{ marginTop: '30px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ color: '#667eea', margin: 0 }}>Ваши кредиты</h3>
            <button className="btn btn-secondary btn-small" onClick={addCredit}>
              <Plus size={16} />
              Добавить кредит
            </button>
          </div>

          {credits.map((credit, index) => (
            <div key={credit.id} style={{ padding: '20px', background: '#f8f9fa', borderRadius: '12px', marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h4 style={{ margin: 0, color: '#333' }}>Кредит {index + 1}</h4>
                {credits.length > 1 && (
                  <button className="btn-icon" onClick={() => removeCredit(credit.id)}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div className="form-group">
                <label>Название кредита</label>
                <input
                  type="text"
                  placeholder="Например: Ипотека, Автокредит"
                  value={credit.name}
                  onChange={(e) => updateCredit(credit.id, 'name', e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ежемесячный платеж (₽)</label>
                  <input
                    type="number"
                    value={credit.monthlyPayment}
                    onChange={(e) => updateCredit(credit.id, 'monthlyPayment', Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label>Процентная ставка (%)</label>
                  <input
                    type="number"
                    value={credit.interestRate}
                    onChange={(e) => updateCredit(credit.id, 'interestRate', Number(e.target.value))}
                    step="0.1"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Остаток долга (₽)</label>
                <input
                  type="number"
                  value={credit.balance}
                  onChange={(e) => updateCredit(credit.id, 'balance', Number(e.target.value))}
                />
              </div>
            </div>
          ))}
        </div>

        <button className="btn btn-primary btn-full" onClick={calculate}>
          Рассчитать нагрузку
        </button>
      </div>

      {results && (
        <>
          <div className="results-grid" style={{ marginTop: '30px' }}>
            <div className="result-card highlight">
              <div className="result-label">Кредитная нагрузка</div>
              <div className="result-value">{results.loadPercentage}%</div>
            </div>
            <div className="result-card">
              <div className="result-label">Всего платежей в месяц</div>
              <div className="result-value">{formatNumber(results.totalPayment)} ₽</div>
            </div>
            <div className="result-card">
              <div className="result-label">Свободных средств</div>
              <div className="result-value">{formatNumber(monthlyIncome - results.totalPayment)} ₽</div>
            </div>
          </div>

          <div style={{
            marginTop: '30px',
            padding: '20px',
            borderRadius: '12px',
            background: results.statusClass === 'success' ? '#d4edda' :
                        results.statusClass === 'warning' ? '#fff3cd' : '#f8d7da',
            color: results.statusClass === 'success' ? '#155724' :
                   results.statusClass === 'warning' ? '#856404' : '#721c24',
            fontWeight: '600',
            textAlign: 'center'
          }}>
            {results.status}
          </div>

          {results.priorityCredit && results.priorityCredit.name && (
            <div style={{
              marginTop: '20px',
              padding: '20px',
              background: '#e7f3ff',
              borderRadius: '12px',
              borderLeft: '4px solid #667eea'
            }}>
              <h4 style={{ color: '#667eea', marginBottom: '10px' }}>💡 Рекомендация</h4>
              <p style={{ margin: 0, color: '#333' }}>
                Для оптимизации кредитной нагрузки рекомендуем в первую очередь досрочно погашать:{' '}
                <strong>{results.priorityCredit.name || 'кредит с самой высокой ставкой'}</strong> (ставка {results.priorityCredit.interestRate}%). 
                Это принесёт максимальную выгоду.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
