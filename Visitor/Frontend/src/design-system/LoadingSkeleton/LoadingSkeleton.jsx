/**
 * VMS Design System — LoadingSkeleton Component
 * ───────────────────────────────────────────────
 * Content placeholder skeleton for loading states.
 */
export default function LoadingSkeleton({ variant = 'text', width, height, count = 1, className = '', }) {
    const variantClass = variant !== 'custom' ? `vms-skeleton--${variant}` : '';
    return (<>
      {Array.from({ length: count }).map((_, i) => (<div key={i} className={`vms-skeleton ${variantClass} ${className}`} style={{
                width: width || undefined,
                height: height || undefined,
            }} aria-hidden="true"/>))}
    </>);
}
