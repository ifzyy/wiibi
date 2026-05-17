import { useState, useRef, useCallback } from "react";

export default function FeaturedImageUploader({ value, onChange }) {
  const [mode, setMode] = useState("idle"); // idle | url
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const fileRef = useRef(null);

  const applyFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    onChange(url);
    setMode("idle");
    setLoadError(false);
  };

  const applyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) { setUrlError("Please enter a URL."); return; }
    try { new URL(trimmed); } catch { setUrlError("Invalid URL format."); return; }
    onChange(trimmed);
    setUrlInput("");
    setUrlError("");
    setMode("idle");
    setLoadError(false);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) { applyFile(file); return; }
    const url = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain");
    if (url && url.startsWith("http")) { onChange(url); setLoadError(false); }
  }, []);

  const handlePaste = useCallback((e) => {
    const file = e.clipboardData?.files?.[0];
    if (file) { applyFile(file); return; }
    const text = e.clipboardData?.getData("text");
    if (text && text.startsWith("http")) { onChange(text); setLoadError(false); }
  }, []);

  if (value && !loadError) {
    return (
      <div className="relative group rounded-xl overflow-hidden border border-gray-200">
        <img
          src={value}
          alt="Featured"
          className="w-full h-44 object-cover"
          onError={() => setLoadError(true)}
        />
        <div className="absolute inset-0 bg-[#0C0901]/0 group-hover:bg-[#0C0901]/40 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="px-3 py-1.5 bg-white text-gray-800 text-xs font-medium rounded-lg shadow hover:bg-gray-100 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Replace
          </button>
          <button
            type="button"
            onClick={() => { onChange(null); setLoadError(false); }}
            className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg shadow hover:bg-red-600 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Remove
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => applyFile(e.target.files?.[0])} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onPaste={handlePaste}
        tabIndex={0}
        aria-label="Featured image upload area"
        className={`relative w-full h-36 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-all duration-150 cursor-pointer outline-none focus:border-[#FFAA14] ${
          isDragging ? "drop-zone-active border-[#FFAA14] bg-[#FFF3D4]" : "border-gray-200 bg-gray-50 hover:border-[#FFAA14]/60 hover:bg-amber-50/40"
        }`}
        onClick={() => fileRef.current?.click()}
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDragging ? "bg-[#FFAA14]/20" : "bg-gray-100"}`}>
          <svg className={`w-5 h-5 ${isDragging ? "text-[#FFAA14]" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-600">
            {isDragging ? "Drop to upload" : "Click or drag & drop"}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, WebP up to 10MB</p>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => applyFile(e.target.files?.[0])} />
      </div>

      {/* Divider */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-medium">or</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* URL input */}
      {mode === "url" ? (
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <input
              autoFocus
              type="url"
              value={urlInput}
              onChange={(e) => { setUrlInput(e.target.value); setUrlError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyUrl(); } if (e.key === "Escape") setMode("idle"); }}
              placeholder="https://example.com/image.jpg"
              className={`w-full pl-8 pr-3 py-2 text-sm border rounded-lg bg-white ${urlError ? "border-red-400" : "border-gray-300"}`}
            />
          </div>
          <button
            type="button"
            onClick={applyUrl}
            className="px-3 py-2 bg-[#FFAA14] text-[#0C0901] text-sm font-semibold rounded-lg hover:bg-[#e89c12] transition-colors whitespace-nowrap"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => { setMode("idle"); setUrlInput(""); setUrlError(""); }}
            className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setMode("url")}
          className="w-full py-2 text-xs font-medium text-gray-500 hover:text-[#0C0901] border border-gray-200 rounded-lg hover:border-[#FFAA14]/50 transition-colors flex items-center justify-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Paste image URL
        </button>
      )}
      {urlError && <p className="text-xs text-red-500">{urlError}</p>}
      {loadError && value && (
        <p className="text-xs text-red-500">⚠ Could not load image from that URL. Try a different one.</p>
      )}
    </div>
  );
}