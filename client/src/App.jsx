import { useEffect, useState } from "react";
import { useAuth } from "./context/AuthContext";
import { apiFetch } from "./services/api";

function App() {
  const { user, loading, logout } = useAuth();
  const [books, setBooks] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/books")
      .then((data) => setBooks(data))
      .catch((err) => setError(err.message));
  }, []);

  if (loading) return <div>Loading StoryTome...</div>;

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>StoryTome</h1>
      {user ? (
        <div>
          <p>Logged in as: <strong>{user.username}</strong> ({user.email})</p>
          <button onClick={logout}>Log Out</button>
        </div>
      ) : (
        <p>Not logged in (Demo Mode / Guest)</p>
      )}

      <h2>Seeded Bookshelf</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <ul>
        {books.map((book) => (
          <li key={book.id}>
            <strong>{book.title}</strong> by {book.author} — Status: {book.status} (Page {book.current_page}/{book.total_pages})
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;