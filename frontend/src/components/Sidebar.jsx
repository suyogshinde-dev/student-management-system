import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  UserCheck,
  Calendar,
  Award,
  FileSpreadsheet,
  Bell,
  LogOut,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isMobileOpen, toggleMobile }) => {
  const { user, logout, role } = useAuth();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/students', label: 'Students', icon: Users },
    { path: '/courses', label: 'Courses & Depts', icon: BookOpen },
    { path: '/enrollments', label: 'Enrollments', icon: UserCheck },
    { path: '/attendance', label: 'Attendance', icon: Calendar },
    { path: '/marks', label: 'Academic Marks', icon: Award },
    { path: '/reports', label: 'Reports & Export', icon: FileSpreadsheet },
    { path: '/notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-header">
        <div className="brand-logo">
          <GraduationCap size={24} />
        </div>
        <div>
          <div className="brand-title">EduPulse SMS</div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', letterSpacing: '0.05em' }}>
            ACADEMIC SUITE
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => toggleMobile && toggleMobile(false)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-badge-container">
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              backgroundColor: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              color: '#fff',
            }}
          >
            {user?.username ? user.username[0].toUpperCase() : 'U'}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.username || 'Guest User'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Role: <span style={{ color: '#818cf8', fontWeight: 600 }}>{role}</span>
            </div>
          </div>
          <button
            onClick={logout}
            title="Logout"
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
