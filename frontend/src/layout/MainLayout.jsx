import { Link } from "react-router-dom";

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-900 text-white">

      <nav className="bg-slate-800 p-4 flex justify-between items-center">

        <h1 className="text-2xl font-bold">
          HV Verify
        </h1>

        <div className="flex gap-6">
          <Link to="/">Dashboard</Link>
          <Link to="/admin">Admin</Link>
          <Link to="/results">Results</Link>
        </div>

      </nav>

      <div className="p-6">
        {children}
      </div>

    </div>
  );
}