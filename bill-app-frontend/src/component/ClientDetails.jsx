// ClientDetails.jsx

import React, { useEffect, useState } from "react";
import Layout from "./Layout";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

import { STATUS_LABELS, STATUS_COLORS } from "../utils/milestoneUtils";
import MilestoneStepper from "./MilestoneStepper";

function ClientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchClientDetails = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/clients/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { page: currentPage, limit: 10 },
          },
        );
        const { client, totalPages } = response.data;
        setClient(client);
        setTotalPages(totalPages);
      } catch (error) {
        console.error("Failed to fetch client details:", error);
        if (
          error.response &&
          (error.response.status === 401 || error.response.status === 403)
        ) {
          navigate("/login");
        }
      }
    };
    fetchClientDetails();
  }, [id, currentPage, navigate]);

  if (!client) {
    return (
      <Layout>
        <div>Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Client Info */}
      <div className="bg-white p-6 rounded-xl shadow mb-6">
        <h1 className="text-2xl font-bold mb-2">{client.name}</h1>
        <p className="text-gray-600">{client.company}</p>
        <p className="text-gray-600">GST: {client.gstNumber}</p>
      </div>

      <h2 className="text-xl font-bold mb-4">Invoices</h2>

      <div className="flex flex-col gap-4">
        {client.bills?.map((bill) => {
          const sc = STATUS_COLORS[bill.overallStatus] || STATUS_COLORS.pending;
          return (
            <div key={bill._id} className="bg-white rounded-xl shadow p-4">
              {/* Bill header */}
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className="font-semibold text-blue-700">
                    #{bill.invoiceNumber}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(bill.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-bold text-gray-900">
                    ₹ {bill.total}
                  </span>
                  <span
                    className="text-xs font-bold px-3 py-1 rounded-full border"
                    style={{
                      backgroundColor: sc.bg,
                      borderColor: sc.border,
                      color: sc.text,
                    }}
                  >
                    {STATUS_LABELS[bill.overallStatus] || bill.overallStatus}
                  </span>
                </div>
              </div>

              {/* Milestone Stepper */}
              <MilestoneStepper milestones={bill.milestones || []} />

              {/* Milestone Rows */}
              <div className="flex flex-col gap-2 mt-2">
                {bill.milestones?.length ? (
                  bill.milestones.map((m, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2"
                    >
                      <div>
                        <p className="font-bold text-gray-900 text-sm">
                          Milestone {m.milestoneNumber}
                        </p>
                        <p className="text-xs text-gray-500">₹ {m.amount}</p>
                        <p className="text-xs text-gray-400">
                          Due:{" "}
                          {m.dueDate
                            ? new Date(m.dueDate).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "N/A"}
                        </p>
                      </div>
                      <span
                        className="text-xs font-bold"
                        style={{
                          color:
                            m.status === "paid"
                              ? "#16a34a"
                              : m.status === "overdue"
                                ? "#dc2626"
                                : "#f59e0b",
                        }}
                      >
                        {m?.status ? m.status.toUpperCase() : "PENDING"}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm mt-2">
                    No milestones added
                  </p>
                )}
              </div>

              {/* Paid / Remaining */}
              <div className="flex justify-between mt-3">
                <span className="text-green-600 font-bold text-sm">
                  Paid: ₹ {Number(bill.paidAmount || 0).toFixed(2)}
                </span>
                <span className="text-red-600 font-bold text-sm">
                  Remaining: ₹ {Number(bill.remainingAmount || 0).toFixed(2)}
                </span>
              </div>
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

export default ClientDetails;
