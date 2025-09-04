/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback((type, message, opts = {}) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const toast = { id, type, message, timeout: opts.timeout ?? 5000 };
    setToasts((list) => [...list, toast]);
    if (toast.timeout > 0) {
      setTimeout(() => remove(id), toast.timeout);
    }
    return id;
  }, [remove]);

  const api = useMemo(() => ({
    notify,
    success: (m, o) => notify('success', m, o),
    error: (m, o) => notify('error', m, o),
    info: (m, o) => notify('info', m, o),
    remove,
  }), [notify, remove]);

  return (
    <NotificationContext.Provider value={api}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              `min-w-[260px] max-w-sm rounded-md shadow-md border px-3 py-2 text-sm flex items-start gap-2 ` +
              (t.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
               t.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
               'bg-indigo-50 border-indigo-200 text-indigo-800')
            }
          >
            <span className="mt-0.5">
              {t.type === 'success' ? '✓' : t.type === 'error' ? '⚠' : 'ℹ'}
            </span>
            <div className="flex-1 whitespace-pre-wrap">{t.message}</div>
            <button onClick={() => remove(t.id)} className="text-xs opacity-70 hover:opacity-100">×</button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotify() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotify must be used within NotificationProvider');
  return ctx;
}
