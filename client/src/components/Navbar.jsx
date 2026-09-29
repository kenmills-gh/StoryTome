import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav style={styles.nav}>
      <Link to="/dashboard" style={styles.logo}>
        📖 StoryTome
      </Link>
      <div>
        {user ? (
          <div style={styles.userSection}>
            <span>Welcome, <strong>{user.username}</strong></span>
            <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
          </div>
        ) : (
          <div style={styles.authLinks}>
            <Link to="/login" style={styles.link}>Login</Link>
            <Link to="/signup" style={styles.signupBtn}>Sign Up</Link>
          </div>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 2rem", backgroundColor: "#2b2b2b", borderBottom: "1px solid #333" },
  logo: { fontSize: "1.5rem", fontWeight: "bold", color: "#fff", textDecoration: "none" },
  userSection: { display: "flex", alignItems: "center", gap: "1rem" },
  logoutBtn: { backgroundColor: "#e53e3e", color: "#fff", border: "none", padding: "0.5rem 1rem", borderRadius: "4px", cursor: "pointer" },
  authLinks: { display: "flex", gap: "1rem", alignItems: "center" },
  link: { color: "#fff", textDecoration: "none" },
  signupBtn: { backgroundColor: "#3182ce", color: "#fff", padding: "0.5rem 1rem", borderRadius: "4px", textDecoration: "none" }
};