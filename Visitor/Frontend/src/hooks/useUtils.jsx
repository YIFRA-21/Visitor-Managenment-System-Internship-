/**
 * Utility Hooks
 * ──────────────
 * Reusable hooks for debounce, pagination, and exports.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
// ── useDebounce ─────────────────────────────────────────────────────────────
export function useDebounce(value, delayMs = 300) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delayMs);
        return () => clearTimeout(timer);
    }, [value, delayMs]);
    return debouncedValue;
}
export function usePagination(initialLimit = 20) {
    const [page, setPage] = useState(1);
    const [limit, setLimitState] = useState(initialLimit);
    const [total, setTotal] = useState(0);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const setLimit = useCallback((newLimit) => {
        setLimitState(newLimit);
        setPage(1); // Reset to page 1 when limit changes
    }, []);
    const nextPage = useCallback(() => {
        setPage((p) => Math.min(p + 1, totalPages));
    }, [totalPages]);
    const prevPage = useCallback(() => {
        setPage((p) => Math.max(p - 1, 1));
    }, []);
    const firstPage = useCallback(() => setPage(1), []);
    const lastPage = useCallback(() => setPage(totalPages), [totalPages]);
    return {
        page, limit, total, totalPages,
        setPage, setLimit, setTotal,
        nextPage, prevPage, firstPage, lastPage,
    };
}
export function useExport() {
    const exportCSV = useCallback(({ filename, headers, rows }) => {
        const csvContent = [
            headers.join(','),
            ...rows.map((row) => row.map((cell) => {
                const str = String(cell ?? '');
                // Escape commas and quotes
                return str.includes(',') || str.includes('"') || str.includes('\n')
                    ? `"${str.replace(/"/g, '""')}"`
                    : str;
            }).join(',')),
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }, []);
    const exportJSON = useCallback((data, filename) => {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }, []);
    const printTable = useCallback((title, tableId) => {
        const table = document.getElementById(tableId);
        if (!table)
            return;
        const printWindow = window.open('', '_blank');
        if (!printWindow)
            return;
        printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { font-size: 18px; margin-bottom: 10px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background-color: #f4f4f4; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        ${table.outerHTML}
      </body>
      </html>
    `);
        printWindow.document.close();
        printWindow.print();
    }, []);
    return { exportCSV, exportJSON, printTable };
}
// ── useClickOutside ─────────────────────────────────────────────────────────
export function useClickOutside(callback) {
    const ref = useRef(null);
    useEffect(() => {
        function handleClick(event) {
            if (ref.current && !ref.current.contains(event.target)) {
                callback();
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [callback]);
    return ref;
}
// ── useLocalStorage ─────────────────────────────────────────────────────────
export function useLocalStorage(key, initialValue) {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        }
        catch {
            return initialValue;
        }
    });
    const setValue = useCallback((value) => {
        setStoredValue(value);
        try {
            localStorage.setItem(key, JSON.stringify(value));
        }
        catch {
            // Ignore storage errors
        }
    }, [key]);
    return [storedValue, setValue];
}
