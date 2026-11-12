import React, { useState } from 'react';
import { api, authStorage, User } from '../services/api';
import { Mail, Lock, User as UserIcon, Activity, Sparkles, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

interface AuthCardProps {
  onAuthSuccess: (user: User) => void;
}

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
}

export const AuthCard: React.FC<AuthCardProps> = ({ onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<User | null>(null);

  // Validate fields individually
  const validate = (): boolean => {
    const errors: FieldErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (isSignUp) {
      if (!name.trim()) {
        errors.name = 'Please enter your full name.';
      }
    }

    if (!email.trim()) {
      errors.email = 'Please enter your email address.';
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Please enter a valid email address (e.g. name@example.com).';
    }

    if (!password) {
      errors.password = 'Please enter your password.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    // Validate fields before submitting
    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const res = await api.auth.register(name, email, password);
        authStorage.setToken(res.token);
        authStorage.setUser(res.user);
        setRegisteredUser(res.user);
        setShowSuccessModal(true);
      } else {
        const res = await api.auth.login(email, password);
        authStorage.setToken(res.token);
        authStorage.setUser(res.user);
        onAuthSuccess(res.user);
      }
    } catch (err: any) {
      setGlobalError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToDashboard = () => {
    setShowSuccessModal(false);
    if (registeredUser) {
      onAuthSuccess(registeredUser);
    }
  };

  const fillDemoAccount = () => {
    setIsSignUp(false);
    setEmail('demo@sweety.com');
    setPassword('Password123!');
    setGlobalError(null);
    setFieldErrors({});
  };

  return (
    <div className="auth-page-container">
      <div className="auth-brand-header">
        <div className="brand-logo-badge">
          <Activity className="brand-icon" size={28} />
        </div>
        <h1 className="brand-title">Sweety</h1>
        <p className="brand-subtitle">Smart Blood Glucose Tracker for Diabetes Management</p>
      </div>

      <div className={`auth-card-container ${isSignUp ? 'sign-up-mode' : 'sign-in-mode'}`}>
        {/* Overlay side panel matching reference Image 1 */}
        <div className="auth-side-panel">
          <div className="side-panel-content">
            {isSignUp ? (
              <>
                <h2 className="side-title">Welcome Back!</h2>
                <p className="side-desc">
                  To keep tracking your daily glucose readings, please sign in with your personal account.
                </p>
                <button
                  type="button"
                  className="ghost-pill-btn"
                  onClick={() => {
                    setIsSignUp(false);
                    setGlobalError(null);
                    setFieldErrors({});
                  }}
                >
                  SIGN IN
                </button>
              </>
            ) : (
              <>
                <h2 className="side-title">Hello, Friend!</h2>
                <p className="side-desc">
                  Start your journey to better glucose control and view clinical daily & monthly reports.
                </p>
                <button
                  type="button"
                  className="ghost-pill-btn"
                  onClick={() => {
                    setIsSignUp(true);
                    setGlobalError(null);
                    setFieldErrors({});
                  }}
                >
                  SIGN UP
                </button>
              </>
            )}
          </div>
        </div>

        {/* Form panel */}
        <div className="auth-form-panel">
          <div className="form-inner">
            <h2 className="form-main-heading">{isSignUp ? 'Create Account' : 'Sign In'}</h2>

            {/* Social icons row (Reference Image 1) */}
            <div className="social-pills-row">
              <span className="social-pill" title="Google sign-in placeholder">G+</span>
              <span className="social-pill" title="Facebook placeholder">f</span>
              <span className="social-pill" title="GitHub placeholder">git</span>
              <span className="social-pill" title="LinkedIn placeholder">in</span>
            </div>

            <p className="social-subtitle">
              {isSignUp ? 'or use your email for registration' : 'or use your email account'}
            </p>

            {globalError && (
              <div className="auth-alert error-alert" role="alert">
                <AlertCircle size={18} className="alert-icon" />
                <span>{globalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              {isSignUp && (
                <div className="form-field-wrapper">
                  <div className="input-group">
                    <UserIcon size={18} className="input-icon" />
                    <input
                      type="text"
                      placeholder="Name"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (fieldErrors.name) {
                          setFieldErrors((prev) => ({ ...prev, name: undefined }));
                        }
                      }}
                      className={`styled-input ${fieldErrors.name ? 'input-error' : ''}`}
                    />
                  </div>
                  {fieldErrors.name && (
                    <span className="field-error-text" role="alert">
                      {fieldErrors.name}
                    </span>
                  )}
                </div>
              )}

              <div className="form-field-wrapper">
                <div className="input-group">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) {
                        setFieldErrors((prev) => ({ ...prev, email: undefined }));
                      }
                    }}
                    className={`styled-input ${fieldErrors.email ? 'input-error' : ''}`}
                  />
                </div>
                {fieldErrors.email && (
                  <span className="field-error-text" role="alert">
                    {fieldErrors.email}
                  </span>
                )}
              </div>

              <div className="form-field-wrapper">
                <div className="input-group">
                  <Lock size={18} className="input-icon" />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) {
                        setFieldErrors((prev) => ({ ...prev, password: undefined }));
                      }
                    }}
                    className={`styled-input ${fieldErrors.password ? 'input-error' : ''}`}
                  />
                </div>
                {fieldErrors.password && (
                  <span className="field-error-text" role="alert">
                    {fieldErrors.password}
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="primary-action-btn"
              >
                {loading ? 'Please wait...' : isSignUp ? 'SIGN UP' : 'SIGN IN'}
              </button>
            </form>

            {/* Reviewer / Evaluator Demo Helper */}
            <div className="demo-login-box">
              <button
                type="button"
                className="demo-pill-btn"
                onClick={fillDemoAccount}
              >
                <Sparkles size={15} />
                <span>Fill Kenpath Demo Patient (1-Click)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal Popup when Register is Successful */}
      {showSuccessModal && (
        <div className="modal-backdrop">
          <div className="success-popup-card">
            <div className="success-icon-badge">
              <CheckCircle2 size={48} className="success-badge-icon" />
            </div>
            <h3 className="success-popup-title">Registered Successfully! 🎉</h3>
            <p className="success-popup-message">
              Welcome to <strong>Sweety</strong>, {registeredUser?.name}! Your diabetes tracking account has been created.
            </p>
            <div className="success-popup-info">
              <span>Account: <strong>{registeredUser?.email}</strong></span>
            </div>
            <button
              type="button"
              className="success-continue-btn"
              onClick={handleContinueToDashboard}
            >
              <span>Go to Dashboard</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
