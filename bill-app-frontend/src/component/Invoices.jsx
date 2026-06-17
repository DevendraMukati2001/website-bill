// Invoices.jsx

import React, { useEffect, useState } from "react";
import Layout from "./Layout";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { STATUS_LABELS, STATUS_COLORS } from "../utils/milestoneUtils";

function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const fetchInvoices = async () => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/bills`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { page: currentPage, limit: 10 },
        },
      );
      setInvoices(response.data.bills);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate("/login");
      }
    }
  };

  useEffect(() => {
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // ─── Soft delete ────────────────────────────────────────────
  const deleteInvoice = async (id) => {
    if (!window.confirm("Move this invoice to trash?")) return;
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/bills/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInvoices(invoices.filter((i) => i._id !== id));
      alert("Invoice moved to trash successfully");
    } catch {
      alert("Failed to move invoice to trash");
    }
  };

  // ─── Mark single milestone paid — same as mobile ────────────
  const markMilestonePaid = async (billId, milestoneId) => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/bills/${billId}/milestones/${milestoneId}/pay`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      // Refresh list so paidAmount / remainingAmount update ho
      fetchInvoices();
    } catch (error) {
      console.error(error);
      alert("Failed to update milestone");
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
  const clientName = (
    inv.clientName ||
    inv.client?.name ||
    ''
  ).toLowerCase();

  return clientName.includes(search.toLowerCase());
});

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Invoice List</h1>

      <input
        type="text"
        placeholder="Search by client..."
        className="border p-2 mb-4 w-full rounded"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2">Invoice No</th>
              <th className="p-2">Client</th>
              <th className="p-2">Date</th>
              <th className="p-2">Total</th>
              <th className="p-2">Paid</th>
              <th className="p-2">Remaining</th>
              <th className="p-2">Status</th>
              <th className="p-2">Milestones</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length > 0 ? (
              filteredInvoices.map((inv) => {
                const sc = STATUS_COLORS[inv.overallStatus] || STATUS_COLORS.pending;
                return (
                  <tr key={inv._id} className="border-t align-top">
                    <td className="p-2 font-semibold text-blue-700">
                      {inv.invoiceNumber}
                    </td>
                    <td className="p-2">{inv.client?.name || "—"}</td>
                    <td className="p-2">
                      {new Date(inv.date).toLocaleDateString()}
                    </td>
                    <td className="p-2">₹ {Number(inv.total || 0).toFixed(2)}</td>
                    <td className="p-2 text-green-600 font-bold">
                      ₹ {Number(inv.paidAmount || 0).toFixed(2)}
                    </td>
                    <td className="p-2 text-red-600 font-bold">
                      ₹ {Number(inv.remainingAmount || 0).toFixed(2)}
                    </td>
                    <td className="p-2">
                      <span
                        className="px-2 py-1 rounded-full text-xs font-bold border"
                        style={{
                          backgroundColor: sc.bg,
                          borderColor: sc.border,
                          color: sc.text,
                        }}
                      >
                        {STATUS_LABELS[inv.overallStatus] || inv.overallStatus}
                      </span>
                    </td>

                    {/* ── Milestones — har ek pe Mark Paid button ── */}
                    <td className="p-2">
                      {inv.milestones?.length ? (
                        <div className="flex flex-col gap-2 min-w-[200px]">
                          {inv.milestones.map((m, i) => (
                            <div
                              key={i}
                              className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100"
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-gray-700 font-semibold">
                                  M-{m.milestoneNumber} &nbsp;₹{m.amount}
                                </span>
                                <span
                                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                                  style={{
                                    backgroundColor:
                                      m.status === "paid"
                                        ? "#dcfce7"
                                        : m.status === "overdue"
                                        ? "#fee2e2"
                                        : "#fef3c7",
                                    color:
                                      m.status === "paid"
                                        ? "#16a34a"
                                        : m.status === "overdue"
                                        ? "#dc2626"
                                        : "#b45309",
                                  }}
                                >
                                  {m.status ? m.status.toUpperCase() : "PENDING"}
                                </span>
                              </div>
                              <div className="text-xs text-gray-400 mb-2">
                                Due:{" "}
                                {m.dueDate
                                  ? new Date(m.dueDate).toLocaleDateString()
                                  : "N/A"}
                              </div>
                              {/* Mark Paid button — sirf unpaid milestones pe */}
                              {m.status !== "paid" && (
                                <button
                                  onClick={() =>
                                    markMilestonePaid(inv._id, m._id)
                                  }
                                  className="w-full text-xs font-bold py-1 rounded-md text-white"
                                  style={{ backgroundColor: "#16a34a" }}
                                >
                                  ✓ Mark Paid
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">
                          No milestones
                        </span>
                      )}
                    </td>

                    {/* ── Actions ── */}
                    <td className="p-2">
                      <div className="flex flex-wrap gap-2 items-center">
                        <button
                          onClick={() => navigate("/preview", { state: inv })}
                          className="text-blue-500 text-sm font-semibold"
                        >
                          View
                        </button>
                        <button
                          onClick={() =>
                            navigate("/create", {
                              state: {
                                ...inv,
                                client: {
                                  _id: inv.client?._id || inv.client,
                                  name: inv.client?.name || "",
                                  company: inv.client?.company || "",
                                  gstNumber: inv.client?.gstNumber || "",
                                  phone: inv.client?.phone || "",
                                  email: inv.client?.email || "",
                                  dob: inv.client?.dob || null,
                                },
                              },
                            })
                          }
                          className="text-yellow-600 font-semibold text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteInvoice(inv._id)}
                          className="text-red-500 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="9" className="text-center p-4 text-gray-500">
                  No invoices found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
<div className="flex justify-center items-center mt-6">        <button
          onClick={() => setCurrentPage((p) => p - 1)}
          disabled={currentPage === 1}
          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-l disabled:opacity-50"
        >
          Previous
        </button>
        <span className="px-4 py-2 bg-gray-200">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((p) => p + 1)}
          disabled={currentPage === totalPages}
          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-r disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </Layout>
  );
}

export default Invoices;