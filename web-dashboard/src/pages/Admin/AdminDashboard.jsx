// src/pages/Admin/AdminDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import Loader from '../../components/Loader';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Filtri
  const [statusFilter, setStatusFilter] = useState('');
  const [searchOrder, setSearchOrder] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  
  // Paginazione
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const limit = 10;

  // Fetch dashboard
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/admin/dashboard');
        if (response.data.success) {
          setStats(response.data.stats);
        } else {
          toast.error(response.data.error || 'Errore caricamento dashboard');
        }
      } catch (error) {
        console.error('Errore dashboard:', error);
        toast.error('Errore caricamento dashboard');
      }
    };
    fetchDashboard();
  }, []);

  // Fetch orders con filtri e paginazione
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (searchOrder) params.append('search', searchOrder);
      if (searchEmail) params.append('email', searchEmail);
      params.append('page', page);
      params.append('limit', limit);

      const response = await api.get(`/admin/orders?${params.toString()}`);
      if (response.data.success) {
        setOrders(response.data.orders || []);
        setTotalPages(response.data.pagination?.pages || 1);
        setTotalOrders(response.data.pagination?.total || 0);
      } else {
        toast.error(response.data.error || 'Errore caricamento ordini');
      }
    } catch (error) {
      console.error('Errore ordini:', error);
      toast.error('Errore caricamento ordini');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchOrder, searchEmail, page]);

  // Esegui fetch quando cambiano filtri o pagina
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Reset pagina quando cambiano i filtri
  useEffect(() => {
    setPage(1);
  }, [statusFilter, searchOrder, searchEmail]);

  const updateOrderStatus = async (orderId, status) => {
    if (updating) return;
    setUpdating(true);
    try {
      const response = await api.put(`/admin/orders/${orderId}`, { status });
      if (response.data.success) {
        toast.success('Ordine aggiornato con successo');
        fetchOrders();
      } else {
        toast.error(response.data.error || 'Errore aggiornamento ordine');
      }
    } catch (error) {
      console.error('Errore aggiornamento:', error);
      toast.error('Errore aggiornamento ordine');
    } finally {
      setUpdating(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const resetFilters = () => {
    setStatusFilter('');
    setSearchOrder('');
    setSearchEmail('');
    setPage(1);
  };

  if (loading && !orders.length) {
    return <Loader fullScreen />;
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700' }}>🛡️ Admin Panel</h1>
        <span style={{ color: '#6b7280', fontSize: '14px' }}>
          Totale ordini: {totalOrders} | Pagina {page} di {totalPages}
        </span>
      </div>

      {/* Statistiche */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card" style={{ background: '#e3f2fd', borderLeft: '4px solid #1976d2' }}>
            <h3>📦 Ordini totali</h3>
            <p className="stat-value">{stats.totalOrders}</p>
          </div>
          <div className="stat-card" style={{ background: '#e8f5e9', borderLeft: '4px solid #388e3c' }}>
            <h3>✅ Pagati</h3>
            <p className="stat-value">{stats.paidOrders}</p>
          </div>
          <div className="stat-card" style={{ background: '#fff3e0', borderLeft: '4px solid #f57c00' }}>
            <h3>⏳ In attesa</h3>
            <p className="stat-value">{stats.pendingOrders}</p>
          </div>
          <div className="stat-card" style={{ background: '#f3e5f5', borderLeft: '4px solid #7b1fa2' }}>
            <h3>💰 Totale incasso</h3>
            <p className="stat-value">{stats.totalRevenue || 0} XMR</p>
          </div>
          <div className="stat-card" style={{ background: '#fce4ec', borderLeft: '4px solid #c62828' }}>
            <h3>👥 Utenti</h3>
            <p className="stat-value">{stats.totalUsers}</p>
          </div>
          <div className="stat-card" style={{ background: '#e0f7fa', borderLeft: '4px solid #00838f' }}>
            <h3>📊 Conversione</h3>
            <p className="stat-value">{stats.conversionRate || 0}%</p>
          </div>
        </div>
      )}

      {/* Filtri e Ricerca */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '16px', 
        flexWrap: 'wrap', 
        alignItems: 'center',
        background: '#f8f9fa',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid #e5e7eb'
      }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            background: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            minWidth: '140px'
          }}
        >
          <option value="">📋 Tutti gli stati</option>
          <option value="pending">⏳ In attesa</option>
          <option value="paid">✅ Pagato</option>
          <option value="processing">🔄 In elaborazione</option>
          <option value="shipped">📦 Spedito</option>
          <option value="delivered">✅ Consegnato</option>
          <option value="cancelled">❌ Annullato</option>
        </select>

        <input
          type="text"
          placeholder="🔍 Cerca per orderNumber"
          value={searchOrder}
          onChange={(e) => setSearchOrder(e.target.value)}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            background: 'white',
            fontSize: '14px',
            flex: '1',
            minWidth: '180px'
          }}
        />

        <input
          type="text"
          placeholder="✉️ Cerca per email utente"
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            background: 'white',
            fontSize: '14px',
            flex: '1',
            minWidth: '180px'
          }}
        />

        <button
          onClick={handleSearch}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: 'none',
            background: '#4f46e5',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          🔍 Cerca
        </button>

        <button
          onClick={resetFilters}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            background: '#f3f4f6',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🔄 Reset
        </button>
      </div>

      {/* Lista ordini */}
      <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
        📋 Ordini {statusFilter && `(${statusFilter})`}
        {searchOrder && ` - Ricerca: ${searchOrder}`}
        {searchEmail && ` - Utente: ${searchEmail}`}
      </h2>

      {loading ? (
        <Loader />
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <p>Nessun ordine trovato</p>
        </div>
      ) : (
        <div className="orders-grid">
          {orders.map((order) => (
            <div key={order._id} className="order-card fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="order-number" style={{ fontWeight: '600' }}>{order.orderNumber}</span>
                <span className={`order-status ${order.status}`}>{order.status}</span>
              </div>
              <div className="order-details" style={{ marginTop: '12px' }}>
                <p><strong>Utente:</strong> {order.userId?.name || order.userId?.email || 'N/A'}</p>
                <p><strong>Totale:</strong> {order.total} {order.currency}</p>
                <p><strong>Items:</strong> {order.items?.length || 0}</p>
                <p><strong>Pagamento:</strong> {order.paymentStatus}</p>
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="order-actions" style={{ marginTop: '12px' }}>
                <select
                  value={order.status}
                  onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                  disabled={updating}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    background: 'white',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  <option value="pending">⏳ In attesa</option>
                  <option value="paid">✅ Pagato</option>
                  <option value="processing">🔄 In elaborazione</option>
                  <option value="shipped">📦 Spedito</option>
                  <option value="delivered">✅ Consegnato</option>
                  <option value="cancelled">❌ Annullato</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paginazione */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          marginTop: '24px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              background: page === 1 ? '#f3f4f6' : 'white',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              opacity: page === 1 ? 0.5 : 1
            }}
          >
            ◀ Precedente
          </button>

          <span style={{ padding: '8px 16px', fontWeight: '600' }}>
            Pagina {page} di {totalPages}
          </span>

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              background: page === totalPages ? '#f3f4f6' : 'white',
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
              opacity: page === totalPages ? 0.5 : 1
            }}
          >
            Successivo ▶
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;