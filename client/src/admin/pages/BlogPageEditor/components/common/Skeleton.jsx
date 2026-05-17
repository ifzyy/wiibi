import React from 'react';

export const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-stone-100 rounded-xl ${className}`} />
);

export const PageSkeleton = () => (
  <main className="bg-white min-h-screen pt-10">
    <header className="max-w-7xl mx-auto px-6 pt-16 pb-12 space-y-4">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-14 w-64 rounded-2xl" />
    </header>
    
    <div className="border border-stone-100 mb-10" />
    
    <section className="max-w-7xl mx-auto px-6 pb-32">
      <div className="grid md:grid-cols-2 gap-x-12 gap-y-16">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="aspect-[16/10] w-full rounded-[2rem]" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-3/4 rounded-xl" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </section>
  </main>
);