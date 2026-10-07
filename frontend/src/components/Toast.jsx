import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose, duration = 4000 }) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={20} color="#10b981" />;
      case 'error':
        return <AlertCircle size={20} color="#ef4444" />;
      case 'warning':
        return <AlertCircle size={20} color="#f59e0b" />;
      default:
        return <Info size={20} color="#3b82f6" />;
    }
  };

  return (
    <div className={`toast toast-${type}`}>
      {getIcon()}
      <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{message}</span>
      <button
        onClick={onClose}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', marginLeft: 'auto' }}
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;
