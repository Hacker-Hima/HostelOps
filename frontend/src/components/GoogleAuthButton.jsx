import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { X, UserPlus, ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import {
  getSavedOAuthAccounts,
  saveOAuthAccount,
  removeOAuthAccount,
  getCurrentUserEmail,
} from '../utils/authStorage';

const GoogleAuthButton = ({
  text = 'Continue with Google',
  onError = () => {},
  className = '',
  style = {},
}) => {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [signingInAccount, setSigningInAccount] = useState(null);
  const [view, setView] = useState('list'); // 'list' | 'custom'
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [customError, setCustomError] = useState('');

  const envClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const hasValidClientId =
    envClientId.length > 10 &&
    !envClientId.includes('your_google_client_id_here') &&
    envClientId.includes('.apps.googleusercontent.com');

  const handleAuthSuccess = (user) => {
    if (user.role === 'admin') {
      navigate('/admin/dashboard');
    } else if (user.role === 'technician' || user.role === 'staff') {
      navigate('/technician/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const reloadAccounts = () => {
    const list = getSavedOAuthAccounts();
    setAccounts(list);
  };

  useEffect(() => {
    reloadAccounts();
  }, [showAccountModal]);

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setSigningInAccount('google');
      const res = await googleLogin(credentialResponse.credential);
      setSigningInAccount(null);

      if (res.success) {
        saveOAuthAccount(res.user);
        reloadAccounts();
        handleAuthSuccess(res.user);
      } else {
        onError(res.message || 'Google sign-in failed');
      }
    } catch (err) {
      setSigningInAccount(null);
      onError(err.message || 'Google sign-in error');
    }
  };

  const selectAccount = async (account) => {
    setSigningInAccount(account.email);
    setCustomError('');

    try {
      const res = await googleLogin(`mock-google-token:${account.email}`, {
        name: account.name,
        picture: account.avatar,
      });

      if (res.success) {
        saveOAuthAccount(res.user || account);
        reloadAccounts();
        setShowAccountModal(false);
        handleAuthSuccess(res.user);
      } else {
        setCustomError(res.message || 'Could not sign in with this account');
        setSigningInAccount(null);
      }
    } catch (err) {
      setCustomError(err.message || 'Error authenticating account');
      setSigningInAccount(null);
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customEmail || !customEmail.includes('@')) {
      setCustomError('Enter a valid email address');
      return;
    }
    const email = customEmail.trim().toLowerCase();
    const name = customName.trim() || email.split('@')[0];
    const initial = name.charAt(0).toUpperCase();
    selectAccount({
      name,
      email,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1a73e8&color=fff`,
      color: '#1a73e8',
      initial,
    });
  };

  const handleRemoveAccount = (e, emailToRemove) => {
    e.stopPropagation();
    const updated = removeOAuthAccount(emailToRemove);
    setAccounts(updated || []);
  };

  return (
    <div style={{ width: '100%', margin: '0.6rem 0', ...style }} className={className}>
      {hasValidClientId ? (
        <GoogleOAuthProvider clientId={envClientId}>
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => onError('Google authentication closed')}
              text="continue_with"
              shape="rectangular"
              size="large"
              width="100%"
              theme="outline"
              locale="en"
            />
          </div>
        </GoogleOAuthProvider>
      ) : (
        /* Styled authentic Continue with Google button */
        <button
          type="button"
          id="btn-continue-with-google"
          onClick={() => {
            setView('list');
            setCustomError('');
            setShowAccountModal(true);
          }}
          disabled={!!signingInAccount}
          style={{
            width: '100%',
            height: '44px',
            padding: '0 1rem',
            backgroundColor: '#ffffff',
            color: '#1f2937',
            border: '1.5px solid #dadce0',
            borderRadius: '8px',
            fontSize: '0.925rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f8fafc';
            e.currentTarget.style.borderColor = '#cbd5e1';
            e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.borderColor = '#dadce0';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.08)';
          }}
        >
          {/* Authentic Google 'G' SVG Logo */}
          <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              fill="#EA4335"
            />
          </svg>
          <span>{text}</span>
        </button>
      )}

      {/* Authentic Google "Choose an account" / Gmail popup dialog */}
      {showAccountModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(32, 33, 36, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 9999,
          }}
          onClick={() => !signingInAccount && setShowAccountModal(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              maxWidth: '430px',
              width: '100%',
              boxShadow: '0 4px 28px rgba(0, 0, 0, 0.24)',
              position: 'relative',
              textAlign: 'left',
              overflow: 'hidden',
              fontFamily: 'Roboto, "Google Sans", -apple-system, BlinkMacSystemFont, sans-serif',
              color: '#202124',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Google progress bar when authenticating */}
            {signingInAccount && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  backgroundColor: '#e8f0fe',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    backgroundColor: '#1a73e8',
                    width: '60%',
                    animation: 'googleProgress 1.2s infinite ease-in-out',
                  }}
                />
              </div>
            )}

            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowAccountModal(false)}
              disabled={!!signingInAccount}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                border: 'none',
                background: 'transparent',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#5f6368',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f3f4')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <X size={20} />
            </button>

            {/* Google Header */}
            <div style={{ padding: '2rem 2.25rem 1.25rem 2.25rem', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', marginBottom: '0.75rem' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
              </div>

              {view === 'list' ? (
                <>
                  <h2
                    style={{
                      margin: '0 0 0.4rem 0',
                      fontSize: '1.45rem',
                      fontWeight: 500,
                      color: '#202124',
                      letterSpacing: '-0.2px',
                    }}
                  >
                    Choose an account
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: '#5f6368' }}>
                    to continue to <strong style={{ color: '#202124', fontWeight: 600 }}>HostelOps</strong>
                  </p>
                </>
              ) : (
                <>
                  <h2
                    style={{
                      margin: '0 0 0.4rem 0',
                      fontSize: '1.45rem',
                      fontWeight: 500,
                      color: '#202124',
                    }}
                  >
                    Sign in with Google
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: '#5f6368' }}>
                    to continue to <strong style={{ color: '#202124', fontWeight: 600 }}>HostelOps</strong>
                  </p>
                </>
              )}
            </div>

            {/* Error banner if any */}
            {customError && (
              <div
                style={{
                  margin: '0 1.5rem 0.75rem 1.5rem',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: '#fce8e6',
                  borderRadius: '8px',
                  color: '#c5221f',
                  fontSize: '0.82rem',
                }}
              >
                {customError}
              </div>
            )}

            {/* Account List View */}
            {view === 'list' && (
              <div
                style={{
                  borderTop: '1px solid #dadce0',
                  borderBottom: '1px solid #dadce0',
                  maxHeight: '340px',
                  overflowY: 'auto',
                }}
              >
                {accounts.map((acc) => {
                  const isSigningInThis = signingInAccount === acc.email;
                  const currentEmail = getCurrentUserEmail();
                  const isCurrent = currentEmail && currentEmail === acc.email.toLowerCase();

                  return (
                    <div
                      key={acc.email}
                      onClick={() => !signingInAccount && selectAccount(acc)}
                      style={{
                        padding: '0.85rem 1.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.9rem',
                        cursor: signingInAccount ? 'not-allowed' : 'pointer',
                        borderBottom: '1px solid #f1f3f4',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!signingInAccount) e.currentTarget.style.backgroundColor = '#f8fafd';
                      }}
                      onMouseLeave={(e) => {
                        if (!signingInAccount) e.currentTarget.style.backgroundColor = '#ffffff';
                      }}
                    >
                      {/* Avatar */}
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: acc.color || '#1a73e8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          fontWeight: 600,
                          fontSize: '1.1rem',
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}
                      >
                        {acc.avatar ? (
                          <img
                            src={acc.avatar}
                            alt={acc.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          acc.initial || acc.name?.charAt(0)?.toUpperCase() || 'U'
                        )}
                      </div>

                      {/* Name & Email */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.925rem',
                            fontWeight: 500,
                            color: '#202124',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {acc.name}
                        </div>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: '#5f6368',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {acc.email}
                        </div>
                      </div>

                      {/* Current active user tag or role */}
                      {isCurrent ? (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            backgroundColor: '#e6f4ea',
                            color: '#137333',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '12px',
                            fontWeight: 500,
                            flexShrink: 0,
                          }}
                        >
                          Signed in
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            color: '#5f6368',
                            backgroundColor: '#f1f3f4',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '12px',
                            fontWeight: 400,
                            flexShrink: 0,
                          }}
                        >
                          {acc.role || 'Signed out'}
                        </span>
                      )}

                      {/* Remove account button */}
                      <button
                        type="button"
                        title="Remove from account list"
                        onClick={(e) => handleRemoveAccount(e, acc.email)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#9aa0a6',
                          padding: '0.3rem',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease',
                          flexShrink: 0,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#d93025';
                          e.currentTarget.style.backgroundColor = '#fce8e6';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#9aa0a6';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <Trash2 size={15} />
                      </button>

                      {/* Status indicator */}
                      {isSigningInThis && (
                        <Loader2 size={18} color="#1a73e8" style={{ animation: 'spin 1s linear infinite' }} />
                      )}
                    </div>
                  );
                })}

                {/* "Use another account" row */}
                <div
                  onClick={() => !signingInAccount && setView('custom')}
                  style={{
                    padding: '0.85rem 1.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.9rem',
                    cursor: signingInAccount ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!signingInAccount) e.currentTarget.style.backgroundColor = '#f8fafd';
                  }}
                  onMouseLeave={(e) => {
                    if (!signingInAccount) e.currentTarget.style.backgroundColor = '#ffffff';
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      border: '1.5px solid #dadce0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#5f6368',
                      flexShrink: 0,
                    }}
                  >
                    <UserPlus size={18} />
                  </div>
                  <div style={{ fontSize: '0.925rem', fontWeight: 500, color: '#202124' }}>
                    Use another account
                  </div>
                </div>
              </div>
            )}

            {/* Custom Account Input View */}
            {view === 'custom' && (
              <form onSubmit={handleCustomSubmit} style={{ padding: '0.5rem 1.75rem 1.25rem 1.75rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.825rem',
                      fontWeight: 500,
                      color: '#5f6368',
                      marginBottom: '0.35rem',
                    }}
                  >
                    Email or phone
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@gmail.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.85rem',
                      borderRadius: '4px',
                      border: '1px solid #dadce0',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'border 0.2s',
                    }}
                    onFocus={(e) => (e.target.style.border = '2px solid #1a73e8')}
                    onBlur={(e) => (e.target.style.border = '1px solid #dadce0')}
                  />
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.825rem',
                      fontWeight: 500,
                      color: '#5f6368',
                      marginBottom: '0.35rem',
                    }}
                  >
                    Your full name (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Arun Kumar"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.85rem',
                      borderRadius: '4px',
                      border: '1px solid #dadce0',
                      fontSize: '0.95rem',
                      outline: 'none',
                    }}
                    onFocus={(e) => (e.target.style.border = '2px solid #1a73e8')}
                    onBlur={(e) => (e.target.style.border = '1px solid #dadce0')}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setView('list')}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#1a73e8',
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.5rem 0',
                    }}
                  >
                    <ArrowLeft size={16} />
                    <span>Back to accounts</span>
                  </button>

                  <button
                    type="submit"
                    disabled={!!signingInAccount}
                    style={{
                      backgroundColor: '#1a73e8',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '0.6rem 1.4rem',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    {signingInAccount ? 'Signing in...' : 'Next'}
                  </button>
                </div>
              </form>
            )}

            {/* Bottom Disclaimer & Google Footer */}
            <div style={{ padding: '1rem 1.75rem 1.25rem 1.75rem', backgroundColor: '#ffffff' }}>
              <p
                style={{
                  fontSize: '0.75rem',
                  lineHeight: '1.4',
                  color: '#5f6368',
                  margin: '0 0 0.85rem 0',
                }}
              >
                To continue, Google will share your name, email address, language preference, and profile picture with
                HostelOps.
              </p>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.72rem',
                  color: '#5f6368',
                  borderTop: '1px solid #f1f3f4',
                  paddingTop: '0.65rem',
                }}
              >
                <span>English (United States)</span>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <span style={{ cursor: 'pointer' }}>Help</span>
                  <span style={{ cursor: 'pointer' }}>Privacy</span>
                  <span style={{ cursor: 'pointer' }}>Terms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleAuthButton;
