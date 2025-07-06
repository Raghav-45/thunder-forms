export default function SkeletonPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 pt-16 md:p-10 pb-16">
      <div className="animate-pulse delay-0 space-y-1 md:space-y-1.5">
        <div className="animate-pulse delay-0 h-8 md:h-12 bg-neutral-700 rounded w-1/3 md:w-1/5"></div>
        <div className="animate-pulse delay-700 h-4 bg-neutral-700 rounded w-1/2 md:w-1/3"></div>
      </div>
      <div className="space-y-4 md:space-y-9">
        <div className="animate-pulse delay-0 grid w-full items-center gap-2 md:gap-3">
          <div className="animate-pulse delay-0 h-4 bg-neutral-700 rounded w-1/4"></div>
          <div className="animate-pulse delay-700 h-8 bg-neutral-700 rounded w-full"></div>
        </div>
        <div className="animate-pulse delay-500 grid w-full items-center gap-2 md:gap-3">
          <div className="animate-pulse delay-0 h-4 bg-neutral-700 rounded w-1/4"></div>
          <div className="animate-pulse delay-700 h-8 bg-neutral-700 rounded w-full"></div>
        </div>
        <div className="animate-pulse delay-1000 grid w-full items-center pt-4 md:pt-0 gap-2 md:gap-3">
          <div className="animate-pulse delay-1000 h-10 bg-neutral-700 rounded w-32"></div>
        </div>
      </div>
    </div>
  )
}
