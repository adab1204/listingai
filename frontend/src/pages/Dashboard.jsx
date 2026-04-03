// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGenerate } from '../hooks/useGenerate';
import { usePayment } from '../hooks/usePayment';
import { userAPI, contentAPI } from '../services/api';
import {
  InstagramLogo, FacebookLogo, YouTubeLogo,
} from '../components/Logos';
import styles from './Dashboard.module.css';

const FORMATS = [
  { key: 'instagram', label: 'Instagram Post' },
  { key: 'facebook',  label: 'Facebook Ad'    },
  { key: 'email',     label: 'Email Drip'     },
  { key: 'youtube',   label: 'YouTube Script' },
  { key: 'blog',      label: 'Market Blog'    },
  { key: 'stories',   label: 'Stories Script' },
];

function FormatIcon({ type, size = 16 }) {
  if (type === 'instagram' || type === 'stories') return <InstagramLogo size={size} color="#E1306C" />;
  if (type === 'facebook')  return <FacebookLogo size={size} />;
  if (type === 'youtube')   return <YouTubeLogo size={size} />;
  if (type === 'email')     return <span style={{ fontSize: size }}>📧</span>;
  if (type === 'blog')      return <span style={{ fontSize: size }}>📰</span>;
  return null;
}

function CreditBar({ used, total }) {
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const remaining = Math.max(0, total - used);
  return (
    <div className={styles.creditBar}>
      <div className={styles.creditBarHeader}>
        <span className={styles.creditBarLabel}>Credits this period</span>
        <span className={styles.creditBarCount}>{remaining} / {total} remaining</span>
      </div>
      <div className={styles.creditBarTrack}>
        <div className={styles.creditBarFill} style={{ width: `${pct}%`, background: pct > 80 ? '#9B3D1E' : 'var(--gold)' }} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate          = useNavigate();
  const { user, logout }  = useAuth();
  const { output, loading, error, generate, reset } = useGenerate();
  const { initiatePayment, loading: payLoading } = usePayment();

  // Form state
  const [address,      setAddress]      = useState('');
  const [beds,         setBeds]         = useState('');
  const [baths,        setBaths]        = useState('');
  const [price,        setPrice]        = useState('');
  const [notes,        setNotes]        = useState('');
  const [activeFormat, setActiveFormat] = useState('instagram');

  // Data state
  const [subscription, setSubscription] = useState(null);
  const [history,      setHistory]      = useState([]);
  const [histLoading,  setHistLoading]  = useState(true);
  const [activeTab,    setActiveTab]    = useState('generate'); // 'generate' | 'history'
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    Promise.all([
      userAPI.getSubscription().then(r => setSubscription(r.data.data)),
      contentAPI.getHistory().then(r => setHistory(r.data.data)),
    ]).finally(() => setHistLoading(false));
  }, []);

  const handleGenerate = async () => {
    reset();
    await generate({ contentType: activeFormat, listing: { address, beds, baths, price, notes } });
    // Refresh history and subscription after generation
    const [subRes, histRes] = await Promise.all([
      userAPI.getSubscription(),
      contentAPI.getHistory(),
    ]);
    setSubscription(subRes.data.data);
    setHistory(histRes.data.data);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const planLabel = subscription?.plan
    ? subscription.plan.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
    : 'Free';

  return (
    <div className={styles.page}>

      {/* ── SIDEBAR ── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>Listing<span>AI</span></div>

        <nav className={styles.sidebarNav}>
          <button className={`${styles.navItem} ${activeTab === 'generate' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('generate')}>
            <span className={styles.navItemIcon}>⚡</span> Generate
          </button>
          <button className={`${styles.navItem} ${activeTab === 'history' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('history')}>
            <span className={styles.navItemIcon}>🕐</span> History
            {history.length > 0 && <span className={styles.navBadge}>{history.length}</span>}
          </button>
        </nav>

        <div className={styles.sidebarBottom}>
          {/* Subscription card */}
          <div className={styles.subCard}>
            <div className={styles.subCardPlan}>
              <span className={styles.subCardPlanLabel}>{planLabel}</span>
              {subscription?.plan === 'free' && (
                <button className={styles.upgradeBtn} onClick={() => navigate('/#pricing')}>Upgrade</button>
              )}
            </div>
            {subscription && (
              <CreditBar
                used={subscription.creditsUsed ?? (5 - (user?.credits ?? 0))}
                total={subscription.creditsTotal ?? 5}
              />
            )}
          </div>

          {/* User info */}
          <div className={styles.userRow}>
            <div className={styles.userAvatar}>{user?.name?.[0]?.toUpperCase() || 'A'}</div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{user?.name}</div>
              <div className={styles.userEmail}>{user?.email}</div>
            </div>
            <button className={styles.logoutBtn} onClick={handleLogout} title="Sign out">↩</button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className={styles.main}>

        {/* ── GENERATE TAB ── */}
        {activeTab === 'generate' && (
          <div className={styles.generateTab}>
            <div className={styles.mainHeader}>
              <div>
                <h1 className={styles.mainTitle}>Generate Content</h1>
                <p className={styles.mainSubtitle}>Enter a listing and generate AI-written marketing content in seconds.</p>
              </div>
            </div>

            <div className={styles.generateGrid}>
              {/* Left: Form */}
              <div className={styles.generateForm}>
                <div className={styles.formSection}>
                  <div className={styles.formSectionTitle}>Listing Details</div>
                  <div className={styles.formFields}>
                    <input className={styles.formInput} placeholder="Listing address *"
                      value={address} onChange={e => setAddress(e.target.value)} />
                    <div className={styles.formRow}>
                      <input className={styles.formInput} placeholder="Beds"  style={{ maxWidth: 90 }} value={beds}  onChange={e => setBeds(e.target.value)} />
                      <input className={styles.formInput} placeholder="Baths" style={{ maxWidth: 90 }} value={baths} onChange={e => setBaths(e.target.value)} />
                      <input className={styles.formInput} placeholder="Price (e.g. ₹1.2Cr)" value={price} onChange={e => setPrice(e.target.value)} />
                    </div>
                    <textarea className={styles.formInput} placeholder="Key features / MLS notes (optional)"
                      value={notes} onChange={e => setNotes(e.target.value)}
                      rows={3} style={{ resize: 'vertical' }} />
                  </div>
                </div>

                <div className={styles.formSection}>
                  <div className={styles.formSectionTitle}>Content Type</div>
                  <div className={styles.formatGrid}>
                    {FORMATS.map(f => (
                      <button
                        key={f.key}
                        className={`${styles.formatBtn} ${activeFormat === f.key ? styles.formatBtnActive : ''}`}
                        onClick={() => { setActiveFormat(f.key); reset(); }}
                      >
                        <FormatIcon type={f.key} size={18} />
                        <span>{f.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  className={styles.generateBtn}
                  onClick={handleGenerate}
                  disabled={loading || !address.trim()}
                >
                  {loading
                    ? <><span className="spinner" style={{ borderColor: 'var(--ink)', borderTopColor: 'transparent' }} />Generating...</>
                    : `Generate ${FORMATS.find(f => f.key === activeFormat)?.label}`
                  }
                </button>

                {error && (
                  <div className={styles.errorBox}>
                    {error}
                    {(error.includes('credits') || error.includes('limit')) && (
                      <button className={styles.upgradeInlineBtn} onClick={() => initiatePayment('agent_pro')} disabled={payLoading}>
                        {payLoading ? <span className="spinner" /> : 'Upgrade Plan →'}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Right: Output */}
              <div className={styles.outputPanel}>
                <div className={styles.outputPanelHeader}>
                  <div className={styles.outputPanelTitle}>Output</div>
                  {output && (
                    <button className={styles.copyBtn} onClick={() => navigator.clipboard.writeText(output)}>
                      Copy
                    </button>
                  )}
                </div>
                <div className={styles.outputArea}>
                  {loading && !output && (
                    <div className={styles.outputLoading}>
                      <span className="spinner" style={{ borderColor: 'var(--gold)', borderTopColor: 'transparent', width: 24, height: 24 }} />
                      <span>AI is writing your content...</span>
                    </div>
                  )}
                  {!loading && !output && !error && (
                    <div className={styles.outputEmpty}>
                      <div className={styles.outputEmptyIcon}><FormatIcon type={activeFormat} size={32} /></div>
                      <div className={styles.outputEmptyText}>
                        Fill in the listing details and click Generate to see your content here.
                      </div>
                    </div>
                  )}
                  {output && (
                    <div className={styles.outputContent}>
                      <div className={styles.outputMeta}>
                        <FormatIcon type={activeFormat} size={14} />
                        <span>{FORMATS.find(f => f.key === activeFormat)?.label}</span>
                      </div>
                      <pre className={styles.outputText}>{output}</pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {activeTab === 'history' && (
          <div className={styles.historyTab}>
            <div className={styles.mainHeader}>
              <div>
                <h1 className={styles.mainTitle}>Generation History</h1>
                <p className={styles.mainSubtitle}>All your past content, ready to reuse or copy.</p>
              </div>
            </div>

            {histLoading ? (
              <div className={styles.histLoading}>
                <span className="spinner" style={{ borderColor: 'var(--gold)', borderTopColor: 'transparent', width: 28, height: 28 }} />
              </div>
            ) : history.length === 0 ? (
              <div className={styles.histEmpty}>
                <div className={styles.histEmptyText}>No generations yet.</div>
                <button className="btn-primary" onClick={() => setActiveTab('generate')}>Generate your first →</button>
              </div>
            ) : (
              <div className={styles.histLayout}>
                {/* List */}
                <div className={styles.histList}>
                  {history.map(item => (
                    <div
                      key={item._id}
                      className={`${styles.histItem} ${selectedItem?._id === item._id ? styles.histItemActive : ''}`}
                      onClick={() => setSelectedItem(item)}
                    >
                      <div className={styles.histItemIcon}><FormatIcon type={item.contentType} size={18} /></div>
                      <div className={styles.histItemInfo}>
                        <div className={styles.histItemAddress}>{item.input?.address || 'Unknown address'}</div>
                        <div className={styles.histItemMeta}>
                          {FORMATS.find(f => f.key === item.contentType)?.label} · {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Detail panel */}
                <div className={styles.histDetail}>
                  {!selectedItem ? (
                    <div className={styles.histDetailEmpty}>Select an item to view the content.</div>
                  ) : (
                    <>
                      <div className={styles.histDetailHeader}>
                        <div>
                          <div className={styles.histDetailAddress}>{selectedItem.input?.address}</div>
                          <div className={styles.histDetailMeta}>
                            {FORMATS.find(f => f.key === selectedItem.contentType)?.label} · {new Date(selectedItem.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <button className={styles.copyBtn} onClick={() => navigator.clipboard.writeText(selectedItem.output)}>
                          Copy
                        </button>
                      </div>
                      <pre className={styles.histDetailOutput}>{selectedItem.output}</pre>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
