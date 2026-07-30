export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-surface-light border-t-primary rounded-full animate-spin" />
        <span className="text-white/60 text-sm">Loading...</span>
      </div>
    </div>
  );
}
