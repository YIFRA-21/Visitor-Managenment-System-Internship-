import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { FlagImage } from './CountryNationalitySelect';
import { COUNTRIES_DATA, getFlagUrl, validatePhoneNumber } from '../../data/countriesData';

/**
 * CountryPhoneInput - Professional Phone Input with International Country Flag Dropdown
 * Matches the user-provided UI design:
 * - Left Box: Flag logo + caret arrow button in a sleek rounded border
 * - Right Box: "Phone number" input field
 * - Dropdown Menu:
 *   - Dark theme popover with scrollbar
 *   - Selected item with full-width blue highlight
 *   - Each item shows: [Flag Logo] Country Name (+DialCode)
 *   - All countries in the world included
 *   - Live search by country name, code, or dial code
 *   - Real-time and on-submit phone validation with friendly guidance
 */
export default function CountryPhoneInput({
  id = 'phone-input',
  name = 'phone',
  value = '',
  dialCode = '+251',
  onChange,
  onDialCodeChange,
  error = '',
  placeholder = 'Phone number',
  label = '',
  required = false,
  disabled = false,
  className = '',
  showValidationHelper = true,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(true);
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const phoneInputRef = useRef(null);
  const listRef = useRef(null);

  // Active country determined by dialCode (defaults to Ethiopia +251)
  const currentCountry = useMemo(() => {
    const cleanDial = dialCode.startsWith('+') ? dialCode : `+${dialCode}`;
    return COUNTRIES_DATA.find(c => c.dialCode === cleanDial) || COUNTRIES_DATA[0];
  }, [dialCode]);

  // List of countries ordered: Selected country at top, followed by all countries alphabetically
  const displayCountries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q) {
      return COUNTRIES_DATA.filter(
        c =>
          c.name.toLowerCase().includes(q) ||
          c.dialCode.includes(q) ||
          c.code.toLowerCase().includes(q) ||
          (c.nationality && c.nationality.toLowerCase().includes(q))
      );
    }

    // Default view: Selected country on top, followed by full alphabetical list
    const otherCountries = COUNTRIES_DATA.filter(c => c.code !== currentCountry.code);
    return [currentCountry, ...otherCountries];
  }, [search, currentCountry]);

  // Dynamically calculate whether dropdown opens upward or downward based on viewport
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      // Default to opening upward (matching user's screenshot), unless cramped on top
      if (spaceAbove < 260 && spaceBelow > spaceAbove) {
        setOpenUpward(false);
      } else {
        setOpenUpward(true);
      }
    }
  }, [isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setActiveIndex(0);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-index="${activeIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex, isOpen]);

  // Select country handler
  const handleSelectCountry = (country) => {
    if (onDialCodeChange) {
      onDialCodeChange(country.dialCode, country);
    }
    setIsOpen(false);
    setTimeout(() => {
      phoneInputRef.current?.focus();
    }, 50);
  };

  // Keyboard navigation inside dropdown
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < displayCountries.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (displayCountries[activeIndex]) {
        handleSelectCountry(displayCountries[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  // Handle phone input change (filters numeric / standard chars)
  const handlePhoneChange = (e) => {
    const rawVal = e.target.value;
    // Disallow letters, allow digits, spaces, and hyphens
    const filteredVal = rawVal.replace(/[^\d\s-]/g, '');
    if (onChange) {
      onChange({
        target: {
          name,
          value: filteredVal,
          rawDigits: filteredVal.replace(/\D/g, ''),
          dialCode: currentCountry.dialCode,
          fullPhone: `${currentCountry.dialCode} ${filteredVal.trim()}`.trim(),
        },
      });
    }
  };

  // Real-time validation status
  const validationState = useMemo(() => {
    if (!value) return null;
    return validatePhoneNumber(value, currentCountry.dialCode, currentCountry.code);
  }, [value, currentCountry]);

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {label && (
        <label
          htmlFor={id}
          className={`block text-[10px] font-extrabold uppercase tracking-wider mb-1.5 ${
            error ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'
          }`}
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Main Phone Input Group */}
      <div className="relative flex items-center gap-2">
        {/* Country Flag Trigger Button (Matches Left Box in Screenshot) */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(prev => !prev)}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          title={`${currentCountry.name} (${currentCountry.dialCode})`}
          className={`h-11 px-3 flex items-center justify-center gap-2 rounded-lg bg-[#0b1220] transition-all cursor-pointer select-none outline-none shrink-0 ${
            isOpen
              ? 'border-2 border-blue-500 ring-2 ring-blue-500/30'
              : error
              ? 'border-2 border-rose-500/80'
              : 'border border-slate-700 hover:border-slate-500 focus:border-blue-500'
          }`}
          style={{ minWidth: '76px' }}
        >
          <FlagImage
            code={currentCountry.code}
            flagEmoji={currentCountry.flag}
            className="w-6 h-4 shrink-0 rounded-[2px]"
            alt={currentCountry.name}
          />
          {/* Caret triangle arrow matching screenshot */}
          <span className="text-[10px] text-slate-300 select-none">
            {isOpen ? (openUpward ? '▲' : '▼') : '▼'}
          </span>
        </button>

        {/* Phone Number Input Field (Matches Right Box in Screenshot) */}
        <div className="relative flex-1">
          <input
            ref={phoneInputRef}
            id={id}
            name={name}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            disabled={disabled}
            value={value}
            onChange={handlePhoneChange}
            placeholder={placeholder}
            className={`w-full h-11 px-3.5 bg-[#0b1220] rounded-lg text-xs font-bold text-white placeholder-slate-500 outline-none transition-all ${
              error
                ? 'border-2 border-rose-500 bg-rose-950/20 focus:ring-2 focus:ring-rose-500/20'
                : 'border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
            }`}
          />
        </div>
      </div>

      {/* Country List Dropdown Popover (Exact Match to Screenshot) */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={`absolute z-50 left-0 ${
            openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } w-full sm:w-[380px] bg-[#1a202c] border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
          style={{
            maxHeight: '340px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Quick Search Header */}
          <div className="p-2 border-b border-slate-700/70 bg-[#161b26] sticky top-0 z-10">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search country name or code (+251)..."
                className="w-full bg-[#0d121d] border border-slate-700/80 rounded-lg pl-8.5 pr-7 py-1.5 text-xs font-semibold text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Country Options List */}
          <div
            ref={listRef}
            role="listbox"
            tabIndex={-1}
            className="overflow-y-auto max-h-[280px] p-0 custom-scrollbar"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#4b5563 #111827',
            }}
          >
            {displayCountries.length === 0 ? (
              <div className="py-6 px-4 text-center text-xs text-slate-400">
                No matching country found
              </div>
            ) : (
              displayCountries.map((country, index) => {
                const isSelected = country.code === currentCountry.code && index === 0;
                const isActive = index === activeIndex;
                const isFirstItemWithoutSearch = !search && index === 0;

                return (
                  <div
                    key={`${country.code}-${country.dialCode}-${index}`}
                    data-index={index}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectCountry(country)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 text-xs font-medium cursor-pointer transition-colors ${
                      isFirstItemWithoutSearch
                        ? 'border-b border-slate-600/80'
                        : ''
                    } ${
                      isSelected
                        ? 'bg-[#195383] text-white font-bold'
                        : isActive
                        ? 'bg-slate-800/90 text-white'
                        : 'text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    {/* Country Flag Logo */}
                    <FlagImage
                      code={country.code}
                      flagEmoji={country.flag}
                      className="w-6 h-4 shrink-0 rounded-[2px] shadow-sm"
                      alt={country.name}
                    />

                    {/* Country Name (+DialCode) as in screenshot: Ethiopia (+251) */}
                    <div className="flex-1 truncate">
                      <span>{country.name}</span>{' '}
                      <span className={isSelected ? 'text-blue-100 font-bold' : 'text-slate-400'}>
                        ({country.dialCode})
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Form Validation Feedback */}
      {error ? (
        <p className="mt-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 animate-in fade-in duration-150">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </p>
      ) : showValidationHelper && validationState && (
        <div className="mt-1">
          {validationState.valid ? (
            <p className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
              <span>Valid: {validationState.fullInternational}</span>
            </p>
          ) : (
            <p className="text-[11px] font-semibold text-amber-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
              <span>{validationState.error}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
