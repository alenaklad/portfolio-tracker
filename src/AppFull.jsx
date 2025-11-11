import React, { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, PlusCircle, Trash2, BarChart3, Plus, X, LogOut, User, Menu, Home, Calculator, CreditCard, TrendingDown, Percent, DollarSign, PieChart } from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { supabase } from './supabaseClient';
import Auth from './Auth';
import CompoundInterest from './pages/CompoundInterest';
import Mortgage from './pages/Mortgage';
import Inflation from './pages/Inflation';
import CreditAnalyzer from './pages/CreditAnalyzer';
import FinanceTracker from './pages/FinanceTracker';
import MonthlyDashboard from './pages/MonthlyDashboard';
import BalanceSheet from './pages/BalanceSheet';
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

const fetchMoexStockPrice = async (ticker) => {
  try {
    const response = await fetch(`https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities/${ticker}.json?iss.meta=off&iss.only=marketdata&marketdata.columns=LAST`);
    const data = await response.json();
    const price = data?.marketdata?.data?.[0]?.[0];
    return price || 0;
  } catch (error) {
    console.error(`Ошибка получения цены акции ${ticker}:`, error);
    return 0;
  }
};

const fetchMoexBondPrice = async (isin) => {
  try {
    // Получаем цену с НКД (WAPRICE - средневзвешенная цена с НКД)
    const response = await fetch(`https://iss.moex.com/iss/engines/stock/markets/bonds/boards/TQCB/securities/${isin}.json?iss.meta=off&iss.only=marketdata&marketdata.columns=WAPRICE`);
    const data = await response.json();
    let price = data?.marketdata?.data?.[0]?.[0];
    
    // Если нет WAPRICE, пробуем LAST
    if (!price || price === 0) {
      const response2 = await fetch(`https://iss.moex.com/iss/engines/stock/markets/bonds/boards/TQCB/securities/${isin}.json?iss.meta=off&iss.only=marketdata&marketdata.columns=LAST`);
      const data2 = await response2.json();
      price = data2?.marketdata?.data?.[0]?.[0];
    }
    
    return price || 0;
  } catch (error) {
    console.error(`Ошибка получения цены облигации ${isin}:`, error);
    return 0;
  }
};

const fetchMoexFundPrice = async (ticker) => {
  try {
    // Для БПИФов и ПИФов
    const response = await fetch(`https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQTF/securities/${ticker}.json?iss.meta=off&iss.only=marketdata&marketdata.columns=LAST`);
    const data = await response.json();
    let price = data?.marketdata?.data?.[0]?.[0];
    
    // Если не нашли в TQTF, пробуем TQTD (облигационные ETF)
    if (!price || price === 0) {
      const response2 = await fetch(`https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQTD/securities/${ticker}.json?iss.meta=off&iss.only=marketdata&marketdata.columns=LAST`);
      const data2 = await response2.json();
      price = data2?.marketdata?.data?.[0]?.[0];
    }
    
    return price || 0;
  } catch (error) {
    console.error(`Ошибка получения цены фонда ${ticker}:`, error);
    return 0;
  }
};

const fetchBybitCryptoPrice = async (symbol) => {
  try {
    // Bybit API для получения текущей цены
    const normalizedSymbol = symbol.toUpperCase();
    const response = await fetch(`https://api.bybit.com/v5/market/tickers?category=spot&symbol=${normalizedSymbol}USDT`);
    const data = await response.json();
    
    if (data.retCode === 0 && data.result?.list?.[0]) {
      const priceUSD = parseFloat(data.result.list[0].lastPrice);
      // Конвертируем в рубли (примерный курс, можно улучшить)
      const usdToRub = 95; // Можно получать актуальный курс через API
      return priceUSD * usdToRub;
    }
    return 0;
  } catch (error) {
    console.error(`Ошибка получения цены криптовалюты ${symbol}:`, error);
    return 0;
  }
};

const fetchForeignPrice = async (ticker, currency) => {
  // Для зарубежных активов используем Yahoo Finance или Alpha Vantage
  // Пока оставляем моковые данные, но можно подключить реальный API
  const mockPrices = {
    'VTI': 28979, 'GXC': 6700, 'MCHI': 4700,
    'EWG': 2300, 'EWQ': 3200, 'EWU': 2800,
    'GLD': 18500, 'SLV': 2100, 'IAU': 4500,
    'SCHH': 2400, 'VNQ': 8900, 'REM': 2800
  };
  const basePrice = mockPrices[ticker] || 100;
  const variation = (Math.random() - 0.5) * basePrice * 0.05;
  return basePrice + variation;
};

const fetchPrice = async (ticker, currency, category) => {
  if (category === 'Акции российских компаний') {
    return await fetchMoexStockPrice(ticker);
  } else if (category === 'Российские облигации') {
    return await fetchMoexBondPrice(ticker); // ticker здесь будет ISIN
  } else if (category === 'Зарубежные облигации') {
    return await fetchForeignPrice(ticker, currency);
  } else if (category === 'Товары' || category === 'Денежные фонды' || category === 'Недвижимость') {
    // Сначала пробуем получить с MOEX (для российских БПИФов/ПИФов)
    const moexPrice = await fetchMoexFundPrice(ticker);
    if (moexPrice > 0) return moexPrice;
    // Если не нашли на MOEX, значит зарубежный фонд
    return await fetchForeignPrice(ticker, currency);
  } else if (category === 'Криптовалюты') {
    return await fetchBybitCryptoPrice(ticker);
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
  goalYears: '',
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
  const [activePage, setActivePage] = useState('portfolio');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'portfolio', icon: Home, label: 'Портфель' },
    { id: 'finance', icon: DollarSign, label: 'Доходы и расходы' },
    { id: 'dashboard', icon: BarChart3, label: 'Ежемесячные итоги' },
    { id: 'balance', icon: PieChart, label: 'Балансовая стоимость' },
    { id: 'compound', icon: TrendingUp, label: 'Сложные проценты' },
    { id: 'mortgage', icon: Home, label: 'Ипотека' },
    { id: 'inflation', icon: TrendingDown, label: 'Инфляция' },
    { id: 'credit', icon: CreditCard, label: 'Кредитная нагрузка' }
  ];

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
      console.log('📥 Загружаю портфели для пользователя:', userId);
      
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', userId)
        .order('id', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        // Преобразуем snake_case из БД в camelCase для приложения
        const portfolios = data.map(p => ({
          id: p.id,
          name: p.name,
          broker: p.broker,
          accountType: p.account_type,
          plannedContribution: p.planned_contribution,
          contributionPeriod: p.contribution_period,
          goal: p.goal,
          goalYears: p.goal_years,
          riskProfile: p.risk_profile,
          currentValue: p.current_value,
          additionalInvestment: p.additional_investment,
          assets: p.assets || []
        }));
        
        console.log('✅ Загружено портфелей:', portfolios.length);
        setPortfolios(portfolios);
        setActivePortfolioId(portfolios[0].id);
      } else {
        console.log('📝 Портфелей нет, создаю первый');
        await createInitialPortfolio(userId);
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки портфелей:', error);
      alert('Ошибка загрузки данных. Проверьте консоль.');
    }
  };

  const createInitialPortfolio = async (userId) => {
    try {
      console.log('📝 Создаю первый портфель');
      
      const newPortfolio = {
        user_id: userId,
        name: 'Основной портфель',
        broker: '',
        account_type: 'Брокерский счет',
        planned_contribution: '',
        contribution_period: 'Месяц',
        goal: '',
        goal_years: '',
        risk_profile: {
          stocks: '', bonds: '', cash: '',
          commodities: '', crypto: '', realestate: ''
        },
        current_value: '',
        additional_investment: '',
        assets: []
      };
      
      const { data, error } = await supabase
        .from('portfolios')
        .insert([newPortfolio])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        // Преобразуем snake_case в camelCase
        const portfolio = {
          id: data[0].id,
          name: data[0].name,
          broker: data[0].broker,
          accountType: data[0].account_type,
          plannedContribution: data[0].planned_contribution,
          contributionPeriod: data[0].contribution_period,
          goal: data[0].goal,
          goalYears: data[0].goal_years,
          riskProfile: data[0].risk_profile,
          currentValue: data[0].current_value,
          additionalInvestment: data[0].additional_investment,
          assets: data[0].assets || []
        };
        
        console.log('✅ Первый портфель создан');
        setPortfolios([portfolio]);
        setActivePortfolioId(portfolio.id);
      }
    } catch (error) {
      console.error('❌ Ошибка создания портфеля:', error);
      alert('Ошибка создания портфеля. Проверьте консоль.');
    }
  };

  const savePortfolio = async (updatedPortfolio) => {
    if (!session) {
      console.log('⚠️ Не залогинен - данные не сохраняются');
      return;
    }

    try {
      // Преобразуем camelCase в snake_case для Supabase
      const dbPortfolio = {
        name: updatedPortfolio.name,
        broker: updatedPortfolio.broker,
        account_type: updatedPortfolio.accountType,
        planned_contribution: updatedPortfolio.plannedContribution,
        contribution_period: updatedPortfolio.contributionPeriod,
        goal: updatedPortfolio.goal,
        goal_years: updatedPortfolio.goalYears,
        risk_profile: updatedPortfolio.riskProfile,
        current_value: updatedPortfolio.currentValue,
        additional_investment: updatedPortfolio.additionalInvestment,
        assets: updatedPortfolio.assets
      };

      console.log('💾 Сохраняю портфель:', updatedPortfolio.id);
      
      const { error } = await supabase
        .from('portfolios')
        .update(dbPortfolio)
        .eq('id', updatedPortfolio.id)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('❌ Ошибка сохранения:', error);
        throw error;
      }
      
      console.log('✅ Портфель сохранен');
    } catch (error) {
      console.error('❌ Ошибка сохранения:', error);
      alert('Ошибка сохранения данных. Проверьте консоль.');
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
      console.log('➕ Создаю новый портфель');
      
      const newPortfolio = {
        user_id: session.user.id,
        name: `Портфель ${portfolios.length + 1}`,
        broker: '',
        account_type: 'Брокерский счет',
        planned_contribution: '',
        contribution_period: 'Месяц',
        goal: '',
        goal_years: '',
        risk_profile: {
          stocks: '', bonds: '', cash: '',
          commodities: '', crypto: '', realestate: ''
        },
        current_value: '',
        additional_investment: '',
        assets: []
      };

      const { data, error } = await supabase
        .from('portfolios')
        .insert([newPortfolio])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        // Преобразуем snake_case в camelCase
        const portfolio = {
          id: data[0].id,
          name: data[0].name,
          broker: data[0].broker,
          accountType: data[0].account_type,
          plannedContribution: data[0].planned_contribution,
          contributionPeriod: data[0].contribution_period,
          goal: data[0].goal,
          goalYears: data[0].goal_years,
          riskProfile: data[0].risk_profile,
          currentValue: data[0].current_value,
          additionalInvestment: data[0].additional_investment,
          assets: data[0].assets || []
        };
        
        console.log('✅ Портфель создан');
        setPortfolios([...portfolios, portfolio]);
        setActivePortfolioId(portfolio.id);
      }
    } catch (error) {
      console.error('❌ Ошибка создания портфеля:', error);
      alert('Ошибка создания портфеля. Проверьте консоль.');
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
    
    // Для криптовалют показываем точное количество с дробной частью
    const isCrypto = asset.category === 'Криптовалюты';
    let rebalance;
    let rebalanceDisplay;
    
    if (isCrypto) {
      const exactRebalance = (targetAmount / price) - quantity;
      rebalance = exactRebalance;
      rebalanceDisplay = exactRebalance.toFixed(8); // 8 знаков для крипты
    } else {
      rebalance = Math.floor((targetQuantity - quantity) / lotSize);
      rebalanceDisplay = rebalance;
    }
    
    return { targetAmount, targetQuantity, actualAmount, actualShare, rebalance, rebalanceDisplay, isCrypto };
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
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

  // Render calculators
  if (activePage !== 'portfolio') {
    return (
      <div className="app-container">
        <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <TrendingUp size={32} />
              {sidebarOpen && <h1>Финансы</h1>}
            </div>
            <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          <nav className="sidebar-nav">
            {menuItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                  onClick={() => setActivePage(item.id)}
                >
                  <Icon size={20} />
                  {sidebarOpen && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>

          <div className="sidebar-footer">
            <div className="user-info-sidebar">
              <User size={18} />
              {sidebarOpen && <span className="user-email-text">{userEmail}</span>}
            </div>
            <button className="btn-signout" onClick={handleSignOut}>
              <LogOut size={18} />
              {sidebarOpen && <span>Выйти</span>}
            </button>
          </div>
        </aside>

        <main className="main-content">
          {activePage === 'finance' && <FinanceTracker />}
          {activePage === 'dashboard' && <MonthlyDashboard />}
          {activePage === 'balance' && <BalanceSheet />}
          {activePage === 'compound' && <CompoundInterest />}
          {activePage === 'mortgage' && <Mortgage />}
          {activePage === 'inflation' && <Inflation />}
          {activePage === 'credit' && <CreditAnalyzer />}
        </main>
      </div>
    );
  }

  // Original Portfolio view - FULL VERSION
  return (
    <div className="app-container">
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <TrendingUp size={32} />
            {sidebarOpen && <h1>Финансы</h1>}
          </div>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                onClick={() => setActivePage(item.id)}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info-sidebar">
            <User size={18} />
            {sidebarOpen && <span className="user-email-text">{userEmail}</span>}
          </div>
          <button className="btn-signout" onClick={handleSignOut}>
            <LogOut size={18} />
            {sidebarOpen && <span>Выйти</span>}
          </button>
        </div>
      </aside>

      <main className="main-content-portfolio">
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
                        value={activePortfolio?.goalYears || ''}
                        onChange={(e) => updatePortfolio('goalYears', e.target.value)}
                        placeholder="Введите срок"
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
                                  <th>{category.includes('облигации') || category.includes('Облигации') ? 'ISIN' : 'Тикер'}</th>
                                  <th>Доля в портфеле, %</th>
                                  <th>Валюта</th>
                                  <th>{category.includes('облигации') || category.includes('Облигации') ? 'Цена с НКД' : 'Цена за лот'}</th>
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
                                          placeholder={category.includes('облигации') || category.includes('Облигации') ? 'ISIN' : 'Тикер'}
                                          className="input-sm"
                                          style={{ width: '100px' }}
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
                                        {values.rebalance > 0 ? '+' : ''}{values.rebalanceDisplay}
                                        {values.isCrypto && values.rebalance !== 0 && (
                                          <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                                            💡 Можно купить дробно
                                          </div>
                                        )}
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
      </main>
    </div>
  );
}

export default App;
