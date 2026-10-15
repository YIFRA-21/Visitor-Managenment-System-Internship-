/**
 * VMS Global Enterprise Design System — Reusable Button Component
 * ─────────────────────────────────────────────────────────────────
 * Variants: Primary, Secondary, Success, Warning, Danger, Outline, Ghost, Icon.
 */
import { forwardRef } from 'react';
const Button = forwardRef(({ variant = 'primary', size = 'md', loading = false, loadingText, icon, iconRight, block = false, iconOnly = false, children, className = '', disabled, ...props }, ref) => {
    const classes = [
        'vms-btn',
        `vms-btn--${variant}`,
        size !== 'md' ? `vms-btn--${size}` : '',
        block ? 'vms-btn--block' : '',
        iconOnly ? 'vms-btn--icon' : '',
        loading ? 'loading' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');
    return (<button ref={ref} className={classes} disabled={disabled || loading} aria-busy={loading} aria-disabled={disabled || loading} {...props}>
        {loading ? (<>
            <span className="vms-btn-spinner" aria-hidden="true"/>
            <span>{loadingText || children || 'Processing...'}</span>
          </>) : (<>
            {icon && <span className="vms-btn__icon-left">{icon}</span>}
            {children}
            {iconRight && <span className="vms-btn__icon-right">{iconRight}</span>}
          </>)}
      </button>);
});
Button.displayName = 'Button';
export default Button;
