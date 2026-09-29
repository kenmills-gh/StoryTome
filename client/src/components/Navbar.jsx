import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar__logo">
        📖 StoryTome
      </Link>
      <div className="navbar__content">
        {user ? (
          <div className="navbar__user">
            <span>Welcome, <strong>{user.username}</strong></span>
            <button onClick={handleLogout} className="navbar__logout">Logout</button>
          </div>
        ) : (
          <div className="navbar__auth-links">
            <Link to="/login" className="navbar__link">Login</Link>
            <Link to="/signup" className="navbar__signup">Sign Up</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
