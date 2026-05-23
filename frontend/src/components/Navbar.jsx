import { Link } from "react-router-dom";
import { ShieldCheck, Home, UserPlus, Vote, BadgeCheck, BarChart3, Settings } from "lucide-react";
import { useLang, LANGUAGES } from "../context/LangContext";

function Navbar() {
  const isAdmin = Boolean(localStorage.getItem("adminToken"));
  const { lang, t, switchLang } = useLang();

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <Link to="/" className="brand">
          <span className="brand-icon"><ShieldCheck size={18} /></span>
          <span className="brand-text">HV Verify</span>
          <span className="brand-tag">Election Control</span>
        </Link>

        <div className="nav-links">
          <Link className="nav-link" to="/"><Home size={16} />{t.home}</Link>
          <Link className="nav-link" to="/register"><UserPlus size={16} />{t.register}</Link>
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

          {/* Language switcher */}
          <div style={{ display: "flex", gap: 4, marginLeft: 8 }}>
            {Object.entries(LANGUAGES).map(([code, meta]) => (
              <button
                key={code}
                onClick={() => switchLang(code)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: lang === code ? "var(--primary)" : "transparent",
                  color: lang === code ? "#fff" : "var(--text)",
                  fontWeight: lang === code ? 700 : 400,
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {meta.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
