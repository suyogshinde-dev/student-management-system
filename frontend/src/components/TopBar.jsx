import React, { useState, useEffect } from 'react';
import { Search, Bell, Menu, Plus, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/api';
import { useNavigate } from 'react-router-dom';

const TopBar = ({ toggleMobile }) => {
  const { user, role, setUser } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const notifs = await notificationService.getAll();
        const unread = notifs.filter((n) => !n.is_read).length;
        setUnreadCount(unread);
      } catch (e) {
        // Ignore unauthenticated notification fetch error
      }
    };
    fetchNotifications();
  }, []);

  // Demo role switcher for testing frontend UI layout perspectives
  const switchRole = (newRole) => {
    const updatedUser = { ...user, role: newRole };
    setUser(updatedUser);
    localStorage.setItem('user_info', JSON.stringify(updatedUser));
  };

  const isStudentRole = role === 'STUDENT';

  return (
    <header className="top-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={toggleMobile}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#64748b',
          }}
          className="mobile-menu-btn"
        >
          <Menu size={24} />
        </button>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
            }}
          />
          <input
            type="text"
            placeholder="Search students, courses..."
            className="form-control"
            style={{ paddingLeft: '38px', borderRadius: '20px', fontSize: '0.85rem' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                navigate(`/students?search=${e.target.value}`);
              }
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Demo Role Switcher Dropdown */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#f1f5f9',
            padding: '4px 10px',
            borderRadius: '20px',
            border: '1px solid #cbd5e1',
          }}
        >
          <ShieldCheck size={16} color="#4f46e5" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
            DEMO UI ROLE:
          </span>
          <select
            value={role}
            onChange={(e) => switchRole(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              fontWeight: 700,
              color: '#4f46e5',
              cursor: 'pointer',
              outline: 'none',
              fontSize: '0.8rem',
            }}
          >
            <option value="ADMIN">Admin</option>
            <option value="TEACHER">Teacher/Staff</option>
            <option value="STUDENT">Student</option>
          </select>
        </div>

        {/* Quick Action Button - Hidden for Student Role */}
        {!isStudentRole && (
          <button
            className="btn btn-primary"
            style={{ padding: '8px 14px', fontSize: '0.825rem' }}
            onClick={() => navigate('/students')}
          >
            <Plus size={16} />
            <span>Quick Student</span>
          </button>
        )}

        {/* Notifications Icon */}
        <button
          onClick={() => navigate('/notifications')}
          style={{
            position: 'relative',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            color: '#64748b',
          }}
          title="Notifications"
        >
          <Bell size={22} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '18px',
                height: '18px',
                backgroundColor: '#ef4444',
                color: '#fff',
                borderRadius: '50%',
                fontSize: '0.7rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

export default TopBar;
