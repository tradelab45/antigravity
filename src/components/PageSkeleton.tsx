import React from 'react';

type SkeletonPage = 'markets' | 'portfolio' | 'academy';

const Block = ({ className = '' }: { className?: string }) => (
  <div className={`rounded-lg bg-slate-200 dark:bg-slate-700 motion-safe:animate-pulse ${className}`} />
);

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="min-w-0 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-6">{children}</div>
);

/** Matches each route's layout while its code downloads; no fake figures or progress. */
export function PageSkeleton({ page }: { page: SkeletonPage }) {
  const label = { markets: 'Markets', portfolio: 'Portfolio', academy: 'Academy' }[page];
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="min-w-0 space-y-6">
      <span className="sr-only">Loading {label}…</span>
      <div aria-hidden="true" className="space-y-6">
        <Card>
          <Block className="h-7 w-2/3 max-w-sm" />
          <Block className="h-4 w-5/6 max-w-xl" />
          {page === 'markets' ? <><Block className="h-11 w-full" /><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Block key={i} className="h-11" />)}</div></> :
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{Array.from({ length: 3 }, (_, i) => <Block key={i} className={page === 'portfolio' ? 'h-20' : 'h-11'} />)}</div>}
        </Card>
        {page === 'markets' ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => <Card key={i}><Block className="h-10 w-2/3" /><Block className="h-8 w-1/2" /><Block className="h-4 w-full" /><div className="grid grid-cols-2 gap-3"><Block className="h-16" /><Block className="h-16" /></div><Block className="h-11 w-full" /></Card>)}
          </div>
        ) : page === 'academy' ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <Card>{Array.from({ length: 5 }, (_, i) => <Block key={i} className="h-16" />)}</Card>
            <Card><Block className="h-8 w-4/5" />{Array.from({ length: 9 }, (_, i) => <Block key={i} className={`h-4 ${i % 3 === 2 ? 'w-3/4' : 'w-full'}`} />)}</Card>
          </div>
        ) : (
          <Card><Block className="h-7 w-1/3" /><Block className="h-52 w-full sm:h-64" />{Array.from({ length: 3 }, (_, i) => <Block key={i} className="h-14 w-full" />)}</Card>
        )}
      </div>
    </div>
  );
}
