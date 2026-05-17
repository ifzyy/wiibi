import { useRef, useState } from "react";

/**
 * ContentEditor
 * Rich text editing area with formatting toolbar.
 * Uses contentEditable for the editor area.
 *
 * Props:
 *  - value: string (HTML)
 *  - onChange: (html: string) => void
 */
export default function ContentEditor({ value = "", onChange }) {
  const editorRef = useRef(null);
  const [wordCount, setWordCount] = useState(0);

  const execCmd = (cmd, val = null) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
  };

  const handleInput = () => {
    const html = editorRef.current?.innerHTML || "";
    const text = editorRef.current?.innerText || "";
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
    if (onChange) onChange(html);
  };

  return (
    <div style={styles.wrap}>
      {/* Toolbar */}
      <div style={styles.toolbar}>
        <ToolGroup>
          <ToolBtn title="H1" onClick={() => execCmd("formatBlock", "h1")}><b>H1</b></ToolBtn>
          <ToolBtn title="H2" onClick={() => execCmd("formatBlock", "h2")}><b>H2</b></ToolBtn>
          <ToolBtn title="H3" onClick={() => execCmd("formatBlock", "h3")}><b>H3</b></ToolBtn>
        </ToolGroup>
        <Divider />
        <ToolGroup>
          <ToolBtn title="Bold" onClick={() => execCmd("bold")}><b>B</b></ToolBtn>
          <ToolBtn title="Italic" onClick={() => execCmd("italic")}><i>I</i></ToolBtn>
          <ToolBtn title="Underline" onClick={() => execCmd("underline")}><u>U</u></ToolBtn>
          <ToolBtn title="Strikethrough" onClick={() => execCmd("strikeThrough")}><s>S</s></ToolBtn>
        </ToolGroup>
        <Divider />
        <ToolGroup>
          <ToolBtn title="Ordered List" onClick={() => execCmd("insertOrderedList")}>
            <ListOlIcon />
          </ToolBtn>
          <ToolBtn title="Bullet List" onClick={() => execCmd("insertUnorderedList")}>
            <ListUlIcon />
          </ToolBtn>
        </ToolGroup>
        <Divider />
        <ToolGroup>
          <ToolBtn title="Align Left" onClick={() => execCmd("justifyLeft")}><AlignLeftIcon /></ToolBtn>
          <ToolBtn title="Align Center" onClick={() => execCmd("justifyCenter")}><AlignCenterIcon /></ToolBtn>
        </ToolGroup>
        <Divider />
        <ToolGroup>
          <ToolBtn title="Undo" onClick={() => execCmd("undo")}><UndoIcon /></ToolBtn>
          <ToolBtn title="Redo" onClick={() => execCmd("redo")}><RedoIcon /></ToolBtn>
        </ToolGroup>

        <span style={styles.wordCount}>{wordCount} words</span>
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        style={styles.editor}
        data-placeholder="Start writing your content here..."
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </div>
  );
}

function ToolGroup({ children }) {
  return <div style={{ display: "flex", gap: 0 }}>{children}</div>;
}

function Divider() {
  return <div style={{ width: 1, background: "#eee", margin: "0 6px", height: 20, alignSelf: "center" }} />;
}

function ToolBtn({ title, onClick, children }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={styles.toolBtn}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
    >
      {children}
    </button>
  );
}

function ListOlIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3h8M5 7h8M5 11h8" stroke="#555" strokeWidth="1.3" strokeLinecap="round"/><text x="0" y="4" fontSize="4" fill="#555">1.</text><text x="0" y="8" fontSize="4" fill="#555">2.</text><text x="0" y="12" fontSize="4" fill="#555">3.</text></svg>;
}
function ListUlIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="2" cy="3" r="1" fill="#555"/><circle cx="2" cy="7" r="1" fill="#555"/><circle cx="2" cy="11" r="1" fill="#555"/><path d="M5 3h8M5 7h8M5 11h8" stroke="#555" strokeWidth="1.3" strokeLinecap="round"/></svg>;
}
function AlignLeftIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 3h12M1 6h8M1 9h10M1 12h6" stroke="#555" strokeWidth="1.3" strokeLinecap="round"/></svg>;
}
function AlignCenterIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 3h12M3 6h8M2 9h10M4 12h6" stroke="#555" strokeWidth="1.3" strokeLinecap="round"/></svg>;
}
function UndoIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7a5 5 0 105 -5H5l-3 3 3 3" stroke="#555" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function RedoIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M12 7a5 5 0 10-5 -5H9l3 3-3 3" stroke="#555" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

const styles = {
  wrap: {
    border: "1.5px solid #e8e8e8",
    borderRadius: 10,
    overflow: "hidden",
    background: "#fff",
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: 2,
    padding: "6px 10px",
    borderBottom: "1.5px solid #eee",
    background: "#fafafa",
    flexWrap: "wrap",
  },
  toolBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px 6px",
    borderRadius: 5,
    fontSize: 12,
    color: "#555",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 28,
    height: 28,
  },
  editor: {
    minHeight: 160,
    padding: "16px 18px",
    fontSize: 14,
    color: "#222",
    outline: "none",
    lineHeight: 1.65,
    fontFamily: "inherit",
  },
  wordCount: {
    marginLeft: "auto",
    fontSize: 11,
    color: "#bbb",
  },
};