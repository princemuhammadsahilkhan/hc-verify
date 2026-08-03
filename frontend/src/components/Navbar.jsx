import { Link } from "react-router-dom";
import { ShieldCheck, Home, UserPlus, Vote, BadgeCheck, BarChart3, Settings, LogIn, Globe } from "lucide-react";
import { useLang, LANGUAGES } from "../context/LangContext";

function Navbar() {
  const isAdmin = Boolean(localStorage.getItem("adminToken"));
  const { lang, t, switchLang } = useLang();

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <Link to="/" className="brand">
          <span className="brand-icon"><ShieldCheck size={18} /></span>
          <span className="brand-text">HVS-STE</span>
          <span className="brand-tag">Election Control</span>
        </Link>

        <div className="nav-links">
          <Link className="nav-link" to="/"><Home size={16} />{t.home}</Link>
          <Link className="nav-link" to="/auth"><UserPlus size={16} />{t.register}</Link>
          <Link className="nav-link" to="/vote"><Vote size={16} />{t.vote}</Link>
          <Link className="nav-link" to="/verify"><BadgeCheck size={16} />{t.verify}</Link>
          {isAdmin ? (
            <>
              <Link className="nav-link" to="/results"><BarChart3 size={16} />{t.results}</Link>
              <Link className="nav-link" to="/admin"><Settings size={16} />{t.admin}</Link>
            </>
          ) : (
            <Link className="nav-link" to="/admin-login"><Settings size={16} />{t.adminLogin}</Link>
          )}

        </div>
      </div>
    </nav>
  );
}

export default Navbar;
