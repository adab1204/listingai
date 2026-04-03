// src/pages/LandingPage.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGenerate } from '../hooks/useGenerate';
import { usePayment } from '../hooks/usePayment';
import {
  InstagramLogo, InstagramGradientLogo,
  FacebookLogo, YouTubeLogo, TwitterXLogo,
  MailchimpLogo, MLSLogo, MonogramLogo,
} from '../components/Logos';
import styles from './LandingPage.module.css';

// ── Static data ──────────────────────────
const CONTENT_FORMATS = [
  { key: 'instagram', label: 'Instagram Post', logo: 'instagram' },
  { key: 'facebook',  label: 'Facebook Ad',    logo: 'facebook'  },
  { key: 'email',     label: 'Email Drip',      logo: 'email'     },
  { key: 'youtube',   label: 'YouTube Script',  logo: 'youtube'   },
  { key: 'blog',      label: 'Market Blog',     logo: 'blog'      },
  { key: 'stories',   label: 'Stories Script',  logo: 'stories'   },
];

const DAY_LABELS  = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
const ACTIVE_DAYS = [1,3,5,7,8,10,12,13,15,17,19,20,22,24,26,27,29];

const PLANS = [
  {
    key: 'starter',   name: 'Starter',   monthlyPrice: '₹6,599',  annualPrice: '₹4,949',
    desc: 'For solo agents with 1–2 active listings.',
    sections: [
      { label: 'Listings & Content', features: ['1 active listing','30-day content calendar','All 6 content types','Unlimited regenerations'] },
      { label: 'Publishing',         features: ['Instagram + Facebook','Mailchimp email integration','Manual publish for other channels'] },
      { label: 'Support',            features: ['Email support (48hr)','Help center access','Onboarding checklist'] },
    ],
  },
  {
    key: 'agent_pro', name: 'Agent Pro', monthlyPrice: '₹16,599', annualPrice: '₹12,449', featured: true,
    desc: 'For active agents listing 5–10 properties per month.',
    sections: [
      { label: 'Listings & Content', features: ['10 active listings','All 6 content types + Reels','Priority AI queue','MLS API auto-import'] },
      { label: 'Publishing',         features: ['All social platforms','All email platforms','YouTube auto-upload','Peak-time scheduling'] },
      { label: 'Brand & Analytics',  features: ['Full white-label brand kit','Per-listing analytics','Lead source attribution'] },
      { label: 'Support',            features: ['Live chat (2hr response)','Dedicated onboarding call','API access'] },
    ],
  },
  {
    key: 'brokerage', name: 'Brokerage', monthlyPrice: '₹49,999', annualPrice: '₹37,499',
    desc: 'For brokerages managing multiple agents at scale.',
    sections: [
      { label: 'Listings & Agents',       features: ['Unlimited listings','Up to 25 agent seats','Agent-level brand profiles','Central admin dashboard'] },
      { label: 'Publishing & Automation', features: ['All platforms + webhooks','MLS auto-trigger','Bulk approval workflow','White-label reports'] },
      { label: 'Security & Support',      features: ['Full audit logs','SSO / SAML login','99.9% uptime SLA','Dedicated success manager'] },
    ],
  },
];

const FAQS = [
  { q: 'Is there a free trial?',               a: 'Yes — every plan includes a 14-day free trial with no credit card required. Full feature access from day one.' },
  { q: 'What happens if I exceed my limit?',    a: "We notify you before you hit your limit. You can upgrade your plan or archive a listing to free up a slot. We never auto-charge overages." },
  { q: 'Can I switch plans mid-month?',          a: 'Upgrade instantly with prorated billing. Downgrade takes effect at the end of your current cycle.' },
  { q: 'Do I own the generated content?',        a: '100%. All content belongs to you. We do not use your listing data or outputs to train any AI models.' },
  { q: 'Is there a contract or lock-in?',        a: 'No contracts. Monthly plans cancel anytime. Annual plans are refunded pro-rata if cancelled.' },
];

// ── Sub-components ───────────────────────
function FormatLogo({ logoKey, size = 12, active = false }) {
  const color = active ? '#E1306C' : 'rgba(245,240,232,0.4)';
  if (logoKey === 'instagram' || logoKey === 'stories') return <InstagramLogo size={size} color={color} />;
  if (logoKey === 'facebook')  return <FacebookLogo size={size} />;
  if (logoKey === 'youtube')   return <YouTubeLogo size={size} />;
  return null;
}

function CalendarPreview() {
  const cells = Array.from({ length: 35 }, (_, i) => i);
  return (
    <div className={styles.calGrid}>
      {DAY_LABELS.map(d => <div key={d} className={styles.calDayLabel}>{d}</div>)}
      {cells.map(i => {
        const day    = i + 1;
        const active = ACTIVE_DAYS.includes(day) && day <= 30;
        return (
          <div key={i} className={`${styles.calCell} ${active ? styles.calCellActive : ''}`}>
            {day <= 30 ? day : ''}
            {active && <div className={styles.calDot} />}
          </div>
        );
      })}
    </div>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.faqItem} onClick={() => setOpen(o => !o)}>
      <div className={styles.faqQuestion}>
        {q}
        <span className={`${styles.faqChevron} ${open ? styles.faqChevronOpen : ''}`}>⌄</span>
      </div>
      <div className={`${styles.faqAnswer} ${open ? styles.faqAnswerOpen : ''}`}>{a}</div>
    </div>
  );
}

// ── Main component ───────────────────────
export default function LandingPage() {
  const navigate         = useNavigate();
  const { user }         = useAuth();
  const { output, loading, error, generate, reset } = useGenerate();
  const { initiatePayment, loading: payLoading, error: payError } = usePayment();

  const [address,      setAddress]      = useState('');
  const [beds,         setBeds]         = useState('');
  const [baths,        setBaths]        = useState('');
  const [price,        setPrice]        = useState('');
  const [notes,        setNotes]        = useState('');
  const [activeFormat, setActiveFormat] = useState('instagram');
  const [annualBilling, setAnnualBilling] = useState(false);

  const scrollTo = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const handleGenerate = () => {
    if (!user) { navigate('/signup'); return; }
    generate({ contentType: activeFormat, listing: { address, beds, baths, price, notes } });
  };

  const handleUpgrade = async (plan) => {
    if (!user) { navigate('/signup'); return; }
    try { await initiatePayment(plan); }
    catch { /* errors shown via payError */ }
  };

  return (
    <div className={styles.page}>

      {/* ── NAV ── */}
      <nav className={styles.nav}>
        <div className={styles.navLogo}>Listing<span>AI</span></div>
        <div className={styles.navLinks}>
          {[['features','Features'],['integrations','Integrations'],['pricing','Pricing'],['security','Security']].map(([id,label]) => (
            <a key={id} href="#" onClick={e => { e.preventDefault(); scrollTo(id); }}>{label}</a>
          ))}
        </div>
        <div className={styles.navRight}>
          {user ? (
            <button className="btn-primary" onClick={() => navigate('/dashboard')}>Dashboard →</button>
          ) : (
            <>
              <Link to="/login"  className={styles.navSignIn}>Sign In</Link>
              <button className="btn-primary" onClick={() => scrollTo('pricing')}>Start Free Trial →</button>
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroBgShape} />
        <div className={styles.heroEyebrow}>
          <div className={styles.heroEyebrowDot} />
          AI-Powered Real Estate Marketing
        </div>
        <h1 className={styles.heroH1}>
          One Listing.<br /><em>30 Days</em> of<br />Marketing. Done.
        </h1>
        <p className={styles.heroSub}>
          Paste an address. Get Instagram posts, Facebook ads, email sequences, blog reports,
          and video scripts — auto-published to every channel. No VA required.
        </p>
        <div className={styles.heroActions}>
          <button className="btn-primary" onClick={() => scrollTo('demo')}>Generate My Content Calendar →</button>
          <button className="btn-secondary" onClick={() => scrollTo('features')}>See Features</button>
        </div>
        <div className={styles.heroStats}>
          {[['30×','more content output'],['~4 min','per full calendar'],['6','channels, one input']].map(([num,label]) => (
            <div key={label} className={styles.stat}>
              <div className={styles.statNum}>{num}</div>
              <div className={styles.statLabel}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DEMO ── */}
      <section className={styles.demoSection} id="demo">
        <div className={styles.demoInner}>
          <div>
            <div className={styles.demoLabel}>Live Demo</div>
            <h2 className={styles.demoHeadline}>Type an address.<br />Watch the <em>magic</em>.</h2>
            <p className={styles.demoBody}>
              Our AI reads your listing data, understands the neighbourhood, and writes
              platform-perfect content in your brand voice — in under 5 minutes.
            </p>
            {!user && (
              <p className={styles.demoAuthNote}>
                <Link to="/signup">Create a free account</Link> to run real generations.
              </p>
            )}
          </div>

          <div className={styles.demoCard}>
            <div className={styles.demoCardTitle}>Generate Content Calendar</div>

            {/* Format selector */}
            <div className={styles.formatTabs}>
              {CONTENT_FORMATS.map(f => (
                <button
                  key={f.key}
                  className={`${styles.formatTab} ${activeFormat === f.key ? styles.formatTabActive : ''}`}
                  onClick={() => { setActiveFormat(f.key); reset(); }}
                >
                  <span className={styles.formatTabIcon}>
                    <FormatLogo logoKey={f.logo} size={12} active={activeFormat === f.key} />
                  </span>
                  {f.label}
                </button>
              ))}
            </div>

            <div className={styles.inputGroup}>
              <input className={styles.demoInput} placeholder="Listing address (e.g. 742 Evergreen Terrace, Springfield)"
                value={address} onChange={e => setAddress(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGenerate()} />
              <div className={styles.inputRow}>
                <input className={styles.demoInput} placeholder="Beds"  style={{ maxWidth: 80 }} value={beds}  onChange={e => setBeds(e.target.value)} />
                <input className={styles.demoInput} placeholder="Baths" style={{ maxWidth: 80 }} value={baths} onChange={e => setBaths(e.target.value)} />
                <input className={styles.demoInput} placeholder="Price (e.g. ₹1,20,00,000)"   value={price} onChange={e => setPrice(e.target.value)} />
              </div>
              <input className={styles.demoInput} placeholder="Key features / MLS notes (optional)"
                value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            <button className={styles.demoGenerateBtn} onClick={handleGenerate} disabled={loading || !address.trim()}>
              {loading
                ? <><span className="spinner" style={{ borderColor: 'var(--ink)', borderTopColor: 'transparent' }} />Generating with AI...</>
                : `Generate ${CONTENT_FORMATS.find(f => f.key === activeFormat)?.label}`
              }
            </button>

            {(error || payError) && (
              <div className={styles.errorBox}>
                {error || payError}
                {(error?.includes('credits') || error?.includes('limit')) && (
                  <button className={styles.errorUpgrade} onClick={() => scrollTo('pricing')}>
                    View Plans →
                  </button>
                )}
              </div>
            )}

            {(output || loading) && (
              <div className={styles.demoOutput}>
                {output && (
                  <div className={styles.outputHeader}>
                    {activeFormat === 'instagram' && <InstagramLogo size={14} color="#E1306C" />}
                    {activeFormat === 'facebook'  && <FacebookLogo size={14} />}
                    {activeFormat === 'youtube'   && <YouTubeLogo size={14} />}
                    {activeFormat === 'email'     && <span style={{ fontSize: 14 }}>📧</span>}
                    {activeFormat === 'blog'      && <span style={{ fontSize: 14 }}>📰</span>}
                    {activeFormat === 'stories'   && <InstagramLogo size={14} color="#E1306C" />}
                    <span className={styles.outputTag}>
                      AI · {CONTENT_FORMATS.find(f => f.key === activeFormat)?.label.toUpperCase()}
                    </span>
                  </div>
                )}
                <div className={styles.outputBody}>
                  {loading && !output
                    ? <span className={styles.outputPlaceholder}>Analysing listing and crafting content...</span>
                    : output
                  }
                  {!loading && !output && <span className={styles.cursor} />}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── CALENDAR ── */}
      <section className={styles.calendarSection}>
        <div className={styles.calWrapper}>
          <div className={styles.calText}>
            <div className={styles.sectionEyebrow} style={{ color: 'var(--gold)', marginBottom: 16 }}>Content Calendar</div>
            <h2 className={styles.sectionTitle} style={{ color: 'var(--cream)' }}>Every day,<br /><em>covered</em>.</h2>
            <p>17 scheduled publish events per listing mapped across 30 days and auto-queued to each platform.</p>
            <div className={styles.calPlatformPills}>
              {[['instagram','Instagram','#E1306C'],['facebook','Facebook',null],['youtube','YouTube',null]].map(([key,label,color]) => (
                <div key={key} className={styles.calPlatformPill}>
                  {key === 'instagram' && <InstagramLogo size={16} color={color} />}
                  {key === 'facebook'  && <FacebookLogo size={16} />}
                  {key === 'youtube'   && <YouTubeLogo size={16} />}
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <div className={styles.calLegend}>
              <div className={styles.calLegendItem}><div className={styles.calLegendDot} style={{ background: 'var(--gold)' }} />Publish day</div>
              <div className={styles.calLegendItem}><div className={styles.calLegendDot} style={{ background: 'rgba(245,240,232,0.15)' }} />Rest day</div>
            </div>
          </div>
          <CalendarPreview />
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className={styles.howSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionEyebrow}>How It Works</div>
          <h2 className={styles.sectionTitle}>Three steps.<br /><em>One month</em> of content.</h2>
        </div>
        <div className={styles.steps}>
          {[
            { num:'01', title:'Input Your Listing',        body:'Enter the address and MLS details — or connect your MLS API and let us pull it automatically. Takes 60 seconds.' },
            { num:'02', title:'AI Generates Everything',   body:'Our engine crafts 30+ pieces of content across 6 formats, calibrated to your brand voice, listing highlights, and local market data.' },
            { num:'03', title:'Auto-Publish & Track',      body:'Content goes live on your schedule. Monitor engagement, leads, and reach from a single dashboard.' },
          ].map(s => (
            <div className={styles.step} key={s.num}>
              <div className={styles.stepNum}>{s.num}</div>
              <div className={styles.stepTitle}>{s.title}</div>
              <div className={styles.stepBody}>{s.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className={styles.featuresSection} id="features">
        <div className={styles.sectionHeader}>
          <div className={styles.sectionEyebrow}>Features</div>
          <h2 className={styles.sectionTitle}><em>Everything</em> an agent<br />needs to dominate.</h2>
          <p className={styles.sectionSubtitle}>One platform replaces your VA, your content agency, and your scheduling tool.</p>
        </div>
        <div className={styles.featuresMainGrid}>
          <div className={styles.featureBigCard}>
            <div className={styles.featureAccent} />
            <div className={styles.featureTag}>Core Engine</div>
            <div className={styles.featureBigTitle}>AI Content Generation<br />Built for Real Estate</div>
            <div className={styles.featureBigBody}>Purpose-built for the residential market. The engine understands property type, price tier, and neighbourhood context — producing copy that reflects the listing accurately, not generically.</div>
            <div className={styles.featureBullets}>
              {['Listing-specific copy calibrated to property type and price tier','Neighbourhood tone and lifestyle context applied automatically','Platform-native formatting per channel','Brand voice configured once, applied to every future listing'].map(b => (
                <div className={styles.featureBullet} key={b}><div className={styles.featureBulletDot} />{b}</div>
              ))}
            </div>
          </div>
          <div className={`${styles.featureBigCard} ${styles.featureBigCardDark}`}>
            <div className={styles.featureTag}>Automation</div>
            <div className={`${styles.featureBigTitle} ${styles.featureBigTitleLight}`}>Scheduled Publishing<br />Across Every Channel</div>
            <div className={`${styles.featureBigBody} ${styles.featureBigBodyLight}`}>Content is queued and published according to platform-specific engagement windows. No manual intervention required once a listing is submitted.</div>
            <div className={styles.featureBullets}>
              {['Scheduling optimised per platform based on engagement data','Automatic retry logic on failed publish attempts','Per-platform queue with drag-to-reschedule interface','Any post can be paused or cancelled prior to publication'].map(b => (
                <div className={`${styles.featureBullet} ${styles.featureBulletLight}`} key={b}><div className={styles.featureBulletDot} />{b}</div>
              ))}
            </div>
          </div>
        </div>
        <div className={styles.featuresSmallGrid}>
          {[
            { title:'Analytics Dashboard',       body:'Unified performance view across all platforms. Track impressions, clicks, and lead conversions per listing in real time.', stat:'6 platforms',  statLabel:'in one dashboard' },
            { title:'30-Day Content Calendar',   body:'Full publish schedule visualised before go-live. Drag to reschedule, preview any post, or approve the entire month in one click.', stat:'17 posts',     statLabel:'avg. per listing' },
            { title:'MLS API Connector',          body:'Connect your MLS board once. Address, photos, price, and comps are pulled automatically on every new listing — no manual entry.', stat:'200+',         statLabel:'MLS boards supported' },
            { title:'Branded Graphics',           body:'Platform-sized social graphics generated per post using your brand palette and listing photos. No design tool required.', stat:'12',           statLabel:'graphic types per listing' },
            { title:'Neighbourhood Intelligence', body:'Walkability, school ratings, and comparable sales data woven automatically into market reports and email copy.', stat:'50+',          statLabel:'data points per listing' },
            { title:'Workflow Automation',        body:'Content generation triggers on MLS status change. No manual initiation required — the system handles it end to end.', stat:'0 clicks',     statLabel:'for fully automated flow' },
          ].map(f => (
            <div className={styles.featureSmallCard} key={f.title}>
              <div className={styles.featureSmallRule} />
              <div className={styles.featureSmallTitle}>{f.title}</div>
              <div className={styles.featureSmallBody}>{f.body}</div>
              <div className={styles.featureSmallStat}>{f.stat}</div>
              <div className={styles.featureSmallStatLabel}>{f.statLabel}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── INTEGRATIONS ── */}
      <section className={styles.integrationsSection} id="integrations">
        <div className={styles.sectionHeader}>
          <div className={styles.sectionEyebrow}>Integrations</div>
          <h2 className={styles.sectionTitle}>Connects to<br /><em>everything</em> you use.</h2>
          <p className={styles.sectionSubtitle}>One-click OAuth connections. Authorise once and we handle the rest.</p>
        </div>
        <div className={styles.integrationsCats}>
          {[
            { label: 'Social Media', cards: [
              { type:'logo', logoKey:'instagram', name:'Instagram', status:'live', desc:'Publishes feed posts, Reels, and Stories with carousel support. Peak-time scheduling included.', setup:'2 min', publishes:'Posts + Stories + Reels' },
              { type:'logo', logoKey:'facebook',  name:'Facebook',  status:'live', desc:'Publishes organic posts and syncs with Meta Ads Manager for paid amplification.', setup:'2 min', publishes:'Posts + Ads + Stories' },
              { type:'logo', logoKey:'youtube',   name:'YouTube',   status:'live', desc:'Uploads listing videos with AI-written titles, descriptions, tags, and chapter markers.', setup:'3 min', publishes:'Videos + Shorts' },
              { type:'logo', logoKey:'twitter',   name:'Twitter / X', status:'live', desc:'Schedules listing posts and threads optimised for real estate audiences.', setup:'1 min', publishes:'Posts + Threads' },
              { type:'mono', letters:'TK', name:'TikTok',   status:'soon', desc:"Short-form video scripts formatted for TikTok's discovery algorithm with trending audio suggestions.", setup:'Q3 2026', publishes:'Videos + Drafts' },
              { type:'mono', letters:'LI', name:'LinkedIn', status:'soon', desc:"Market report articles and listing posts formatted for LinkedIn's professional feed.", setup:'Q3 2026', publishes:'Posts + Articles' },
            ]},
            { label: 'Email Marketing', cards: [
              { type:'mono', letters:'MC', name:'Mailchimp',      status:'live', desc:'Sync contact lists and deliver 5-part drip sequences to tagged segments with personalisation.', setup:'3 min', publishes:'Campaigns + Automations' },
              { type:'mono', letters:'AC', name:'ActiveCampaign', status:'live', desc:'Route listing emails into existing AC automations. Lead scoring tags engaged contacts.', setup:'4 min', publishes:'Emails + Sequences' },
              { type:'mono', letters:'KL', name:'Klaviyo',        status:'soon', desc:'Behaviour-driven email personalisation with dynamic content blocks per buyer profile.', setup:'Q4 2026', publishes:'Flows + Campaigns' },
            ]},
            { label: 'MLS & Listing Data', cards: [
              { type:'mono', letters:'RE', name:'RESO Web API',    status:'live', desc:'RESO-standard connection across 200+ MLS boards. Pulls listing fields, photos, and status updates automatically.', setup:'5 min', publishes:'Auto-import on new listing' },
              { type:'mono', letters:'ZW', name:'Zillow/Zestimate',status:'live', desc:'Retrieves market value estimates and comparable sales to enrich blog posts and email sequences.', setup:'2 min', publishes:'Data enrichment' },
              { type:'mono', letters:'AT', name:'Attom Data',      status:'soon', desc:'Property and neighbourhood intelligence — school ratings, walk score, permit history.', setup:'Q3 2026', publishes:'Data enrichment' },
            ]},
          ].map(cat => (
            <div key={cat.label}>
              <div className={styles.integrationsCatLabel}>{cat.label}</div>
              <div className={styles.integrationsCardsGrid}>
                {cat.cards.map(card => (
                  <div className={styles.integrationCard} key={card.name}>
                    <div className={styles.integrationCardHeader}>
                      <div className={styles.integrationCardLogo}>
                        {card.type === 'logo' && card.logoKey === 'instagram' && <InstagramLogo size={20} color="#E1306C" />}
                        {card.type === 'logo' && card.logoKey === 'facebook'  && <FacebookLogo size={20} />}
                        {card.type === 'logo' && card.logoKey === 'youtube'   && <YouTubeLogo size={20} />}
                        {card.type === 'logo' && card.logoKey === 'twitter'   && <TwitterXLogo size={20} />}
                        {card.type === 'mono' && <MonogramLogo letters={card.letters} size={24} />}
                        <div className={styles.integrationCardName}>{card.name}</div>
                      </div>
                      <div className={`${styles.integrationStatus} ${card.status === 'live' ? styles.statusLive : styles.statusSoon}`}>
                        {card.status === 'live' ? 'LIVE' : 'SOON'}
                      </div>
                    </div>
                    <div className={styles.integrationCardDesc}>{card.desc}</div>
                    <div className={styles.integrationCardMeta}>
                      <span>{card.setup}</span>
                      <span>{card.publishes}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className={styles.integrationsCTAStrip}>
            <div>
              <h3>Don't see your tool?</h3>
              <p>We add integrations every sprint. Request one and it goes straight to our roadmap.</p>
            </div>
            <button className="btn-primary" style={{ flexShrink: 0 }}>Request an Integration →</button>
          </div>
        </div>
      </section>

      {/* ── SECURITY ── */}
      <section className={styles.securitySection} id="security">
        <div className={styles.sectionHeader}>
          <div className={styles.sectionEyebrow} style={{ color: 'var(--gold)' }}>Enterprise Security</div>
          <h2 className={styles.sectionTitle} style={{ color: 'var(--cream)' }}>Built <em>secure</em>.<br />By default.</h2>
          <p className={styles.sectionSubtitle} style={{ color: 'rgba(245,240,232,0.45)' }}>Your listing data, client contacts, and social credentials are treated as critical assets.</p>
        </div>
        <div className={styles.securityMainGrid}>
          {[
            { label:'01', title:'End-to-End Encryption',          body:'All data — listing details, OAuth tokens, contact lists — is encrypted in transit via TLS 1.3 and at rest via AES-256-GCM.', points:['AES-256-GCM field-level encryption on all credentials','TLS 1.3 enforced across every API endpoint','Keys managed by AWS KMS — never stored in application code','Database encryption independent of underlying disk encryption'] },
            { label:'02', title:'OAuth 2.0 — Zero Passwords Stored', body:'Platform passwords are never stored. All connections use OAuth 2.0 token exchange. Revoke from any platform and our access terminates immediately.', points:['Short-lived access tokens (15 min) with automatic refresh rotation','Tokens encrypted at rest, surfaced only server-side','Revocation from Meta or Google takes effect instantly','Least-privilege scopes — we request only what is required'] },
            { label:'03', title:'SOC 2 Type II Architecture',     body:'Infrastructure is built to SOC 2 Type II standards from the ground up. Audit logging, RBAC, and incident response are core to the system design.', points:['Immutable audit logs for all data access and mutations','Row-level security in PostgreSQL enforces user data isolation','Automated vulnerability scanning on every CI/CD deployment','Annual third-party penetration testing'] },
            { label:'04', title:'GDPR & CCPA Compliance',         body:'Data residency controls, right-to-erasure workflows, and consent management are built into the platform. EU and California clients are fully covered.', points:['Right-to-erasure: all data purged within 72 hours of account deletion','Data residency: select US, EU, or UK hosting regions','No data sold or shared with third parties under any condition','Data Processing Agreement (DPA) available on request'] },
          ].map(s => (
            <div className={styles.securityCard} key={s.title}>
              <div className={styles.securityCardLabel}>{s.label}</div>
              <div className={styles.securityCardTitle}>{s.title}</div>
              <div className={styles.securityCardBody}>{s.body}</div>
              <div className={styles.securityCardPoints}>
                {s.points.map(p => <div className={styles.securityPoint} key={p}><div className={styles.securityPointDot} />{p}</div>)}
              </div>
            </div>
          ))}
        </div>
        <div className={styles.complianceBadges}>
          {[['S2','SOC 2 Ready','Architecture compliant'],['EU','GDPR Compliant','EU data residency available'],['CA','CCPA Compliant','California privacy rights'],['ENC','AES-256 Encrypted','At rest & in transit'],['SLA','99.9% Uptime SLA','Brokerage plan'],['PT','Pen Tested Annually','Third-party audit']].map(([mark,label,sub]) => (
            <div className={styles.complianceBadge} key={label}>
              <div className={styles.complianceBadgeMark}>{mark}</div>
              <div>
                <div className={styles.complianceBadgeLabel}>{label}</div>
                <div className={styles.complianceBadgeSub}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
        <div className={styles.securityTrustBar}>
          <div className={styles.trustBarText}>Have a security requirement we haven't covered? Our team will send you a full security questionnaire response, architecture diagram, and DPA within one business day.</div>
          <button className={styles.trustBarCta}>Request Security Docs →</button>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className={styles.pricingSection} id="pricing">
        <div className={styles.sectionHeader}>
          <div className={styles.sectionEyebrow}>Pricing</div>
          <h2 className={styles.sectionTitle}>Simple.<br /><em>Transparent.</em></h2>
          <p className={styles.sectionSubtitle}>No setup fees. No per-post charges. No surprise overages. Cancel any time.</p>
        </div>
        <div className={styles.pricingToggle}>
          <span className={`${styles.toggleLabel} ${!annualBilling ? styles.toggleLabelActive : ''}`}>Monthly</span>
          <button className={styles.toggleSwitch} onClick={() => setAnnualBilling(a => !a)} style={{ background: annualBilling ? 'var(--sage)' : 'var(--gold)' }}>
            <div className={styles.toggleKnob} style={{ left: annualBilling ? 25 : 3 }} />
          </button>
          <span className={`${styles.toggleLabel} ${annualBilling ? styles.toggleLabelActive : ''}`}>Annual</span>
          <span className={styles.saveBadge}>Save 25%</span>
        </div>
        <div className={styles.pricingGrid}>
          {PLANS.map(p => (
            <div className={`${styles.pricingCard} ${p.featured ? styles.pricingCardFeatured : ''}`} key={p.key}>
              {p.featured && <div className={styles.pricingPopular}>MOST POPULAR</div>}
              <div className={styles.pricingPlan}>{p.name}</div>
              <div className={styles.pricingPrice}>
                {annualBilling ? p.annualPrice : p.monthlyPrice}
                <span className={styles.pricingPeriod}>/mo</span>
              </div>
              {annualBilling && <div className={styles.pricingAnnualNote}>billed annually · save 25%</div>}
              <div className={styles.pricingCardDesc}>{p.desc}</div>
              <hr className={styles.pricingDivider} />
              {p.sections.map(sec => (
                <div key={sec.label}>
                  <div className={styles.pricingSectionLabel}>{sec.label}</div>
                  {sec.features.map(f => (
                    <div className={styles.pricingFeature} key={f}><span className={styles.pricingCheck}>✦</span>{f}</div>
                  ))}
                </div>
              ))}
              <button
                className={`${styles.pricingBtn} ${p.featured ? styles.pricingBtnFeatured : ''}`}
                onClick={() => handleUpgrade(p.key)}
                disabled={payLoading}
              >
                {payLoading ? <span className="spinner" /> : null}
                {p.featured ? 'Start Pro Trial →' : p.key === 'brokerage' ? 'Contact Sales →' : 'Get Started →'}
              </button>
            </div>
          ))}
        </div>
        <div className={styles.pricingFaq}>
          <div className={styles.pricingFaqTitle}>Common questions.</div>
          {FAQS.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={styles.ctaSection}>
        <h2 className={styles.ctaTitle}>Your next listing<br />deserves <em>real</em> marketing.</h2>
        <p className={styles.ctaSubtitle}>Join 1,200+ agents turning every listing into a full marketing campaign — automatically.</p>
        <div className={styles.ctaActions}>
          <button className="btn-gold" onClick={() => navigate('/signup')}>Start Free — No Credit Card →</button>
          <button className="btn-secondary" style={{ color: 'var(--cream)', borderColor: 'rgba(245,240,232,0.25)' }}>Talk to Sales</button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <div className={styles.footerLogo}>Listing<span>AI</span></div>
        <div className={styles.footerLinks}>
          {['Privacy Policy','Terms of Service','Security','Status'].map(l => (
            <a href="#" key={l}>{l}</a>
          ))}
        </div>
        <div className={styles.footerRight}>
          <div className={styles.footerSocials}>
            {[['Instagram', <InstagramLogo key="ig" size={18} color="#E1306C" />],['Facebook', <FacebookLogo key="fb" size={18} />],['YouTube', <YouTubeLogo key="yt" size={18} />]].map(([name, icon]) => (
              <a key={name} href="#" title={name} className={styles.footerSocialLink}>{icon}</a>
            ))}
          </div>
          <div className={styles.footerCopy}>© 2026 ListingAI. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
