// Clients.jsx

import React, { useEffect, useState } from "react";
import Layout from "./Layout";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { STATUS_LABELS, STATUS_COLORS } from "../utils/milestoneUtils";

function Clients() {
  const [clients, setClients] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClients = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/clients`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { page: currentPage, limit: 10 },
          },
        );
        const { clients, totalPages } = response.data;
        setClients(clients);
        setTotalPages(totalPages);
      } catch (error) {
        console.error("Failed to fetch clients:", error);
        if (
          error.response &&
          (error.response.status === 401 || error.response.status === 403)
        ) {
          navigate("/login");
        }
      }
    };
    fetchClients();
  }, [currentPage, navigate]);

const filteredClients = clients.filter((c) => {
  if (!c) return false;

  const q = search.trim().toLowerCase();
  if (!q) return true;

  const dueDateStr = c.dueDate
    ? new Date(c.dueDate).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).toLowerCase()
    : "";

  return (
    (c.name || "").toLowerCase().includes(q) ||
    (c.company || "").toLowerCase().includes(q) ||
    (c.gstNumber || "").toLowerCase().includes(q) ||
    (c.overallStatus || c.status || "").toLowerCase().includes(q) ||
    String(c.total || "").includes(q) ||
    String(c.count || "").includes(q) ||
    dueDateStr.includes(q)
  );
});

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Clients CRM</h1>

      <input
        type="text"
        placeholder="Search client..."
        className="border p-2 mb-4 w-full rounded"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => {
          const sc = STATUS_COLORS[client.status] || STATUS_COLORS.pending;

          const currentStatus = client.overallStatus || client.status;

          const borderColor = currentStatus === "paid" ? "#16a34a" : "#ef4444";

          return (
            <div
              key={client._id}
              onClick={() => navigate(`/client/${client._id}`)}
              className="p-4 rounded-xl shadow cursor-pointer bg-white"
              style={{ borderLeft: `4px solid ${borderColor}` }}
            >
              <h2 className="text-lg font-bold text-gray-900">{client.name}</h2>
              <p className="text-sm text-gray-500 mt-2">
                Total Billing: ₹{client.total}
              </p>
              <p className="text-sm text-gray-500">Invoices: {client.count}</p>
              <p
                className="mt-2 font-bold text-sm"
                style={{ color: borderColor }}
              >
                {currentStatus?.toUpperCase()}
              </p>
              {currentStatus === "unpaid" && client.dueDate && (
                <p className="text-xs text-red-500 mt-1">
                  Due: {new Date(client.dueDate).toLocaleDateString()}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center mt-6">
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-l disabled:opacity-50"
        >
          Previous
        </button>
        <span className="px-4 py-2 bg-gray-200">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-r disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </Layout>
  );
}

export default Clients;
