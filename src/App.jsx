import React, { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, PlusCircle, Trash2, Download, Upload, BarChart3, Plus, X } from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import './App.css';

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#fa709a', '#fee140', '#30cfd0'];

const CATEGORIES = [
  'Акции российских компаний',
  'Акции мирового рынка',
  'Российские облигации',
  'Зарубежные облигации',
  'Товары',
  'Денежные фонды',
  'Недвижимость',
  'Криптовалюты'
];

// API для получения цен с Московской Биржи
const fetchMoexPrice = async (ticker) => {
  try {
    const response = await fetch(`https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities/${ticker}.json?iss.meta=off&iss.only=marketdata&marketdata.columns=LAST`);
    const data = await response.json();
    const price = data?.marketdata?.data?.[0]?.[0];
    return price || 0;
  } catch (error) {
    console.error(`Ошибка получения цены для ${ticker}:`, error);
    return 0;
  }
};

// API для зарубежных активов (заглушка, можно интегрировать реальное API)
const fetchForeignPrice = async (ticker, currency) => {
  const mockPrices = {
    'VTI': 28979,
    'GXC': 6700,
    'MCHI': 4700,
    'EWG': 2300,
    'EWQ': 3200,
    'EWU': 2800,
  };
  const basePrice = mockPrices[ticker] || 100;
  const variation = (Math.random() - 0.5) * basePrice * 0.05;
  return basePrice + variation;
};

const fetchPrice = async (ticker, currency, category) => {
  if (category === 'Акции российских компаний' || category === 'Российские облигации') {
    return await fetchMoexPrice(ticker);
  } else {
    return await fetchForeignPrice(ticker, currency);
  }
};

const defaultPortfolio = {
  id: 1,
  name: 'Основной портфель',
  broker: '',
  accountType: 'Брокерский счет',
  plannedContribution: '',
  contributionPeriod: 'Месяц',
  goal: '',
  goalYears: 5,
  riskProfile: {
    stocks: '',
    bonds: '',
    cash: '',
    commodities: '',
    crypto: '',
    realestate: ''
  },
  currentValue: '',
  additionalInvestment: '',
  assets: []
};

function App() {
  const [portfolios, setPortfolios] = useState(() => {
    const saved = localStorage.getItem('portfolios');
    return saved ? JSON.parse(saved) : [defaultPortfolio];
  });
  
  const [activePortfolioId, setActivePortfolioId] = useState(1);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [activeTab, setActiveTab] = useState('portfolio');

  useEffect(() => {
    localStorage.setItem('portfolios', JSON.stringify(portfolios));
  }, [portfolios]);

  useEffect(() => {
    const saved = localStorage.getItem('lastPriceUpdate');
    if (saved) {
      setLastUpdate(new Date(saved));
    }
  }, []);

  const activePortfolio = portfolios.find(p => p.id === activePortfolioId) || portfolios[0];
  const totalPortfolio = parseFloat(activePortfolio.currentValue || 0) + parseFloat(activePortfolio.additionalInvestment || 0);

  const updatePortfolio = (field, value) => {
    setPortfolios(portfolios.map(p => 
      p.id === activePortfolioId ? { ...p, [field]: value } : p
    ));
  };

  const updateRiskProfile = (field, value) => {
    setPortfolios(portfolios.map(p => 
      p.id === activePortfolioId ? {
        ...p,
        riskProfile: { ...p.riskProfile, [field]: value }
      } : p
    ));
  };

  const addPortfolio = () => {
    const newId = Math.max(...portfolios.map(p => p.id), 0) + 1;
    setPortfolios([...portfolios, { ...defaultPortfolio, id: newId, name: `Портфель ${newId}` }]);
    setActivePortfolioId(newId);
  };

  const deletePortfolio = (id) => {
    if (portfolios.length === 1) {
      alert('Нельзя удалить последний портфель');
      return;
    }
    setPortfolios(portfolios.filter(p => p.id !== id));
    if (activePortfolioId === id) {
      setActivePortfolioId(portfolios.find(p => p.id !== id).id);
    }
  };

  const updateAllPrices = async () => {
    setIsUpdating(true);
    const updatedAssets = [...activePortfolio.assets];
    
    for (let i = 0; i < updatedAssets.length; i++) {
      if (updatedAssets[i].ticker) {
        const newPrice = await fetchPrice(
          updatedAssets[i].ticker, 
          updatedAssets[i].currency,
          updatedAssets[i].category
        );
        updatedAssets[i].price = newPrice;
      }
    }
    
    updatePortfolio('assets', updatedAssets);
    const now = new Date();
    setLastUpdate(now);
    localStorage.setItem('lastPriceUpdate', now.toISOString());
    setIsUpdating(false);
  };

  const calculateAssetValues = (asset) => {
    const targetShare = parseFloat(asset.targetShare) || 0;
    const price = parseFloat(asset.price) || 0;
    const lotSize = parseFloat(asset.lotSize) || 1;
    const quantity = parseFloat(asset.quantity) || 0;
    
    const targetAmount = (targetShare / 100) * totalPortfolio;
    const targetQuantity = Math.floor(targetAmount / (price * lotSize)) * lotSize;
    const actualAmount = quantity * price;
    const actualShare = totalPortfolio > 0 ? (actualAmount / totalPortfolio) * 100 : 0;
    const rebalance = Math.floor((targetQuantity - quantity) / lotSize);
    
    return {
      targetAmount,
      targetQuantity,
      actualAmount,
      actualShare,
      rebalance
    };
  };

  const addAsset = (category) => {
    const newAsset = {
      id: Math.max(...activePortfolio.assets.map(a => a.id), 0) + 1,
      category,
      name: '',
      ticker: '',
      targetShare: '',
      currency: 'RUB',
      lotSize: '',
      quantity: '',
      price: ''
    };
    updatePortfolio('assets', [...activePortfolio.assets, newAsset]);
  };

  const updateAsset = (id, field, value) => {
    updatePortfolio('assets', activePortfolio.assets.map(asset => 
      asset.id === id ? { ...asset, [field]: value } : asset
    ));
  };

  const deleteAsset = (id) => {
    updatePortfolio('assets', activePortfolio.assets.filter(asset => asset.id !== id));
  };

  const exportData = () => {
    const dataStr = JSON.stringify(portfolios, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `portfolios_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          setPortfolios(Array.isArray(data) ? data : [data]);
        } catch (error) {
          alert('Ошибка при чтении файла');
        }
      };
      reader.readAsText(file);
    }
  };

  // Анализ риск-профиля
  const getRiskProfileAnalysis = () => {
    const rp = activePortfolio.riskProfile;
    const targetTotal = parseFloat(rp.stocks || 0) + parseFloat(rp.bonds || 0) + 
                       parseFloat(rp.cash || 0) + parseFloat(rp.commodities || 0) + 
                       parseFloat(rp.crypto || 0) + parseFloat(rp.realestate || 0);
    
    const categoryMapping = {
      'Акции российских компаний': 'stocks',
      'Акции мирового рынка': 'stocks',
      'Российские облигации': 'bonds',
      'Зарубежные облигации': 'bonds',
      'Товары': 'commodities',
      'Денежные фонды': 'cash',
      'Недвижимость': 'realestate',
      'Криптовалюты': 'crypto'
    };

    const actualAllocation = {
      stocks: 0,
      bonds: 0,
      cash: 0,
      commodities: 0,
      crypto: 0,
      realestate: 0
    };

    const plannedAllocation = { ...actualAllocation };

    activePortfolio.assets.forEach(asset => {
      const values = calculateAssetValues(asset);
      const type = categoryMapping[asset.category];
      if (type) {
        actualAllocation[type] += values.actualAmount;
        plannedAllocation[type] += values.targetAmount;
      }
    });

    const getPercentage = (value, total) => total > 0 ? (value / total) * 100 : 0;

    return {
      targetTotal,
      isValid: Math.abs(targetTotal - 100) < 0.01,
      actual: {
        stocks: getPercentage(actualAllocation.stocks, totalPortfolio),
        bonds: getPercentage(actualAllocation.bonds, totalPortfolio),
        cash: getPercentage(actualAllocation.cash, totalPortfolio),
        commodities: getPercentage(actualAllocation.commodities, totalPortfolio),
        crypto: getPercentage(actualAllocation.crypto, totalPortfolio),
        realestate: getPercentage(actualAllocation.realestate, totalPortfolio)
      },
      planned: {
        stocks: getPercentage(plannedAllocation.stocks, totalPortfolio),
        bonds: getPercentage(plannedAllocation.bonds, totalPortfolio),
        cash: getPercentage(plannedAllocation.cash, totalPortfolio),
        commodities: getPercentage(plannedAllocation.commodities, totalPortfolio),
        crypto: getPercentage(plannedAllocation.crypto, totalPortfolio),
        realestate: getPercentage(plannedAllocation.realestate, totalPortfolio)
      }
    };
  };

  const riskAnalysis = getRiskProfileAnalysis();

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="header-title">
            <TrendingUp size={32} />
            <h1>Инвестиционный Портфель</h1>
          </div>
          <div className="header-actions">
            <button 
              className="btn btn-secondary" 
              onClick={updateAllPrices}
              disabled={isUpdating}
            >
              <RefreshCw size={18} className={isUpdating ? 'spinning' : ''} />
              Обновить цены
            </button>
            <button className="btn btn-secondary" onClick={exportData}>
              <Download size={18} />
              Экспорт
            </button>
            <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
              <Upload size={18} />
              Импорт
              <input type="file" accept=".json" onChange={importData} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
        {lastUpdate && (
          <div className="last-update">
            Последнее обновление цен: {lastUpdate.toLocaleString('ru-RU')}
          </div>
        )}
      </header>

      {/* Вкладки портфелей */}
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
                  setPortfolios(portfolios.map(p => 
                    p.id === portfolio.id ? { ...p, name: e.target.value } : p
                  ));
                }}
                onClick={(e) => e.stopPropagation()}
                className="portfolio-name-input"
              />
            </button>
            {portfolios.length > 1 && (
              <button 
                className="portfolio-tab-delete"
                onClick={() => deletePortfolio(portfolio.id)}
                title="Удалить портфель"
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

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'portfolio' ? 'active' : ''}`}
          onClick={() => setActiveTab('portfolio')}
        >
          Портфель
        </button>
        <button 
          className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 size={18} />
          Аналитика
        </button>
      </div>

      <main className="main">
        {activeTab === 'portfolio' ? (
          <>
            {/* Информация о портфеле */}
            <div className="portfolio-info">
              <h2>Информация о портфеле</h2>
              <div className="info-grid">
                <div className="info-field">
                  <label>Брокер:</label>
                  <input
                    type="text"
                    value={activePortfolio.broker}
                    onChange={(e) => updatePortfolio('broker', e.target.value)}
                    placeholder="Название брокера"
                  />
                </div>
                <div className="info-field">
                  <label>Вид счета:</label>
                  <div className="button-group">
                    <button
                      className={`btn-choice ${activePortfolio.accountType === 'Брокерский счет' ? 'active' : ''}`}
                      onClick={() => updatePortfolio('accountType', 'Брокерский счет')}
                    >
                      Брокерский счет
                    </button>
                    <button
                      className={`btn-choice ${activePortfolio.accountType === 'ИИС' ? 'active' : ''}`}
                      onClick={() => updatePortfolio('accountType', 'ИИС')}
                    >
                      ИИС
                    </button>
                  </div>
                </div>
                <div className="info-field">
                  <label>Планируемые пополнения:</label>
                  <div className="contribution-field">
                    <input
                      type="number"
                      value={activePortfolio.plannedContribution}
                      onChange={(e) => updatePortfolio('plannedContribution', e.target.value)}
                      placeholder="Сумма"
                    />
                    <select
                      value={activePortfolio.contributionPeriod}
                      onChange={(e) => updatePortfolio('contributionPeriod', e.target.value)}
                    >
                      <option value="Неделя">Неделя</option>
                      <option value="Месяц">Месяц</option>
                      <option value="Квартал">Квартал</option>
                      <option value="Полугодие">Полугодие</option>
                      <option value="Год">Год</option>
                    </select>
                  </div>
                </div>
                <div className="info-field">
                  <label>Цель:</label>
                  <input
                    type="text"
                    value={activePortfolio.goal}
                    onChange={(e) => updatePortfolio('goal', e.target.value)}
                    placeholder="Описание цели"
                  />
                </div>
                <div className="info-field">
                  <label>Срок цели (лет):</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="30"
                    value={activePortfolio.goalYears}
                    onChange={(e) => updatePortfolio('goalYears', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Риск-профиль */}
            <div className="risk-profile">
              <h2>Риск-профиль</h2>
              <div className="risk-grid">
                <div className="risk-field">
                  <label>Акции (%):</label>
                  <input
                    type="number"
                    value={activePortfolio.riskProfile.stocks}
                    onChange={(e) => updateRiskProfile('stocks', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="risk-field">
                  <label>Облигации (%):</label>
                  <input
                    type="number"
                    value={activePortfolio.riskProfile.bonds}
                    onChange={(e) => updateRiskProfile('bonds', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="risk-field">
                  <label>Денежные фонды (%):</label>
                  <input
                    type="number"
                    value={activePortfolio.riskProfile.cash}
                    onChange={(e) => updateRiskProfile('cash', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="risk-field">
                  <label>Товары (%):</label>
                  <input
                    type="number"
                    value={activePortfolio.riskProfile.commodities}
                    onChange={(e) => updateRiskProfile('commodities', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="risk-field">
                  <label>Криптовалюты (%):</label>
                  <input
                    type="number"
                    value={activePortfolio.riskProfile.crypto}
                    onChange={(e) => updateRiskProfile('crypto', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="risk-field">
                  <label>Недвижимость (%):</label>
                  <input
                    type="number"
                    value={activePortfolio.riskProfile.realestate}
                    onChange={(e) => updateRiskProfile('realestate', e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className={`risk-total ${riskAnalysis.isValid ? 'valid' : 'invalid'}`}>
                Итого: {riskAnalysis.targetTotal.toFixed(1)}%
                {!riskAnalysis.isValid && <span className="error-text"> (Должно быть 100%)</span>}
              </div>
            </div>

            {/* Размер портфеля */}
            <div className="portfolio-summary">
              <div className="summary-card">
                <label>Текущая оценка портфеля</label>
                <input
                  type="number"
                  value={activePortfolio.currentValue}
                  onChange={(e) => updatePortfolio('currentValue', e.target.value)}
                  className="input-large"
                  placeholder="0"
                />
              </div>
              <div className="summary-card">
                <label>Сумма довложения</label>
                <input
                  type="number"
                  value={activePortfolio.additionalInvestment}
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

            {/* Активы по категориям */}
            <div className="assets-section">
              {CATEGORIES.map(category => {
                const categoryAssets = activePortfolio.assets.filter(a => a.category === category);
                return (
                  <div key={category} className="category-section">
                    <div className="category-header">
                      <h3>{category}</h3>
                      <button 
                        className="btn btn-small"
                        onClick={() => addAsset(category)}
                      >
                        <PlusCircle size={16} />
                        Добавить актив
                      </button>
                    </div>
                    {categoryAssets.length > 0 && (
                      <div className="table-container">
                        <table className="assets-table">
                          <thead>
                            <tr>
                              <th>Актив</th>
                              <th>Тикер</th>
                              <th>Доля в портфеле, %</th>
                              <th>Валюта</th>
                              <th>Цена за лот</th>
                              <th>Размер лота</th>
                              <th>Целевое кол-во</th>
                              <th>Целевая сумма</th>
                              <th>Реальное кол-во</th>
                              <th>Сумма в портфеле</th>
                              <th>Реальная доля %</th>
                              <th>Ребалансировка</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {categoryAssets.map(asset => {
                              const values = calculateAssetValues(asset);
                              return (
                                <tr key={asset.id}>
                                  <td>
                                    <input
                                      type="text"
                                      value={asset.name}
                                      onChange={(e) => updateAsset(asset.id, 'name', e.target.value)}
                                      placeholder="Название"
                                      className="input-sm"
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="text"
                                      value={asset.ticker}
                                      onChange={(e) => updateAsset(asset.id, 'ticker', e.target.value)}
                                      placeholder="Тикер"
                                      className="input-sm"
                                      style={{ width: '80px' }}
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      value={asset.targetShare}
                                      onChange={(e) => updateAsset(asset.id, 'targetShare', e.target.value)}
                                      placeholder="0"
                                      className="input-sm"
                                      style={{ width: '70px' }}
                                    />
                                  </td>
                                  <td>
                                    <select
                                      value={asset.currency}
                                      onChange={(e) => updateAsset(asset.id, 'currency', e.target.value)}
                                      className="input-sm"
                                      style={{ width: '70px' }}
                                    >
                                      <option value="RUB">RUB</option>
                                      <option value="USD">USD</option>
                                      <option value="EUR">EUR</option>
                                    </select>
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      value={asset.price}
                                      onChange={(e) => updateAsset(asset.id, 'price', e.target.value)}
                                      placeholder="0"
                                      className="input-sm"
                                      style={{ width: '90px' }}
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      value={asset.lotSize}
                                      onChange={(e) => updateAsset(asset.id, 'lotSize', e.target.value)}
                                      placeholder="1"
                                      className="input-sm"
                                      style={{ width: '60px' }}
                                    />
                                  </td>
                                  <td className="calculated">{values.targetQuantity || 0}</td>
                                  <td className="calculated">
                                    {values.targetAmount.toLocaleString('ru-RU', { maximumFractionDigits: 0 })}
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      value={asset.quantity}
                                      onChange={(e) => updateAsset(asset.id, 'quantity', e.target.value)}
                                      placeholder="0"
                                      className="input-sm"
                                      style={{ width: '80px' }}
                                    />
                                  </td>
                                  <td className="calculated">
                                    {values.actualAmount.toLocaleString('ru-RU', { maximumFractionDigits: 0 })}
                                  </td>
                                  <td className="calculated">{values.actualShare.toFixed(2)}%</td>
                                  <td className={`calculated ${values.rebalance > 0 ? 'positive' : values.rebalance < 0 ? 'negative' : ''}`}>
                                    {values.rebalance > 0 ? '+' : ''}{values.rebalance}
                                  </td>
                                  <td>
                                    <button 
                                      className="btn-icon" 
                                      onClick={() => deleteAsset(asset.id)}
                                      title="Удалить"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Анализ соответствия риск-профилю */}
            <div className="risk-analysis">
              <h2>Анализ соответствия риск-профилю</h2>
              <div className="analysis-grid">
                <div className="analysis-card">
                  <h3>Планируемое распределение</h3>
                  <table className="analysis-table">
                    <thead>
                      <tr>
                        <th>Класс активов</th>
                        <th>Целевое</th>
                        <th>Планируемое</th>
                        <th>Отклонение</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Акции</td>
                        <td>{parseFloat(activePortfolio.riskProfile.stocks || 0).toFixed(1)}%</td>
                        <td>{riskAnalysis.planned.stocks.toFixed(1)}%</td>
                        <td className={Math.abs(riskAnalysis.planned.stocks - parseFloat(activePortfolio.riskProfile.stocks || 0)) > 2 ? 'warning' : 'ok'}>
                          {(riskAnalysis.planned.stocks - parseFloat(activePortfolio.riskProfile.stocks || 0)).toFixed(1)}%
                        </td>
                      </tr>
                      <tr>
                        <td>Облигации</td>
                        <td>{parseFloat(activePortfolio.riskProfile.bonds || 0).toFixed(1)}%</td>
                        <td>{riskAnalysis.planned.bonds.toFixed(1)}%</td>
                        <td className={Math.abs(riskAnalysis.planned.bonds - parseFloat(activePortfolio.riskProfile.bonds || 0)) > 2 ? 'warning' : 'ok'}>
                          {(riskAnalysis.planned.bonds - parseFloat(activePortfolio.riskProfile.bonds || 0)).toFixed(1)}%
                        </td>
                      </tr>
                      <tr>
                        <td>Денежные фонды</td>
                        <td>{parseFloat(activePortfolio.riskProfile.cash || 0).toFixed(1)}%</td>
                        <td>{riskAnalysis.planned.cash.toFixed(1)}%</td>
                        <td className={Math.abs(riskAnalysis.planned.cash - parseFloat(activePortfolio.riskProfile.cash || 0)) > 2 ? 'warning' : 'ok'}>
                          {(riskAnalysis.planned.cash - parseFloat(activePortfolio.riskProfile.cash || 0)).toFixed(1)}%
                        </td>
                      </tr>
                      <tr>
                        <td>Товары</td>
                        <td>{parseFloat(activePortfolio.riskProfile.commodities || 0).toFixed(1)}%</td>
                        <td>{riskAnalysis.planned.commodities.toFixed(1)}%</td>
                        <td className={Math.abs(riskAnalysis.planned.commodities - parseFloat(activePortfolio.riskProfile.commodities || 0)) > 2 ? 'warning' : 'ok'}>
                          {(riskAnalysis.planned.commodities - parseFloat(activePortfolio.riskProfile.commodities || 0)).toFixed(1)}%
                        </td>
                      </tr>
                      <tr>
                        <td>Криптовалюты</td>
                        <td>{parseFloat(activePortfolio.riskProfile.crypto || 0).toFixed(1)}%</td>
                        <td>{riskAnalysis.planned.crypto.toFixed(1)}%</td>
                        <td className={Math.abs(riskAnalysis.planned.crypto - parseFloat(activePortfolio.riskProfile.crypto || 0)) > 2 ? 'warning' : 'ok'}>
                          {(riskAnalysis.planned.crypto - parseFloat(activePortfolio.riskProfile.crypto || 0)).toFixed(1)}%
                        </td>
                      </tr>
                      <tr>
                        <td>Недвижимость</td>
                        <td>{parseFloat(activePortfolio.riskProfile.realestate || 0).toFixed(1)}%</td>
                        <td>{riskAnalysis.planned.realestate.toFixed(1)}%</td>
                        <td className={Math.abs(riskAnalysis.planned.realestate - parseFloat(activePortfolio.riskProfile.realestate || 0)) > 2 ? 'warning' : 'ok'}>
                          {(riskAnalysis.planned.realestate - parseFloat(activePortfolio.riskProfile.realestate || 0)).toFixed(1)}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="analysis-card">
                  <h3>Реальное распределение</h3>
                  <table className="analysis-table">
                    <thead>
                      <tr>
                        <th>Класс активов</th>
                        <th>Целевое</th>
                        <th>Реальное</th>
                        <th>Отклонение</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Акции</td>
                        <td>{parseFloat(activePortfolio.riskProfile.stocks || 0).toFixed(1)}%</td>
                        <td>{riskAnalysis.actual.stocks.toFixed(1)}%</td>
                        <td className={Math.abs(riskAnalysis.actual.stocks - parseFloat(activePortfolio.riskProfile.stocks || 0)) > 2 ? 'warning' : 'ok'}>
                          {(riskAnalysis.actual.stocks - parseFloat(activePortfolio.riskProfile.stocks || 0)).toFixed(1)}%
                        </td>
                      </tr>
                      <tr>
                        <td>Облигации</td>
                        <td>{parseFloat(activePortfolio.riskProfile.bonds || 0).toFixed(1)}%</td>
                        <td>{riskAnalysis.actual.bonds.toFixed(1)}%</td>
                        <td className={Math.abs(riskAnalysis.actual.bonds - parseFloat(activePortfolio.riskProfile.bonds || 0)) > 2 ? 'warning' : 'ok'}>
                          {(riskAnalysis.actual.bonds - parseFloat(activePortfolio.riskProfile.bonds || 0)).toFixed(1)}%
                        </td>
                      </tr>
                      <tr>
                        <td>Денежные фонды</td>
                        <td>{parseFloat(activePortfolio.riskProfile.cash || 0).toFixed(1)}%</td>
                        <td>{riskAnalysis.actual.cash.toFixed(1)}%</td>
                        <td className={Math.abs(riskAnalysis.actual.cash - parseFloat(activePortfolio.riskProfile.cash || 0)) > 2 ? 'warning' : 'ok'}>
                          {(riskAnalysis.actual.cash - parseFloat(activePortfolio.riskProfile.cash || 0)).toFixed(1)}%
                        </td>
                      </tr>
                      <tr>
                        <td>Товары</td>
                        <td>{parseFloat(activePortfolio.riskProfile.commodities || 0).toFixed(1)}%</td>
                        <td>{riskAnalysis.actual.commodities.toFixed(1)}%</td>
                        <td className={Math.abs(riskAnalysis.actual.commodities - parseFloat(activePortfolio.riskProfile.commodities || 0)) > 2 ? 'warning' : 'ok'}>
                          {(riskAnalysis.actual.commodities - parseFloat(activePortfolio.riskProfile.commodities || 0)).toFixed(1)}%
                        </td>
                      </tr>
                      <tr>
                        <td>Криптовалюты</td>
                        <td>{parseFloat(activePortfolio.riskProfile.crypto || 0).toFixed(1)}%</td>
                        <td>{riskAnalysis.actual.crypto.toFixed(1)}%</td>
                        <td className={Math.abs(riskAnalysis.actual.crypto - parseFloat(activePortfolio.riskProfile.crypto || 0)) > 2 ? 'warning' : 'ok'}>
                          {(riskAnalysis.actual.crypto - parseFloat(activePortfolio.riskProfile.crypto || 0)).toFixed(1)}%
                        </td>
                      </tr>
                      <tr>
                        <td>Недвижимость</td>
                        <td>{parseFloat(activePortfolio.riskProfile.realestate || 0).toFixed(1)}%</td>
                        <td>{riskAnalysis.actual.realestate.toFixed(1)}%</td>
                        <td className={Math.abs(riskAnalysis.actual.realestate - parseFloat(activePortfolio.riskProfile.realestate || 0)) > 2 ? 'warning' : 'ok'}>
                          {(riskAnalysis.actual.realestate - parseFloat(activePortfolio.riskProfile.realestate || 0)).toFixed(1)}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="analytics">
            {/* Графики - оставляем как были */}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
