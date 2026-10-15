import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
export default function StatisticsCards({ cards }) {
    const getTrendIcon = (trend) => {
        if (!trend || trend === 0)
            return <Minus className="h-3 w-3"/>;
        return trend > 0 ? <TrendingUp className="h-3 w-3"/> : <TrendingDown className="h-3 w-3"/>;
    };
    const getTrendClass = (trend) => {
        if (!trend || trend === 0)
            return 'trend-badge trend-neutral';
        return trend > 0 ? 'trend-badge trend-up' : 'trend-badge trend-down';
    };
    return (<div className="row g-3">
      {cards.map((card, idx) => (<div className="col-12 col-sm-6 col-lg-4 col-xl" key={idx}>
          <div className={`vms-dashboard-card card-${card.color} vms-section-animated`}>
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div className={`card-icon-wrapper icon-${card.color}`}>
                {card.icon}
              </div>
              {card.trend !== undefined && (<span className={getTrendClass(card.trend)}>
                  {getTrendIcon(card.trend)}
                  {card.trend > 0 ? '+' : ''}{card.trend}%
                </span>)}
            </div>
            <div className="card-value mt-2">{card.value}</div>
            <div className="card-title mt-1">{card.label}</div>
            {card.trendLabel && (<div className="card-description mt-1">{card.trendLabel}</div>)}
          </div>
        </div>))}
    </div>);
}
