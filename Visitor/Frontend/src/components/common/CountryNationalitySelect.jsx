import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X, Globe, AlertCircle } from 'lucide-react';
import { COUNTRIES_DATA, getFlagUrl } from '../../data/countriesData';

export { COUNTRIES_DATA, getFlagUrl };

/**
 * Flag Image with fallback component
 */
export const FlagImage = ({ code, flagEmoji, className = "w-5 h-3.5", alt = "" }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !code) {
    return (
      <span className="inline-flex items-center justify-center text-sm leading-none shrink-0" role="img" aria-label={alt || code}>
        {flagEmoji || '🌐'}
      </span>
    );
  }

  return (
    <img
      src={getFlagUrl(code, 40)}
      srcSet={`${getFlagUrl(code, 40)} 1x, ${getFlagUrl(code, 80)} 2x`}
      alt={alt || code}
      onError={() => setHasError(true)}
      loading="lazy"
      className={`${className} object-cover rounded-[3px] shadow-xs border border-slate-300/60 dark:border-slate-700/60 shrink-0 inline-block`}
    />
  );
};

/**
 * Professional Country & Nationality Dropdown Component
 * Features:
 * - All countries in the world with flags/logos
 * - Search by Nationality, Country name, or ISO code
 * - Quick-pick section for priority countries
 * - Full keyboard navigation (Arrow Up/Down, Enter, Escape)
 * - Dark & light mode compatibility
 * - Seamless form validation error state support
 */
export default function CountryNationalitySelect({
  id = 'country-nationality-select',
  name = 'nationality',
  value = '',
  onChange,
  onBlur,
  error = '',
  placeholder = 'Select Nationality...',
  label = '',
  required = false,
  disabled = false,
  className = '',
  returnMode = 'nationality', // 'nationality' | 'country' | 'code' | 'object'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  // Dynamically calculate whether dropdown opens upward or downward based on viewport
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 320 && spaceAbove > spaceBelow) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
  }, [isOpen]);

  // Find currently selected country
  const selectedCountry = useMemo(() => {
    if (!value) return null;
    const v = String(value).trim().toLowerCase();
    return COUNTRIES_DATA.find(
      c =>
        c.nationality.toLowerCase() === v ||
        c.name.toLowerCase() === v ||
        c.code.toLowerCase() === v
    ) || null;
  }, [value]);

  // Separate priority / quick-pick countries and regular list
  const priorityCountries = useMemo(() => {
    return COUNTRIES_DATA.filter(c => c.priority);
  }, []);

  // Filtered countries based on search
  const filteredCountries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return COUNTRIES_DATA;
    return COUNTRIES_DATA.filter(
      c =>
        c.nationality.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.dialCode.includes(q)
    );
  }, [search]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
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

  const handleSelect = (country) => {
    if (disabled) return;
    setIsOpen(false);

    let output;
    if (returnMode === 'country') {
      output = country.name;
    } else if (returnMode === 'code') {
      output = country.code;
    } else if (returnMode === 'object') {
      output = country;
    } else {
      output = country.nationality;
    }

    if (onChange) {
      onChange({
        target: {
          name,
          value: output,
          country,
        },
      }, country);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (disabled) return;
    if (onChange) {
      onChange({
        target: {
          name,
          value: '',
          country: null,
        },
      }, null);
    }
  };

  // Keyboard navigation within the dropdown
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
      setActiveIndex(prev => (prev < filteredCountries.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCountries[activeIndex]) {
        handleSelect(filteredCountries[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

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

      {/* Main Trigger Button */}
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-invalid={error ? 'true' : undefined}
        data-invalid={error ? 'true' : undefined}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-bold text-left transition-all outline-none cursor-pointer select-none ${
          disabled
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-70'
            : 'bg-white dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 hover:border-slate-400 dark:hover:border-slate-600'
        } ${
          error
            ? 'border-2 border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 focus:ring-2 focus:ring-rose-500/20'
            : isOpen
            ? 'border-2 border-blue-600 dark:border-blue-500 ring-2 ring-blue-500/20'
            : 'border border-slate-300 dark:border-slate-800 focus:border-blue-500'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {selectedCountry ? (
            <>
              <FlagImage
                code={selectedCountry.code}
                flagEmoji={selectedCountry.flag}
                className="w-5 h-3.5 shrink-0"
                alt={selectedCountry.name}
              />
              <span className="truncate font-semibold text-slate-900 dark:text-white">
                {returnMode === 'country' ? selectedCountry.name : selectedCountry.nationality}
              </span>
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate hidden sm:inline">
                ({selectedCountry.name})
              </span>
            </>
          ) : (
            <>
              <Globe className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
              <span className="text-slate-400 dark:text-slate-500 font-normal truncate">
                {placeholder}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {selectedCountry && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === 'Enter' && handleClear(e)}
              title="Clear selection"
              className="p-0.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-blue-500' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute z-[100] left-0 ${
            openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
          style={{ maxHeight: '360px' }}
        >
          {/* Search Header */}
          <div className="p-2.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/90 backdrop-blur sticky top-0 z-10">
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
                placeholder="Search country, nationality, or code..."
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-8.5 pr-8 py-2 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick-filter badges if no search entered */}
            {!search && (
              <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0">
                  Quick:
                </span>
                {priorityCountries.slice(0, 6).map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleSelect(c)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-800 dark:hover:bg-blue-950 dark:hover:text-blue-300 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 transition-colors shrink-0"
                  >
                    <FlagImage code={c.code} flagEmoji={c.flag} className="w-3.5 h-2.5" />
                    <span>{c.nationality}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Countries List */}
          <div
            ref={listRef}
            role="listbox"
            tabIndex={-1}
            className="overflow-y-auto max-h-[260px] divide-y divide-slate-100 dark:divide-slate-800/40 p-1"
          >
            {filteredCountries.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <Globe className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-40 animate-pulse" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  No matching country found
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Try searching with standard name, nationality or 2-letter ISO code.
                </p>
              </div>
            ) : (
              filteredCountries.map((country, index) => {
                const isSelected = selectedCountry?.code === country.code;
                const isActive = index === activeIndex;

                return (
                  <div
                    key={country.code}
                    data-index={index}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(country)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                        : isActive
                        ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <FlagImage
                        code={country.code}
                        flagEmoji={country.flag}
                        className="w-5 h-3.5 shrink-0"
                        alt={country.name}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate">
                            {country.nationality}
                          </span>
                          <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500 truncate">
                            • {country.name}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        {country.code}
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with total count */}
          <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between font-medium">
            <span>
              Showing {filteredCountries.length} of {COUNTRIES_DATA.length} countries
            </span>
            <span className="text-[9px] uppercase tracking-wider text-slate-400">
              Flags verified
            </span>
          </div>
        </div>
      )}

      {/* Field Error Display */}
      {error && (
        <p className="mt-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 animate-in fade-in duration-150">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
