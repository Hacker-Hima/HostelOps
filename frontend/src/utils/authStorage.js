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

/**
 * Google OAuth Account Chooser Storage
 * Persists all previously logged in accounts across sessions
 */
export const OAUTH_ACCOUNTS_KEY = 'hams_saved_google_accounts';

export const DEFAULT_GOOGLE_ACCOUNTS = [
  {
    name: 'Arun Kumar',
    email: 'arunkumar.student@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop',
    color: '#1a73e8',
    initial: 'A',
    role: 'Hostel Resident',
  },
  {
    name: 'Priya Sharma',
    email: 'priyasharma.hostel@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop',
    color: '#e37400',
    initial: 'P',
    role: 'Hostel Resident',
  },
  {
    name: 'Admin Warden',
    email: 'admin1@hostel.edu',
    avatar: '',
    color: '#d93025',
    initial: 'W',
    role: 'Chief Warden',
  },
];

const AVATAR_COLORS = [
  '#1a73e8',
  '#e37400',
  '#137333',
  '#a142f4',
  '#d93025',
  '#12b5cb',
  '#8e24aa',
  '#00897b',
];

export function getAvatarColor(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function getCurrentUserEmail() {
  try {
    const raw = localStorage.getItem('hams_user');
    if (!raw) return null;
    const u = JSON.parse(raw);
    return u?.email?.toLowerCase().trim() || null;
  } catch {
    return null;
  }
}

export function getSavedOAuthAccounts() {
  try {
    const raw = localStorage.getItem(OAUTH_ACCOUNTS_KEY);
    let accounts = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(accounts) || accounts.length === 0) {
      accounts = [...DEFAULT_GOOGLE_ACCOUNTS];
      localStorage.setItem(OAUTH_ACCOUNTS_KEY, JSON.stringify(accounts));
    }

    // Ensure currently or recently logged in user from hams_user is at the top
    const currentEmail = getCurrentUserEmail();
    if (currentEmail) {
      try {
        const u = JSON.parse(localStorage.getItem('hams_user') || '{}');
        const existingIdx = accounts.findIndex(
          (a) => a.email?.toLowerCase().trim() === currentEmail
        );
        const name = u.name || currentEmail.split('@')[0];
        const activeAcc = {
          name,
          email: currentEmail,
          avatar: u.avatar || '',
          color: getAvatarColor(name || currentEmail),
          initial: name.charAt(0).toUpperCase(),
          role:
            u.role === 'admin'
              ? 'Chief Warden'
              : u.role === 'technician'
              ? 'Technician'
              : 'Hostel Resident',
          lastUsed: Date.now(),
        };

        if (existingIdx >= 0) {
          accounts.splice(existingIdx, 1);
        }
        accounts.unshift(activeAcc);
        localStorage.setItem(OAUTH_ACCOUNTS_KEY, JSON.stringify(accounts));
      } catch (e) {
        // ignore parse errors
      }
    }

    return accounts;
  } catch (err) {
    console.error('Failed to read saved OAuth accounts:', err);
    return [...DEFAULT_GOOGLE_ACCOUNTS];
  }
}

export function saveOAuthAccount(userOrAccount) {
  if (!userOrAccount || !userOrAccount.email) return;
  try {
    const email = userOrAccount.email.toLowerCase().trim();
    const name = userOrAccount.name || email.split('@')[0];
    const initial = name.charAt(0).toUpperCase();

    const existingAccounts = getSavedOAuthAccounts();
    const filtered = existingAccounts.filter(
      (a) => a.email?.toLowerCase().trim() !== email
    );

    const newAcc = {
      name,
      email,
      avatar: userOrAccount.avatar || userOrAccount.picture || '',
      color: userOrAccount.color || getAvatarColor(name || email),
      initial,
      role:
        userOrAccount.role === 'admin'
          ? 'Chief Warden'
          : userOrAccount.role === 'technician'
          ? 'Technician'
          : 'Hostel Resident',
      lastUsed: Date.now(),
    };

    const updated = [newAcc, ...filtered];
    localStorage.setItem(OAUTH_ACCOUNTS_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to save OAuth account:', err);
  }
}

export function removeOAuthAccount(email) {
  try {
    const emailLower = email.toLowerCase().trim();
    const existing = getSavedOAuthAccounts();
    const updated = existing.filter(
      (a) => a.email?.toLowerCase().trim() !== emailLower
    );
    localStorage.setItem(OAUTH_ACCOUNTS_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to remove OAuth account:', err);
    return [];
  }
}

