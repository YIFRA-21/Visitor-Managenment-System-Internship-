import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { FlagImage } from './CountryNationalitySelect';
import { COUNTRIES_DATA, getFlagUrl, validatePhoneNumber, parseInternationalPhone } from '../../data/countriesData';

/**
 * CountryPhoneInput - Professional Phone Input with International Country Flag Dropdown
 * Features:
 * - Left Box: Flag logo + caret arrow button in a sleek rounded border
 * - Right Box: Phone number input field
 * - Dropdown Menu:
 *   - Dark theme popover matching user screenshot
 *   - Selected item with full-width blue highlight
 *   - Each item shows: [Flag Logo] Country Name (+DialCode)
 *   - All countries and territories in the world included
 *   - Live search by country name, nationality, or dial code
 *   - Quick-select priority countries (Ethiopia, US, UK, Canada, Kenya, UAE, etc.)
 *   - Real-time phone validation and format helper
 *   - Supports both two-part forms (separate dialCode and phone) and single-string forms
 *   - Auto-detects pasted/typed international prefixes (+251, +1, etc.)
 *   - Handles countries sharing calling codes (e.g. US and Canada +1)
 */
export default function CountryPhoneInput({
  id = 'phone-input',
  name = 'phone',
  value = '',
  dialCode = '+251',
  countryCode = '',
  onChange,
  onDialCodeChange,
  onBlur,
  error = '',
  placeholder = 'Phone number',
  label = '',
  required = false,
  disabled = false,
  className = '',
  showValidationHelper = true,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  // Internal country state for when onDialCodeChange is not provided
  const [internalCountryCode, setInternalCountryCode] = useState(countryCode || '');
  const [internalDialCode, setInternalDialCode] = useState(dialCode || '+251');

  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const phoneInputRef = useRef(null);
  const listRef = useRef(null);

  // Determine effective dial code and country
  const effectiveCountry = useMemo(() => {
    // If external onDialCodeChange is used, dialCode prop is the primary source of truth
    if (onDialCodeChange) {
      if (countryCode) {
        const byCode = COUNTRIES_DATA.find(c => c.code.toUpperCase() === countryCode.toUpperCase());
        if (byCode) return byCode;
      }
      const cleanDial = dialCode.startsWith('+') ? dialCode : `+${dialCode}`;
      return COUNTRIES_DATA.find(c => c.dialCode === cleanDial) || COUNTRIES_DATA[0];
    }

    // Single-field mode: check if value starts with '+'
    if (value && (String(value).trim().startsWith('+') || String(value).trim().startsWith('00'))) {
      const parsed = parseInternationalPhone(value, internalDialCode, internalCountryCode);
      if (parsed.country) return parsed.country;
    }

    if (internalCountryCode) {
      const byCode = COUNTRIES_DATA.find(c => c.code.toUpperCase() === internalCountryCode.toUpperCase());
      if (byCode) return byCode;
    }

    const cleanDial = internalDialCode.startsWith('+') ? internalDialCode : `+${internalDialCode}`;
    return COUNTRIES_DATA.find(c => c.dialCode === cleanDial) || COUNTRIES_DATA[0];
  }, [onDialCodeChange, dialCode, countryCode, value, internalDialCode, internalCountryCode]);

  // Determine what to display inside the text input
  const displayLocalValue = useMemo(() => {
    if (!value) return '';
    const str = String(value).trim();
    // If in single-field mode and value contains the dial code, extract local number for display
    if (!onDialCodeChange && (str.startsWith('+') || str.startsWith('00'))) {
      const parsed = parseInternationalPhone(str, effectiveCountry.dialCode, effectiveCountry.code);
      return parsed.localNumber;
    }
    return value;
  }, [value, onDialCodeChange, effectiveCountry]);

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
    const otherCountries = COUNTRIES_DATA.filter(c => c.code !== effectiveCountry.code);
    return [effectiveCountry, ...otherCountries];
  }, [search, effectiveCountry]);

  // Dynamically calculate whether dropdown opens upward or downward based on viewport
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      // Default to opening downward unless cramped on bottom and more room on top
      if (spaceBelow < 280 && spaceAbove > spaceBelow) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
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
    setInternalDialCode(country.dialCode);
    setInternalCountryCode(country.code);

    if (onDialCodeChange) {
      onDialCodeChange(country.dialCode, country);
    } else if (onChange) {
      // Single-field mode: update the full string with new dial code
      const currentDigits = String(displayLocalValue).replace(/\D/g, '');
      const newCombined = currentDigits ? `${country.dialCode} ${currentDigits}`.trim() : country.dialCode;
      onChange({
        target: {
          name,
          value: newCombined,
          rawDigits: currentDigits,
          dialCode: country.dialCode,
          fullPhone: newCombined,
        },
      });
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

  // Handle phone input change
  const handlePhoneChange = (e) => {
    const rawVal = e.target.value;

    // Detect if user pasted or typed full international number like +1... or +251...
    if (rawVal.trim().startsWith('+') || rawVal.trim().startsWith('00')) {
      const parsed = parseInternationalPhone(rawVal, effectiveCountry.dialCode, effectiveCountry.code);
      if (parsed.country && parsed.country.code !== effectiveCountry.code) {
        setInternalDialCode(parsed.country.dialCode);
        setInternalCountryCode(parsed.country.code);
        if (onDialCodeChange) {
          onDialCodeChange(parsed.country.dialCode, parsed.country);
        }
      }
      const filteredLocal = parsed.localNumber.replace(/[^\d\s-]/g, '');
      if (onChange) {
        const outValue = onDialCodeChange
          ? filteredLocal
          : `${parsed.dialCode} ${filteredLocal}`.trim();
        onChange({
          target: {
            name,
            value: outValue,
            rawDigits: filteredLocal.replace(/\D/g, ''),
            dialCode: parsed.dialCode,
            fullPhone: `${parsed.dialCode} ${filteredLocal}`.trim(),
          },
        });
      }
      return;
    }

    // Standard local digits entered
    const filteredVal = rawVal.replace(/[^\d\s-]/g, '');
    if (onChange) {
      const outValue = onDialCodeChange
        ? filteredVal
        : `${effectiveCountry.dialCode} ${filteredVal}`.trim();
      onChange({
        target: {
          name,
          value: outValue,
          rawDigits: filteredVal.replace(/\D/g, ''),
          dialCode: effectiveCountry.dialCode,
          fullPhone: `${effectiveCountry.dialCode} ${filteredVal}`.trim(),
        },
      });
    }
  };

  // Real-time validation status
  const validationState = useMemo(() => {
    const testVal = displayLocalValue || value;
    if (!testVal) return null;
    return validatePhoneNumber(testVal, effectiveCountry.dialCode, effectiveCountry.code);
  }, [displayLocalValue, value, effectiveCountry]);

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
          title={`${effectiveCountry.name} (${effectiveCountry.dialCode})`}
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
            code={effectiveCountry.code}
            flagEmoji={effectiveCountry.flag}
            className="w-6 h-4 shrink-0 rounded-[2px]"
            alt={effectiveCountry.name}
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
            value={displayLocalValue}
            onChange={handlePhoneChange}
            onBlur={onBlur}
            placeholder={placeholder}
            aria-invalid={error ? 'true' : undefined}
            data-invalid={error ? 'true' : undefined}
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
          className={`absolute z-[100] left-0 ${
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
                const isSelected = country.code === effectiveCountry.code && index === 0;
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
      ) : showValidationHelper && validationState && validationState.valid ? (
        <div className="mt-1">
          <p className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
            <span>Valid: {validationState.fullInternational}</span>
          </p>
        </div>
      ) : null}
    </div>
  );
}
