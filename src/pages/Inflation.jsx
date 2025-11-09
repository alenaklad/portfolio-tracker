import React, { useState } from 'react';

export default function Inflation() {
  const [currentAmount, setCurrentAmount] = useState(1000000);
  const [inflationRate, setInflationRate] = useState(5.5);
  const [years, setYears] = useState(10);
  const [results, setResults] = useState(null);

  const calculate = () => {
    const futureValue = currentAmount / Math.pow(1 + inflationRate / 100, years);
    const lostValue = currentAmount - futureValue;
    const lossPercent = (lostValue / currentAmount * 100).toFixed(2);

    setResults({ futureValue, lostValue, lossPercent });
  };

  const formatNumber = (num) => num.toLocaleString('ru-RU', { maximumFractionDigits: 0 });

  return (
    <div>
      <h2 className="page-title">💸 Калькулятор влияния инфляции</h2>
      <p className="page-subtitle">Узнайте, как инфляция влияет на покупательную способность</p>

      <div className="calculator-form">
        <div className="form-group">
          <label>Текущая сумма (₽)</label>
          <input type="number" value={currentAmount} onChange={(e) => setCurrentAmount(Number(e.target.value))} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Средняя инфляция (% в год)</label>
            <input type="number" value={inflationRate} onChange={(e) => setInflationRate(Number(e.target.value))} step="0.1" />
          </div>
          <div className="form-group">
            <label>Период (лет)</label>
            <input type="number" value={years} onChange={(e) => setYears(Number(e.target.value))} />
          </div>
        </div>

        <button className="btn btn-primary btn-full" onClick={calculate}>
          Рассчитать
        </button>
      </div>

      {results && (
        <div className="results-grid">
          <div className="result-card highlight">
            <div className="result-label">Реальная стоимость через {years} лет</div>
            <div className="result-value">{formatNumber(results.futureValue)} ₽</div>
          </div>
          <div className="result-card">
            <div className="result-label">Потеря покупательной способности</div>
            <div className="result-value">{formatNumber(results.lostValue)} ₽</div>
          </div>
          <div className="result-card">
            <div className="result-label">Потери в процентах</div>
            <div className="result-value">{results.lossPercent}%</div>
          </div>
        </div>
      )}
    </div>
  );
}
