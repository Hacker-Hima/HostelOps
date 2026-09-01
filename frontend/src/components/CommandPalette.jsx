import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setRole, setPage, openTicketDrawer, setProfileModalOpen } from '../redux/ticketSlice';
import { useTranslation } from '../utils/translations';

function fuzzy(str, query) {
  const s = str.toLowerCase();
  const q = query.toLowerCase();
  let si = 0, qi = 0;
  while (si < s.length && qi < q.length) {
    if (s[si] === q[qi]) qi++;
    si++;
  }
  return qi === q.length;
}

export default function CommandPalette({ isOpen, onClose }) {
  const dispatch   = useDispatch();
  const { tickets, assets, staffRequests, currentRole, currentUser } = useSelector(s => s.ticketStore);
  const { t } = useTranslation();
  const [query, setQuery]   = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef  = useRef(null);

  useEffect(() => {
    if (isOpen) { setQuery(''); setCursor(0); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [isOpen]);

  useEffect(() => {
    const handler = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const quickActions = useMemo(() => [
    { id: 'profile', label: 'View / Edit User Profile', subtitle: `${currentUser?.name} (${currentRole})`, icon: '👤', action: 'profile' },
    { id: 'logout',  label: 'Sign Out of Workspace',   subtitle: 'Return to login portal selection',       icon: '🚪', action: 'logout' },
  ], [currentUser, currentRole]);

  const results = useMemo(() => {
    if (!query.trim()) {
      return [
        { group: 'Quick Actions', items: quickActions },
        { group: 'Recent Tickets', items: tickets.slice(0, 4).map(tk => ({ id: tk.id, label: tk.title, subtitle: `${tk.status} · ${tk.room}`, icon: '🎫', action: 'ticket', ticketId: tk.id })) },
      ];
    }
    const q = query.trim();
    const actionItems = quickActions.filter(a => fuzzy(a.label, q) || fuzzy(a.id, q));
    const ticketItems = tickets.filter(tk => fuzzy(tk.title, q) || fuzzy(tk.id, q)).map(tk => ({ id: tk.id, label: tk.title, subtitle: `${tk.id} · ${tk.status} · ${tk.room}`, icon: '🎫', action: 'ticket', ticketId: tk.id }));
    const assetItems  = assets.filter(a => fuzzy(a.name, q) || fuzzy(a.tag, q)).map(a => ({ id: a.tag, label: a.name, subtitle: `${a.tag} · ${a.condition}`, icon: '🏷️', action: 'asset', tag: a.tag }));
    const reqItems    = staffRequests.filter(r => fuzzy(r.title, q) || fuzzy(r.id, q)).map(r => ({ id: r.id, label: r.title, subtitle: `${r.id} · ₹${r.cost.toLocaleString()}`, icon: '📋', action: 'request' }));

    const groups = [];
    if (actionItems.length) groups.push({ group: 'Quick Actions', items: actionItems });
    if (ticketItems.length) groups.push({ group: 'Tickets',       items: ticketItems });
    if (assetItems.length)  groups.push({ group: 'Assets',        items: assetItems });
    if (reqItems.length)    groups.push({ group: 'Staff Requests',items: reqItems });
    return groups;
  }, [query, quickActions, tickets, assets, staffRequests]);

  const flatItems = useMemo(() => results.flatMap(g => g.items), [results]);

  const handleSelect = useCallback((item) => {
    if (item.action === 'profile') { dispatch(setProfileModalOpen(true)); }
    if (item.action === 'logout')  { dispatch(setRole('login')); }
    if (item.action === 'ticket')  { dispatch(openTicketDrawer(item.ticketId)); }
    onClose();
  }, [dispatch, onClose]);

  useEffect(() => {
    const handler = (e) => {
      if (!isOpen || !flatItems.length) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, flatItems.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
      if (e.key === 'Enter')     { e.preventDefault(); handleSelect(flatItems[cursor]); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, flatItems, cursor, handleSelect]);

  useEffect(() => { setCursor(0); }, [query]);

  if (!isOpen) return null;

  let globalIdx = 0;

  return (
    <div className="cmd-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="cmd-palette" onClick={e => e.stopPropagation()}>
        <div className="cmd-search-row">
          <span className="cmd-search-icon">⌘</span>
          <input
            ref={inputRef}
            className="cmd-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('search', 'Search roles, tickets, assets, requests...')}
            autoComplete="off"
          />
          <kbd className="cmd-esc-hint">ESC</kbd>
        </div>

        <div className="cmd-results">
          {results.length === 0 ? (
            <div className="cmd-empty">No results for "{query}"</div>
          ) : results.map(group => (
            <div key={group.group} className="cmd-group">
              <div className="cmd-group-label">{group.group}</div>
              {group.items.map(item => {
                const idx = globalIdx++;
                const isActive = idx === cursor;
                return (
                  <div
                    key={item.id || item.label}
                    className={`cmd-item ${isActive ? 'cmd-item-active' : ''}`}
                    onMouseEnter={() => setCursor(idx)}
                    onClick={() => handleSelect(item)}
                  >
                    <span className="cmd-item-icon">{item.icon}</span>
                    <div className="cmd-item-body">
                      <span className="cmd-item-label">{item.label}</span>
                      <span className="cmd-item-sub">{item.subtitle}</span>
                    </div>
                    {isActive && <kbd className="cmd-enter-hint">↵</kbd>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="cmd-footer">
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>Esc</kbd> close</span>
          <span><kbd>Ctrl+K</kbd> toggle</span>
        </div>
      </div>
    </div>
  );
}
