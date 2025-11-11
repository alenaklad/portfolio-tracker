import React, { useState, useEffect } from 'react';
import { TrendingUp, LogOut, User, Menu, X, Calculator, Home, CreditCard, TrendingDown, Percent } from 'lucide-react';
import { supabase } from './supabaseClient';
import Auth from './Auth';
import CompoundInterest from './pages/CompoundInterest';
import Mortgage from './pages/Mortgage';
import Inflation from './pages/Inflation';
import CreditAnalyzer from './pages/CreditAnalyzer';
import './App.css';

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

const defaultPortfolio = {
  id: 1,
  name: 'Основной портфель',
  broker: '',
  accountType: 'Брокерский счет',
  plannedContribution: '',
  contributionPeriod: 'Месяц',
  goal: '',
  goalYears: 5,
  riskProfile: { stocks: '', bonds: '', cash: '', commodities: '', crypto: '', realestate: '' },
  currentValue: '',
  additionalInvestment: '',
  assets: []
};

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portfolios, setPortfolios] = useState([defaultPortfolio]);
  const [activePortfolioId, setActivePortfolioId] = useState(1);
  const [userEmail, setUserEmail] = useState('');
  const [activePage, setActivePage] = useState('portfolio');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'portfolio', icon: Home, label: 'Портфель' },
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

  const renderPage = () => {
    switch (activePage) {
      case 'portfolio':
        return <div><h2>Портфель</h2><p>Здесь будет компонент портфеля</p></div>;
      case 'compound':
        return <CompoundInterest />;
      case 'mortgage':
        return <Mortgage />;
      case 'inflation':
        return <Inflation />;
      case 'credit':
        return <CreditAnalyzer />;
      default:
        return <div><h2>Портфель</h2></div>;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
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
            {sidebarOpen && <span>{userEmail}</span>}
          </div>
          <button className="btn-signout" onClick={handleSignOut}>
            <LogOut size={18} />
            {sidebarOpen && <span>Выйти</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
