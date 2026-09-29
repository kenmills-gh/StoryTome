// client/src/components/NotesModal.jsx
import { useState, useEffect } from "react";
import { apiFetch } from "../services/api";

export default function NotesModal({ book, onClose }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // New Note state
  const [chapterNum, setChapterNum] = useState("");
  const [noteType, setNoteType] = useState("Chapter Note");
  const [content, setContent] = useState("");

  useEffect(() => {
    fetchNotes();
  }, [book.id]);

  const fetchNotes = async () => {
    try {
      const data = await apiFetch(`/notes?book_id=${book.id}`);
      setNotes(data);
    } catch (err) {
      setError(err.message || "Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      const newNote = await apiFetch("/notes", {
        method: "POST",
        body: JSON.stringify({
          book_id: book.id,
          chapter_num: chapterNum ? parseInt(chapterNum) : null,
          note_type: noteType,
          content: content,
        }),
      });
      setNotes([...notes, newNote]);
      setContent("");
      setChapterNum("");
      setNoteType("Chapter Note");
    } catch (err) {
      setError(err.message || "Failed to create note");
    }
  };

  const handleDeleteNote = async (id) => {
    try {
      await apiFetch(`/notes/${id}`, { method: "DELETE" });
      setNotes(notes.filter((n) => n.id !== id));
    } catch (err) {
      setError(err.message || "Failed to delete note");
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2>Notes for <em>{book.title}</em></h2>
          <button onClick={onClose} style={styles.closeBtn}>&times;</button>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        {/* Add Note Form */}
        <form onSubmit={handleAddNote} style={styles.form}>
          <div style={styles.formRow}>
            <input
              type="number"
              placeholder="Chapter #"
              value={chapterNum}
              onChange={(e) => setChapterNum(e.target.value)}
              style={styles.chapterInput}
            />
            <select
              value={noteType}
              onChange={(e) => setNoteType(e.target.value)}
              style={styles.select}
            >
              <option value="Chapter Note">Chapter Note</option>
              <option value="Character Log">Character Log</option>
              <option value="Quote">Quote</option>
              <option value="Theory">Theory</option>
            </select>
          </div>
          <textarea
            placeholder="Write your note, theory, or quote here..."
            required
            rows="3"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={styles.textarea}
          />
          <button type="submit" style={styles.addBtn}>Add Note</button>
        </form>

        {/* Notes List */}
        <div style={styles.notesList}>
          {loading ? (
            <p>Loading notes...</p>
          ) : notes.length === 0 ? (
            <p style={{ color: "#a0aec0" }}>No notes recorded for this book yet.</p>
          ) : (
            notes.map((note) => (
              <div key={note.id} style={styles.noteCard}>
                <div style={styles.noteHeader}>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <span style={styles.badge}>{note.note_type}</span>
                    {note.chapter_num && (
                      <span style={styles.chapterTag}>Ch. {note.chapter_num}</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    style={styles.deleteBtn}
                  >
                    Delete
                  </button>
                </div>
                <p style={styles.noteContent}>{note.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.75)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modal: { backgroundColor: "#2b2b2b", width: "90%", maxWidth: "650px", maxHeight: "85vh", borderRadius: "8px", padding: "1.5rem", display: "flex", flexDirection: "column", boxShadow: "0 4px 20px rgba(0,0,0,0.5)" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #444", paddingBottom: "1rem", marginBottom: "1rem" },
  closeBtn: { background: "none", border: "none", color: "#fff", fontSize: "1.8rem", cursor: "pointer" },
  error: { color: "#fc8181", marginBottom: "1rem" },
  form: { display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem", backgroundColor: "#1a1a1a", padding: "1rem", borderRadius: "6px" },
  formRow: { display: "flex", gap: "0.75rem" },
  chapterInput: { width: "145px", padding: "0.5rem", borderRadius: "4px", border: "1px solid #444", backgroundColor: "#2b2b2b", color: "#fff" },
  select: { flex: 1, padding: "0.5rem", borderRadius: "4px", border: "1px solid #444", backgroundColor: "#2b2b2b", color: "#fff" },
  textarea: { width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #444", backgroundColor: "#2b2b2b", color: "#fff", resize: "vertical" },
  addBtn: { backgroundColor: "#3182ce", color: "#fff", border: "none", padding: "0.5rem 1rem", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" },
  notesList: { overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem", paddingRight: "0.5rem" },
  noteCard: { backgroundColor: "#1a1a1a", padding: "1rem", borderRadius: "6px", borderLeft: "3px solid #3182ce" },
  noteHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" },
  badge: { backgroundColor: "#2b6cb0", color: "#fff", padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "bold" },
  chapterTag: { color: "#a0aec0", fontSize: "0.8rem" },
  noteContent: { margin: 0, color: "#e2e8f0", lineHeight: "1.4", whiteSpace: "pre-wrap" },
  deleteBtn: { backgroundColor: "transparent", color: "#e53e3e", border: "none", cursor: "pointer", fontSize: "0.8rem" }
};