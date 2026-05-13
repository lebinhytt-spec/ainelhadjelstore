import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = "" }) => {
  return (
    <div className={`animate-pulse bg-muted rounded-xl ${className}`} />
  );
};

export const ProductSkeleton = () => {
    return (
        <div className="bg-card rounded-3xl overflow-hidden border shadow-sm p-4 space-y-4">
            <Skeleton className="aspect-square w-full rounded-2xl" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                    <Skeleton className="w-6 h-6 rounded-full" />
                    <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-3 w-8" />
            </div>
        </div>
    );
}
