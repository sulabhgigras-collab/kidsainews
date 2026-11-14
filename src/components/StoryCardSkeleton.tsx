import { motion } from "framer-motion";

const StoryCardSkeleton = ({ index }: { index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    className="bg-card border-3 border-foreground/20 rounded-2xl overflow-hidden shadow-md"
    style={{ boxShadow: "4px 4px 0px hsl(var(--foreground) / 0.1)" }}
  >
    {/* Image placeholder */}
    <div className="w-full h-48 bg-muted animate-pulse" />

    <div className="p-4 space-y-3">
      {/* Category badge */}
      <div className="flex items-center gap-2">
        <div className="h-5 w-16 bg-muted rounded-full animate-pulse" />
        <div className="h-4 w-24 bg-muted/60 rounded animate-pulse" />
      </div>

      {/* Title */}
      <div className="space-y-2">
        <div className="h-6 w-full bg-muted rounded animate-pulse" />
        <div className="h-6 w-3/4 bg-muted rounded animate-pulse" />
      </div>

      {/* Summary */}
      <div className="space-y-1.5">
        <div className="h-4 w-full bg-muted/70 rounded animate-pulse" />
        <div className="h-4 w-5/6 bg-muted/70 rounded animate-pulse" />
        <div className="h-4 w-2/3 bg-muted/70 rounded animate-pulse" />
      </div>

      {/* Source line */}
      <div className="flex items-center gap-2 pt-2">
        <div className="h-3 w-20 bg-muted/50 rounded animate-pulse" />
        <div className="h-3 w-32 bg-muted/50 rounded animate-pulse" />
      </div>
    </div>
  </motion.div>
);

const StorySkeletonGrid = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
    {Array.from({ length: count }).map((_, i) => (
      <StoryCardSkeleton key={i} index={i} />
    ))}
  </div>
);

export { StoryCardSkeleton, StorySkeletonGrid };
export default StorySkeletonGrid;
