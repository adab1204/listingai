// src/pages/LoginPage.jsx
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './AuthPage.module.css';

export default function LoginPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login } = useAuth();
  const from      = location.state?.from?.pathname || '/dashboard';

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Link to="/" className={styles.logo}>Listing<span>AI</span></Link>
        <h1 className={styles.title}>Welcome back.</h1>
        <p className={styles.subtitle}>Sign in to your account to continue.</p>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Email address</label>
            <input
              type="email" className={styles.input} placeholder="you@brokerage.com"
              value={email} onChange={e => setEmail(e.target.value)} required autoFocus
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <input
              type="password" className={styles.input} placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} required
            />
          </div>
          <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loading}>
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        <p className={styles.switchLink}>
          Don't have an account? <Link to="/signup">Create one free →</Link>
        </p>
      </div>

      {/* Decorative background */}
      <div className={styles.bgDecor}>
        <div className={styles.bgShape1} />
        <div className={styles.bgShape2} />
      </div>
    </div>
  );
}
