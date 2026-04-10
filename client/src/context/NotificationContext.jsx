import { createContext, useCallback, useContext, useState } from 'react';

const NotificationContext = createContext(null);

const getNotificationIcon = (type) => {
  return '';
};

const getNotificationTitle = (type) => {
  switch (type) {
    case 'success': return 'Success';
    case 'error': return 'Error';
    case 'warning': return 'Warning';
    default: return 'Info';
  }
};

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const notify = useCallback((message, type = 'info', options = {}) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const toast = {
      id,
      message,
      type,
      title: options.title || getNotificationTitle(type),
      icon: options.icon || getNotificationIcon(type),
      duration: options.duration || 4500,
      action: options.action || null
    };
    
    setToasts((t) => [...t, toast]);
    
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, toast.duration);
  }, []);

  const success = useCallback((message, options = {}) => {
    notify(message, 'success', options);
  }, [notify]);

  const error = useCallback((message, options = {}) => {
    notify(message, 'error', options);
  }, [notify]);

  const info = useCallback((message, options = {}) => {
    notify(message, 'info', options);
  }, [notify]);

  const warning = useCallback((message, options = {}) => {
    notify(message, 'warning', options);
  }, [notify]);

  return (
    <NotificationContext.Provider value={{ notify, success, error, info, warning }}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{t.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: '600', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                  {t.title}
                </div>
                <div style={{ fontSize: '0.95rem', lineHeight: '1.4' }}>
                  {t.message}
                </div>
                {t.action && (
                  <button
                    onClick={t.action.onClick}
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.25rem 0.75rem',
                      background: 'rgba(255, 255, 255, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '4px',
                      color: 'inherit',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    {t.action.label}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotify() {
  const ctx = useContext(NotificationContext);
  if (!ctx) return { 
    notify: () => {}, 
    success: () => {}, 
    error: () => {}, 
    info: () => {}, 
    warning: () => {} 
  };
  return ctx;
}
