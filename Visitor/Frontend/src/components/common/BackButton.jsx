import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
/**
 * Standard Squircle Back Navigation Button
 * Matches the system-wide visual specification:
 * Dark navy squircle background, subtle border, white left arrow with micro-interaction.
 */
export default function BackButton({ onClick, fallbackUrl = '/dashboard', className = '', title = 'Go back to previous page', ariaLabel = 'Go back to previous page' }) {
    const navigate = useNavigate();
    const handleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onClick) {
            onClick();
        }
        else {
            if (window.history.state && window.history.state.idx > 0) {
                navigate(-1);
            }
            else if (window.history.length > 1) {
                navigate(-1);
            }
            else {
                navigate(fallbackUrl);
            }
        }
    };
    return (<button type="button" onClick={handleClick} title={title} aria-label={ariaLabel} className={`w-10 h-10 rounded-2xl bg-[#0e172e] border border-slate-700/80 hover:border-indigo-500/60 hover:bg-[#15203d] text-white flex items-center justify-center transition-all duration-200 shadow-lg shadow-black/40 hover:scale-105 active:scale-95 group shrink-0 cursor-pointer ${className}`}>
      <ArrowLeft className="w-5 h-5 text-white group-hover:-translate-x-0.5 transition-transform"/>
    </button>);
}
export { BackButton };
