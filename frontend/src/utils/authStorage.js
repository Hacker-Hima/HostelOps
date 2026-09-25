/**
 * HostelOps Authentication Storage Manager
 * Handles persistent (localStorage) and session-only (sessionStorage) auth states
 */

const STORAGE_KEY = 'hostelops_auth_session';

export function saveSession({ user, token, role, adminType, remember = false }) {
  try {
    // Clear both first to avoid state leakage
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);

    const payload = JSON.stringify({
      user,
      token,
      role: role || user?.role || 'user',
      adminType: adminType || user?.admin_type || '',
      remember,
      savedAt: Date.now(),
    });

    if (remember) {
      localStorage.setItem(STORAGE_KEY, payload);
    } else {
      sessionStorage.setItem(STORAGE_KEY, payload);
    }
  } catch (err) {
    console.error('Failed to save session to storage:', err);
  }
}

export function getStoredSession() {
  try {
    // Check sessionStorage first, then fallback to localStorage
    const raw = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const data = JSON.parse(raw);
    if (!data || !data.token || !data.user) {
      clearSession();
      return null;
    }

    return data;
  } catch {
    clearSession();
    return null;
  }
}

export function getToken() {
  const session = getStoredSession();
  return session?.token || null;
}

export function clearSession() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear session:', err);
  }
}
