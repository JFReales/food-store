interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse rounded-md bg-stone-200 ${className}`} />;
}

interface SkeletonGrillaProps {
  cantidad: number;
}

// Placeholder con la forma de las tarjetas del catálogo mientras carga.
export function SkeletonGrilla({ cantidad }: SkeletonGrillaProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy="true">
      {Array.from({ length: cantidad }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-stone-200 bg-white">
          <Skeleton className="h-40 rounded-none" />
          <div className="flex flex-col gap-2 p-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="mt-2 h-9 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
