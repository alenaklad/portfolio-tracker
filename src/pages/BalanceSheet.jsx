import React, { useState, useEffect } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '../supabaseClient';

const ASSET_TYPES = [
  'Недвижимость',
  'Автомобиль',
  'Акции',
  'Облигации',
  'Криптовалюта',
  'Наличные',
  'Банковский вклад',
  'Драгоценные металлы',
  'Другое'
];

export default function BalanceSheet() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form states
  const [assetName, setAssetName] = useState('');
  const [assetType, setAssetType] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('balance_records')
        .select('*')
        .eq('user_id', user.id)
        .order('record_date', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error loading records:', error);
    } finally {
      setLoading(false);
    }
  };

  const addRecord = async () => {
    if (!assetName || !assetType || !purchasePrice || !currentPrice) {
      alert('Заполните все обязательные поля');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('balance_records')
        .insert([{
          user_id: user.id,
          asset_name: assetName,
          asset_type: assetType,
          purchase_price: parseFloat(purchasePrice),
          current_price: parseFloat(currentPrice),
          quantity: parseFloat(quantity) || 1,
          notes,
          record_date: recordDate
        }]);

      if (error) throw error;

      // Reset form
      setAssetName('');
      setAssetType('');
      setPurchasePrice('');
      setCurrentPrice('');
      setQuantity('1');
      setNotes('');
      setRecordDate(new Date().toISOString().split('T')[0]);
      setShowForm(false);
      
      loadRecords();
    } catch (error) {
      console.error('Error adding record:', error);
      alert('Ошибка при добавлении записи');
    }
  };

  const deleteRecord = async (id) => {
    if (!confirm('Удалить запись?')) return;

    try {
      const { error } = await supabase
        .from('balance_records')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadRecords();
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  };

  const totalPurchaseValue = records.reduce((sum, r) => sum + (parseFloat(r.purchase_price) * parseFloat(r.quantity)), 0);
  const totalCurrentValue = records.reduce((sum, r) => sum + (parseFloat(r.current_price) * parseFloat(r.quantity)), 0);
  const totalGainLoss = totalCurrentValue - totalPurchaseValue;
  const totalGainLossPercent = totalPurchaseValue > 0 ? (totalGainLoss / totalPurchaseValue * 100) : 0;

  const formatNumber = (num) => num.toLocaleString('ru-RU', { maximumFractionDigits: 0 });

  return (
    <div>
      <h2 className="page-title">📈 Балансовая стоимость активов</h2>
      <p className="page-subtitle">Отслеживайте стоимость ваших активов</p>

      {/* Summary cards */}
      <div className="results-grid" style={{ marginBottom: '30px' }}>
        <div className="result-card">
          <div className="result-label">Первоначальная стоимость</div>
          <div className="result-value">{formatNumber(totalPurchaseValue)} ₽</div>
        </div>
        <div className="result-card highlight">
          <div className="result-label">Текущая стоимость</div>
          <div className="result-value">{formatNumber(totalCurrentValue)} ₽</div>
        </div>
        <div className={`result-card ${totalGainLoss >= 0 ? '' : ''}`}>
          <div className="result-label">Изменение</div>
          <div className="result-value" style={{ color: totalGainLoss >= 0 ? '#2ecc71' : '#e74c3c' }}>
            {totalGainLoss >= 0 ? '+' : ''}{formatNumber(totalGainLoss)} ₽
            <div style={{ fontSize: '14px', marginTop: '5px' }}>
              ({totalGainLossPercent >= 0 ? '+' : ''}{totalGainLossPercent.toFixed(2)}%)
            </div>
          </div>
        </div>
      </div>

      {/* Add button */}
      <div style={{ marginBottom: '30px' }}>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus size={18} />
          {showForm ? 'Закрыть форму' : 'Добавить актив'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="calculator-form" style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '20px' }}>Новый актив</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Название актива</label>
              <input
                type="text"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                placeholder="Например: Квартира в Москве"
              />
            </div>
            <div className="form-group">
              <label>Тип актива</label>
              <select value={assetType} onChange={(e) => setAssetType(e.target.value)}>
                <option value="">Выберите тип</option>
                {ASSET_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Цена покупки (₽)</label>
              <input
                type="number"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label>Текущая цена (₽)</label>
              <input
                type="number"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Количество</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                step="0.0001"
              />
            </div>
            <div className="form-group">
              <label>Дата записи</label>
              <input
                type="date"
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Примечания</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Дополнительная информация"
            />
          </div>

          <button className="btn btn-primary btn-full" onClick={addRecord}>
            <Plus size={18} />
            Добавить актив
          </button>
        </div>
      )}

      {/* Records list */}
      <div style={{ background: 'white', padding: '30px', borderRadius: '12px' }}>
        <h3 style={{ marginBottom: '20px' }}>Список активов</h3>
        
        {loading ? (
          <p>Загрузка...</p>
        ) : records.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666' }}>Нет добавленных активов</p>
        ) : (
          <div className="table-container">
            <table className="assets-table">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Тип</th>
                  <th>Количество</th>
                  <th>Цена покупки</th>
                  <th>Текущая цена</th>
                  <th>Изменение</th>
                  <th>Общая стоимость</th>
                  <th>Дата</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {records.map(record => {
                  const purchaseTotal = parseFloat(record.purchase_price) * parseFloat(record.quantity);
                  const currentTotal = parseFloat(record.current_price) * parseFloat(record.quantity);
                  const change = currentTotal - purchaseTotal;
                  const changePercent = purchaseTotal > 0 ? (change / purchaseTotal * 100) : 0;
                  
                  return (
                    <tr key={record.id}>
                      <td>
                        <div style={{ fontWeight: '600' }}>{record.asset_name}</div>
                        {record.notes && <div style={{ fontSize: '12px', color: '#666' }}>{record.notes}</div>}
                      </td>
                      <td>{record.asset_type}</td>
                      <td>{record.quantity}</td>
                      <td>{formatNumber(record.purchase_price)} ₽</td>
                      <td>{formatNumber(record.current_price)} ₽</td>
                      <td style={{ color: change >= 0 ? '#2ecc71' : '#e74c3c', fontWeight: '600' }}>
                        {change >= 0 ? '+' : ''}{formatNumber(change)} ₽
                        <div style={{ fontSize: '12px' }}>
                          ({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)
                        </div>
                      </td>
                      <td style={{ fontWeight: '600' }}>{formatNumber(currentTotal)} ₽</td>
                      <td>{new Date(record.record_date).toLocaleDateString('ru-RU')}</td>
                      <td>
                        <button
                          className="btn-icon"
                          onClick={() => deleteRecord(record.id)}
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

      {/* Summary by type */}
      {records.length > 0 && (
        <div style={{ background: 'white', padding: '30px', borderRadius: '12px', marginTop: '30px' }}>
          <h3 style={{ marginBottom: '20px' }}>По типам активов</h3>
          {Object.entries(
            records.reduce((acc, record) => {
              const type = record.asset_type;
              if (!acc[type]) {
                acc[type] = { purchase: 0, current: 0 };
              }
              acc[type].purchase += parseFloat(record.purchase_price) * parseFloat(record.quantity);
              acc[type].current += parseFloat(record.current_price) * parseFloat(record.quantity);
              return acc;
            }, {})
          ).map(([type, values]) => {
            const change = values.current - values.purchase;
            const changePercent = values.purchase > 0 ? (change / values.purchase * 100) : 0;
            return (
              <div key={type} style={{ marginBottom: '15px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '5px' }}>{type}</div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      {formatNumber(values.purchase)} ₽ → {formatNumber(values.current)} ₽
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: change >= 0 ? '#2ecc71' : '#e74c3c' }}>
                      {change >= 0 ? '+' : ''}{formatNumber(change)} ₽
                    </div>
                    <div style={{ fontSize: '14px', color: change >= 0 ? '#2ecc71' : '#e74c3c' }}>
                      ({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
