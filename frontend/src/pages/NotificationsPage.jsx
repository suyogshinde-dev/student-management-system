import React, { useState, useEffect } from 'react';
import { notificationService } from '../services/api';
import { Bell, Check, CheckCheck, Info, AlertTriangle, Calendar, Award } from 'lucide-react';
import Toast from '../components/Toast';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getAll();
      setNotifications(data.results || data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markRead(id);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setToast({ message: 'All notifications marked as read.', type: 'success' });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'Academic': return <Award size={20} color="#4f46e5" />;
      case 'Attendance': return <Calendar size={20} color="#f59e0b" />;
      case 'System': return <AlertTriangle size={20} color="#ef4444" />;
      default: return <Info size={20} color="#0ea5e9" />;
    }
  };

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Notifications & Announcements</h1>
          <p className="page-subtitle">System notifications, exam schedule alerts, and attendance notices</p>
        </div>
        <button className="btn btn-secondary" onClick={handleMarkAllRead}>
          <CheckCheck size={18} /> Mark All as Read
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="loading-spinner"></div>
            <p style={{ marginTop: '12px', color: '#64748b' }}>Loading notifications...</p>
          </div>
        ) : notifications.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                  padding: '20px 24px',
                  borderBottom: '1px solid #e2e8f0',
                  backgroundColor: n.is_read ? '#ffffff' : '#f8fafc',
                  transition: 'background-color 150ms ease',
                }}
              >
                <div
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    backgroundColor: '#eef2ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {getCategoryIcon(n.category)}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>{n.title}</h4>
                    <span className="badge badge-info">{n.category}</span>
                    {!n.is_read && <span className="badge badge-danger">New</span>}
                  </div>
                  <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.4 }}>{n.message}</p>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '6px', display: 'inline-block' }}>
                    {n.created_at ? new Date(n.created_at).toLocaleDateString() : 'Just now'}
                  </span>
                </div>

                {!n.is_read && (
                  <button
                    className="btn btn-secondary btn-icon"
                    title="Mark Read"
                    onClick={() => handleMarkRead(n.id)}
                  >
                    <Check size={16} color="#10b981" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Bell className="empty-icon" size={48} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>No Notifications</h3>
            <p style={{ fontSize: '0.875rem' }}>You're all caught up! No active notifications.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
