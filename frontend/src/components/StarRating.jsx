// star rating widgets
// display version is read only and shows half stars
// input version lets the user click to pick a 1 to 5 rating

import { useState } from "react";

// one star svg can be filled empty or half filled using a gradient trick
function Star({ filled, half = false, className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`h-5 w-5 ${className}`}
    >
      <defs>
        <linearGradient id="halfGradient">
          <stop offset="50%" stopColor="currentColor" />
          <stop offset="50%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.5l2.95 6.6 7.05.7-5.3 4.95 1.55 7.25L12 18.4l-6.25 3.6L7.3 14.75 2 9.8l7.05-.7L12 2.5z"
        fill={half ? "url(#halfGradient)" : filled ? "currentColor" : "transparent"}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StarRatingDisplay({ value = 0, size = "md" }) {
  const numeric = Number(value) || 0;
  const sizeClass = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5";
  return (
    <div className="flex items-center text-brand-400">
      {[1, 2, 3, 4, 5].map((slot) => {
        const filled = numeric >= slot;
        const half = !filled && numeric >= slot - 0.5;
        return <Star key={slot} filled={filled} half={half} className={sizeClass} />;
      })}
    </div>
  );
}

// clickable star input
// hovered overrides value so the user gets a preview before committing
export function StarRatingInput({ value, onChange, disabled = false }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value || 0;
  return (
    <div
      className="flex items-center gap-1 text-brand-400"
      onMouseLeave={() => setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map((slot) => (
        <button
          key={slot}
          type="button"
          disabled={disabled}
          aria-label={`Rate ${slot} star${slot > 1 ? "s" : ""}`}
          onMouseEnter={() => setHovered(slot)}
          onClick={() => onChange?.(slot)}
          className="transition hover:scale-110 disabled:cursor-not-allowed"
        >
          <Star filled={display >= slot} className="h-7 w-7" />
        </button>
      ))}
      {value ? (
        <span className="ml-2 text-sm font-medium text-brand-700">{value} / 5</span>
      ) : (
        <span className="ml-2 text-sm text-brand-400">Tap to rate</span>
      )}
    </div>
  );
}
