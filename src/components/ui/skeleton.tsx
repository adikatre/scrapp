import {cn} from "@/lib/utils";

function Skeleton({className, ...props}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

const SVGSkeleton = ({className, ...props}: React.ComponentProps<"svg">) => (
  <svg className={className + " animate-pulse rounded bg-gray-300"} {...props} />
);

export {Skeleton, SVGSkeleton};
