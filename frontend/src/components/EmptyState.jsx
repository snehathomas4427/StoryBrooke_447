// reusable empty state card
// shows up when a list has nothing in it like no reviews or no favorites yet
export function EmptyState({ title, description, action = null }) {
  return (
    <div className="card flex flex-col items-center gap-2 border-dashed text-center">
      <h3 className="text-base font-semibold text-brand-800">{title}</h3>
      {description ? (
        <p className="max-w-md text-sm text-brand-600">{description}</p>
      ) : null}
      {action}
    </div>
  );
}
