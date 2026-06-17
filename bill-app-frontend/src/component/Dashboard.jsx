// Dashboard.jsx

import React, { useEffect, useState } from "react";
import Layout from "./Layout";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { STATUS_LABELS, STATUS_COLORS } from "../utils/milestoneUtils";

function Dashboard() {
  const [stats, setStats] = useState({
    totalInvoices: 0,
    revenue: 0,
    pending: 0,
  });
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/dashboard`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const { totalInvoices, revenue, pending, unpaidInvoices } =
          response.data;
        setStats({
          totalInvoices: Number(totalInvoices || 0),
          revenue: Number(revenue || 0),
          pending: Number(pending || 0),
        });
        setUnpaidInvoices(unpaidInvoices || []);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        if (
          error.response &&
          (error.response.status === 401 || error.response.status === 403)
        ) {
          navigate("/login");
        }
      }
    };
    fetchDashboardData();
  }, [navigate]);

  // Milestone counts
  const allMilestones = unpaidInvoices.flatMap((inv) => inv.milestones || []);
  const paidMilestones = allMilestones.filter((m) => m.status === "paid");
  const overdueMilestones = allMilestones.filter((m) => m.status === "overdue");
  const pendingMilestones = allMilestones.filter((m) => m.status === "pending");

  // Filter: exclude fully paid invoices, search by invoice number or date
const filtered = unpaidInvoices.filter((inv) => {
  if (!inv || !inv.client || !inv.invoiceNumber) return false;
  if (inv.overallStatus === "paid") return false;
  const q = search.toLowerCase();
  if (!q) return true;

  const dateStr = new Date(inv.date).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });

  return (
    inv.invoiceNumber?.toLowerCase().includes(q) ||
    (inv.clientName || inv.client?.name || "").toLowerCase().includes(q) ||
    inv.client?.gstNumber?.toLowerCase().includes(q) ||
    inv.client?.company?.toLowerCase().includes(q) ||
    inv.overallStatus?.toLowerCase().includes(q) ||
    String(inv.total ?? "").includes(q) ||
    dateStr.toLowerCase().includes(q)
  );
});

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      {/* Stats Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-xs text-gray-500 mb-1">Total Invoices</p>
          <p className="text-xl font-bold text-gray-900">
            {stats.totalInvoices}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-xs text-gray-500 mb-1">Revenue</p>
          <p className="text-xl font-bold text-gray-900">
            ₹{Number(stats.revenue).toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-xs text-gray-500 mb-1">Pending</p>
          <p className="text-xl font-bold text-red-700">
            ₹{Number(stats.pending).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Stats Row 2 — Milestones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-xs text-gray-500 mb-1">Paid Milestones</p>
          <p className="text-xl font-bold text-green-600">
            {paidMilestones.length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-xs text-gray-500 mb-1">Pending</p>
          <p className="text-xl font-bold text-yellow-500">
            {pendingMilestones.length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-xs text-gray-500 mb-1">Overdue</p>
          <p className="text-xl font-bold text-red-600">
            {overdueMilestones.length}
          </p>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by Invoice No or Date..."
        className="border p-2 mb-4 w-full rounded"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <h2 className="text-lg font-semibold text-gray-700 mb-3">
        Pending Invoices
      </h2>

      {/* Invoice Cards */}
      {filtered.length === 0 ? (
        <p className="text-center text-gray-400 mt-8">No invoices found</p>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((inv) => {
            const sc =
              STATUS_COLORS[inv.overallStatus] || STATUS_COLORS.pending;
            return (
              <div key={inv._id} className="bg-white rounded-xl shadow p-4">
                {/* Header row */}
                <div className="flex justify-between items-center mb-1">
                  <span className="text-blue-700 font-semibold break-all">
  #{inv.invoiceNumber}
</span>
                  <span
                    className="text-xs font-bold px-3 py-1 rounded-full border"
                    style={{
                      backgroundColor: sc.bg,
                      borderColor: sc.border,
                      color: sc.text,
                    }}
                  >
                    {STATUS_LABELS[inv.overallStatus] || inv.overallStatus}
                  </span>
                </div>

                <p className="text-gray-900 font-medium mb-3">
                  {inv?.clientName || inv?.client?.name || "Unknown Client"}
                </p>

                {/* Milestones */}
                <div className="flex flex-col gap-2 mt-2">
                  {inv.milestones?.length ? (
                    inv.milestones.map((m, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center bg-gray-50 rounded-lg p-2"
                      >
                        <div>
                          <p className="font-bold text-gray-900 text-sm">
                            Milestone {m.milestoneNumber}
                          </p>
                          <p className="text-xs text-gray-500">₹ {m.amount}</p>
                          <p className="text-xs text-gray-400">
                            Due:{" "}
                            {m.dueDate
                              ? new Date(m.dueDate).toLocaleDateString(
                                  "en-GB",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )
                              : "N/A"}
                          </p>
                        </div>
                        <span
                          className="text-xs font-bold px-3 py-1 rounded-full"
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
                          {m?.status ? m.status.toUpperCase() : "PENDING"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm mt-1">
                      No milestones added
                    </p>
                  )}
                </div>

                {/* Paid / Remaining */}
                <div className="flex justify-between mt-3 mb-2">
                  <span className="text-green-600 font-bold text-sm">
                    Paid: ₹ {Number(inv.paidAmount || 0).toFixed(2)}
                  </span>
                  <span className="text-red-600 font-bold text-sm">
                    Remaining: ₹ {Number(inv.remainingAmount || 0).toFixed(2)}
                  </span>
                </div>

                {/* Footer */}
                <div className="flex flex-col sm:flex-row justify-between gap-2">
                  <span className="text-gray-500 text-sm">
                    {new Date(inv.date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span className="font-bold text-gray-900 text-sm">
                    ₹ {Number(inv.total || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}

export default Dashboard;
