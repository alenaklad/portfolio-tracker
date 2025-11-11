import React, { useState, useEffect } from 'react';

export default function CompoundInterest() {
  const [principal, setPrincipal] = useState(100000);
  const [rate, setRate] = useState(10);
  const [years, setYears] = useState(10);
  const [contribution, setContribution] = useState(5000);
  const [compound, setCompound] = useState(12);
  const [results, setResults] = useState(null);

  const calculate = () => {
    const r = rate / 100;
    let amount = principal;
    let totalContributions = principal;
    const yearlyData = [];

    for (let year = 1; year <= years; year++) {
      for (let period = 0; period < compound; period++) {
        const monthsPerPeriod = 12 / compound;
        amount = amount * (1 + r / compound);
        const contributionsThisPeriod = contribution * monthsPerPeriod;
        amount += contributionsThisPeriod;
        totalContributions += contributionsThisPeriod;
      }
      yearlyData.push({ year, amount, contributions: totalContributions });
    }

    const totalInterest = amount - totalContributions;
    const roi = ((amount - totalContributions) / totalContributions * 100).toFixed(2);

    setResults({ finalAmount: amount, totalContributions, totalInterest, roi, yearlyData });
  };

  useEffect(() => {
    calculate();
  }, []);

  const formatNumber = (num) => num.toLocaleString('ru-RU', { maximumFractionDigits: 0 });

  return (
    <div>
      <h2 className="page-title">💰 Калькулятор сложных процентов</h2>
      <p className="page-subtitle">Рассчитайте будущую стоимость ваших инвестиций</p>

      <div className="calculator-form">
        <div className="form-group">
          <label>Начальная сумма (₽)</label>
          <input type="number" value={principal} onChange={(e) => setPrincipal(Number(e.target.value))} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Годовая ставка (%)</label>
            <input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} step="0.1" />
          </div>
          <div className="form-group">
            <label>Период (лет)</label>
            <input type="number" value={years} onChange={(e) => setYears(Number(e.target.value))} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Ежемесячный взнос (₽)</label>
            <input type="number" value={contribution} onChange={(e) => setContribution(Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Частота начисления</label>
            <select value={compound} onChange={(e) => setCompound(Number(e.target.value))}>
              <option value="12">Ежемесячно</option>
              <option value="4">Ежеквартально</option>
              <option value="1">Ежегодно</option>
            </select>
          </div>
        </div>

        <button className="btn btn-primary btn-full" onClick={calculate}>
          Рассчитать
        </button>
      </div>

      {results && (
        <div className="results-grid">
          <div className="result-card highlight">
            <div className="result-label">Итоговая сумма</div>
            <div className="result-value">{formatNumber(results.finalAmount)} ₽</div>
          </div>
          <div className="result-card">
            <div className="result-label">Внесено средств</div>
            <div className="result-value">{formatNumber(results.totalContributions)} ₽</div>
          </div>
          <div className="result-card">
            <div className="result-label">Заработано процентов</div>
            <div className="result-value">{formatNumber(results.totalInterest)} ₽</div>
          </div>
          <div className="result-card">
            <div className="result-label">Доходность</div>
            <div className="result-value">{results.roi}%</div>
          </div>
        </div>
      )}
    </div>
  );
}
