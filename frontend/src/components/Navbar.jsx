import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Home,
  UserPlus,
  Vote,
  BadgeCheck,
  BarChart3,
  Settings
} from "lucide-react";

function Navbar() {
  const isAdmin = Boolean(localStorage.getItem("adminToken"));

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <Link to="/" className="brand">
          <span className="brand-icon">
            <ShieldCheck size={18} />
          </span>
          <span className="brand-text">HV Verify</span>
          <span className="brand-tag">Election Control</span>
        </Link>

        <div className="nav-links">
          <Link className="nav-link" to="/">
            <Home size={16} />
            Home
          </Link>
          <Link className="nav-link" to="/register">
            <UserPlus size={16} />
            Register
          </Link>
          <Link className="nav-link" to="/vote">
            <Vote size={16} />
            Vote
          </Link>
          <Link className="nav-link" to="/verify">
            <BadgeCheck size={16} />
            Verify
          </Link>
          {isAdmin ? (
            <>
              <Link className="nav-link" to="/results">
                <BarChart3 size={16} />
                Results
              </Link>
              <Link className="nav-link" to="/admin">
                <Settings size={16} />
                Admin
              </Link>
            </>
          ) : (
            <Link className="nav-link" to="/admin-login">
              <Settings size={16} />
              Admin Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;