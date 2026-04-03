// src/components/Logos.jsx

export const InstagramLogo = ({ size = 28, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="2" y="2" width="20" height="20" rx="5.5" stroke={color} strokeWidth="1.8" fill="none"/>
    <circle cx="12" cy="12" r="4.5" stroke={color} strokeWidth="1.8" fill="none"/>
    <circle cx="17.5" cy="6.5" r="1.1" fill={color}/>
  </svg>
);

export const InstagramGradientLogo = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%"   stopColor="#F58529"/>
        <stop offset="35%"  stopColor="#DD2A7B"/>
        <stop offset="70%"  stopColor="#8134AF"/>
        <stop offset="100%" stopColor="#515BD4"/>
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="20" height="20" rx="5.5" stroke="url(#ig-grad)" strokeWidth="1.8" fill="none"/>
    <circle cx="12" cy="12" r="4.5" stroke="url(#ig-grad)" strokeWidth="1.8" fill="none"/>
    <circle cx="17.5" cy="6.5" r="1.1" fill="url(#ig-grad)"/>
  </svg>
);

export const FacebookLogo = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="2" y="2" width="20" height="20" rx="5.5" fill="#1877F2"/>
    <path d="M13.5 8.5H15V6H13C11.343 6 10 7.343 10 9V11H8V13.5H10V18H12.5V13.5H14.5L15 11H12.5V9C12.5 8.724 12.724 8.5 13 8.5H13.5Z" fill="white"/>
  </svg>
);

export const YouTubeLogo = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16">
    <path d="M14.705 4.63a1.75 1.75 0 0 0-1.235-1.235C12.38 3.1 8 3.1 8 3.1s-4.38 0-5.47.295a1.75 1.75 0 0 0-1.235 1.235A18.065 18.065 0 0 0 1 8a18.065 18.065 0 0 0 .295 3.37 1.75 1.75 0 0 0 1.235 1.235c1.09.295 5.47.295 5.47.295s4.38 0 5.47-.295a1.75 1.75 0 0 0 1.235-1.235A18.065 18.065 0 0 0 15 8a18.065 18.065 0 0 0-.295-3.37Z" fill="#FF0000"/>
    <path d="M6.6 10.1v-4.2l3.635 2.1Z" fill="white"/>
  </svg>
);

export const TwitterXLogo = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="2" y="2" width="20" height="20" rx="5.5" fill="#000"/>
    <path d="M13.27 10.887L17.8 5.5h-1.06l-3.937 4.575L9.553 5.5H6l4.747 6.906L6 18.5h1.06l4.148-4.822 3.313 4.822H18l-4.73-6.613Zm-1.468 1.706-.48-.688-3.826-5.472h1.645l3.085 4.413.48.688 4.012 5.739h-1.645l-3.271-4.68Z" fill="white"/>
  </svg>
);

export const MailchimpLogo = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="#FFE01B"/>
    <text x="12" y="16.5" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#241C15" fontFamily="sans-serif">M</text>
  </svg>
);

export const MLSLogo = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="2" y="2" width="20" height="20" rx="5" fill="#1A1209"/>
    <path d="M12 5L20 10V19H4V10L12 5Z" stroke="#C9963A" strokeWidth="1.5" fill="none"/>
    <rect x="9" y="13" width="6" height="6" rx="1" fill="#C9963A" opacity="0.8"/>
  </svg>
);

// Monogram badge for non-branded integrations
export const MonogramLogo = ({ letters, size = 24 }) => (
  <div style={{
    width: size, height: size, borderRadius: 6,
    background: 'var(--ink)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontFamily: 'var(--font-mono)',
    fontSize: size * 0.38, fontWeight: 500, color: 'var(--gold)',
    letterSpacing: '0.02em', flexShrink: 0,
  }}>
    {letters}
  </div>
);
