export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10" aria-busy="true">
      <div className="skeleton mb-6 h-4 w-64" />
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="skeleton aspect-square rounded-lg" />
        <div className="space-y-5">
          <div className="skeleton h-4 w-32" />
          <div className="skeleton h-10 w-3/4" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-5/6" />
          <div className="mt-6 space-y-3">
            <div className="skeleton h-11 w-full rounded-xl" />
            <div className="skeleton h-11 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}