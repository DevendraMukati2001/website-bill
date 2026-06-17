// Preview.jsx
// Uses: html2pdf.js (already in package.json)

import React, { useRef, useState } from "react";
import Layout from "./Layout";
import { useLocation } from "react-router-dom";
import html2pdf from "html2pdf.js";
import { STATUS_LABELS, STATUS_COLORS } from "../utils/milestoneUtils";
import MilestoneStepper from "./MilestoneStepper";

function Preview() {
  const location = useLocation();
  const data = location.state;
  const invoiceRef = useRef(null);
  const [loading, setLoading] = useState(false);

  if (!data) return <div>No Data</div>;

  const invoiceStatus = data.overallStatus ?? "pending";
  const sc = STATUS_COLORS[invoiceStatus] || STATUS_COLORS.pending;
  const clientName = data.client?.name ?? data.client ?? "";
  const invoiceNo = data.invoiceNumber ?? "";

  const pdfOptions = {
    margin: 0,
    filename: `Invoice_${invoiceNo || "draft"}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };

  const generatePdfBlob = () => {
    return new Promise((resolve, reject) => {
      html2pdf()
        .set(pdfOptions)
        .from(invoiceRef.current)
        .outputPdf("blob")
        .then(resolve)
        .catch(reject);
    });
  };

  const handleDownloadPDF = async () => {
    try {
      setLoading(true);
      await html2pdf().set(pdfOptions).from(invoiceRef.current).save();
    } catch (err) {
      console.error(err);
      alert("Failed to generate PDF");
    } finally {
      setLoading(false);
    }
  };

  const shareWhatsApp = async () => {
    try {
      setLoading(true);
      const blob = await generatePdfBlob();
      const file = new File([blob], `Invoice_${invoiceNo || "draft"}.pdf`, {
        type: "application/pdf",
      });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Invoice #${invoiceNo}`,
          text: `Invoice #${invoiceNo} from Binjwa IT Solutions`,
          files: [file],
        });
      } else {
        await html2pdf().set(pdfOptions).from(invoiceRef.current).save();
        const message = `Invoice #${invoiceNo}\nClient: ${clientName}\nTotal: ₹${Number(data.total || 0).toFixed(2)}\nFrom: Binjwa IT Solutions\n\n(PDF downloaded — please attach manually)`;
        window.open(
          `https://wa.me/?text=${encodeURIComponent(message)}`,
          "_blank",
        );
      }
    } catch (err) {
      if (err?.name !== "AbortError" && !err?.message?.includes("cancel")) {
        alert("WhatsApp share failed. PDF has been downloaded instead.");
      }
    } finally {
      setLoading(false);
    }
  };

  const shareEmail = async () => {
    try {
      setLoading(true);
      const blob = await generatePdfBlob();
      const file = new File([blob], `Invoice_${invoiceNo || "draft"}.pdf`, {
        type: "application/pdf",
      });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Invoice ${invoiceNo ? "#" + invoiceNo : ""} — Binjwa IT Solutions`,
          text: `Dear ${clientName},\n\nPlease find your invoice attached.\n\nRegards,\nBinjwa IT Solutions`,
          files: [file],
        });
      } else {
        await html2pdf().set(pdfOptions).from(invoiceRef.current).save();
        const subject = `Invoice ${invoiceNo ? "#" + invoiceNo : ""} — Binjwa IT Solutions`;
        const body = `Dear ${clientName},\n\nPlease find your invoice attached.\n\nRegards,\nBinjwa IT Solutions`;
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      }
    } catch (err) {
      if (err?.name !== "AbortError" && !err?.message?.includes("cancel")) {
        alert("Email share failed. PDF has been downloaded instead.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
<Layout>
  <div className="overflow-x-auto">
    <div className="print:p-0 print:shadow-none print:max-w-full min-w-[768px]">
        <div
          ref={invoiceRef}
          id="invoice"
          className="bg-white p-8 max-w-4xl mx-auto text-sm border"
        >
          {/* Header */}
          <div className="flex justify-between items-start border-b pb-4">
            <div>
              <img src="/binjwalogo.png" className="w-32" alt="logo" />
              {invoiceNo && (
                <p className="text-xs text-gray-500 mt-1">
                  Invoice #{invoiceNo}
                </p>
              )}
            </div>
            <div className="text-right text-xs text-gray-500 leading-5">
              <p>
                605 & 301, Atulya IT Park, Near Bhawarkua Main Road, Indore -
                452010
              </p>
              <p>Www.binjwaitsolutions.com</p>
              <p>Info@binjwaitsolutions.com</p>
              <p>+91 7974147736, 9826656189</p>
              <p>GST No.:- 23ABGFB3210J1ZY</p>
            </div>
          </div>

          {/* Payment Status Banner */}
          <div
            className="flex items-center gap-4 rounded-lg p-3 my-4 border"
            style={{ backgroundColor: sc.bg, borderColor: sc.border }}
          >
            <div className="min-w-[90px]">
              <p className="text-xs font-bold text-gray-400 tracking-widest">
                PAYMENT STATUS
              </p>
              <p
                className="font-bold text-sm mt-0.5"
                style={{ color: sc.text }}
              >
                {STATUS_LABELS[invoiceStatus] || invoiceStatus}
              </p>
            </div>
            <div className="flex-1">
              <MilestoneStepper milestones={data.milestones || []} />
            </div>
          </div>

          {/* Client */}
          <div className="flex justify-between mt-4 border-b pb-4">
            <div>
              <p className="font-semibold">Issued To</p>
              <p>{data.client?.name ?? data.client}</p>
              <p>{data.client?.gstNumber ?? data.gstnum}</p>
            </div>
            <div>
              <p className="font-semibold">Billing Address</p>
              <p>{data.client?.company ?? data.company}</p>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-2 mb-4">
            Date: {data.date ? new Date(data.date).toLocaleDateString() : ""}
          </p>

          {/* Items Table */}
          <table className="w-full mt-2 border text-center">
            <thead>
              <tr className="bg-blue-800 text-white">
                <th className="border p-2">S.No</th>
                <th className="border p-2">Item</th>
                <th className="border p-2">Qty</th>
                <th className="border p-2">Rate</th>
                <th className="border p-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.items?.map((item, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                  <td className="border p-2">{i + 1}</td>
                  <td className="border p-2">{item.name}</td>
                  <td className="border p-2">{item.qty}</td>
                  <td className="border p-2">₹ {item.price}</td>
                  <td className="border p-2">₹ {item.qty * item.price}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Milestones Table */}
          <p className="font-bold text-sm mt-6 mb-2">Milestones</p>
          <div className="border rounded-lg overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-blue-800 text-white">
                  <th className="p-2 text-left">Milestone</th>
                  <th className="p-2 text-left">Amount</th>
                  <th className="p-2 text-left">Due Date</th>
                  <th className="p-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.milestones?.length ? (
                  data.milestones.map((m, i) => (
                    <tr
                      key={i}
                      className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}
                    >
                      <td className="p-2">M-{m.milestoneNumber}</td>
                      <td className="p-2">₹ {m.amount}</td>
                      <td className="p-2">
                        {m.dueDate
                          ? new Date(m.dueDate).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td
                        className="p-2 text-right font-bold"
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
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center p-3 text-gray-400">
                      No milestones added
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mt-4">
            <div className="w-1/3 text-sm flex flex-col gap-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>₹ {Number(data.subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">GST</span>
                <span>₹ {Number(data.gstAmount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Discount</span>
                <span>₹ {Number(data.discount || 0).toFixed(2)}</span>
              </div>
              {/* ── Birthday Discount Row ── */}
              {Number(data.birthdayDiscount || 0) > 0 && (
                <div className="flex justify-between text-yellow-600 font-semibold">
                  <span>🎂 Birthday Discount</span>
                  <span>- ₹ {Number(data.birthdayDiscount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-green-600 font-bold">
                <span>Paid Amount</span>
                <span>₹ {Number(data.paidAmount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-red-600 font-bold">
                <span>Remaining</span>
                <span>₹ {Number(data.remainingAmount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold border-t mt-2 pt-2 text-blue-800">
                <span>Total</span>
                <span>₹ {Number(data.total || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 border-t pt-4 flex justify-between text-xs text-gray-600">
            <div className="leading-6">
              <p>Bank account name :- Binjwa IT Solutions</p>
              <p>BANK NAME :- ICICI Bank</p>
              <p>BANK ACC no. :- 777705635026</p>
              <p>IFSC Code :- ICIC0006575</p>
              <p>Branch :- Gumasta Nagar, Indore</p>
              <p className="text-blue-700 font-semibold mt-1">
                Thank you for your business!
              </p>
            </div>
            <div className="text-right">
              <p>For Binjwa IT Solutions</p>
              <div className="h-12"></div>
              <div className="w-32 border-t border-gray-700 ml-auto"></div>
              <p>Authorized Signature</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 mt-6 print:hidden flex-wrap">
        {loading ? (
          <div className="flex items-center gap-2 text-gray-500 py-3">
            <svg
              className="animate-spin h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
            <span className="text-sm font-medium">Preparing PDF…</span>
          </div>
        ) : (
          <>
            <button
              onClick={handleDownloadPDF}
              className="bg-green-500 text-white px-6 py-2 rounded font-semibold hover:bg-green-600 transition"
            >
              📥 Download PDF
            </button>
            <button
              onClick={shareWhatsApp}
              className="bg-green-600 text-white px-6 py-2 rounded font-semibold hover:bg-green-700 transition"
            >
              📤 Share to WhatsApp
            </button>
            <button
              onClick={shareEmail}
              className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700 transition"
            >
              ✉️ Share to Email
            </button>
          </>
        )}
      </div>

      <p className="text-center text-xs text-gray-400 mt-3 print:hidden">
        💡 Mobile (Chrome/Safari) pe PDF directly share hogi. Desktop pe pehle
        download hogi — phir manually attach karein.
      </p>
      </div>
    </Layout>
  );
}

export default Preview;
