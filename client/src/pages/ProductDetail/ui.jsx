// ── Shared primitives ─────────────────────────────────────────────────────────

export const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

export const StarRating = ({ rating, max = 5, size = "md" }) => {
  const sizes = { sm: "text-sm", md: "text-base", lg: "text-xl" };
  return (
    <div className={`flex gap-0.5 ${sizes[size]}`}>
      {Array.from({ length: max }, (_, i) => {
        const filled  = i < Math.floor(rating);
        const partial = !filled && i < rating;
        return (
          <span key={i} className="relative inline-block">
            <span className="text-gray-200">★</span>
            {(filled || partial) && (
              <span
                className="absolute inset-0 overflow-hidden text-[#FFAA14]"
                style={partial ? { width: `${(rating % 1) * 100}%` } : {}}
              >
                ★
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
};

export const SpecCell = ({ label, value }) => (
  <div className="bg-gray-50 rounded-xl p-4">
    <p className="text-[11px] text-gray-400 font-medium mb-1">{label}</p>
    <p className="text-sm font-bold text-gray-900">{value}</p>
  </div>
);
