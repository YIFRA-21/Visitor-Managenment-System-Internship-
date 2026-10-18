/**
 * VMS Global Enterprise Design System — Reusable Button Component
 * ─────────────────────────────────────────────────────────────────
 * Variants: Primary, Secondary, Success, Warning, Danger, Outline, Ghost, Icon.
 * Sizes: 'sm' (32px), 'md' (40px, default), 'lg' (48px).
 * Touch-friendly: minimum 44px hit-target on touch devices.
 */
import { forwardRef } from 'react';

const Button = forwardRef(({
    type = 'button',
    variant = 'primary',
    size = 'md',
    loading = false,
    loadingText,
    icon,
    iconRight,
    block = false,
    iconOnly = false,
    children,
    className = '',
    disabled,
    onClick,
    ...props
}, ref) => {
    const classes = [
        'vms-btn',
        `vms-btn--${variant}`,
        size !== 'md' ? `vms-btn--${size}` : '',
        block ? 'vms-btn--block w-full' : '',
        iconOnly ? 'vms-btn--icon' : '',
        loading ? 'loading' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    const handleClick = (e) => {
        if (loading || disabled) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        onClick?.(e);
    };

    return (
        <button
            ref={ref}
            type={type}
            className={classes}
            disabled={disabled || loading}
            aria-busy={loading}
            aria-disabled={disabled || loading}
            onClick={handleClick}
            {...props}
        >
            {loading ? (
                <>
                    <span className="vms-btn-spinner" aria-hidden="true" />
                    <span>{loadingText || children || 'Processing...'}</span>
                </>
            ) : (
                <>
                    {icon && <span className="vms-btn__icon-left">{icon}</span>}
                    {children}
                    {iconRight && <span className="vms-btn__icon-right">{iconRight}</span>}
                </>
            )}
        </button>
    );
});

Button.displayName = 'Button';
export default Button;

