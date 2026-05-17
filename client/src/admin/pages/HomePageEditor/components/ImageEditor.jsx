/**
 * ImageEditor.jsx
 *
 * Modal overlay that handles the two-step image update flow:
 *   1. User picks a file or pastes a URL
 *   2. On "Apply":
 *        a. POST /admin/upload  →  get mediaId + permanent URL
 *        b. PATCH /admin/sections/:id/media  →  attach to section with role
 *        c. onSuccess(newUrl)  →  parent updates local state
 *
 * This component is responsible for the full backend round-trip.
 * The parent only sees the final URL.
 */

import { useRef, useState } from "react";
import { uploadImageFile, saveExternalImageUrl, attachMediaToSection } from "../api/homepageApi";

/**
 * @param {{
 *   sectionId  : string,
 *   role       : string,   one of the ROLE constants
 *   currentUrl : string | null,
 *   onSuccess  : (newUrl: string) => void,
 *   onClose    : () => void,
 * }} props
 */
const ImageEditor = ({ sectionId, role, currentUrl, onSuccess, onClose }) => {
  const [mode, setMode]           = useState("upload"); // "upload" | "link"
  const [file, setFile]           = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [externalUrl, setExternalUrl] = useState("");
  const [busy, setBusy]           = useState(false);
  const [error, setError]         = useState(null);
  const fileInputRef = useRef(null);

  // ── File selection ────────────────────────────────────────────────────────

  const handleFileChosen = (f) => {
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setError(null);
  };

  // ── Apply: upload → attach → notify parent ────────────────────────────────

  const handleApply = async () => {
    setError(null);
    setBusy(true);
    try {
      let mediaRecord;

      if (mode === "upload") {
        if (!file) throw new Error("Please select an image file first.");
        mediaRecord = await uploadImageFile(file, "homepage");
      } else {
        if (!externalUrl.startsWith("http")) {
          throw new Error("Please enter a valid URL starting with http.");
        }
        mediaRecord = await saveExternalImageUrl(externalUrl);
      }

      // Attach the created media record to this section with the correct role
      await attachMediaToSection(sectionId, mediaRecord.id, role);

      onSuccess(mediaRecord.url);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const previewSrc = previewUrl || (mode === "link" ? externalUrl : null) || currentUrl;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="absolute inset-0 z-20 bg-white/96 backdrop-blur-md flex flex-col items-center justify-center p-8 overflow-y-auto">

      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-6">
        Edit Image — <span className="text-[#FFAA14]">{role}</span>
      </h3>

      {/* Mode toggle */}
      <div className="flex gap-3 mb-8">
        {["upload", "link"].map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(null); }}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition ${
              mode === m
                ? "bg-[#FFAA14] text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {m === "upload" ? "Upload File" : "Paste URL"}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="w-full max-w-md">
        {mode === "upload" ? (
          <label className="block cursor-pointer">
            <div
              className="border-2 border-dashed border-[#FFAA14]/40 rounded-2xl p-10 text-center hover:border-[#FFAA14] hover:bg-amber-50/20 transition"
              onClick={() => fileInputRef.current?.click()}
            >
              {file ? (
                <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
              ) : (
                <>
                  <p className="text-gray-500 text-sm mb-1">Click or drag an image here</p>
                  <p className="text-xs text-gray-400">PNG · JPG · WebP — max 5 MB</p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChosen(e.target.files?.[0])}
            />
          </label>
        ) : (
          <input
            type="url"
            value={externalUrl}
            onChange={(e) => { setExternalUrl(e.target.value); setError(null); }}
            placeholder="https://example.com/image.jpg"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#FFAA14] focus:ring-2 focus:ring-[#FFAA14]/20 text-sm"
          />
        )}
      </div>

      {error && <p className="mt-3 text-sm text-red-500 font-medium">{error}</p>}

      {/* Preview */}
      {previewSrc && (
        <div className="mt-6 w-full max-w-md">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Preview</p>
          <img
            src={previewSrc}
            alt="Preview"
            className="w-full h-52 object-cover rounded-xl shadow border border-gray-100"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        </div>
      )}

      {/* Actions */}
      <div className="mt-8 flex gap-4 w-full max-w-md">
        <button
          onClick={onClose}
          className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-semibold text-sm transition"
        >
          Cancel
        </button>
        <button
          onClick={handleApply}
          disabled={busy}
          className="flex-1 py-3 bg-[#FFAA14] text-white rounded-xl hover:bg-yellow-500 font-semibold text-sm transition disabled:opacity-50"
        >
          {busy ? "Saving…" : "Apply"}
        </button>
      </div>
    </div>
  );
};

export default ImageEditor;
