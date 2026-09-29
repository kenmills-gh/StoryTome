import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";

// Protected Route Guard
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading session...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <Router>
      <div style={{ minHeight: "100vh", backgroundColor: "#1a1a1a", color: "#f1f1f1" }}>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;