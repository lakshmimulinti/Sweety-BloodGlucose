import React, { useState } from 'react';
import { api, authStorage, User } from '../services/api';
import { Mail, Lock, User as UserIcon, Activity, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface AuthCardProps {
  onAuthSuccess: (user: User) => void;
}

export const AuthCard: React.FC<AuthCardProps> = ({ onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isSignUp) {
        if (!name.trim()) throw new Error('Please enter your full name.');
        if (!email.trim()) throw new Error('Please enter your email.');
        if (!password || password.length < 6) throw new Error('Password must be at least 6 characters.');

        const res = await api.auth.register(name, email, password);
        authStorage.setToken(res.token);
        authStorage.setUser(res.user);
        setSuccessMsg('Account created successfully! Redirecting...');
        setTimeout(() => onAuthSuccess(res.user), 600);
      } else {
        if (!email.trim() || !password) throw new Error('Please provide both email and password.');

        const res = await api.auth.login(email, password);
        authStorage.setToken(res.token);
        authStorage.setUser(res.user);
        setSuccessMsg('Welcome back! Logging you in...');
        setTimeout(() => onAuthSuccess(res.user), 600);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setIsSignUp(false);
    setEmail('demo@sweety.com');
    setPassword('Password123!');
    setError(null);
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
                    setError(null);
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
                    setError(null);
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

            {error && (
              <div className="auth-alert error-alert" role="alert">
                <AlertCircle size={18} className="alert-icon" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="auth-alert success-alert" role="alert">
                <CheckCircle2 size={18} className="alert-icon" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              {isSignUp && (
                <div className="input-group">
                  <UserIcon size={18} className="input-icon" />
                  <input
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="styled-input"
                  />
                </div>
              )}

              <div className="input-group">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="styled-input"
                />
              </div>

              <div className="input-group">
                <Lock size={18} className="input-icon" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="styled-input"
                />
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
    </div>
  );
};
