import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

/**
 * Placeholder shown while expert cards load. Replaces a bare centered spinner so
 * the layout doesn't jump and the wait feels faster (perceived performance).
 */
const ExpertCardSkeleton = () => (
  <Card className="flex flex-col h-full">
    <CardContent className="p-5 flex-1 space-y-3">
      <div className="flex items-start gap-3">
        <Skeleton className="w-11 h-11 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <div className="space-y-1.5 pt-1">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-3 w-2/5" />
      </div>
    </CardContent>
    <CardFooter className="p-5 pt-0">
      <div className="flex gap-2 w-full">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 flex-1" />
      </div>
    </CardFooter>
  </Card>
);

export const ExpertGridSkeleton = ({ count = 8 }: { count?: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <ExpertCardSkeleton key={i} />
    ))}
  </div>
);

export default ExpertCardSkeleton;
