// client/src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { apiFetch } from "../services/api";
import NotesModal from "../components/NoteModal";
import "./Dashboard.css";

const statusClassNames = {
  Completed: "book-card__status--completed",
  "Currently Reading": "book-card__status--reading",
  "Want to Read": "book-card__status--wanted",
};

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

  if (loading) return <div className="dashboard-loading">Loading your bookshelf...</div>;

  return (
    <main className="dashboard">
      <div className="dashboard__header">
        <h2>My Bookshelf</h2>
        <button className="button button--primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Add Book"}
        </button>
      </div>

      {error && <p className="dashboard__error" role="alert">{error}</p>}

      <section className="reading-stats" aria-label="Reading summary">
        <div className="reading-stats__item"><span>Currently reading</span><strong>{statusCounts.reading}</strong></div>
        <div className="reading-stats__item"><span>Want to read</span><strong>{statusCounts.wanted}</strong></div>
        <div className="reading-stats__item"><span>Completed</span><strong>{statusCounts.completed}</strong></div>
        <div className="reading-stats__item"><span>Pages read</span><strong>{pagesRead.toLocaleString()}</strong></div>
      </section>

      {showForm && (
        <form onSubmit={handleAddBook} className="book-form">
          <h3>Add New Book</h3>
          <div className="book-form__grid">
            <input
              placeholder="Book Title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="dashboard-input"
            />
            <input
              placeholder="Author"
              required
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="dashboard-input"
            />
            <input
              placeholder="Series Name (Optional)"
              value={seriesName}
              onChange={(e) => setSeriesName(e.target.value)}
              className="dashboard-input"
            />
            <input
              type="number"
              min="1"
              placeholder="Series # (Optional)"
              value={seriesOrder}
              onChange={(e) => setSeriesOrder(e.target.value)}
              className="dashboard-input"
            />
            <input
              type="number"
              min="1"
              placeholder="Total Pages"
              required
              value={totalPages}
              onChange={(e) => setTotalPages(e.target.value)}
              className="dashboard-input"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="dashboard-input"
            >
              <option value="Want to Read">Want to Read</option>
              <option value="Currently Reading">Currently Reading</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <button type="submit" disabled={savingBook} className="button button--save">
            {savingBook ? "Saving..." : "Save Book"}
          </button>
        </form>
      )}

      {/* Search and Status Filter Bar */}
      <div className="dashboard-filters">
        <input
          type="text"
          placeholder="🔍 Search title, author, or series..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="dashboard-input dashboard-input--search"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="dashboard-input dashboard-input--filter"
        >
          <option value="All">All Statuses</option>
          <option value="Currently Reading">Currently Reading</option>
          <option value="Want to Read">Want to Read</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      <section className="recent-notes" aria-labelledby="recent-notes-heading">
        <div className="recent-notes__heading">
          <h3 id="recent-notes-heading">Recent Notes</h3>
          <input
            type="search"
            aria-label="Search notes by book, chapter, type, or text"
            placeholder="Search notes by book, chapter, type, or text..."
            value={noteSearchTerm}
            onChange={(e) => setNoteSearchTerm(e.target.value)}
            className="dashboard-input dashboard-input--search-notes"
          />
        </div>
        {filteredNotes.length === 0 ? (
          <p className="recent-notes__empty">
            {notes.length === 0 ? "Your saved notes will appear here." : "No notes match your search."}
          </p>
        ) : (
          <div className="recent-notes__list">
            {visibleNotes.map((note) => {
              const book = books.find((item) => item.id === note.book_id);
              return (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => book && setSelectedBookForNotes(book)}
                  className="recent-notes__item"
                >
                  <span className="recent-notes__meta">
                    {book?.title || "Book"} · {note.note_type}
                    {note.chapter_num ? ` · Chapter ${note.chapter_num}` : ""}
                  </span>
                  <span className="recent-notes__preview">{note.content}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <div className="book-list">
        {books.length === 0 ? (
          <p className="book-list__empty">Your bookshelf is empty. Add a book to get started!</p>
        ) : filteredBooks.length === 0 ? (
          <p className="book-list__empty">No books found matching your search criteria.</p>
        ) : (
          filteredBooks.map((book) => {
            const progressPercent = book.total_pages > 0 
              ? Math.min(100, Math.round((book.current_page / book.total_pages) * 100))
              : 0;

            return (
              <article key={book.id} className="book-card">
                <div className="book-card__header">
                  <div>
                    <h3 className="book-card__title">{book.title}</h3>
                    <p className="book-card__author">by {book.author}</p>
                    {book.series_name && (
                      <p className="book-card__series">
                        {book.series_name} {book.series_order ? `#${book.series_order}` : ""}
                      </p>
                    )}
                  </div>
                  <span className={`book-card__status ${statusClassNames[book.status] || ""}`}>
                    {book.status}
                  </span>
                </div>

                <div className="book-card__progress">
                  <div className="book-card__progress-track">
                    <div className="book-card__progress-fill" style={{ width: `${progressPercent}%` }} />
                  </div>
                  <div className="book-card__progress-text">
                    <span>Progress: {progressPercent}%</span>
                    <span>{book.current_page} / {book.total_pages} pages</span>
                  </div>
                </div>

                <div className="book-card__actions">
                  <div className="book-card__page-update">
                    <label htmlFor={`book-page-${book.id}`}>Update Page:</label>
                    <input
                      id={`book-page-${book.id}`}
                      type="number"
                      min="0"
                      max={book.total_pages}
                      defaultValue={book.current_page}
                      onBlur={(e) => handleUpdatePages(book.id, e.target.value, book.total_pages)}
                      className="dashboard-input book-card__page-input"
                    />
                  </div>
                  
                  <div className="book-card__buttons">
                    <button
                      onClick={() => setSelectedBookForNotes(book)}
                      className="button button--secondary"
                    >
                      📝 Notes
                    </button>
                    <button onClick={() => handleDelete(book.id)} className="button button--delete">
                      Delete
                    </button>
                  </div>
                </div>
              </article>
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
    </main>
  );
}
