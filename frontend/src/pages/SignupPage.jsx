// src/pages/SignupPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './AuthPage.module.css';

export default function SignupPage() {
  const navigate  = useNavigate();
  const { signup } = useAuth();

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      await signup(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Link to="/" className={styles.logo}>Listing<span>AI</span></Link>
        <h1 className={styles.title}>Start for free.</h1>
        <p className={styles.subtitle}>5 free AI generations included. No credit card required.</p>

        <div className={styles.freeBadge}>
          5 free generations · All 6 content types · No credit card
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Full name</label>
            <input
              type="text" className={styles.input} placeholder="Sarah Johnson"
              value={name} onChange={e => setName(e.target.value)} required autoFocus
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Email address</label>
            <input
              type="email" className={styles.input} placeholder="you@brokerage.com"
              value={email} onChange={e => setEmail(e.target.value)} required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <input
              type="password" className={styles.input}
              placeholder="Min. 8 chars, one uppercase, one number"
              value={password} onChange={e => setPassword(e.target.value)} required
            />
          </div>
          <button type="submit" className={`btn-gold ${styles.submitBtn}`} disabled={loading}>
            {loading ? <span className="spinner" style={{ borderColor: 'var(--ink)', borderTopColor: 'transparent' }} /> : null}
            {loading ? 'Creating account...' : 'Create Free Account →'}
          </button>
          <p className={styles.terms}>
            By signing up you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
          </p>
        </form>

        <p className={styles.switchLink}>
          Already have an account? <Link to="/login">Sign in →</Link>
        </p>
      </div>

      <div className={styles.bgDecor}>
        <div className={styles.bgShape1} />
        <div className={styles.bgShape2} />
      </div>
    </div>
  );
}
