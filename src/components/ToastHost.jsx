import React, { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeToast } from '../redux/ticketSlice';

const ICONS = { success: '✅', error: '❌', warn: '⚠️', info: 'ℹ️' };

function Toast({ toast, onRemove }) {
  useEffect(() => {
    const t = setTimeout(() => onRemove(toast.id), 4000);
    return () => clearTimeout(t);
  }, [toast.id, onRemove]);

  return (
    <div className={`toast toast-${toast.type || 'info'}`} role="alert" aria-live="polite">
      <span className="toast-icon">{ICONS[toast.type] || ICONS.info}</span>
      <span className="toast-msg">{toast.message}</span>
      <button className="toast-close" onClick={() => onRemove(toast.id)} aria-label="Dismiss">✕</button>
    </div>
  );
}

export default function ToastHost() {
  const toasts   = useSelector(s => s.ticketStore.toasts);
  const dispatch = useDispatch();
  const remove   = useCallback(id => dispatch(removeToast(id)), [dispatch]);

  if (!toasts.length) return null;
  return (
    <div className="toast-host" aria-label="Notifications">
      {toasts.map(t => <Toast key={t.id} toast={t} onRemove={remove} />)}
    </div>
  );
}
