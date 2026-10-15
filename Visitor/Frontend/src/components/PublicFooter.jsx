import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowUp, MapPin, Phone, Mail, Send, Globe } from 'lucide-react';
import { useOrganization } from '../contexts/OrganizationContext';
import { useLanguage } from '../contexts/LanguageContext';
export default function PublicFooter() {
    const { organization, logoUrl, orgName, orgEmail, orgPhone, orgWebsite } = useOrganization();
    const { t, language } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const handleNavClick = (id) => {
        if (location.pathname === '/') {
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
                window.history.pushState(null, '', `#${id}`);
            }
        }
        else {
            navigate(`/#${id}`);
        }
    };
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const handleSubscribe = (e) => {
        e.preventDefault();
        if (email.trim()) {
            setEmail('');
            // TODO: wire up newsletter subscription
        }
    };
    return (<footer className="relative z-10 overflow-hidden" style={{ background: '#0a1628', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* ── Main Footer Content ─────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 pt-14 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-10">

          {/* ── Column 1: Brand + Description + Socials ──────────── */}
          <div className="space-y-5">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img src={logoUrl || '/logo.png'} alt={`${orgName} Logo`} className="h-12 w-auto object-contain rounded-md" onError={(e) => {
            e.target.src = '/logo.png';
        }}/>
            </div>

            {/* Description */}
            <p style={{ color: '#8899b0', fontSize: '0.8125rem', lineHeight: '1.75', letterSpacing: '0.01em' }}>
              {t('footer.desc')}
            </p>

            {/* Social Icons Row */}
            <div className="flex items-center gap-2.5 pt-1">
              {[
            { label: 'Facebook', icon: <FacebookIcon /> },
            { label: 'Twitter', icon: <TwitterIcon /> },
            { label: 'LinkedIn', icon: <LinkedInIcon /> },
            { label: 'YouTube', icon: <YouTubeIcon /> },
            { label: 'TikTok', icon: <TikTokIcon /> },
            { label: 'Telegram', icon: <TelegramIcon /> },
        ].map((social) => (<a key={social.label} href="#" aria-label={social.label} className="flex items-center justify-center transition-all duration-300" style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#8899b0',
            }} onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.35)';
                e.currentTarget.style.color = '#60a5fa';
            }} onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.color = '#8899b0';
            }}>
                  {social.icon}
                </a>))}
            </div>
          </div>

          {/* ── Column 2: Quick Links ────────────────────────────── */}
          <div>
            <h4 style={{
            color: '#f1f5f9',
            fontSize: '0.9375rem',
            fontWeight: 700,
            marginBottom: '1.25rem',
            letterSpacing: '0.02em',
        }}>
              {t('footer.quickLinks')}
            </h4>
            <ul className="space-y-3">
              {[
            { label: t('nav.home'), id: 'home' },
            { label: t('nav.about'), id: 'about' },
            { label: t('footer.services'), id: 'services' },
        ].map((item) => (<li key={item.id}>
                  <button onClick={() => handleNavClick(item.id)} className="flex items-center gap-2.5 transition-colors duration-200 group" style={{ color: '#8899b0', fontSize: '0.8125rem', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#60a5fa'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#8899b0'; }}>
                    <span style={{ opacity: 0.5 }}><LinkIcon /></span>
                    <span>{item.label}</span>
                  </button>
                </li>))}
              <li>
                <Link to="/contact" className="flex items-center gap-2.5 transition-colors duration-200" style={{ color: '#8899b0', fontSize: '0.8125rem', textDecoration: 'none' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#60a5fa'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#8899b0'; }}>
                  <span style={{ opacity: 0.5 }}><LinkIcon /></span>
                  <span>{t('footer.contact')}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* ── Column 3: Services ───────────────────────────────── */}
          <div>
            <h4 style={{
            color: '#f1f5f9',
            fontSize: '0.9375rem',
            fontWeight: 700,
            marginBottom: '1.25rem',
            letterSpacing: '0.02em',
        }}>
              {t('footer.services')}
            </h4>
            <ul className="space-y-3">
              {[
            { label: t('services.reg'), icon: <FAQIcon /> },
            { label: t('services.verify'), icon: <FAQIcon /> },
            { label: t('services.access'), icon: <FAQIcon /> },
            { label: t('services.reports'), icon: <FAQIcon /> },
            { label: t('services.faqs'), icon: <FAQIcon /> },
        ].map((item, idx) => (<li key={idx}>
                  <a href="#" className="flex items-center gap-2.5 transition-colors duration-200" style={{ color: '#8899b0', fontSize: '0.8125rem', textDecoration: 'none' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#60a5fa'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#8899b0'; }}>
                    <span style={{ opacity: 0.5 }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </a>
                </li>))}
            </ul>
          </div>

          {/* ── Column 4: Get In Touch ───────────────────────────── */}
          <div>
            <h4 style={{
            color: '#f1f5f9',
            fontSize: '0.9375rem',
            fontWeight: 700,
            marginBottom: '1.25rem',
            letterSpacing: '0.02em',
        }}>
              {t('footer.getInTouch')}
            </h4>
            <ul className="space-y-3.5">
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#64748b' }}/>
                <span style={{ color: '#8899b0', fontSize: '0.8125rem', lineHeight: '1.5' }}>
                  {organization.address || `${organization.city || (language === 'am' ? 'አዲስ አበባ' : 'Addis Ababa')}, ${organization.country || (language === 'am' ? 'ኢትዮጵያ' : 'Ethiopia')}`}
                </span>
              </li>
              {orgPhone && (<li className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 shrink-0" style={{ color: '#64748b' }}/>
                  <a href={`tel:${orgPhone}`} style={{ color: '#8899b0', fontSize: '0.8125rem', textDecoration: 'none' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#60a5fa'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#8899b0'; }}>
                    {orgPhone}
                  </a>
                </li>)}
              {orgEmail && (<li className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 shrink-0" style={{ color: '#64748b' }}/>
                  <a href={`mailto:${orgEmail}`} style={{ color: '#8899b0', fontSize: '0.8125rem', textDecoration: 'none' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#60a5fa'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#8899b0'; }}>
                    {orgEmail}
                  </a>
                </li>)}
              {orgWebsite && (<li className="flex items-center gap-2.5">
                  <Globe className="h-4 w-4 shrink-0" style={{ color: '#64748b' }}/>
                  <a href={orgWebsite.startsWith('http') ? orgWebsite : `https://${orgWebsite}`} target="_blank" rel="noopener noreferrer" style={{ color: '#8899b0', fontSize: '0.8125rem', textDecoration: 'none' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#60a5fa'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#8899b0'; }}>
                    {orgWebsite}
                  </a>
                </li>)}
            </ul>

            {/* Newsletter Subscribe */}
            <form onSubmit={handleSubscribe} className="mt-5 flex items-center gap-0">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('footer.placeholder')} style={{
            flex: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRight: 'none',
            borderRadius: '6px 0 0 6px',
            padding: '0.5rem 0.75rem',
            fontSize: '0.75rem',
            color: '#e2e8f0',
            outline: 'none',
        }}/>
              <button type="submit" style={{
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderLeft: 'none',
            borderRadius: '0 6px 6px 0',
            padding: '0.5rem 0.75rem',
            color: '#8899b0',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s',
        }} onMouseEnter={(e) => { e.currentTarget.style.color = '#60a5fa'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#8899b0'; }}>
                <Send className="h-4 w-4"/>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── Bottom Bar ──────────────────────────────────────────────── */}
      <div style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            backgroundColor: 'rgba(0, 0, 0, 0.15)',
        }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left: Copyright */}
          <p style={{ color: '#64748b', fontSize: '0.75rem', margin: 0 }}>
            © {new Date().getFullYear()} {orgName}. {t('footer.rights')}
          </p>

          {/* Right: Legal Links + Scroll Top */}
          <div className="flex items-center gap-3">
            <a href="#privacy" className="flex items-center gap-1.5" style={{ color: '#64748b', fontSize: '0.75rem', textDecoration: 'none' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#94a3b8'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; }}>
              <PrivacyIcon />
              <span>{t('footer.privacy')}</span>
            </a>
            <span style={{ color: '#334155' }}>•</span>
            <a href="#terms" className="flex items-center gap-1.5" style={{ color: '#64748b', fontSize: '0.75rem', textDecoration: 'none' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#94a3b8'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; }}>
              <TermsIcon />
              <span>{t('footer.terms')}</span>
            </a>
            <span style={{ color: '#334155' }}>•</span>
            <a href="#contact" className="flex items-center gap-1.5" style={{ color: '#64748b', fontSize: '0.75rem', textDecoration: 'none' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#94a3b8'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; }}>
              <Phone className="h-3 w-3"/>
              <span>{t('footer.contact')}</span>
            </a>

            {/* Scroll to Top */}
            <button onClick={scrollToTop} className="flex items-center justify-center transition-all duration-300 ml-2" style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#64748b',
            cursor: 'pointer',
        }} onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.35)';
            e.currentTarget.style.color = '#60a5fa';
        }} onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.color = '#64748b';
        }} title="Back to top">
              <ArrowUp className="h-3.5 w-3.5"/>
            </button>
          </div>
        </div>
      </div>
    </footer>);
}
// ═══════════════════════════════════════════════════════════════════════════
// INLINE SVG ICONS (matching the screenshot style)
// ═══════════════════════════════════════════════════════════════════════════
function FacebookIcon() {
    return (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>);
}
function TwitterIcon() {
    return (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
    </svg>);
}
function LinkedInIcon() {
    return (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>);
}
function YouTubeIcon() {
    return (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>);
}
function TikTokIcon() {
    return (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>);
}
function TelegramIcon() {
    return (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>);
}
function LinkIcon() {
    return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M8 12h8"/>
      <path d="M12 8v8"/>
    </svg>);
}
function BuildingIcon() {
    return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>
    </svg>);
}
function LandIcon() {
    return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/>
    </svg>);
}
function InvestIcon() {
    return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>);
}
function PartnersIcon() {
    return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>);
}
function FAQIcon() {
    return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>);
}
function PrivacyIcon() {
    return (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>);
}
function TermsIcon() {
    return (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>);
}
