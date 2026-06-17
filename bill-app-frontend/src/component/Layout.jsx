import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
} from "react-router-dom";
import { useEffect, useState } from "react";
// ---------- Layout with Top Navbar ----------
function Layout({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loggedUser = JSON.parse(localStorage.getItem("user"));
    setUser(loggedUser);
  }, []);
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg p-4">
        <img src="/binjwalogo.png" alt="binjwa it solutions" />
        <ul className="space-y-6 pt-10">
          <li>
            <Link to="/dashboard" className="hover:text-blue-500">
              Dashboard
            </Link>
          </li>
          <li>
            <Link to="/clients" className="hover:text-blue-500">
              Clients
            </Link>
          </li>
          <li>
            <Link to="/create" className="hover:text-blue-500">
              Create Invoice
            </Link>
          </li>
          <li>
            <Link to="/invoices" className="hover:text-blue-500">
              Invoices
            </Link>
          </li>
          <li>
            <Link to="/trash" className="hover:text-blue-500">
              Trash
            </Link>
          </li>
        </ul>
      </div>

      {/* Main */}
      <div className="flex-1">
        {/* Top Navbar */}
        <div className="bg-white shadow p-4 flex justify-between items-center">
          <h1 className="font-semibold">Invoice System</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm">{user?.name || "Admin"}</span>

            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
              {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
            </div>
            <button
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.href = "/";
              }}
              className="text-red-500 text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
export default Layout;
