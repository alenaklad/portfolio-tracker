import React, { useState, useEffect, useRef } from 'react';
import { MoreVertical, Edit2, Trash2, RotateCcw, AlertCircle } from 'lucide-react';

const PortfolioList = ({ 
  portfolios, 
  activePortfolioId, 
  onSelectPortfolio, 
  onRenamePortfolio, 
  onDeletePortfolio,
  onAddPortfolio 
}) => {
  const [menuOpen, setMenuOpen] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(null);
  const [recentlyDeleted, setRecentlyDeleted] = useState(null);
  const [undoTimer, setUndoTimer] = useState(null);
  const [undoCountdown, setUndoCountdown] = useState(10);
  const [renameMode, setRenameMode] = useState(null);
  const [newName, setNewName] = useState('');
  const menuRefs = useRef({});

  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpen && menuRefs.current[menuOpen] && 
          !menuRefs.current[menuOpen].contains(event.target)) {
        setMenuOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  // Таймер для отмены удаления
  useEffect(() => {
    let interval;
    if (recentlyDeleted && undoCountdown > 0) {
      interval = setInterval(() => {
        setUndoCountdown(prev => {
          if (prev <= 1) {
            // Время истекло, окончательно удаляем
            performFinalDelete(recentlyDeleted);
            return 10;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [recentlyDeleted, undoCountdown]);

  const handleMenuToggle = (portfolioId, event) => {
    event.stopPropagation();
    setMenuOpen(menuOpen === portfolioId ? null : portfolioId);
  };

  const handleRename = (portfolio, event) => {
    event.stopPropagation();
    setMenuOpen(null);
    setRenameMode(portfolio.id);
    setNewName(portfolio.name);
  };

  const handleRenameSubmit = (portfolioId) => {
    if (newName.trim() && newName !== portfolios.find(p => p.id === portfolioId)?.name) {
      onRenamePortfolio(portfolioId, newName.trim());
    }
    setRenameMode(null);
    setNewName('');
  };

  const handleRenameCancel = () => {
    setRenameMode(null);
    setNewName('');
  };

  const handleDeleteClick = (portfolio, event) => {
    event.stopPropagation();
    setMenuOpen(null);
    setDeleteConfirmOpen(portfolio.id);
  };

  const handleDeleteConfirm = (portfolio) => {
    setDeleteConfirmOpen(null);
    
    // Сохраняем удаляемый портфель для возможности отмены
    setRecentlyDeleted(portfolio);
    setUndoCountdown(10);
    
    // Скрываем портфель из списка (но не удаляем из базы)
    // Это должно быть реализовано в родительском компоненте
    if (onDeletePortfolio) {
      onDeletePortfolio(portfolio.id, false); // false = мягкое удаление
    }
    
    // Устанавливаем таймер для окончательного удаления
    if (undoTimer) clearTimeout(undoTimer);
    const timer = setTimeout(() => {
      performFinalDelete(portfolio);
    }, 10000);
    setUndoTimer(timer);
  };

  const performFinalDelete = (portfolio) => {
    // Окончательное удаление из базы данных
    if (onDeletePortfolio) {
      onDeletePortfolio(portfolio.id, true); // true = полное удаление
    }
    setRecentlyDeleted(null);
    setUndoCountdown(10);
    if (undoTimer) {
      clearTimeout(undoTimer);
      setUndoTimer(null);
    }
  };

  const handleUndo = () => {
    if (undoTimer) {
      clearTimeout(undoTimer);
      setUndoTimer(null);
    }
    
    // Восстанавливаем портфель
    if (onDeletePortfolio) {
      onDeletePortfolio(recentlyDeleted.id, 'restore');
    }
    
    setRecentlyDeleted(null);
    setUndoCountdown(10);
  };

  const handlePortfolioClick = (portfolio) => {
    // Переход к портфелю только если не в режиме переименования
    if (renameMode !== portfolio.id) {
      onSelectPortfolio(portfolio.id);
    }
  };

  return (
    <div className="portfolio-list-container">
      {/* Заголовок списка портфелей */}
      <div className="portfolio-list-header">
        <h2>Мои портфели</h2>
        <button className="btn-add-portfolio" onClick={onAddPortfolio}>
          + Добавить портфель
        </button>
      </div>

      {/* Список портфелей */}
      <div className="portfolio-list">
        {portfolios
          .filter(p => !recentlyDeleted || p.id !== recentlyDeleted.id)
          .map(portfolio => (
          <div key={portfolio.id} className="portfolio-item-wrapper">
            <div 
              className={`portfolio-item ${activePortfolioId === portfolio.id ? 'active' : ''}`}
            >
              {renameMode === portfolio.id ? (
                // Режим переименования
                <div className="rename-input-group" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameSubmit(portfolio.id);
                      if (e.key === 'Escape') handleRenameCancel();
                    }}
                    autoFocus
                    className="rename-input"
                  />
                  <button 
                    className="rename-btn save"
                    onClick={() => handleRenameSubmit(portfolio.id)}
                  >
                    ✓
                  </button>
                  <button 
                    className="rename-btn cancel"
                    onClick={handleRenameCancel}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                // Обычный режим отображения
                <>
                  <button
                    className="portfolio-name-btn"
                    onClick={() => handlePortfolioClick(portfolio)}
                  >
                    {portfolio.name}
                  </button>
                  
                  {/* Кнопка меню действий */}
                  <div className="portfolio-menu-wrapper" ref={el => menuRefs.current[portfolio.id] = el}>
                    <button
                      className="portfolio-menu-btn"
                      onClick={(e) => handleMenuToggle(portfolio.id, e)}
                      aria-label="Меню действий"
                    >
                      <MoreVertical size={18} />
                    </button>
                    
                    {/* Выпадающее меню */}
                    {menuOpen === portfolio.id && (
                      <div className="portfolio-dropdown-menu">
                        <button
                          className="menu-item"
                          onClick={(e) => handleRename(portfolio, e)}
                        >
                          <Edit2 size={16} />
                          <span>Переименовать</span>
                        </button>
                        <button
                          className="menu-item danger"
                          onClick={(e) => handleDeleteClick(portfolio, e)}
                        >
                          <Trash2 size={16} />
                          <span>Удалить</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Модальное окно подтверждения удаления */}
      {deleteConfirmOpen && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmOpen(null)}>
          <div className="modal-content delete-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header danger">
              <AlertCircle size={24} />
              <h3>Удалить портфель?</h3>
            </div>
            <div className="modal-body">
              <p>
                Вы уверены, что хотите удалить портфель 
                <strong> "{portfolios.find(p => p.id === deleteConfirmOpen)?.name}"</strong>?
              </p>
              <div className="warning-message">
                <AlertCircle size={18} />
                <span>
                  Внимание: Все данные портфеля будут безвозвратно удалены. 
                  Это действие невозможно будет отменить после подтверждения.
                </span>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-modal cancel"
                onClick={() => setDeleteConfirmOpen(null)}
              >
                Отмена
              </button>
              <button 
                className="btn-modal delete"
                onClick={() => handleDeleteConfirm(portfolios.find(p => p.id === deleteConfirmOpen))}
              >
                Удалить портфель
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Уведомление с возможностью отмены удаления */}
      {recentlyDeleted && (
        <div className="undo-notification">
          <div className="undo-content">
            <span>Портфель "{recentlyDeleted.name}" удален</span>
            <button className="undo-btn" onClick={handleUndo}>
              <RotateCcw size={16} />
              Отменить ({undoCountdown}с)
            </button>
          </div>
          <div className="undo-progress">
            <div 
              className="undo-progress-bar"
              style={{ width: `${(undoCountdown / 10) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioList;
