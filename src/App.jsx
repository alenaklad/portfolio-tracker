import React, { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, PlusCircle, Trash2, Download, Upload, PieChart, BarChart3 } from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import './App.css';

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#fa709a', '#fee140', '#30cfd0'];

// API для получения цен криптовалют и акций
const fetchPrice = async (ticker, currency = 'RUB') => {
  try {
    // Для демонстрации используем случайные цены
    // В реальном проекте здесь будет API интеграция
    const mockPrices = {
      'VTI': 28979,
      'GXC': 6700,
      'MCHI': 4700,
      'EWG': 2300,
      'EWQ': 3200,
      'EWU': 2800,
      'SBMX': 150,
      'DIVD': 120,
      'SBGB': 100,
      'BOND': 95,
    };
    
    // Добавляем небольшую вариацию для реалистичности
    const basePrice = mockPrices[ticker] || 100;
    const variation = (Math.random() - 0.5) * basePrice * 0.05; // +/- 5%
    return basePrice + variation;
  } catch (error) {
    console.error(`Error fetching price for ${ticker}:`, error);
    return 0;
  }
};

const initialAssets = [
  { id: 1, category: 'Акции международного рынка', name: 'ETF-фонд на акции США', ticker: 'VTI', targetShare: 0, currency: 'USD', lotSize: 1, quantity: 0, price: 28979 },
  { id: 2, category: 'Акции международного рынка', name: 'ETF на рынок акций Китая', ticker: 'GXC', targetShare: 0, currency: 'USD', lotSize: 1, quantity: 0, price: 6700 },
  { id: 3, category: 'Акции международного рынка', name: 'ETF на рынок акций Китая', ticker: 'MCHI', targetShare: 0, currency: 'USD', lotSize: 1, quantity: 0, price: 4700 },
  { id: 4, category: 'Акции международного рынка', name: 'ETF-фонд на акции Германии', ticker: 'EWG', targetShare: 0, currency: 'EUR', lotSize: 1, quantity: 0, price: 2300 },
  { id: 5, category: 'Акции международного рынка', name: 'Фонд на акции Франции', ticker: 'EWQ', targetShare: 0, currency: 'EUR', lotSize: 1, quantity: 0, price: 3200 },
  { id: 6, category: 'Акции международного рынка', name: 'ETF на рынок акций UK', ticker: 'EWU', targetShare: 0, currency: 'EUR', lotSize: 1, quantity: 0, price: 2800 },
  { id: 7, category: 'Акции российских компаний', name: 'БПИФ Топ Российских акций', ticker: 'SBMX', targetShare: 0, currency: 'RUB', lotSize: 1, quantity: 0, price: 150 },
  { id: 8, category: 'Акции российских компаний', name: 'БПИФ ДОХОДЪ Индекс дивидендных акций', ticker: 'DIVD', targetShare: 0, currency: 'RUB', lotSize: 1, quantity: 0, price: 120 },
  { id: 9, category: 'Облигации РФ', name: 'БПИФ Государственные облигации', ticker: 'SBGB', targetShare: 0, currency: 'RUB', lotSize: 1, quantity: 0, price: 100 },
  { id: 10, category: 'Облигации РФ', name: 'БПИФ ДОХОДЪ Корпоративные облигации РФ', ticker: 'BOND', targetShare: 0, currency: 'RUB', lotSize: 1, quantity: 0, price: 95 },
];

function App() {
  const [portfolioValue, setPortfolioValue] = useState(120000);
  const [additionalInvestment, setAdditionalInvestment] = useState(0);
  const [assets, setAssets] = useState(() => {
    const saved = localStorage.getItem('portfolioAssets');
    return saved ? JSON.parse(saved) : initialAssets;
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [activeTab, setActiveTab] = useState('portfolio');

  useEffect(() => {
    localStorage.setItem('portfolioAssets', JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    const saved = localStorage.getItem('lastPriceUpdate');
    if (saved) {
      setLastUpdate(new Date(saved));
    }
  }, []);

  const totalPortfolio = portfolioValue + additionalInvestment;

  const updateAllPrices = async () => {
    setIsUpdating(true);
    const updatedAssets = [...assets];
    
    for (let i = 0; i < updatedAssets.length; i++) {
      if (updatedAssets[i].ticker) {
        const newPrice = await fetchPrice(updatedAssets[i].ticker, updatedAssets[i].currency);
        updatedAssets[i].price = newPrice;
      }
    }
    
    setAssets(updatedAssets);
    const now = new Date();
    setLastUpdate(now);
    localStorage.setItem('lastPriceUpdate', now.toISOString());
    setIsUpdating(false);
  };

  const calculateAssetValues = (asset) => {
    const targetAmount = (asset.targetShare / 100) * totalPortfolio;
    const targetQuantity = Math.floor(targetAmount / (asset.price * asset.lotSize)) * asset.lotSize;
    const actualAmount = asset.quantity * asset.price;
    const actualShare = totalPortfolio > 0 ? (actualAmount / totalPortfolio) * 100 : 0;
    const rebalance = Math.floor((targetQuantity - asset.quantity) / asset.lotSize);
    
    return {
      targetAmount,
      targetQuantity,
      actualAmount,
      actualShare,
      rebalance
    };
  };

  const updateAsset = (id, field, value) => {
    setAssets(assets.map(asset => 
      asset.id === id ? { ...asset, [field]: parseFloat(value) || 0 } : asset
    ));
  };

  const addAsset = () => {
    const newAsset = {
      id: Math.max(...assets.map(a => a.id), 0) + 1,
      category: 'Новая категория',
      name: 'Новый актив',
      ticker: '',
      targetShare: 0,
      currency: 'RUB',
      lotSize: 1,
      quantity: 0,
      price: 0
    };
    setAssets([...assets, newAsset]);
  };

  const deleteAsset = (id) => {
    setAssets(assets.filter(asset => asset.id !== id));
  };

  const exportData = () => {
    const dataStr = JSON.stringify({ portfolioValue, additionalInvestment, assets }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `portfolio_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          setPortfolioValue(data.portfolioValue || 0);
          setAdditionalInvestment(data.additionalInvestment || 0);
          setAssets(data.assets || []);
        } catch (error) {
          alert('Ошибка при чтении файла');
        }
      };
      reader.readAsText(file);
    }
  };

  // Подготовка данных для графиков
  const categoryData = {};
  assets.forEach(asset => {
    const values = calculateAssetValues(asset);
    if (!categoryData[asset.category]) {
      categoryData[asset.category] = 0;
    }
    categoryData[asset.category] += values.actualAmount;
  });

  const pieData = Object.entries(categoryData).map(([name, value]) => ({
    name,
    value,
    percentage: totalPortfolio > 0 ? ((value / totalPortfolio) * 100).toFixed(1) : 0
  }));

  const barData = assets.map(asset => {
    const values = calculateAssetValues(asset);
    return {
      name: asset.ticker || asset.name.substring(0, 15),
      target: values.targetAmount,
      actual: values.actualAmount
    };
  }).filter(d => d.target > 0 || d.actual > 0);

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
            <div className="portfolio-summary">
              <div className="summary-card">
                <label>Текущая оценка портфеля</label>
                <input
                  type="number"
                  value={portfolioValue}
                  onChange={(e) => setPortfolioValue(parseFloat(e.target.value) || 0)}
                  className="input-large"
                />
              </div>
              <div className="summary-card">
                <label>Сумма довложения</label>
                <input
                  type="number"
                  value={additionalInvestment}
                  onChange={(e) => setAdditionalInvestment(parseFloat(e.target.value) || 0)}
                  className="input-large"
                />
              </div>
              <div className="summary-card highlight">
                <label>Итоговый размер портфеля</label>
                <div className="total-value">
                  {totalPortfolio.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                </div>
              </div>
            </div>

            <div className="actions-bar">
              <button className="btn btn-primary" onClick={addAsset}>
                <PlusCircle size={18} />
                Добавить актив
              </button>
            </div>

            <div className="table-container">
              <table className="portfolio-table">
                <thead>
                  <tr>
                    <th>№</th>
                    <th>Категория</th>
                    <th>Актив</th>
                    <th>Тикер</th>
                    <th>Целевая доля %</th>
                    <th>Валюта</th>
                    <th>Цена за лот</th>
                    <th>Размер лота</th>
                    <th>Целевое кол-во</th>
                    <th>Целевая сумма</th>
                    <th>Реальное кол-во</th>
                    <th>Сумма в портфеле</th>
                    <th>Реальная доля %</th>
                    <th>Ребалансировка</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset, index) => {
                    const values = calculateAssetValues(asset);
                    return (
                      <tr key={asset.id}>
                        <td>{index + 1}</td>
                        <td>
                          <input
                            type="text"
                            value={asset.category}
                            onChange={(e) => setAssets(assets.map(a => 
                              a.id === asset.id ? { ...a, category: e.target.value } : a
                            ))}
                            className="input-sm"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={asset.name}
                            onChange={(e) => setAssets(assets.map(a => 
                              a.id === asset.id ? { ...a, name: e.target.value } : a
                            ))}
                            className="input-sm"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={asset.ticker}
                            onChange={(e) => setAssets(assets.map(a => 
                              a.id === asset.id ? { ...a, ticker: e.target.value } : a
                            ))}
                            className="input-sm"
                            style={{ width: '80px' }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={asset.targetShare}
                            onChange={(e) => updateAsset(asset.id, 'targetShare', e.target.value)}
                            className="input-sm"
                            style={{ width: '70px' }}
                          />
                        </td>
                        <td>
                          <select
                            value={asset.currency}
                            onChange={(e) => setAssets(assets.map(a => 
                              a.id === asset.id ? { ...a, currency: e.target.value } : a
                            ))}
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
                            className="input-sm"
                            style={{ width: '90px' }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={asset.lotSize}
                            onChange={(e) => updateAsset(asset.id, 'lotSize', e.target.value)}
                            className="input-sm"
                            style={{ width: '60px' }}
                          />
                        </td>
                        <td className="calculated">{values.targetQuantity}</td>
                        <td className="calculated">
                          {values.targetAmount.toLocaleString('ru-RU', { maximumFractionDigits: 0 })}
                        </td>
                        <td>
                          <input
                            type="number"
                            value={asset.quantity}
                            onChange={(e) => updateAsset(asset.id, 'quantity', e.target.value)}
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
          </>
        ) : (
          <div className="analytics">
            <div className="chart-grid">
              <div className="chart-card">
                <h3>Распределение по категориям</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPie>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => value.toLocaleString('ru-RU', { maximumFractionDigits: 0 }) + ' ₽'} />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <h3>Целевое vs Фактическое распределение</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip formatter={(value) => value.toLocaleString('ru-RU', { maximumFractionDigits: 0 }) + ' ₽'} />
                    <Legend />
                    <Bar dataKey="target" fill="#667eea" name="Целевое" />
                    <Bar dataKey="actual" fill="#764ba2" name="Фактическое" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="stats-grid">
              {Object.entries(categoryData).map(([category, value]) => (
                <div key={category} className="stat-card">
                  <h4>{category}</h4>
                  <div className="stat-value">
                    {value.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                  </div>
                  <div className="stat-percentage">
                    {totalPortfolio > 0 ? ((value / totalPortfolio) * 100).toFixed(1) : 0}% портфеля
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
