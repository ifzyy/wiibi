import { useState } from "react";

/**
 * FileList
 * Displays a grid of uploaded files with delete option.
 * Props:
 *  - files: Array<{ id, name, size, url? }>
 *  - onRemove: (id) => void
 *  - onUploadMore: () => void
 */
export default function FileList({ files = [], onRemove, onUploadMore }) {
  return (
    <div>
      <div style={styles.header}>
        <span style={styles.count}>
          Upload Project Images <strong>{files.length}</strong>
        </span>
        <button style={styles.uploadMoreBtn} onClick={onUploadMore}>
          <UploadIcon /> Upload Files
        </button>
      </div>

      {files.length > 0 && (
        <div style={styles.grid}>
          {files.map((file) => (
            <FileRow key={file.id} file={file} onRemove={() => onRemove(file.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function FileRow({ file, onRemove }) {
  return (
    <div style={styles.row}>
      <div style={styles.rowLeft}>
        <FileIcon />
        <div style={styles.fileInfo}>
          <span style={styles.fileName}>{file.name}</span>
          <span style={styles.fileSize}>{formatSize(file.size)}</span>
        </div>
      </div>
      <button style={styles.deleteBtn} onClick={onRemove}>
        <TrashIcon />
      </button>
    </div>
  );
}

function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

function FileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <rect x="2" y="1" width="10" height="14" rx="2" stroke="#aaa" strokeWidth="1.2" />
      <path d="M5 5h6M5 8h6M5 11h3" stroke="#aaa" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 3.5h10M5.5 3.5V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M4 3.5l.667 8h4.666L10 3.5" stroke="#e53e3e" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: 5 }}>
      <path d="M7 9V2M7 2L4 5M7 2l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 12h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  count: {
    fontSize: 13,
    color: "#555",
  },
  uploadMoreBtn: {
    background: "none",
    border: "none",
    color: "#555",
    fontSize: 12,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    fontFamily: "inherit",
    padding: "4px 8px",
    borderRadius: 6,
    border: "1px solid #ddd",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 6,
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "7px 10px",
    background: "#fafafa",
    borderRadius: 7,
    border: "1px solid #eee",
  },
  rowLeft: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    overflow: "hidden",
  },
  fileInfo: {
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  fileName: {
    fontSize: 12,
    color: "#333",
    fontWeight: 500,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 120,
  },
  fileSize: {
    fontSize: 10,
    color: "#F5A623",
  },
  deleteBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 4,
    flexShrink: 0,
  },
};