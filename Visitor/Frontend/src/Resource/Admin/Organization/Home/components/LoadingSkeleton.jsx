function SkeletonBar({ width, height = '12px' }) {
    return (<div className="skeleton-bar" style={{ width, height }}></div>);
}
function CardSkeleton() {
    return (<div className="skeleton-card d-flex flex-column gap-3">
      <div className="d-flex align-items-center justify-content-between">
        <SkeletonBar width="40px" height="40px"/>
        <SkeletonBar width="55px" height="16px"/>
      </div>
      <div>
        <SkeletonBar width="60px" height="28px"/>
      </div>
      <div className="d-flex flex-column gap-1.5 mt-1">
        <SkeletonBar width="120px" height="12px"/>
        <SkeletonBar width="180px" height="10px"/>
      </div>
    </div>);
}
function ListSkeleton() {
    return (<div className="d-flex align-items-center gap-3 py-2 border-bottom border-secondary border-opacity-10">
      <SkeletonBar width="28px" height="28px"/>
      <div className="flex-grow-1 d-flex flex-column gap-1.5">
        <SkeletonBar width="80%" height="12px"/>
        <SkeletonBar width="50%" height="10px"/>
      </div>
    </div>);
}
function ChartSkeleton() {
    return (<div className="bg-dark border border-secondary rounded-3 p-3 h-100 d-flex flex-column gap-3">
      <div className="d-flex align-items-center justify-content-between">
        <div className="d-flex flex-column gap-1.5">
          <SkeletonBar width="150px" height="14px"/>
          <SkeletonBar width="90px" height="10px"/>
        </div>
        <SkeletonBar width="50px" height="16px"/>
      </div>
      <div className="d-flex align-items-end gap-2 mt-4" style={{ height: '140px' }}>
        {[45, 65, 30, 80, 50, 70, 40, 85].map((h, i) => (<div key={i} className="skeleton-bar flex-grow-1" style={{
                height: `${h}%`,
                borderRadius: '2px 2px 0 0',
                opacity: 0.15 + (i * 0.05)
            }}></div>))}
      </div>
    </div>);
}
function TimelineSkeleton() {
    return (<div className="py-2 d-flex flex-column gap-4">
      {[1, 2, 3, 4].map((i) => (<div key={i} className="d-flex gap-3">
          <div className="d-flex flex-column align-items-center">
            <SkeletonBar width="12px" height="12px"/>
            <div className="border-start border-secondary border-opacity-20 flex-grow-1 my-1" style={{ width: '1px', minHeight: '30px' }}></div>
          </div>
          <div className="flex-grow-1 d-flex flex-column gap-2 bg-dark bg-opacity-20 p-3 rounded border border-secondary border-opacity-5">
            <div className="d-flex align-items-center justify-content-between">
              <SkeletonBar width="120px" height="12px"/>
              <SkeletonBar width="60px" height="14px"/>
            </div>
            <SkeletonBar width="80%" height="10px"/>
            <div className="d-flex gap-2 mt-1">
              <SkeletonBar width="60px" height="10px"/>
              <SkeletonBar width="50px" height="10px"/>
            </div>
          </div>
        </div>))}
    </div>);
}
export default function LoadingSkeleton({ type = 'cards', count = 4 }) {
    const renderSkeleton = () => {
        switch (type) {
            case 'cards':
                return (<div className="row g-3">
            {Array.from({ length: count }).map((_, i) => (<div key={i} className="col-xl-4 col-lg-4 col-md-6 col-sm-12">
                <CardSkeleton />
              </div>))}
          </div>);
            case 'list':
                return (<div className="d-flex flex-column gap-2 py-2">
            {Array.from({ length: count }).map((_, i) => (<ListSkeleton key={i}/>))}
          </div>);
            case 'chart':
                return <ChartSkeleton />;
            case 'timeline':
                return <TimelineSkeleton />;
            default:
                return <CardSkeleton />;
        }
    };
    return (<div className="vms-loading-skeleton" role="status" aria-label="Loading Panel">
      {renderSkeleton()}
    </div>);
}
