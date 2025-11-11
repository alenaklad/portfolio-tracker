import React from 'react';
import { TrendingUp, RefreshCw, PlusCircle, Trash2, X, Plus } from 'lucide-react';

// Копируем всю логику портфеля из оригинального App.jsx
// Это будет просто компонент внутри общего приложения

export default function Portfolio({ 
  portfolios, 
  activePortfolioId,
  setActivePortfolioId,
  setPortfolios,
  updatePortfolio,
  updateRiskProfile,
  addPortfolio,
  deletePortfolio,
  updateAllPrices,
  isUpdating,
  lastUpdate,
  addAsset,
  updateAsset,
  deleteAsset,
  calculateAssetValues,
  getRiskProfileAnalysis,
  totalPortfolio,
  activePortfolio,
  CATEGORIES
}) {
  const [activeTab, setActiveTab] = React.useState('portfolio');
  const riskAnalysis = getRiskProfileAnalysis();

  return (
    <div>
      {/* Весь JSX портфеля из оригинального App */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="page-title" style={{ margin: 0 }}>📊 Инвестиционный Портфель</h2>
        <button 
          className="btn btn-secondary" 
          onClick={updateAllPrices}
          disabled={isUpdating}
        >
          <RefreshCw size={18} className={isUpdating ? 'spinning' : ''} />
          Обновить цены
        </button>
      </div>
      
      {lastUpdate && (
        <div style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
          Последнее обновление: {lastUpdate.toLocaleString('ru-RU')}
        </div>
      )}

      <div className="portfolio-tabs">
        {portfolios.map(portfolio => (
          <div key={portfolio.id} className="portfolio-tab-wrapper">
            <button 
              className={`portfolio-tab ${activePortfolioId === portfolio.id ? 'active' : ''}`}
              onClick={() => setActivePortfolioId(portfolio.id)}
            >
              <input
                type="text"
                value={portfolio.name}
                onChange={(e) => {
                  e.stopPropagation();
                  const updated = portfolios.map(p => 
                    p.id === portfolio.id ? { ...p, name: e.target.value } : p
                  );
                  setPortfolios(updated);
                }}
                onClick={(e) => e.stopPropagation()}
                className="portfolio-name-input"
              />
            </button>
            {portfolios.length > 1 && (
              <button 
                className="portfolio-tab-delete"
                onClick={() => deletePortfolio(portfolio.id)}
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))}
        <button className="portfolio-tab-add" onClick={addPortfolio}>
          <Plus size={18} />
          Добавить портфель
        </button>
      </div>

      <div className="portfolio-info">
        <h3>Информация о портфеле</h3>
        <div className="info-grid">
          <div className="info-field">
            <label>Брокер:</label>
            <input
              type="text"
              value={activePortfolio?.broker || ''}
              onChange={(e) => updatePortfolio('broker', e.target.value)}
              placeholder="Название брокера"
            />
          </div>
          <div className="info-field">
            <label>Вид счета:</label>
            <div className="button-group">
              <button
                className={`btn-choice ${activePortfolio?.accountType === 'Брокерский счет' ? 'active' : ''}`}
                onClick={() => updatePortfolio('accountType', 'Брокерский счет')}
              >
                Брокерский счет
              </button>
              <button
                className={`btn-choice ${activePortfolio?.accountType === 'ИИС' ? 'active' : ''}`}
                onClick={() => updatePortfolio('accountType', 'ИИС')}
              >
                ИИС
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="risk-profile">
        <h3>Риск-профиль</h3>
        <div className="risk-grid">
          {['stocks', 'bonds', 'cash', 'commodities', 'crypto', 'realestate'].map(type => {
            const labels = {
              stocks: 'Акции (%)',
              bonds: 'Облигации (%)',
              cash: 'Денежные фонды (%)',
              commodities: 'Товары (%)',
              crypto: 'Криптовалюты (%)',
              realestate: 'Недвижимость (%)'
            };
            return (
              <div key={type} className="risk-field">
                <label>{labels[type]}</label>
                <input
                  type="number"
                  value={activePortfolio?.riskProfile?.[type] || ''}
                  onChange={(e) => updateRiskProfile(type, e.target.value)}
                  placeholder="0"
                />
              </div>
            );
          })}
        </div>
        <div className={`risk-total ${riskAnalysis.isValid ? 'valid' : 'invalid'}`}>
          Итого: {riskAnalysis.targetTotal.toFixed(1)}%
          {!riskAnalysis.isValid && <span className="error-text"> (Должно быть 100%)</span>}
        </div>
      </div>

      <div className="portfolio-summary">
        <div className="summary-card">
          <label>Текущая оценка портфеля</label>
          <input
            type="number"
            value={activePortfolio?.currentValue || ''}
            onChange={(e) => updatePortfolio('currentValue', e.target.value)}
            className="input-large"
            placeholder="0"
          />
        </div>
        <div className="summary-card">
          <label>Сумма довложения</label>
          <input
            type="number"
            value={activePortfolio?.additionalInvestment || ''}
            onChange={(e) => updatePortfolio('additionalInvestment', e.target.value)}
            className="input-large"
            placeholder="0"
          />
        </div>
        <div className="summary-card highlight">
          <label>Итоговый размер портфеля</label>
          <div className="total-value">
            {totalPortfolio.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
          </div>
        </div>
      </div>

      <div style={{ marginTop: '30px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', fontSize: '14px', color: '#666' }}>
        💡 Для добавления активов используйте разделы по категориям ниже
      </div>
    </div>
  );
}
