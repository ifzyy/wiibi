import { Skeleton } from './ui.jsx';

const ProductDetailSkeleton = () => (
  <div className="bg-white min-h-screen">
    <div className="max-w-6xl mx-auto px-6 py-10">
      <Skeleton className="h-4 w-24 mb-10" />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-16 mb-16">
        {/* Images */}
        <div className="flex gap-4">
          <div className="flex flex-col gap-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="w-[130px] h-[130px] rounded-2xl" />
            ))}
          </div>
          <div className="flex-1 flex flex-col gap-3">
            <Skeleton className="flex-1 aspect-square rounded-3xl" />
            <div className="flex justify-between px-1">
              <Skeleton className="h-8 w-20 rounded-full" />
              <div className="flex gap-1.5">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="w-2 h-2 rounded-full" />)}
              </div>
              <div className="flex gap-2">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="w-8 h-8 rounded-full" />
              </div>
            </div>
          </div>
        </div>
        {/* Info */}
        <div className="space-y-5">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded" />
            <Skeleton className="h-6 w-16 rounded" />
          </div>
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-12 w-48" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-full rounded" />)}
          </div>
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-14 flex-1 rounded-xl" />
            <Skeleton className="h-14 w-40 rounded-xl" />
          </div>
        </div>
      </div>
      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200 mb-10">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-36 rounded-none" />)}
      </div>
      {/* Tab content */}
      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  </div>
);

export default ProductDetailSkeleton;
