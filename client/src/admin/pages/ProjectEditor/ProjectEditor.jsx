import { useRef, useState } from "react";
import EditableText from "./components/EditableText";
import FileUploadZone from "./components/FileUploadZone";
import FileList from "./components/FileList";
import ContentEditor from "./components/ContentEditor";
import TagsInput from "./components/TagsInput";

let fileIdCounter = 1;

const FIXED_SECTIONS = [
  { key: "overview",   label: "Overview" },
  { key: "problem",    label: "Problem" },
  { key: "solution",   label: "Solution" },
  { key: "results",    label: "Results" },
  { key: "conclusion", label: "Conclusion" },
];

export default function ProjectEditor({ initialData = {}, onBack, onPublish, saving = false }) {
  const [title,    setTitle]    = useState(initialData.title    || "");
  const [year,     setYear]     = useState(initialData.year     || new Date().getFullYear());
  const [files,    setFiles]    = useState(initialData.files    || []);
  const [tags,     setTags]     = useState(initialData.tags     || []);
  const [fields,   setFields]   = useState({
    overview:   initialData.overview   || "",
    problem:    initialData.problem    || "",
    solution:   initialData.solution   || "",
    results:    initialData.results    || "",
    conclusion: initialData.conclusion || "",
  });

  const fileInputRef = useRef(null);

  const handleFilesAdded = (newFiles) => {
    const mapped = newFiles.map((f) => ({
      id:    fileIdCounter++,
      name:  f.name,
      size:  f.size,
      url:   URL.createObjectURL(f),
      _file: f, // keep real File object for upload
    }));
    setFiles((prev) => [...prev, ...mapped]);
  };

  const removeFile = (id) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const handleFieldChange = (key, html) => {
    setFields((prev) => ({ ...prev, [key]: html }));
  };

  const handlePublish = () => {
    if (onPublish) onPublish({ title, year, files, tags, ...fields });
  };

  const hasContent = title.trim().length > 0;

  return (
    <div style={styles.page}>
      {/* Top Bar */}
      <div style={styles.topBar}>
        <EditableText
          value={title}
          onChange={setTitle}
          placeholder="Enter Project Name"
          style={styles.titleText}
          inputStyle={styles.titleInput}
        />
        <div style={styles.topActions}>
          <button style={styles.previewBtn} onClick={onBack}>
            Cancel
          </button>
          <button
            style={{
              ...styles.publishBtn,
              ...(!hasContent || saving ? styles.publishBtnDisabled : {}),
            }}
            onClick={hasContent && !saving ? handlePublish : undefined}
            disabled={!hasContent || saving}
          >
            {saving ? "Saving…" : "Publish Now"}
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={styles.body}>
        {/* Main */}
        <div style={styles.main}>

          {/* Year */}
          <div style={styles.yearRow}>
            <span style={styles.yearLabel}>Year</span>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              style={styles.yearInput}
            />
          </div>

          {/* Images */}
          <div style={{ marginBottom: 28 }}>
            <p style={styles.sectionLabel}>Project Images</p>
            {files.length === 0 ? (
              <FileUploadZone onFiles={handleFilesAdded} multiple />
            ) : (
              <>
                <FileList
                  files={files}
                  onRemove={removeFile}
                  onUploadMore={() => fileInputRef.current?.click()}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => handleFilesAdded(Array.from(e.target.files))}
                />
              </>
            )}
          </div>

          {/* Fixed content sections */}
          {FIXED_SECTIONS.map(({ key, label }) => (
            <div key={key} style={styles.fieldBlock}>
              <p style={styles.sectionLabel}>{label}</p>
              <ContentEditor
                value={fields[key]}
                onChange={(html) => handleFieldChange(key, html)}
              />
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <div style={styles.sideSection}>
            <TagsInput tags={tags} onChange={setTags} />
          </div>
        </aside>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: "28px 36px",
    background: "#fff",
    minHeight: "100vh",
    fontFamily: "'DM Sans', sans-serif",
    boxSizing: "border-box",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  titleText: {
    fontSize: 18,
    fontWeight: 700,
    color: "#111",
    padding: "6px 10px",
    border: "1px solid #e0e0e0",
    borderRadius: 7,
    display: "inline-block",
    minWidth: 220,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: 700,
  },
  topActions: {
    display: "flex",
    gap: 10,
  },
  previewBtn: {
    background: "#111",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "9px 20px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  publishBtn: {
    background: "#F5A623",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "9px 20px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  publishBtnDisabled: {
    background: "#f5d79b",
    cursor: "not-allowed",
  },
  body: {
    display: "grid",
    gridTemplateColumns: "1fr 220px",
    gap: 32,
    alignItems: "start",
  },
  main: {
    minWidth: 0,
  },
  yearRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  yearLabel: {
    fontSize: 13,
    color: "#888",
    fontWeight: 500,
  },
  yearInput: {
    border: "1px solid #e0e0e0",
    borderRadius: 6,
    padding: "4px 8px",
    fontSize: 13,
    color: "#555",
    outline: "none",
    width: 70,
    fontFamily: "inherit",
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: "#555",
    margin: "0 0 8px 0",
  },
  fieldBlock: {
    marginBottom: 24,
  },
  sidebar: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
    position: "sticky",
    top: 24,
  },
  sideSection: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
};