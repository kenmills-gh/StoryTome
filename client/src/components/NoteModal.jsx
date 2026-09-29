// client/src/components/NotesModal.jsx
import { useState, useEffect } from "react";
import { apiFetch } from "../services/api";

export default function NotesModal({ book, onClose, onNotesChange }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState(null);
  const [editChapterNum, setEditChapterNum] = useState("");
  const [editNoteType, setEditNoteType] = useState("Chapter Note");
  const [editContent, setEditContent] = useState("");

  // New Note state
  const [chapterNum, setChapterNum] = useState("");
  const [noteType, setNoteType] = useState("Chapter Note");
  const [content, setContent] = useState("");

  const publishNotes = (updatedNotes) => {
    setNotes(updatedNotes);
    onNotesChange?.(updatedNotes);
  };

  useEffect(() => {
    let cancelled = false;
    apiFetch(`/notes?book_id=${book.id}`)
      .then((data) => {
        if (!cancelled) setNotes(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load notes");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [book.id]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setAddingNote(true);
    setError("");
    try {
      const newNote = await apiFetch("/notes", {
        method: "POST",
        body: JSON.stringify({
          book_id: book.id,
          chapter_num: chapterNum ? Number.parseInt(chapterNum, 10) : null,
          note_type: noteType,
          content,
        }),
      });
      publishNotes([...notes, newNote]);
      setContent("");
      setChapterNum("");
      setNoteType("Chapter Note");
    } catch (err) {
      setError(err.message || "Failed to create note");
    } finally {
      setAddingNote(false);
    }
  };

  const startEditing = (note) => {
    setEditingNoteId(note.id);
    setEditChapterNum(note.chapter_num ?? "");
    setEditNoteType(note.note_type);
    setEditContent(note.content);
    setError("");
  };

  const handleSaveEdit = async (e, noteId) => {
    e.preventDefault();
    if (!editContent.trim()) return;

    setSavingEdit(true);
    setError("");
    try {
      const updatedNote = await apiFetch(`/notes/${noteId}`, {
        method: "PATCH",
        body: JSON.stringify({
          chapter_num: editChapterNum ? Number.parseInt(editChapterNum, 10) : null,
          note_type: editNoteType,
          content: editContent,
        }),
      });
      publishNotes(notes.map((note) => (note.id === noteId ? updatedNote : note)));
      setEditingNoteId(null);
    } catch (err) {
      setError(err.message || "Failed to update note");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteNote = async (id) => {
    if (!window.confirm("Delete this note? This action cannot be undone.")) return;

    setDeletingNoteId(id);
    setError("");
    try {
      await apiFetch(`/notes/${id}`, { method: "DELETE" });
      publishNotes(notes.filter((note) => note.id !== id));
      if (editingNoteId === id) setEditingNoteId(null);
    } catch (err) {
      setError(err.message || "Failed to delete note");
    } finally {
      setDeletingNoteId(null);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal} role="dialog" aria-modal="true" aria-labelledby="notes-modal-title">
        <div style={styles.header}>
          <h2 id="notes-modal-title">Notes for <em>{book.title}</em></h2>
          <button onClick={onClose} style={styles.closeBtn} aria-label="Close notes">&times;</button>
        </div>

        {error && <p style={styles.error} role="alert">{error}</p>}

        {/* Add Note Form */}
        <form onSubmit={handleAddNote} style={styles.form}>
          <div style={styles.formRow}>
            <input
              type="number"
              min="1"
              aria-label="Chapter number"
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
              <option value="Chapter Recap">Chapter Recap</option>
              <option value="Character Log">Character Log</option>
              <option value="Character Note">Character Note</option>
              <option value="Quote">Quote</option>
              <option value="Theory">Theory</option>
            </select>
          </div>
          <textarea
            placeholder="Write your note, theory, or quote here..."
            aria-label="Note content"
            required
            rows="3"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={styles.textarea}
          />
          <button type="submit" disabled={addingNote} style={styles.addBtn}>
            {addingNote ? "Saving..." : "Add Note"}
          </button>
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
                {editingNoteId === note.id ? (
                  <form onSubmit={(e) => handleSaveEdit(e, note.id)} style={styles.editForm}>
                    <div style={styles.formRow}>
                      <input
                        type="number"
                        min="1"
                        aria-label="Edit chapter number"
                        placeholder="Chapter #"
                        value={editChapterNum}
                        onChange={(e) => setEditChapterNum(e.target.value)}
                        style={styles.chapterInput}
                      />
                      <select
                        aria-label="Edit note type"
                        value={editNoteType}
                        onChange={(e) => setEditNoteType(e.target.value)}
                        style={styles.select}
                      >
                        <option value="Chapter Note">Chapter Note</option>
                        <option value="Chapter Recap">Chapter Recap</option>
                        <option value="Character Log">Character Log</option>
                        <option value="Character Note">Character Note</option>
                        <option value="Quote">Quote</option>
                        <option value="Theory">Theory</option>
                      </select>
                    </div>
                    <textarea
                      aria-label="Edit note content"
                      required
                      rows="3"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      style={styles.textarea}
                    />
                    <div style={styles.editActions}>
                      <button type="submit" disabled={savingEdit} style={styles.addBtn}>
                        {savingEdit ? "Saving..." : "Save changes"}
                      </button>
                      <button type="button" onClick={() => setEditingNoteId(null)} style={styles.cancelBtn}>
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div style={styles.noteHeader}>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <span style={styles.badge}>{note.note_type}</span>
                        {note.chapter_num && (
                          <span style={styles.chapterTag}>Ch. {note.chapter_num}</span>
                        )}
                      </div>
                      <div style={styles.noteActions}>
                        <button onClick={() => startEditing(note)} style={styles.editBtn}>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          disabled={deletingNoteId === note.id}
                          style={styles.deleteBtn}
                        >
                          {deletingNoteId === note.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                    <p style={styles.noteContent}>{note.content}</p>
                  </>
                )}
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
  editForm: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  editActions: { display: "flex", gap: "0.5rem" },
  formRow: { display: "flex", gap: "0.75rem" },
  chapterInput: { width: "145px", padding: "0.5rem", borderRadius: "4px", border: "1px solid #444", backgroundColor: "#2b2b2b", color: "#fff" },
  select: { flex: 1, padding: "0.5rem", borderRadius: "4px", border: "1px solid #444", backgroundColor: "#2b2b2b", color: "#fff" },
  textarea: { width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #444", backgroundColor: "#2b2b2b", color: "#fff", resize: "vertical" },
  addBtn: { backgroundColor: "#3182ce", color: "#fff", border: "none", padding: "0.5rem 1rem", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" },
  cancelBtn: { backgroundColor: "#4a5568", color: "#fff", border: "none", padding: "0.5rem 1rem", borderRadius: "4px", cursor: "pointer" },
  notesList: { overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem", paddingRight: "0.5rem" },
  noteCard: { backgroundColor: "#1a1a1a", padding: "1rem", borderRadius: "6px", borderLeft: "3px solid #3182ce" },
  noteHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" },
  noteActions: { display: "flex", alignItems: "center", gap: "0.75rem" },
  editBtn: { backgroundColor: "transparent", color: "#63b3ed", border: "none", cursor: "pointer", fontSize: "0.8rem" },
  badge: { backgroundColor: "#2b6cb0", color: "#fff", padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "bold" },
  chapterTag: { color: "#a0aec0", fontSize: "0.8rem" },
  noteContent: { margin: 0, color: "#e2e8f0", lineHeight: "1.4", whiteSpace: "pre-wrap" },
  deleteBtn: { backgroundColor: "transparent", color: "#e53e3e", border: "none", cursor: "pointer", fontSize: "0.8rem" }
};