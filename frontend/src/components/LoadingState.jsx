export function LoadingState({ label = "Loading..." }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-brand-500">
      <span className="h-3 w-3 animate-ping rounded-full bg-brand-400" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
