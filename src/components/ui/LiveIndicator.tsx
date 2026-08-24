export default function LiveIndicator() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
      <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
      Live
    </div>
  );
}