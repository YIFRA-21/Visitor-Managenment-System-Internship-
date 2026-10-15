import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Lock, UserPlus, Sun, Moon, ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useOrganization } from '../contexts/OrganizationContext';
import LanguageDropdown, { UsaFlag, EthiopiaFlag } from './common/LanguageDropdown';
export default function PublicNavbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isAuthDropdownOpen, setIsAuthDropdownOpen] = useState(false);
    const authDropdownRef = useRef(null);
    const { language, setLanguage, t } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const { logoUrl, orgName } = useOrganization();
    const location = useLocation();
    const navigate = useNavigate();
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 20) {
                setIsScrolled(true);
            }
            else {
                setIsScrolled(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    // Close auth dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            const target = event.target;
            if (authDropdownRef.current && !authDropdownRef.current.contains(target)) {
                setIsAuthDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
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
        setIsOpen(false);
    };
    const isDark = theme === 'dark';
    return (<nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${isScrolled
            ? isDark
                ? 'border-[#2A2A3A] bg-[#0A0A0F]/95 shadow-lg backdrop-blur-xl py-3'
                : 'border-slate-200 bg-white/95 shadow-lg backdrop-blur-xl py-3'
            : isDark
                ? 'border-white/5 bg-[#0A0A0F]/80 backdrop-blur-xl py-4'
                : 'border-slate-100 bg-white/80 backdrop-blur-xl py-4'}`}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img src={logoUrl || '/logo.png'} alt={`${orgName} Logo`} className="h-9 w-9 object-contain rounded-md" onError={(e) => {
            e.target.src = '/logo.png';
        }}/>
            <span className="text-base font-bold tracking-widest text-slate-900 dark:text-white uppercase hidden sm:block">
              {orgName}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 font-mono">
            <button onClick={() => handleNavClick('home')} className="text-[11px] font-bold uppercase tracking-wider text-slate-900 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-b-2 hover:border-cyan-500 dark:hover:border-cyan-400 pb-1 transition duration-150">
              {t('nav.home')}
            </button>
            <button onClick={() => handleNavClick('about')} className="text-[11px] font-bold uppercase tracking-wider text-slate-900 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-b-2 hover:border-cyan-500 dark:hover:border-cyan-400 pb-1 transition duration-150">
              {t('nav.about')}
            </button>
            <Link to="/contact" className="text-[11px] font-bold uppercase tracking-wider text-slate-900 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-b-2 hover:border-cyan-500 dark:hover:border-cyan-400 pb-1 transition duration-150">
              {t('nav.contact')}
            </Link>
          </div>

          {/* Desktop Controls (Language, Theme, Register) */}
          <div className="hidden md:flex items-center gap-4">
            
            {/* Language Dropdown Selector */}
            <LanguageDropdown variant="auto"/>

            {/* Theme Toggle Button */}
            <button onClick={toggleTheme} className="flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition duration-150" style={{
            border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(15, 23, 42, 0.25)',
            borderRadius: '8px',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 23, 42, 0.06)',
            width: '34px',
            height: '34px',
        }} title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              {theme === 'dark' ? (<Moon className="h-3.5 w-3.5 text-indigo-400"/>) : (<Sun className="h-3.5 w-3.5 text-amber-500"/>)}
            </button>

            {/* Dropdown Auth Button */}
            <div className="relative" ref={authDropdownRef}>
              <button onClick={() => setIsAuthDropdownOpen(!isAuthDropdownOpen)} className="btn-primary px-4.5 text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 transition duration-150" style={{ height: '34px' }}>
                <UserPlus className="h-4 w-4"/>
                <span>{t('nav.signInRegister')}</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isAuthDropdownOpen ? 'rotate-180' : ''}`}/>
              </button>

              {isAuthDropdownOpen && (<div className="absolute right-0 mt-2 py-1.5 w-40 rounded-lg shadow-xl border z-50 text-left font-mono" style={{
                backgroundColor: isDark ? '#0f172a' : '#ffffff',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)',
            }}>
                  <Link to="/login" onClick={() => setIsAuthDropdownOpen(false)} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-left text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-slate-700 dark:text-slate-300 hover:text-slate-950 hover:dark:text-white">
                    <Lock className="h-3.5 w-3.5 text-cyan-500 dark:text-cyan-400"/>
                    <span>{t('nav.signIn')}</span>
                  </Link>
                  <Link to="/register" onClick={() => setIsAuthDropdownOpen(false)} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-left text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-slate-700 dark:text-slate-300 hover:text-slate-950 hover:dark:text-white">
                    <UserPlus className="h-3.5 w-3.5 text-cyan-500 dark:text-cyan-400"/>
                    <span>{t('nav.register')}</span>
                  </Link>
                </div>)}
            </div>
          </div>

          {/* Mobile Controls (Menu, Language/Theme Toggles) */}
          <div className="md:hidden flex items-center gap-2">
            {/* Quick Language Toggle */}
            <button onClick={() => setLanguage(language === 'en' ? 'am' : 'en')} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition flex items-center justify-center border border-slate-200 dark:border-white/10" title="Toggle Language / ቋንቋ ቀይር">
              {language === 'en' ? <UsaFlag className="w-5 h-3.5"/> : <EthiopiaFlag className="w-5 h-3.5"/>}
            </button>

            {/* Quick Theme Toggle */}
            <button onClick={toggleTheme} className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition">
              {theme === 'dark' ? <Moon className="h-4 w-4 text-indigo-400"/> : <Sun className="h-4 w-4 text-amber-500"/>}
            </button>

            <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition duration-200">
              {isOpen ? <X className="h-6 w-6"/> : <Menu className="h-6 w-6"/>}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isOpen && (<div className="md:hidden border-t border-slate-200 dark:border-white/5 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl px-6 py-6 space-y-4 font-mono">
          <button onClick={() => handleNavClick('home')} className="block w-full text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition duration-200">
            {t('nav.home')}
          </button>
          <button onClick={() => handleNavClick('about')} className="block w-full text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition duration-200">
            {t('nav.about')}
          </button>
          <Link to="/contact" onClick={() => setIsOpen(false)} className="block w-full text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition duration-200">
            {t('nav.contact')}
          </Link>
          <div className="h-px bg-slate-200 dark:bg-white/5 my-2"/>
          <Link to="/login" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition duration-200">
            <Lock className="h-4 w-4 text-cyan-500 dark:text-cyan-400"/>
            {t('nav.signIn')}
          </Link>
          <div className="pt-2">
            <Link to="/register" onClick={() => setIsOpen(false)} className="w-full flex items-center justify-center gap-2 btn-primary py-2.5 text-xs font-bold uppercase tracking-wider">
              <UserPlus className="h-4 w-4"/>
              {t('nav.register')}
            </Link>
          </div>
        </div>)}
    </nav>);
}
