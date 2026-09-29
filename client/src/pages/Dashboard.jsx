// client/src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { apiFetch } from "../services/api";
import NotesModal from "../components/NoteModal"

export default function Dashboard() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Notes Modal state
  const [selectedBookForNotes, setSelectedBookForNotes] = useState(null);

  // New book form state
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [seriesName, setSeriesName] = useState("");
  const [seriesOrder, setSeriesOrder] = useState("");
  const [status, setStatus] = useState("Want to Read");
  const [totalPages, setTotalPages] = useState("");

  const fetchBooks = async () => {
    try {
      const data = await apiFetch("/books");
      setBooks(data);
    } catch (err) {
      setError(err.message || "Failed to load books");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleAddBook = async (e) => {
    e.preventDefault();
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
          total_pages: parseInt(totalPages) || 0,
        }),
      });
      setBooks([...books, newBook]);
      setShowForm(false);
      setTitle("");
      setAuthor("");
      setSeriesName("");
      setSeriesOrder("");
      setStatus("Want to Read");
      setTotalPages("");
    } catch (err) {
      setError(err.message || "Failed to add book");
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiFetch(`/books/${id}`, { method: "DELETE" });
      setBooks(books.filter((b) => b.id !== id));
    } catch (err) {
      setError(err.message || "Failed to delete book");
    }
  };

  const handleUpdatePages = async (id, newPage, total) => {
    const pageNum = parseInt(newPage) || 0;
    let updatedStatus = status;
    if (pageNum >= total && total > 0) updatedStatus = "Completed";
    else if (pageNum > 0) updatedStatus = "Currently Reading";

    try {
      const updatedBook = await apiFetch(`/books/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          current_page: pageNum,
          status: updatedStatus,
        }),
      });
      setBooks(books.map((b) => (b.id === id ? updatedBook : b)));
    } catch (err) {
      setError(err.message || "Failed to update book progress");
    }
  };

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
              placeholder="Series # (Optional)"
              value={seriesOrder}
              onChange={(e) => setSeriesOrder(e.target.value)}
              style={styles.input}
            />
            <input
              type="number"
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
          <button type="submit" style={styles.submitBtn}>Save Book</button>
        </form>
      )}

      <div style={styles.bookList}>
        {books.length === 0 ? (
          <p>Your bookshelf is empty. Add a book to get started!</p>
        ) : (
          books.map((book) => {
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
                    <label style={{ fontSize: "0.85rem" }}>Update Page:</label>
                    <input
                      type="number"
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
        />
      )}
    </div>
  );
}

const styles = {
  container: { padding: "2rem", maxWidth: "900px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" },
  addBtn: { backgroundColor: "#3182ce", color: "#fff", border: "none", padding: "0.6rem 1.2rem", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" },
  error: { color: "#fc8181", marginBottom: "1rem" },
  form: { backgroundColor: "#2b2b2b", padding: "1.5rem", borderRadius: "8px", marginBottom: "2rem" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" },
  input: { padding: "0.75rem", borderRadius: "4px", border: "1px solid #444", backgroundColor: "#1a1a1a", color: "#fff" },
  submitBtn: { width: "100%", padding: "0.75rem", backgroundColor: "#38a169", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" },
  bookList: { display: "flex", flexDirection: "column", gap: "1rem" },
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
  cardActions: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #3d3d3d" },
  pageInput: { width: "70px", padding: "0.4rem", borderRadius: "4px", border: "1px solid #444", backgroundColor: "#1a1a1a", color: "#fff" },
  notesBtn: { backgroundColor: "#4a5568", color: "#fff", border: "none", padding: "0.4rem 0.8rem", borderRadius: "4px", cursor: "pointer" },
  deleteBtn: { backgroundColor: "transparent", color: "#e53e3e", border: "1px solid #e53e3e", padding: "0.4rem 0.8rem", borderRadius: "4px", cursor: "pointer" },
};