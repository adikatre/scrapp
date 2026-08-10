export default function Loading() {
  return (
    <div className="mx-auto min-h-screen max-w-6xl px-5 pb-28 pt-24 sm:px-8">
      <div className="h-12 w-2/3 animate-pulse rounded-xl bg-muted" />
      <div className="mt-5 h-6 w-1/2 animate-pulse rounded-lg bg-muted" />
      <div className="mt-12 space-y-4">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-24 animate-pulse rounded-[14px] bg-muted" />
        ))}
      </div>
    </div>
  );
}
