import { useState } from "react";
import ContentEditor from "./ContentEditor";

/**
 * SectionBlock
 * A named content section within the project editor.
 * Can hold rich text and image slots.
 *
 * Props:
 *  - section: { id, label, content, images }
 *  - onChange: (updated) => void
 *  - onRemove: () => void
 */
export default function SectionBlock({ section, onChange, onRemove }) {
  const [label, setLabel] = useState(section.label || "Section");

  const handleLabelChange = (e) => {
    setLabel(e.target.value);
    onChange({ ...section, label: e.target.value });
  };

  const handleContentChange = (html) => {
    onChange({ ...section, content: html });
  };

  return (
    <div style={styles.wrap}>
      {/* Section Header */}
      <div style={styles.header}>
        <input
          value={label}
          onChange={handleLabelChange}
          style={styles.labelInput}
          placeholder="Section name..."
        />
        <button style={styles.removeBtn} onClick={onRemove} title="Remove section">
          <CrossIcon />
        </button>
      </div>

      {/* Content Editor */}
      <ContentEditor
        value={section.content || ""}
        onChange={handleContentChange}
      />

      {/* Add Buttons */}
      <div style={styles.addRow}>
        <AddButton icon={<TextIcon />} label="Text" onClick={() => {}} />
        <AddButton icon={<ImageIcon />} label="Image" onClick={() => {}} />
      </div>
    </div>
  );
}

function AddButton({ icon, label, onClick }) {
  return (
    <button style={styles.addBtn} onClick={onClick}>
      {icon}
      <span style={styles.addPlus}>+</span>
    </button>
  );
}

function CrossIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M1 1l10 10M11 1L1 11" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function TextIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 4h12M2 8h8M2 12h10" stroke="#555" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="2" width="14" height="12" rx="2" stroke="#555" strokeWidth="1.3" />
      <circle cx="5.5" cy="6" r="1.2" fill="#555" />
      <path d="M1 11l4-3 3 3 2-2 5 4" stroke="#555" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const styles = {
  wrap: {
    marginBottom: 16,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 8,
  },
  labelInput: {
    border: "1px solid #e0e0e0",
    borderRadius: 6,
    padding: "5px 10px",
    fontSize: 13,
    fontFamily: "inherit",
    fontWeight: 600,
    color: "#333",
    background: "#fff",
    outline: "none",
    width: "auto",
    minWidth: 100,
  },
  removeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 4,
    borderRadius: 5,
    display: "flex",
    alignItems: "center",
  },
  addRow: {
    display: "flex",
    gap: 8,
    marginTop: 10,
  },
  addBtn: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    background: "#f5f5f5",
    border: "1px solid #e8e8e8",
    borderRadius: 7,
    padding: "6px 12px",
    cursor: "pointer",
    fontSize: 13,
    color: "#555",
    fontFamily: "inherit",
  },
  addPlus: {
    fontSize: 16,
    color: "#F5A623",
    fontWeight: 700,
    lineHeight: 1,
  },
};