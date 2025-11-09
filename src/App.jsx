import React, { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, PlusCircle, Trash2, Download, Upload, BarChart3, Plus, X, LogOut, User } from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { supabase } from './supabaseClient';
import Auth from './Auth';
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

const fetchForeignPrice = async (ticker, currency) => {
  const mockPrices = {
    'VTI': 28979, 'GXC': 6700, 'MCHI': 4700,
    'EWG': 2300, 'EWQ': 3200, 'EWU': 2800,
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
    stocks: '', bonds: '', cash: '',
    commodities: '', crypto: '', realestate: ''
  },
  currentValue: '',
  additionalInvestment: '',
  assets: []
};

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portfolios, setPortfolios] = useState([defaultPortfolio]);
  const [activePortfolioId, setActivePortfolioId] = useState(1);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [activeTab, setActiveTab] = useState('portfolio');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setUserEmail(session.user.email);
        loadPortfolios(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setUserEmail(session.user.email);
        loadPortfolios(session.user.id);
      } else {
        setPortfolios([defaultPortfolio]);
        setActivePortfolioId(1);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadPortfolios = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', userId)
        .order('id', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setPortfolios(data);
        setActivePortfolioId(data[0].id);
      } else {
        await createInitialPortfolio(userId);
      }
    } catch (error) {
      console.error('Ошибка загрузки портфелей:', error);
    }
  };

  const createInitialPortfolio = async (userId) => {
    try {
      const newPortfolio = { ...defaultPortfolio, user_id: userId };
      delete newPortfolio.id;
      
      const { data, error } = await supabase
        .from('portfolios')
        .insert([newPortfolio])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setPortfolios(data);
        setActivePortfolioId(data[0].id);
      }
    } catch (error) {
      console.error('Ошибка создания портфеля:', error);
    }
  };

  const savePortfolio = async (updatedPortfolio) => {
    if (!session) return;

    try {
      const { error } = await supabase
        .from('portfolios')
        .update(updatedPortfolio)
        .eq('id', updatedPortfolio.id)
        .eq('user_id', session.user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    }
  };

  const activePortfolio = portfolios.find(p => p.id === activePortfolioId) || portfolios[0];
  const totalPortfolio = parseFloat(activePortfolio?.currentValue || 0) + parseFloat(activePortfolio?.additionalInvestment || 0);

  const updatePortfolio = (field, value) => {
    const updated = portfolios.map(p => 
      p.id === activePortfolioId ? { ...p, [field]: value } : p
    );
    setPortfolios(updated);
    const updatedPortfolio = updated.find(p => p.id === activePortfolioId);
    savePortfolio(updatedPortfolio);
  };

  const updateRiskProfile = (field, value) => {
    const updated = portfolios.map(p => 
      p.id === activePortfolioId ? {
        ...p,
        riskProfile: { ...p.riskProfile, [field]: value }
      } : p
    );
    setPortfolios(updated);
    const updatedPortfolio = updated.find(p => p.id === activePortfolioId);
    savePortfolio(updatedPortfolio);
  };

  const addPortfolio = async () => {
    if (!session) return;

    try {
      const newPortfolio = {
        ...defaultPortfolio,
        name: `Портфель ${portfolios.length + 1}`,
        user_id: session.user.id
      };
      delete newPortfolio.id;

      const { data, error } = await supabase
        .from('portfolios')
        .insert([newPortfolio])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setPortfolios([...portfolios, data[0]]);
        setActivePortfolioId(data[0].id);
      }
    } catch (error) {
      console.error('Ошибка создания портфеля:', error);
    }
  };

  const deletePortfolio = async (id) => {
    if (portfolios.length === 1) {
      alert('Нельзя удалить последний портфель');
      return;
    }

    if (!session) return;

    try {
      const { error } = await supabase
        .from('portfolios')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) throw error;

      const updated = portfolios.filter(p => p.id !== id);
      setPortfolios(updated);
      if (activePortfolioId === id) {
        setActivePortfolioId(updated[0].id);
      }
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

  const updateAllPrices = async () => {
    setIsUpdating(true);
    const updatedAssets = [...(activePortfolio?.assets || [])];
    
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
    
    return { targetAmount, targetQuantity, actualAmount, actualShare, rebalance };
  };

  const addAsset = (category) => {
    const newAsset = {
      id: Math.max(...(activePortfolio?.assets || []).map(a => a.id), 0) + 1,
      category, name: '', ticker: '', targetShare: '',
      currency: 'RUB', lotSize: '', quantity: '', price: ''
    };
    updatePortfolio('assets', [...(activePortfolio?.assets || []), newAsset]);
  };

  const updateAsset = (id, field, value) => {
    updatePortfolio('assets', (activePortfolio?.assets || []).map(asset => 
      asset.id === id ? { ...asset, [field]: value } : asset
    ));
  };

  const deleteAsset = (id) => {
    updatePortfolio('assets', (activePortfolio?.assets || []).filter(asset => asset.id !== id));
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const getRiskProfileAnalysis = () => {
    const rp = activePortfolio?.riskProfile || {};
    const targetTotal = parseFloat(rp.stocks || 0) + parseFloat(rp.bonds || 0) + 
                       parseFloat(rp.cash || 0) + parseFloat(rp.commodities || 0) + 
                       parseFloat(rp.crypto || 0) + parseFloat(rp.realestate || 0);
    
    const categoryMapping = {
      'Акции российских компаний': 'stocks', 'Акции мирового рынка': 'stocks',
      'Российские облигации': 'bonds', 'Зарубежные облигации': 'bonds',
      'Товары': 'commodities', 'Денежные фонды': 'cash',
      'Недвижимость': 'realestate', 'Криптовалюты': 'crypto'
    };

    const actualAllocation = { stocks: 0, bonds: 0, cash: 0, commodities: 0, crypto: 0, realestate: 0 };
    const plannedAllocation = { ...actualAllocation };

    (activePortfolio?.assets || []).forEach(asset => {
      const values = calculateAssetValues(asset);
      const type = categoryMapping[asset.category];
      if (type) {
        actualAllocation[type] += values.actualAmount;
        plannedAllocation[type] += values.targetAmount;
      }
    });

    const getPercentage = (value, total) => total > 0 ? (value / total) * 100 : 0;

    return {
      targetTotal, isValid: Math.abs(targetTotal - 100) < 0.01,
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

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Загрузка...</p>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  const riskAnalysis = getRiskProfileAnalysis();

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="header-title">
            <TrendingUp size={32} />
            <h1>Инвестиционный Портфель</h1>
          </div>
          <div className="header-user">
            <div className="user-info">
              <User size={18} />
              <span>{userEmail}</span>
            </div>
            <button className="btn btn-secondary" onClick={handleSignOut}>
              <LogOut size={18} />
              Выйти
            </button>
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
          </div>
        </div>
        {lastUpdate && (
          <div className="last-update">
            Последнее обновление цен: {lastUpdate.toLocaleString('ru-RU')}
          </div>
        )}
      </header>

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
                  savePortfolio(updated.find(p => p.id === portfolio.id));
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
            <div className="portfolio-info">
              <h2>Информация о портфеле</h2>
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
                <div className="info-field">
                  <label>Планируемые пополнения:</label>
                  <div className="contribution-field">
                    <input
                      type="number"
                      value={activePortfolio?.plannedContribution || ''}
                      onChange={(e) => updatePortfolio('plannedContribution', e.target.value)}
                      placeholder="Сумма"
                    />
                    <select
                      value={activePortfolio?.contributionPeriod || 'Месяц'}
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
                    value={activePortfolio?.goal || ''}
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
                    value={activePortfolio?.goalYears || 5}
                    onChange={(e) => updatePortfolio('goalYears', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="risk-profile">
              <h2>Риск-профиль</h2>
              <div className="risk-grid">
                <div className="risk-field">
                  <label>Акции (%):</label>
                  <input
                    type="number"
                    value={activePortfolio?.riskProfile?.stocks || ''}
                    onChange={(e) => updateRiskProfile('stocks', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="risk-field">
                  <label>Облигации (%):</label>
                  <input
                    type="number"
                    value={activePortfolio?.riskProfile?.bonds || ''}
                    onChange={(e) => updateRiskProfile('bonds', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="risk-field">
                  <label>Денежные фонды (%):</label>
                  <input
                    type="number"
                    value={activePortfolio?.riskProfile?.cash || ''}
                    onChange={(e) => updateRiskProfile('cash', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="risk-field">
                  <label>Товары (%):</label>
                  <input
                    type="number"
                    value={activePortfolio?.riskProfile?.commodities || ''}
                    onChange={(e) => updateRiskProfile('commodities', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="risk-field">
                  <label>Криптовалюты (%):</label>
                  <input
                    type="number"
                    value={activePortfolio?.riskProfile?.crypto || ''}
                    onChange={(e) => updateRiskProfile('crypto', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="risk-field">
                  <label>Недвижимость (%):</label>
                  <input
                    type="number"
                    value={activePortfolio?.riskProfile?.realestate || ''}
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

            <div className="assets-section">
              {CATEGORIES.map(category => {
                const categoryAssets = (activePortfolio?.assets || []).filter(a => a.category === category);
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
                      {['stocks', 'bonds', 'cash', 'commodities', 'crypto', 'realestate'].map(type => {
                        const names = { stocks: 'Акции', bonds: 'Облигации', cash: 'Денежные фонды', commodities: 'Товары', crypto: 'Криптовалюты', realestate: 'Недвижимость' };
                        const target = parseFloat(activePortfolio?.riskProfile?.[type] || 0);
                        const planned = riskAnalysis.planned[type];
                        const deviation = planned - target;
                        return (
                          <tr key={type}>
                            <td>{names[type]}</td>
                            <td>{target.toFixed(1)}%</td>
                            <td>{planned.toFixed(1)}%</td>
                            <td className={Math.abs(deviation) > 2 ? 'warning' : 'ok'}>
                              {deviation > 0 ? '+' : ''}{deviation.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
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
                      {['stocks', 'bonds', 'cash', 'commodities', 'crypto', 'realestate'].map(type => {
                        const names = { stocks: 'Акции', bonds: 'Облигации', cash: 'Денежные фонды', commodities: 'Товары', crypto: 'Криптовалюты', realestate: 'Недвижимость' };
                        const target = parseFloat(activePortfolio?.riskProfile?.[type] || 0);
                        const actual = riskAnalysis.actual[type];
                        const deviation = actual - target;
                        return (
                          <tr key={type}>
                            <td>{names[type]}</td>
                            <td>{target.toFixed(1)}%</td>
                            <td>{actual.toFixed(1)}%</td>
                            <td className={Math.abs(deviation) > 2 ? 'warning' : 'ok'}>
                              {deviation > 0 ? '+' : ''}{deviation.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="analytics">
            <p>Аналитика в разработке</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
