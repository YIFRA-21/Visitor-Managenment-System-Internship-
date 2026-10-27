import { useState, useRef, useEffect, useContext } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import ThemeContext from '../../theme/ThemeContext';
export function UsaFlag({ className = "w-5 h-3.5" }) {
    return (<svg viewBox="0 0 640 480" className={`${className} rounded-xs shadow-xs shrink-0 overflow-hidden`}>
      <g fillRule="evenodd">
        <rect width="640" height="480" fill="#bd3d44"/>
        <path stroke="#fff" strokeWidth="37" d="M0 55.5h640M0 129.5h640M0 203.5h640M0 277.5h640M0 351.5h640M0 425.5h640"/>
        <rect width="260" height="259" fill="#192f5d"/>
        <g fill="#fff">
          <g id="s1">
            <g id="s2">
              <polygon points="26,18 28.5,25.5 36,25.5 30,30 32,37.5 26,33 20,37.5 22,30 16,25.5 23.5,25.5"/>
              <polygon points="78,18 80.5,25.5 88,25.5 82,30 84,37.5 78,33 72,37.5 74,30 68,25.5 75.5,25.5"/>
              <polygon points="130,18 132.5,25.5 140,25.5 134,30 136,37.5 130,33 124,37.5 126,30 120,25.5 127.5,25.5"/>
              <polygon points="182,18 184.5,25.5 192,25.5 186,30 188,37.5 182,33 176,37.5 178,30 172,25.5 179.5,25.5"/>
              <polygon points="234,18 236.5,25.5 244,25.5 238,30 240,37.5 234,33 228,37.5 230,30 224,25.5 231.5,25.5"/>
            </g>
            <g transform="translate(0, 36)">
              <polygon points="52,18 54.5,25.5 62,25.5 56,30 58,37.5 52,33 46,37.5 48,30 42,25.5 49.5,25.5"/>
              <polygon points="104,18 106.5,25.5 114,25.5 108,30 110,37.5 104,33 98,37.5 100,30 94,25.5 101.5,25.5"/>
              <polygon points="156,18 158.5,25.5 166,25.5 160,30 162,37.5 156,33 150,37.5 152,30 146,25.5 153.5,25.5"/>
              <polygon points="208,18 210.5,25.5 218,25.5 212,30 214,37.5 208,33 202,37.5 204,30 198,25.5 205.5,25.5"/>
            </g>
          </g>
          <use href="#s1" y="72"/>
          <use href="#s1" y="144"/>
          <use href="#s2" y="216"/>
        </g>
      </g>
    </svg>);
}
export function EthiopiaFlag({ className = "w-5 h-3.5" }) {
    return (<svg viewBox="0 0 640 480" className={`${className} rounded-xs shadow-xs shrink-0 overflow-hidden`}>
      <g fillRule="evenodd">
        <rect width="640" height="160" fill="#078930"/>
        <rect y="160" width="640" height="160" fill="#fcdd09"/>
        <rect y="320" width="640" height="160" fill="#da121a"/>
        <circle cx="320" cy="240" r="105" fill="#0f47af"/>
        <g fill="#fcdd09">
          <polygon points="320,165 338,220 395,220 349,253 367,308 320,274 273,308 291,253 245,220 302,220"/>
          <line x1="320" y1="180" x2="320" y2="150" stroke="#fcdd09" strokeWidth="6" strokeLinecap="round"/>
          <line x1="375" y1="210" x2="400" y2="195" stroke="#fcdd09" strokeWidth="6" strokeLinecap="round"/>
          <line x1="365" y1="275" x2="390" y2="295" stroke="#fcdd09" strokeWidth="6" strokeLinecap="round"/>
          <line x1="275" y1="275" x2="250" y2="295" stroke="#fcdd09" strokeWidth="6" strokeLinecap="round"/>
          <line x1="265" y1="210" x2="240" y2="195" stroke="#fcdd09" strokeWidth="6" strokeLinecap="round"/>
        </g>
      </g>
    </svg>);
}
const LANGUAGES = [
    {
        code: 'en',
        label: 'English',
        nativeLabel: 'English',
        flag: <UsaFlag className="w-5 h-3.5"/>,
    },
    {
        code: 'am',
        label: 'Amharic',
        nativeLabel: 'አማርኛ',
        flag: <EthiopiaFlag className="w-5 h-3.5"/>,
    },
];
export default function LanguageDropdown({ variant = 'auto', className = '', align = 'right', }) {
    const { language, setLanguage } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [isBtnHovered, setIsBtnHovered] = useState(false);
    const dropdownRef = useRef(null);
    const themeCtx = useContext(ThemeContext);
    const isDark = variant === 'dark'
        ? true
        : variant === 'light'
            ? false
            : themeCtx
                ? themeCtx.isDark
                : typeof document !== 'undefined'
                    ? document.documentElement.classList.contains('dark') ||
                        document.documentElement.getAttribute('data-theme') === 'dark'
                    : true;
    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);
    const activeOption = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
    return (<div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button type="button" onClick={() => setIsOpen(!isOpen)} onMouseEnter={() => setIsBtnHovered(true)} onMouseLeave={() => setIsBtnHovered(false)} aria-haspopup="true" aria-expanded={isOpen} className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-xs select-none shrink-0" style={{
            backgroundColor: isBtnHovered
                ? isDark
                    ? '#334155'
                    : '#f1f5f9'
                : isDark
                    ? '#1e293b'
                    : '#ffffff',
            color: isDark ? '#f8fafc' : '#0f172a',
            border: isBtnHovered
                ? isDark
                    ? '1px solid #475569'
                    : '1px solid #94a3b8'
                : isDark
                    ? '1px solid rgba(148, 163, 184, 0.3)'
                    : '1px solid #cbd5e1',
            boxShadow: isDark
                ? '0 1px 3px rgba(0, 0, 0, 0.4)'
                : '0 1px 3px rgba(0, 0, 0, 0.08)',
        }}>
        <span className="flex items-center justify-center shrink-0">{activeOption.flag}</span>
        <span className="hidden sm:inline tracking-wide font-bold" style={{ color: isDark ? '#f8fafc' : '#0f172a' }}>
          {activeOption.nativeLabel}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} style={{ color: isDark ? '#94a3b8' : '#475569' }}/>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (<div className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 w-44 rounded-xl shadow-2xl p-1.5 z-[9999] animate-in fade-in zoom-in-95 duration-150`} style={{
                backgroundColor: isDark ? '#0f172a' : '#ffffff',
                border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                boxShadow: isDark
                    ? '0 12px 28px -4px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                    : '0 12px 28px -4px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            }}>
          <div className="space-y-1">
            {LANGUAGES.map((opt) => {
                const isSelected = opt.code === language;
                return (<button key={opt.code} type="button" onClick={() => {
                        setLanguage(opt.code);
                        setIsOpen(false);
                    }} className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer" style={{
                        backgroundColor: isSelected
                            ? isDark
                                ? 'rgba(99, 102, 241, 0.22)'
                                : '#eff6ff'
                            : 'transparent',
                        border: isSelected
                            ? isDark
                                ? '1px solid rgba(129, 140, 248, 0.45)'
                                : '1px solid #bfdbfe'
                            : '1px solid transparent',
                        color: isSelected
                            ? isDark
                                ? '#a5b4fc'
                                : '#2563eb'
                            : isDark
                                ? '#f8fafc'
                                : '#0f172a',
                    }} onMouseEnter={(e) => {
                        if (!isSelected) {
                            e.currentTarget.style.backgroundColor = isDark ? '#1e293b' : '#f1f5f9';
                        }
                    }} onMouseLeave={(e) => {
                        if (!isSelected) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }
                    }}>
                  <div className="flex items-center gap-2.5">
                    <span className="shrink-0">{opt.flag}</span>
                    <div className="flex flex-col text-left leading-tight">
                      <span style={{
                        color: isSelected
                            ? isDark
                                ? '#a5b4fc'
                                : '#2563eb'
                            : isDark
                                ? '#f8fafc'
                                : '#0f172a',
                    }}>
                        {opt.nativeLabel}
                      </span>
                      <span className="text-[10px] font-normal" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                        {opt.label}
                      </span>
                    </div>
                  </div>
                  {isSelected && (<Check className="w-4 h-4 shrink-0" style={{ color: isDark ? '#818cf8' : '#2563eb' }}/>)}
                </button>);
            })}
          </div>
        </div>)}
    </div>);
}
