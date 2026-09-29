// client/src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { apiFetch } from "../services/api";
import NotesModal from "../components/NoteModal"

export default function Dashboard() {
  const [books, setBooks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingBook, setSavingBook] = useState(false);
  
  // Notes Modal state
  const [selectedBookForNotes, setSelectedBookForNotes] = useState(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [noteSearchTerm, setNoteSearchTerm] = useState("");

  // New book form state
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [seriesName, setSeriesName] = useState("");
  const [seriesOrder, setSeriesOrder] = useState("");
  const [status, setStatus] = useState("Want to Read");
  const [totalPages, setTotalPages] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([apiFetch("/books"), apiFetch("/notes")])
      .then(([bookData, noteData]) => {
        if (!cancelled) {
          setBooks(bookData);
          setNotes(noteData);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load books");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleAddBook = async (e) => {
    e.preventDefault();
    setSavingBook(true);
    setError("");
    try {
      const newBook = await apiFetch("/books", {
        method: "POST",
        body: JSON.stringify({
          title,
          author,
          series_name: seriesName,
          series_order: seriesOrder ? parseInt(seriesOrder) : null,
          status,
          current_page: 0,
          total_pages: Number.parseInt(totalPages, 10) || 0,
        }),
      });
      setBooks((currentBooks) => [...currentBooks, newBook]);
      setShowForm(false);
      setTitle("");
      setAuthor("");
      setSeriesName("");
      setSeriesOrder("");
      setStatus("Want to Read");
      setTotalPages("");
    } catch (err) {
      setError(err.message || "Failed to add book");
    } finally {
      setSavingBook(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiFetch(`/books/${id}`, { method: "DELETE" });
      setBooks((currentBooks) => currentBooks.filter((book) => book.id !== id));
    } catch (err) {
      setError(err.message || "Failed to delete book");
    }
  };

  const handleUpdatePages = async (id, newPage, total) => {
    const pageNum = Math.min(Math.max(Number.parseInt(newPage, 10) || 0, 0), total);
    const updatedStatus = pageNum === 0
      ? "Want to Read"
      : pageNum >= total
        ? "Completed"
        : "Currently Reading";

    try {
      const updatedBook = await apiFetch(`/books/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          current_page: pageNum,
          status: updatedStatus,
        }),
      });
      setBooks((currentBooks) =>
        currentBooks.map((book) => (book.id === id ? updatedBook : book))
      );
    } catch (err) {
      setError(err.message || "Failed to update book progress");
    }
  };

  // Filter logic
  const filteredBooks = books.filter((book) => {
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch =
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query) ||
      (book.series_name && book.series_name.toLowerCase().includes(query));

    const matchesStatus =
      filterStatus === "All" || book.status === filterStatus;

    return matchesSearch && matchesStatus;
  });
  const pagesRead = books.reduce((total, book) => total + book.current_page, 0);
  const statusCounts = {
    reading: books.filter((book) => book.status === "Currently Reading").length,
    wanted: books.filter((book) => book.status === "Want to Read").length,
    completed: books.filter((book) => book.status === "Completed").length,
  };
  const noteQuery = noteSearchTerm.toLowerCase().trim();
  const filteredNotes = [...notes]
    .sort((first, second) => Date.parse(second.created_at) - Date.parse(first.created_at))
    .filter((note) => {
      const book = books.find((item) => item.id === note.book_id);
      const searchableText = [
        note.content,
        note.note_type,
        note.chapter_num == null ? "" : `chapter ${note.chapter_num}`,
        book?.title || "",
      ].join(" ").toLowerCase();
      return searchableText.includes(noteQuery);
    });
  const visibleNotes = noteQuery ? filteredNotes : filteredNotes.slice(0, 6);

  if (loading) return <div style={{ padding: "2rem", color: "#fff" }}>Loading your bookshelf...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>My Bookshelf</h2>
        <button onClick={() => setShowForm(!showForm)} style={styles.addBtn}>
          {showForm ? "Cancel" : "+ Add Book"}
        </button>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      <section style={styles.stats} aria-label="Reading summary">
        <div style={styles.stat}><span>Currently reading</span><strong>{statusCounts.reading}</strong></div>
        <div style={styles.stat}><span>Want to read</span><strong>{statusCounts.wanted}</strong></div>
        <div style={styles.stat}><span>Completed</span><strong>{statusCounts.completed}</strong></div>
        <div style={styles.stat}><span>Pages read</span><strong>{pagesRead.toLocaleString()}</strong></div>
      </section>

      {showForm && (
        <form onSubmit={handleAddBook} style={styles.form}>
          <h3>Add New Book</h3>
          <div style={styles.grid}>
            <input
              placeholder="Book Title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={styles.input}
            />
            <input
              placeholder="Author"
              required
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              style={styles.input}
            />
            <input
              placeholder="Series Name (Optional)"
              value={seriesName}
              onChange={(e) => setSeriesName(e.target.value)}
              style={styles.input}
            />
            <input
              type="number"
              min="1"
              placeholder="Series # (Optional)"
              value={seriesOrder}
              onChange={(e) => setSeriesOrder(e.target.value)}
              style={styles.input}
            />
            <input
              type="number"
              min="1"
              placeholder="Total Pages"
              required
              value={totalPages}
              onChange={(e) => setTotalPages(e.target.value)}
              style={styles.input}
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={styles.input}
            >
              <option value="Want to Read">Want to Read</option>
              <option value="Currently Reading">Currently Reading</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <button type="submit" disabled={savingBook} style={styles.submitBtn}>
            {savingBook ? "Saving..." : "Save Book"}
          </button>
        </form>
      )}

      {/* Search and Status Filter Bar */}
      <div style={styles.filterContainer}>
        <input
          type="text"
          placeholder="🔍 Search title, author, or series..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="All">All Statuses</option>
          <option value="Currently Reading">Currently Reading</option>
          <option value="Want to Read">Want to Read</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      <section style={styles.notesSection} aria-labelledby="recent-notes-heading">
        <div style={styles.notesHeading}>
          <h3 id="recent-notes-heading">Recent Notes</h3>
          <input
            type="search"
            aria-label="Search notes by book, chapter, type, or text"
            placeholder="Search notes by book, chapter, type, or text..."
            value={noteSearchTerm}
            onChange={(e) => setNoteSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        {filteredNotes.length === 0 ? (
          <p style={styles.emptyNotes}>
            {notes.length === 0 ? "Your saved notes will appear here." : "No notes match your search."}
          </p>
        ) : (
          <div style={styles.notesList}>
            {visibleNotes.map((note) => {
              const book = books.find((item) => item.id === note.book_id);
              return (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => book && setSelectedBookForNotes(book)}
                  style={styles.noteResult}
                >
                  <span style={styles.noteMeta}>
                    {book?.title || "Book"} · {note.note_type}
                    {note.chapter_num ? ` · Chapter ${note.chapter_num}` : ""}
                  </span>
                  <span style={styles.notePreview}>{note.content}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <div style={styles.bookList}>
        {books.length === 0 ? (
          <p style={styles.emptyState}>Your bookshelf is empty. Add a book to get started!</p>
        ) : filteredBooks.length === 0 ? (
          <p style={styles.emptyState}>No books found matching your search criteria.</p>
        ) : (
          filteredBooks.map((book) => {
            const progressPercent = book.total_pages > 0 
              ? Math.min(100, Math.round((book.current_page / book.total_pages) * 100))
              : 0;

            return (
              <div key={book.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <h3 style={styles.bookTitle}>{book.title}</h3>
                    <p style={styles.author}>by {book.author}</p>
                    {book.series_name && (
                      <p style={styles.series}>
                        {book.series_name} {book.series_order ? `#${book.series_order}` : ""}
                      </p>
                    )}
                  </div>
                  <span style={styles.badge(book.status)}>{book.status}</span>
                </div>

                <div style={{ margin: "1rem 0" }}>
                  <div style={styles.progressBarBg}>
                    <div style={{ ...styles.progressBarFill, width: `${progressPercent}%` }} />
                  </div>
                  <div style={styles.progressText}>
                    <span>Progress: {progressPercent}%</span>
                    <span>{book.current_page} / {book.total_pages} pages</span>
                  </div>
                </div>

                <div style={styles.cardActions}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <label style={{ fontSize: "0.85rem", color: "#e2e8f0" }}>Update Page:</label>
                    <input
                      type="number"
                      min="0"
                      max={book.total_pages}
                      defaultValue={book.current_page}
                      onBlur={(e) => handleUpdatePages(book.id, e.target.value, book.total_pages)}
                      style={styles.pageInput}
                    />
                  </div>
                  
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={() => setSelectedBookForNotes(book)}
                      style={styles.notesBtn}
                    >
                      📝 Notes
                    </button>
                    <button onClick={() => handleDelete(book.id)} style={styles.deleteBtn}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedBookForNotes && (
        <NotesModal
          book={selectedBookForNotes}
          onClose={() => setSelectedBookForNotes(null)}
          onNotesChange={setNotes}
        />
      )}
    </div>
  );
}

const styles = {
  container: { padding: "2rem", maxWidth: "1120px", width: "100%", boxSizing: "border-box", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" },
  addBtn: { backgroundColor: "#3182ce", color: "#fff", border: "none", padding: "0.6rem 1.2rem", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" },
  error: { color: "#fc8181", marginBottom: "1rem" },
  stats: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "1rem", marginBottom: "1.5rem" },
  stat: { display: "flex", flexDirection: "column", gap: "0.35rem", padding: "1rem 1.25rem", backgroundColor: "#2b2b2b", borderBottom: "2px solid #3182ce", borderRadius: "4px", color: "#a0aec0" },
  statValue: { color: "#fff" },
  form: { backgroundColor: "#2b2b2b", padding: "1.5rem", borderRadius: "8px", marginBottom: "1.5rem" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: "1rem", marginBottom: "1rem" },
  input: { padding: "0.75rem", borderRadius: "4px", border: "1px solid #444", backgroundColor: "#1a1a1a", color: "#fff" },
  submitBtn: { width: "100%", padding: "0.75rem", backgroundColor: "#38a169", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" },
  filterContainer: { display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" },
  searchInput: { flex: "2 1 260px", minWidth: 0, padding: "0.65rem 1rem", borderRadius: "6px", border: "1px solid #444", backgroundColor: "#2b2b2b", color: "#fff", fontSize: "0.95rem", boxSizing: "border-box" },
  filterSelect: { flex: "1 1 180px", minWidth: 0, padding: "0.65rem 1rem", borderRadius: "6px", border: "1px solid #444", backgroundColor: "#2b2b2b", color: "#fff", fontSize: "0.95rem", boxSizing: "border-box" },
  notesSection: { margin: "0 0 1.75rem", paddingBottom: "1.5rem", borderBottom: "1px solid #3d3d3d" },
  notesHeading: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginBottom: "0.75rem" },
  notesList: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: "0.75rem" },
  noteResult: { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.35rem", padding: "0.8rem 1rem", textAlign: "left", backgroundColor: "#242424", border: "1px solid #3d3d3d", borderRadius: "4px", color: "#e2e8f0", cursor: "pointer" },
  noteMeta: { color: "#63b3ed", fontSize: "0.8rem" },
  notePreview: { display: "-webkit-box", overflow: "hidden", WebkitBoxOrient: "vertical", WebkitLineClamp: 2 },
  emptyNotes: { color: "#a0aec0", padding: "0.75rem 0" },
  bookList: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 460px), 1fr))", alignItems: "start", gap: "1rem" },
  emptyState: { color: "#a0aec0", textAlign: "center", padding: "2rem 0" },
  card: { backgroundColor: "#2b2b2b", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  bookTitle: { margin: 0, padding: 0, fontSize: "1.25rem", fontWeight: "bold", lineHeight: "1.2", color: "#fff" },
  author: { margin: "0.35rem 0 0 0", padding: 0, color: "#a0aec0", fontSize: "0.95rem" },
  series: { margin: "0.25rem 0 0 0", padding: 0, color: "#63b3ed", fontSize: "0.85rem" },
  badge: (status) => ({
    padding: "0.25rem 0.75rem",
    borderRadius: "12px",
    fontSize: "0.8rem",
    fontWeight: "bold",
    backgroundColor: status === "Completed" ? "#2f855a" : status === "Currently Reading" ? "#2b6cb0" : "#4a5568",
    color: "#fff",
  }),
  progressBarBg: { backgroundColor: "#1a1a1a", borderRadius: "4px", height: "8px", overflow: "hidden" },
  progressBarFill: { backgroundColor: "#3182ce", height: "100%", transition: "width 0.3s ease" },
  progressText: { display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#a0aec0", marginTop: "0.4rem" },
  cardActions: { display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #3d3d3d" },
  pageInput: { width: "70px", padding: "0.4rem", borderRadius: "4px", border: "1px solid #444", backgroundColor: "#1a1a1a", color: "#fff" },
  notesBtn: { backgroundColor: "#4a5568", color: "#fff", border: "none", padding: "0.4rem 0.8rem", borderRadius: "4px", cursor: "pointer" },
  deleteBtn: { backgroundColor: "transparent", color: "#e53e3e", border: "1px solid #e53e3e", padding: "0.4rem 0.8rem", borderRadius: "4px", cursor: "pointer" },
};