import React, { useRef, useState } from "react";
import { COLORS, RADIUS } from "../constants";
import { useImageUpload } from "../hooks/useImageUpload";
import { Icon, Spinner, inputBaseStyle } from "./Primitives";

const ROLE_COLOR = {
  main:    COLORS.amber,
  gallery: COLORS.purple,
};

const ROLE_LABEL = {
  main:    "FEATURED",
  gallery: "GALLERY",
};

// ─────────────────────────────────────────────────────────────────────────────
// ModeToggle — file vs URL switch
// ─────────────────────────────────────────────────────────────────────────────
const ModeToggle = ({ mode, onSelect }) => (
  <div style={{ display: "flex", gap: 6 }} role="group" aria-label="Image source">
    {[
      { id: "file", icon: "upload", label: "Upload File" },
      { id: "url",  icon: "link",   label: "Paste URL"   },
    ].map(({ id, icon, label }) => (
      <button
        key={id}
        type="button"
        aria-pressed={mode === id}
        onClick={() => onSelect(id)}
        style={{
          padding: "6px 12px",
          borderRadius: RADIUS.sm,
          fontSize: 11,
          fontWeight: 700,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 5,
          border: "1.5px solid",
          ...(mode === id
            ? { background: COLORS.ink,   color: COLORS.amber,    borderColor: COLORS.ink     }
            : { background: COLORS.white, color: COLORS.textSec,  borderColor: COLORS.border  }
          ),
        }}
      >
        <Icon name={icon} size={11} />
        {label}
      </button>
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// DropZone — drag-and-drop + click-to-browse
// ─────────────────────────────────────────────────────────────────────────────
const DropZone = ({ roleColor, uploading, onFile }) => {
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  };

  return (
    <div
      role="button"
      tabIndex={uploading ? -1 : 0}
      aria-label="Drop image here or click to browse"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !uploading && fileRef.current?.click()}
      onKeyDown={(e) => e.key === "Enter" && !uploading && fileRef.current?.click()}
      style={{
        border: `2px dashed ${dragOver ? roleColor : COLORS.borderMid}`,
        background: dragOver ? COLORS.warnBg : COLORS.cardBg,
        borderRadius: RADIUS.lg,
        cursor: uploading ? "not-allowed" : "pointer",
        padding: "20px 16px",
        textAlign: "center",
        transition: "all 0.2s",
      }}
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />
      {uploading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <Spinner size={28} color={roleColor} />
          <p style={{ color: COLORS.textSec, fontSize: 12, fontWeight: 600, margin: 0 }}>Uploading…</p>
        </div>
      ) : (
        <>
          <div style={{ width: 36, height: 36, background: roleColor, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
            <Icon name="upload" size={16} style={{ color: COLORS.ink }} />
          </div>
          <p style={{ color: COLORS.ink, fontSize: 13, fontWeight: 600, margin: "0 0 2px" }}>
            Drop image here or click to browse
          </p>
          <p style={{ color: COLORS.textMuted, fontSize: 11, margin: 0 }}>
            JPEG · PNG · WebP · GIF · SVG — max 5MB
          </p>
        </>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// UrlInput — paste an external URL
// ─────────────────────────────────────────────────────────────────────────────
const UrlInput = ({ roleColor, uploading, onSubmit }) => {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (value.trim()) onSubmit(value.trim());
  };

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        placeholder="https://example.com/product-image.jpg"
        disabled={uploading}
        aria-label="Image URL"
        style={{ ...inputBaseStyle, flex: 1 }}
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={uploading || !value.trim()}
        style={{
          padding: "0 16px",
          background: uploading || !value.trim() ? COLORS.borderMid : roleColor,
          color: COLORS.ink,
          border: "none",
          borderRadius: RADIUS.md,
          fontWeight: 700,
          fontSize: 12,
          cursor: uploading || !value.trim() ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          gap: 5,
          whiteSpace: "nowrap",
        }}
      >
        {uploading ? <Spinner size={14} /> : <Icon name="check" size={13} />}
        Add
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ImagePreviewRow — shows the uploaded image with a remove button
// ─────────────────────────────────────────────────────────────────────────────
const ImagePreviewRow = ({ src, role, onClear }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 12,
    background: COLORS.cardBg,
    border: `1.5px solid ${COLORS.border}`,
    borderRadius: RADIUS.lg,
    padding: "10px 12px",
  }}>
    <div style={{ position: "relative", flexShrink: 0 }}>
      <img
        src={src}
        alt="Preview"
        style={{ width: 70, height: 70, objectFit: "cover", borderRadius: RADIUS.md, border: `2px solid ${COLORS.border}`, display: "block" }}
        onError={(e) => (e.target.style.display = "none")}
      />
      <div style={{ position: "absolute", top: -6, left: -6, background: ROLE_COLOR[role], borderRadius: 4, padding: "1px 5px", border: "1.5px solid #fff" }}>
        <p style={{ color: COLORS.ink, fontSize: 8, fontWeight: 800, margin: 0 }}>{ROLE_LABEL[role]}</p>
      </div>
    </div>

    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ color: COLORS.ink, fontSize: 12, fontWeight: 700, margin: "0 0 2px" }}>
        {role === "main" ? "Featured image ready ✓" : "Gallery image ready ✓"}
      </p>
      <p style={{ color: COLORS.textMuted, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
        {src}
      </p>
    </div>

    <button
      type="button"
      onClick={onClear}
      aria-label="Remove image"
      style={{
        width: 28, height: 28,
        borderRadius: "50%",
        background: COLORS.dangerBg,
        color: COLORS.danger,
        border: `1.5px solid ${COLORS.dangerLight}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      <Icon name="x" size={12} />
    </button>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// ImageUploadField — composes the above into the complete upload experience
// ─────────────────────────────────────────────────────────────────────────────
export const ImageUploadField = ({ token, currentImageUrl, role = "main", entityId = null, onUploadComplete, onClear }) => {
  const [mode, setMode] = useState("file");
  const roleColor       = ROLE_COLOR[role] ?? COLORS.amber;

  const { previewSrc, uploading, upload, clear } = useImageUpload({
    token,
    currentImageUrl,
    role,
    entityId,
    onUploadComplete,
    onClear,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <ModeToggle mode={mode} onSelect={setMode} />

      {mode === "file" && (
        <DropZone roleColor={roleColor} uploading={uploading} onFile={upload} />
      )}

      {mode === "url" && (
        <UrlInput roleColor={roleColor} uploading={uploading} onSubmit={upload} />
      )}

      {previewSrc && (
        <ImagePreviewRow src={previewSrc} role={role} onClear={clear} />
      )}
    </div>
  );
};