import { useRef, useState } from "react";

/**
 * FileUploadZone
 * Drag-and-drop + browse upload area.
 *
 * Props:
 *  - onFiles: (files: File[]) => void
 *  - accept: string (e.g. "image/*")
 *  - multiple: boolean
 *  - compact: boolean - renders a smaller variant (for thumbnail)
 *  - label: string
 */
export default function FileUploadZone({
  onFiles,
  accept = "image/*",
  multiple = true,
  compact = false,
  label = "Drop your files here or",
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (onFiles) onFiles(files);
  };

  const handleBrowse = (e) => {
    const files = Array.from(e.target.files);
    if (onFiles) onFiles(files);
    e.target.value = "";
  };

  const zone = compact ? styles.zoneCompact : styles.zone;

  return (
    <div
      style={{
        ...zone,
        ...(dragging ? styles.dragging : {}),
      }}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        style={{ display: "none" }}
        onChange={handleBrowse}
      />
      <UploadIcon size={compact ? 20 : 26} />
      <p style={compact ? styles.labelCompact : styles.label}>
        {label}{" "}
        <span style={styles.browseLink}>Browse</span>
      </p>
    </div>
  );
}

function UploadIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ marginBottom: 6 }}>
      <path d="M12 16V4M12 4L8 8M12 4L16 8" stroke="#aaa" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 20h16" stroke="#aaa" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const styles = {
  zone: {
    border: "1.5px dashed #d0d0d0",
    borderRadius: 10,
    padding: "32px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    background: "#fafafa",
    transition: "border-color 0.2s, background 0.2s",
    textAlign: "center",
  },
  zoneCompact: {
    border: "1.5px dashed #d0d0d0",
    borderRadius: 8,
    padding: "16px 12px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    background: "#fafafa",
    transition: "border-color 0.2s, background 0.2s",
    textAlign: "center",
    minHeight: 80,
  },
  dragging: {
    borderColor: "#F5A623",
    background: "#fffbf3",
  },
  label: {
    fontSize: 13,
    color: "#aaa",
    margin: 0,
  },
  labelCompact: {
    fontSize: 11,
    color: "#aaa",
    margin: 0,
  },
  browseLink: {
    color: "#F5A623",
    textDecoration: "underline",
    cursor: "pointer",
  },
};