import React, { useEffect, useState } from "react";
import Layout from "./Layout";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Trash() {
  const [invoices, setInvoices] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrashInvoices = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/bills/trash`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: {
              page: currentPage,
              limit: 10,
            },
          },
        );
        const { bills, totalPages } = response.data;
        setInvoices(bills);
        setTotalPages(totalPages);
      } catch (error) {
        console.error("Failed to fetch trash invoices:", error);
        if (
          error.response &&
          (error.response.status === 401 || error.response.status === 403)
        ) {
          navigate("/login");
        }
      }
    };

    fetchTrashInvoices();
  }, [currentPage, navigate]);

  // ✅ RESTORE
  const restoreInvoice = async (id) => {
    if (!window.confirm("Are you sure you want to restore this invoice?"))
      return;

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/bills/${id}/restore`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      // Refresh the trash list after restoration
      setInvoices(invoices.filter((i) => i._id !== id));
      alert("Invoice restored successfully");
    } catch (error) {
      console.error("Failed to restore invoice:", error);
      alert("Failed to restore invoice");
    }
  };

  // ✅ PERMANENT DELETE
  const permanentDeleteInvoice = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this invoice? This action cannot be undone.",
      )
    )
      return;

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/bills/${id}/permanent`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      // Refresh the trash list after permanent deletion
      setInvoices(invoices.filter((i) => i._id !== id));
      alert("Invoice permanently deleted");
    } catch (error) {
      console.error("Failed to permanently delete invoice:", error);
      alert("Failed to permanently delete invoice");
    }
  };

  // ✅ SEARCH FILTER
  const filteredInvoices = invoices.filter((inv) => {
    if (!inv?.client) return false;
    const q = search.toLowerCase();
    if (!q) return true;

    const dateStr = new Date(inv.date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const dueDateStr = inv.dueDate
      ? new Date(inv.dueDate).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "";

    return (
      inv.client.name?.toLowerCase().includes(q) ||
      inv.client.company?.toLowerCase().includes(q) ||
      inv.client.gstNumber?.toLowerCase().includes(q) ||
      inv.invoiceNumber?.toLowerCase().includes(q) ||
      inv.status?.toLowerCase().includes(q) ||
      String(inv.total ?? "").includes(q) ||
      dateStr.toLowerCase().includes(q) ||
      dueDateStr.toLowerCase().includes(q)
    );
  });

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Trash - Deleted Invoices</h1>

      {/* 🔍 SEARCH */}
      <input
        type="text"
        placeholder="Search by client..."
        className="border p-2 mb-4 w-full rounded"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* 📋 TABLE */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2">Invoice No</th>
              <th>Client</th>
              <th>Date</th>
              <th>Due Date</th>
              <th>Total</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredInvoices.length > 0 ? (
              filteredInvoices.map((inv) => (
                <tr key={inv._id} className="border-t">
                  <td className="p-2">{inv.invoiceNumber}</td>
                  <td>{inv.client.name}</td>
                  <td>{new Date(inv.date).toLocaleDateString()}</td>
                  <td>
                    {inv.dueDate
                      ? new Date(inv.dueDate).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td>₹ {inv.total}</td>
                  <td>
                    <span
                      className={`px-2 py-1 rounded text-white ${
                        inv.status === "paid" ? "bg-green-500" : "bg-red-500"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>

                  <td className="flex gap-4 p-2">
                    {/* 🔄 RESTORE */}
                    <button
                      onClick={() => restoreInvoice(inv._id)}
                      className="text-green-600"
                    >
                      Restore
                    </button>

                    {/* 👁 VIEW */}
                    <button
                      onClick={() => navigate("/preview", { state: inv })}
                      className="text-blue-500"
                    >
                      View
                    </button>

                    {/* 🗑 PERMANENT DELETE */}
                    <button
                      onClick={() => permanentDeleteInvoice(inv._id)}
                      className="text-red-600"
                    >
                      Permanent Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center p-4 text-gray-500">
                  No invoices in trash
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ⏪ Pagination ⏩ */}
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

export default Trash;
