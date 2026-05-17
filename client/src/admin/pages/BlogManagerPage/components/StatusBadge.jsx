export default function StatusBadge({ status }) {
  const isPublished = status === "published";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm text-xs font-medium tracking-wide uppercase ${
        isPublished
          ? "bg-black text-white"
          : "bg-gray-100 text-gray-600 border border-gray-300"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${isPublished ? "bg-[#FFAA14]" : "bg-gray-400"}`}
      />
      {status}
    </span>
  );
}