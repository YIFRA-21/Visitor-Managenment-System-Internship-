/**
 * VMS Global Enterprise Design System — Card Component
 * ──────────────────────────────────────────────────────
 * Every card follows the unified Enterprise Design System:
 * Same padding, radius, border, shadow, elevation, and hover transition.
 */
import { forwardRef } from 'react';
export const Card = forwardRef(({ interactive, variant = 'primary', hover, flush, borderless, children, className = '', ...props }, ref) => {
    const classes = [
        'vms-card',
        variant === 'secondary' ? 'vms-card--secondary' : '',
        (interactive || hover) ? 'vms-card--interactive' : '',
        flush ? 'vms-card--flush' : '',
        borderless ? 'vms-card--borderless' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');
    return (<div ref={ref} className={classes} {...props}>
        {children}
      </div>);
});
Card.displayName = 'Card';
export function CardHeader({ children, className = '', ...props }) {
    return (<div className={`vms-card__header ${className}`} {...props}>
      {children}
    </div>);
}
export function CardTitle({ children, subtitle, className = '', }) {
    return (<div className={className}>
      <h3 className="vms-card__title">{children}</h3>
      {subtitle && <p className="vms-card__subtitle">{subtitle}</p>}
    </div>);
}
export function CardActions({ children, className = '' }) {
    return <div className={`vms-card__actions ${className}`}>{children}</div>;
}
export function CardBody({ children, className = '', ...props }) {
    return (<div className={`vms-card__body ${className}`} {...props}>
      {children}
    </div>);
}
export function CardFooter({ children, className = '', ...props }) {
    return (<div className={`vms-card__footer ${className}`} {...props}>
      {children}
    </div>);
}
export default Card;
