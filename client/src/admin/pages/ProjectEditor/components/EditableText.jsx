import { useState, useRef, useEffect } from "react";

/**
 * EditableText
 * A reusable inline-editable text component.
 * Renders as styled text; clicking enters edit mode.
 *
 * Props:
 *  - value: string
 *  - onChange: (newValue: string) => void
 *  - placeholder: string
 *  - style: CSSProperties (overrides for the text display)
 *  - inputStyle: CSSProperties (overrides for the input)
 *  - tag: 'input' | 'textarea' (default: 'input')
 *  - multiline: boolean
 */
export default function EditableText({
  value,
  onChange,
  placeholder = "Click to edit...",
  style = {},
  inputStyle = {},
  multiline = false,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const inputRef = useRef(null);

  useEffect(() => {
    setDraft(value || "");
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current.select) inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (onChange) onChange(draft);
  };

  const handleKeyDown = (e) => {
    if (!multiline && e.key === "Enter") {
      e.preventDefault();
      commit();
    }
    if (e.key === "Escape") {
      setDraft(value || "");
      setEditing(false);
    }
  };

  const baseInputStyle = {
    border: "1.5px solid #F5A623",
    borderRadius: 6,
    padding: "4px 8px",
    fontSize: "inherit",
    fontFamily: "inherit",
    fontWeight: "inherit",
    color: "inherit",
    background: "#fffdf7",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    resize: multiline ? "vertical" : "none",
    ...inputStyle,
  };

  const baseTextStyle = {
    cursor: "text",
    borderRadius: 6,
    padding: "4px 8px",
    display: "inline-block",
    minWidth: 60,
    color: value ? "#111" : "#bbb",
    transition: "background 0.15s",
    ...style,
  };

  if (editing) {
    const props = {
      ref: inputRef,
      value: draft,
      onChange: (e) => setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: handleKeyDown,
      placeholder,
      style: baseInputStyle,
    };
    return multiline ? <textarea {...props} rows={3} /> : <input {...props} />;
  }

  return (
    <span
      style={baseTextStyle}
      onClick={() => setEditing(true)}
      title="Click to edit"
      onMouseEnter={(e) => (e.currentTarget.style.background = "#fdf6ec")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {value || <span style={{ color: "#bbb", fontWeight: 400 }}>{placeholder}</span>}
    </span>
  );
}