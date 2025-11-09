import React, { useState } from 'react';

export default function Mortgage() {
  const [loanAmount, setLoanAmount] = useState(5000000);
  const [rate, setRate] = useState(12);
  const [term, setTerm] = useState(20);
  const [results, setResults] = useState(null);

  const calculate = () => {
    const monthlyRate = rate / 100 / 12;
    const months = term * 12;
    const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    const totalPayment = monthlyPayment * months;
    const totalInterest = totalPayment - loanAmount;

    setResults({ monthlyPayment, totalInterest, totalPayment });
  };

  const formatNumber = (num) => num.toLocaleString('ru-RU', { maximumFractionDigits: 0 });

  return (
    <div>
      <h2 className="page-title">🏠 Калькулятор ипотеки</h2>
      <p className="page-subtitle">Рассчитайте ежемесячный платеж и переплату</p>

      <div className="calculator-form">
        <div className="form-group">
          <label>Сумма кредита (₽)</label>
          <input type="number" value={loanAmount} onChange={(e) => setLoanAmount(Number(e.target.value))} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Процентная ставка (% годовых)</label>
            <input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} step="0.1" />
          </div>
          <div className="form-group">
            <label>Срок кредита (лет)</label>
            <input type="number" value={term} onChange={(e) => setTerm(Number(e.target.value))} />
          </div>
        </div>

        <button className="btn btn-primary btn-full" onClick={calculate}>
          Рассчитать
        </button>
      </div>

      {results && (
        <div className="results-grid">
          <div className="result-card highlight">
            <div className="result-label">Ежемесячный платеж</div>
            <div className="result-value">{formatNumber(results.monthlyPayment)} ₽</div>
          </div>
          <div className="result-card">
            <div className="result-label">Переплата по процентам</div>
            <div className="result-value">{formatNumber(results.totalInterest)} ₽</div>
          </div>
          <div className="result-card">
            <div className="result-label">Общая сумма выплат</div>
            <div className="result-value">{formatNumber(results.totalPayment)} ₽</div>
          </div>
        </div>
      )}
    </div>
  );
}
