import { useState, useEffect } from 'react';
const colorMap = {
    primary: 'card-primary',
    success: 'card-success',
    warning: 'card-warning',
    danger: 'card-danger',
    info: 'card-info',
    secondary: 'card-secondary',
};
const iconColorMap = {
    primary: 'icon-primary',
    success: 'icon-success',
    warning: 'icon-warning',
    danger: 'icon-danger',
    info: 'icon-info',
    secondary: 'icon-secondary',
};
const trendColorMap = {
    up: 'trend-up',
    down: 'trend-down',
    neutral: 'trend-neutral',
};
const trendIconMap = {
    up: 'bi-arrow-up-short',
    down: 'bi-arrow-down-short',
    neutral: 'bi-dash',
};
export default function DashboardCard({ card, onClick }) {
    const [displayValue, setDisplayValue] = useState(0);
    const [isCounting, setIsCounting] = useState(false);
    // ── Count-up animation simulator ─────────────────────────────────────────
    useEffect(() => {
        const target = Number(card.value);
        if (isNaN(target)) {
            setDisplayValue(card.value);
            return;
        }
        setIsCounting(true);
        let start = 0;
        const duration = 800; // ms
        const stepTime = Math.max(Math.floor(duration / target), 15);
        const timer = setInterval(() => {
            start += Math.ceil(target / 40);
            if (start >= target) {
                setDisplayValue(target);
                clearInterval(timer);
                setIsCounting(false);
            }
            else {
                setDisplayValue(start);
            }
        }, stepTime);
        return () => clearInterval(timer);
    }, [card.value]);
    // ── Sparkline SVG generator ──────────────────────────────────────────────
    const renderSparkline = () => {
        if (!card.sparklineData || card.sparklineData.length === 0)
            return null;
        const data = card.sparklineData;
        const maxVal = Math.max(...data);
        const minVal = Math.min(...data);
        const range = maxVal - minVal || 1;
        const width = 120;
        const height = 24;
        const points = data.map((val, index) => {
            const x = (index / (data.length - 1)) * width;
            const y = height - ((val - minVal) / range) * (height - 4) - 2;
            return `${x},${y}`;
        }).join(' ');
        const strokeColor = card.color === 'primary' ? '#818CF8' :
            card.color === 'success' ? '#34D399' :
                card.color === 'warning' ? '#FBBF24' :
                    card.color === 'danger' ? '#F87171' :
                        card.color === 'info' ? '#60A5FA' : '#94A3B8';
        return (<svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="card-sparkline">
        <polyline fill="none" stroke={strokeColor} strokeWidth="1.5" points={points}/>
      </svg>);
    };
    return (<div className={`vms-dashboard-card ${colorMap[card.color] || colorMap.primary}`} onClick={() => onClick?.(card)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ')
        onClick?.(card); }} aria-label={`${card.title}: ${card.value}`}>
      <div className="d-flex align-items-center justify-content-between mb-2">
        <span className={`card-icon-wrapper ${iconColorMap[card.color]}`}>
          <i className={`bi ${card.icon}`}></i>
        </span>
        <span className={`trend-badge ${trendColorMap[card.trendDirection]}`}>
          <i className={`bi ${trendIconMap[card.trendDirection]}`}></i>
          {card.trend}
        </span>
      </div>
      <div className={`card-value mb-1 ${isCounting ? 'counting' : ''}`}>
        {displayValue}
      </div>
      <div className="card-title mb-1">{card.title}</div>
      <div className="card-description mb-2">{card.description}</div>
      {renderSparkline()}
    </div>);
}
