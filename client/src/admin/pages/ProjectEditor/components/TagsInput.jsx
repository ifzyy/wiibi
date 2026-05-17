import { useState } from "react";

/**
 * TagsInput
 * Manages a list of tags with add/remove functionality.
 *
 * Props:
 *  - tags: string[]
 *  - onChange: (tags: string[]) => void
 */
export default function TagsInput({ tags = [], onChange }) {
  const [input, setInput] = useState("");
  const [showInput, setShowInput] = useState(false);

  const addTag = () => {
    const val = input.trim();
    if (val && !tags.includes(val)) {
      onChange([...tags, val]);
    }
    setInput("");
    setShowInput(false);
  };

  const removeTag = (tag) => {
    onChange(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") addTag();
    if (e.key === "Escape") setShowInput(false);
  };

  return (
    <div>
      <p style={styles.label}>Tags</p>
      <div style={styles.tagRow}>
        {tags.map((tag) => (
          <span key={tag} style={styles.tag}>
            {tag}
            <button style={styles.tagRemove} onClick={() => removeTag(tag)}>×</button>
          </span>
        ))}

        {showInput ? (
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={addTag}
            style={styles.tagInput}
            placeholder="Add tag..."
          />
        ) : (
          <button style={styles.addBtn} onClick={() => setShowInput(true)} title="Add tag">
            <PlusCircleIcon />
          </button>
        )}
      </div>
    </div>
  );
}

function PlusCircleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" stroke="#555" strokeWidth="1.4" />
      <path d="M10 6v8M6 10h8" stroke="#555" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

const styles = {
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "#888",
    margin: "0 0 8px 0",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  tagRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
  },
  tag: {
    background: "#f0f0f0",
    border: "1px solid #ddd",
    borderRadius: 20,
    padding: "3px 10px 3px 10px",
    fontSize: 12,
    color: "#444",
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  tagRemove: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#999",
    fontSize: 14,
    padding: 0,
    lineHeight: 1,
  },
  addBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    display: "flex",
    alignItems: "center",
    color: "#555",
  },
  tagInput: {
    border: "1px solid #F5A623",
    borderRadius: 20,
    padding: "3px 10px",
    fontSize: 12,
    outline: "none",
    fontFamily: "inherit",
    width: 90,
  },
};