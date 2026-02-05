export function SkeletonCard() {
  return (
    <div className="design-card" style={{ pointerEvents: 'none' }}>
      {/* Thumbnail skeleton */}
      <div className="design-card-image">
        <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: 0 }} />
      </div>

      {/* Content */}
      <div className="design-card-content">
        {/* Title skeleton */}
        <div className="skeleton" style={{ height: '1rem', width: '75%', marginBottom: '6px' }} />

        {/* Creator skeleton */}
        <div className="skeleton" style={{ height: '0.875rem', width: '50%', marginBottom: '12px' }} />

        {/* Stats skeleton */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="skeleton" style={{ height: '0.75rem', width: '2.5rem' }} />
          <div className="skeleton" style={{ height: '0.75rem', width: '2.5rem' }} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="gallery-grid">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
