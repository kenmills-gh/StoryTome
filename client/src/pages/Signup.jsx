import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await signup(username, email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Signup failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <h2>Create Account</h2>
        {error && <p style={styles.error} role="alert">{error}</p>}

        <div style={styles.inputGroup}>
          <label htmlFor="signup-username">Username</label>
          <input
            id="signup-username"
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
          />
        </div>

        <div style={styles.inputGroup}>
          <label htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />
        </div>

        <div style={styles.inputGroup}>
          <label htmlFor="signup-password">Password</label>
          <input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
        </div>

        <button type="submit" disabled={isSubmitting} style={styles.button}>
          {isSubmitting ? "Creating account..." : "Sign Up"}
        </button>
        <p style={{ marginTop: "1rem", textAlign: "center" }}>
          Already have an account? <Link to="/login" style={{ color: "#63b3ed" }}>Login</Link>
        </p>
      </form>
    </div>
  );
}

const styles = {
  container: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" },
  card: { backgroundColor: "#2b2b2b", padding: "2rem", borderRadius: "8px", width: "100%", maxWidth: "400px", boxShadow: "0 4px 6px rgba(0,0,0,0.3)" },
  inputGroup: { marginBottom: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" },
  input: { padding: "0.75rem", borderRadius: "4px", border: "1px solid #444", backgroundColor: "#1a1a1a", color: "#fff" },
  button: { width: "100%", padding: "0.75rem", borderRadius: "4px", backgroundColor: "#38a169", color: "#fff", border: "none", cursor: "pointer", fontWeight: "bold" },
  error: { color: "#fc8181", marginBottom: "1rem" }
};