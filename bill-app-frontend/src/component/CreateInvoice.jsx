// CreateInvoice.jsx

import React, { useEffect, useState, useRef } from "react";
import Layout from "./Layout";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { STATUS_LABELS, STATUS_COLORS } from "../utils/milestoneUtils";

function CreateInvoice() {
  const [client, setClient] = useState("");
  const [clientId, setClientId] = useState(null); // Edit mode mein ObjectId store karo
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [gstnum, setGstnum] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [isBirthday, setIsBirthday] = useState(false);
  const [items, setItems] = useState([{ name: "", qty: 1, price: 0 }]);
  const [gst, setGst] = useState(false);
  const [discount, setDiscount] = useState("0");
  const [milestoneCount, setMilestoneCount] = useState(1);
  const [milestones, setMilestones] = useState([
    {
      milestoneNumber: 1,
      title: "Milestone 1",
      amount: "",
      dueAmount: "",
      expectedDate: "",
      dueDate: "",
      status: "pending",
    },
  ]);
  const [error, setError] = useState("");

  // ─── Refs: infinite loop aur edit overwrite rokne ke liye ───
  const userEditedAmounts = useRef(false);

  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state;

  // ─── Birthday Check ─────────────────────────────────────────
  const checkBirthday = (dobValue) => {
    if (!dobValue) return setIsBirthday(false);
    const today = new Date();
    const d = new Date(dobValue);
    setIsBirthday(
      today.getDate() === d.getDate() && today.getMonth() === d.getMonth(),
    );
  };

  // ─── Pre-fill on edit ───────────────────────────────────────
  useEffect(() => {
    if (!editData) return;

    // Edit mode mein auto-split mat karo — saved amounts rehne do
    userEditedAmounts.current = true;

    setClient(editData.client?.name || "");
    setClientId(editData.client?._id || null);
    setCompany(editData.client?.company || "");
    setGstnum(editData.client?.gstNumber || "");
    setPhone(editData.client?.phone || "");
    setEmail(editData.client?.email || "");
    setDate(new Date(editData.date).toISOString().split("T")[0]);
    setItems(
      editData.items?.length
        ? editData.items
        : [{ name: "", qty: 1, price: 0 }],
    );

    // ── Discount fix: backend discount = manual + birthdayDiscount combined ──
    // Edit mein sirf manual discount dikhao, birthday wala alag hai
    const savedBirthdayDiscount = Number(editData.birthdayDiscount || 0);
    const savedTotalDiscount = Number(editData.discount || 0);
    const manualDiscount = savedTotalDiscount - savedBirthdayDiscount;
    setDiscount(String(Math.max(0, manualDiscount)));

    setGst(Number(editData.gstAmount || 0) > 0);
    setMilestones(
      editData.milestones?.length
        ? editData.milestones
        : [
            {
              milestoneNumber: 1,
              title: "Milestone 1",
              amount: "",
              dueAmount: "",
              expectedDate: "",
              dueDate: "",
              status: "pending",
            },
          ],
    );
    setMilestoneCount(editData.milestones?.length || 1);

    const editDob = editData.client?.dob
      ? new Date(editData.client.dob).toISOString().split("T")[0]
      : "";
    setDob(editDob);
    checkBirthday(editDob);
  }, [editData]);

  // ─── Items helpers ──────────────────────────────────────────
  const addItem = () => setItems([...items, { name: "", qty: 1, price: 0 }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, value) => {
    const updated = [...items];
    updated[i][field] =
      field === "qty" || field === "price" ? Number(value) : value;
    setItems(updated);
    // Item change hone par auto-split dobara allow karo
    userEditedAmounts.current = false;
  };

  // ─── Calculations ───────────────────────────────────────────
  const subtotal = items.reduce((sum, i) => sum + i.qty * i.price, 0);
  const gstAmount = gst ? subtotal * 0.18 : 0;
  const birthdayDiscount = isBirthday ? subtotal * 0.05 : 0;
  const total = subtotal + gstAmount - Number(discount) - birthdayDiscount;

  // ─── Auto-split milestone amounts jab total change ho ───────
  // Sirf tab karo jab user ne manually amount nahi daala
  useEffect(() => {
    if (userEditedAmounts.current) return;
    if (milestones.length === 0) return;
    if (total <= 0) return;

    const splitAmount = (total / milestones.length).toFixed(2);
    setMilestones((prev) =>
      prev.map((m) => ({
        ...m,
        amount: String(splitAmount),
        dueAmount: String(splitAmount),
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, milestones.length]);
  // Note: milestones object intentionally dependency mein nahi — infinite loop rokne ke liye

  // ─── Overall Status ─────────────────────────────────────────
  const calculateOverallStatus = () => {
    const allPaid = milestones.every((m) => m.status === "paid");
    const anyPaid = milestones.some((m) => m.status === "paid");
    const anyOverdue = milestones.some((m) => m.status === "overdue");
    if (allPaid) return "paid";
    if (anyOverdue) return "overdue";
    if (anyPaid) return "partial";
    return "pending";
  };
  const overallStatus = calculateOverallStatus();
  const statusColors = STATUS_COLORS[overallStatus] || STATUS_COLORS.pending;

  // ─── Milestone count change ─────────────────────────────────
  const handleMilestoneCountChange = (val) => {
    const count = Math.max(1, Number(val) || 1);
    setMilestoneCount(count);
    userEditedAmounts.current = false; // Count change = auto-split allow karo

    const splitAmount = total > 0 ? (total / count).toFixed(2) : "0";

    const arr = Array.from({ length: count }, (_, i) => ({
      milestoneNumber: i + 1,
      title: `Milestone ${i + 1}`,
      amount: String(splitAmount),
      dueAmount: String(splitAmount),
      expectedDate: "",
      dueDate: "",
      status: "pending",
    }));
    setMilestones(arr);
  };

  // ─── Milestone field update ─────────────────────────────────
  const updateMilestone = (index, field, value) => {
    const updated = [...milestones];
    updated[index][field] = value;
    if (field === "amount") updated[index].dueAmount = value;
    setMilestones(updated);
  };

  const setMilestoneStatus = (index, status) => {
    const updated = [...milestones];
    updated[index].status = status;
    setMilestones(updated);
  };

  // ─── Manual milestone amount change — auto-split band karo ──
  const handleMilestoneAmountChange = (index, value) => {
    userEditedAmounts.current = true; // User ne khud amount daala
    updateMilestone(index, "amount", value);
  };

  // ─── Preview ────────────────────────────────────────────────
  const handlePreview = () => {
    if (!client) return setError("Client name required");
    if (items.length === 0) return setError("Add at least one item");
    setError("");
    const paidAmount = milestones
      .filter((m) => m.status === "paid")
      .reduce((acc, m) => acc + Number(m.amount || 0), 0);
    navigate("/preview", {
      state: {
        client: { name: client, gstNumber: gstnum, company, phone, email },
        items,
        subtotal,
        gstAmount,
        discount: Number(discount),
        birthdayDiscount,
        total,
        date,
        milestones,
        overallStatus,
        paidAmount,
        remainingAmount: total - paidAmount,
      },
    });
  };

  // ─── Save ────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!client || items.length === 0) return alert("Fill required fields");
    if (!milestones.length) return alert("Add at least one milestone");

    for (const m of milestones) {
      if (!m.amount || !m.dueDate || !m.expectedDate) {
        return alert(`Fill all fields for ${m.title}`);
      }
    }

    const milestoneTotal = milestones.reduce(
      (acc, m) => acc + Number(m.amount || 0),
      0,
    );
    if (Number(milestoneTotal.toFixed(2)) !== Number(total.toFixed(2))) {
      return alert("Milestone total must equal invoice total");
    }

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const formattedMilestones = milestones.map((m, index) => ({
      milestoneNumber: index + 1,
      title: m.title || `Milestone ${index + 1}`,
      amount: Number(m.amount),
      dueAmount: Number(m.amount),
      expectedDate: m.expectedDate,
      dueDate: m.dueDate,
      status: m.status || "pending",
      reminderSent: false,
    }));

    const invoiceData = {
      client: clientId, // ObjectId (edit mode mein set hoga, create mein null)
      clientName: client, // Name string — hamesha bhejo alag field mein
      company,
      gstnum,
      phone,
      email,
      dob,
      date,
      items,
      subtotal,
      gstAmount,
      discount: Number(discount), // Sirf manual discount
      birthdayDiscount, // Birthday discount alag
      total,
      milestones: formattedMilestones,
    };

    try {
      if (editData) {
        await axios.put(
          `${process.env.REACT_APP_API_URL}/bills/${editData._id}`,
          invoiceData,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        alert("Invoice updated successfully");
      } else {
        await axios.post(
          `${process.env.REACT_APP_API_URL}/bills`,
          invoiceData,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        alert("Invoice created successfully");
      }
      navigate("/invoices");
    } catch (err) {
      console.error("SAVE INVOICE ERROR:", err?.response?.data || err);
      alert(err?.response?.data?.message || "Failed to save invoice");
    }
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">
        {editData ? "Edit Invoice" : "Create Invoice"}
      </h1>

      {error && <div className="text-red-500 mb-3 text-sm">{error}</div>}

      {/* ── Client Details ─────────────────────────────── */}
      <div className="bg-white p-4 rounded-xl shadow mb-4">
        <h2 className="text-base font-bold text-gray-700 mb-3">
          Client Details
        </h2>
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col flex-1 min-w-[180px]">
            <label className="text-sm font-semibold mb-1">Client Name *</label>
            <input
              className="border p-2 rounded bg-gray-50"
              placeholder="Client Name"
              value={client}
              onChange={(e) => setClient(e.target.value)}
            />
          </div>
          <div className="flex flex-col flex-1 min-w-[180px]">
            <label className="text-sm font-semibold mb-1">Company Name</label>
            <input
              className="border p-2 rounded bg-gray-50"
              placeholder="Company Name"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>
          <div className="flex flex-col flex-1 min-w-[180px]">
            <label className="text-sm font-semibold mb-1">GST Number</label>
            <input
              className="border p-2 rounded bg-gray-50"
              placeholder="GST Number"
              value={gstnum}
              onChange={(e) => setGstnum(e.target.value)}
            />
          </div>
          <div className="flex flex-col flex-1 min-w-[180px]">
            <label className="text-sm font-semibold mb-1">Phone</label>
            <input
              className="border p-2 rounded bg-gray-50"
              placeholder="Phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="flex flex-col flex-1 min-w-[180px]">
            <label className="text-sm font-semibold mb-1">Email</label>
            <input
              className="border p-2 rounded bg-gray-50"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col flex-1 min-w-[180px]">
            <label className="text-sm font-semibold mb-1">Bill Date</label>
            <input
              className="border p-2 rounded bg-gray-50"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col flex-1 min-w-[180px]">
            <label className="text-sm font-semibold mb-1">
              Date of Birth 🎂
            </label>
            <input
              className="border p-2 rounded bg-gray-50"
              type="date"
              value={dob}
              onChange={(e) => {
                setDob(e.target.value);
                checkBirthday(e.target.value);
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Birthday Banner ────────────────────────────── */}
      {isBirthday && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-3 mb-4 flex items-center gap-2">
          <span className="text-xl">🎂</span>
          <div>
            <p className="text-sm font-bold text-yellow-800">
              Happy Birthday, {client || "Client"}!
            </p>
            <p className="text-xs text-yellow-700">
              5% birthday discount auto-applied (₹ {birthdayDiscount.toFixed(2)}
              )
            </p>
          </div>
        </div>
      )}

      {/* ── Overall Status Badge ───────────────────────── */}
      <div className="bg-white p-4 rounded-xl shadow mb-4">
        <p className="text-sm font-semibold text-gray-700 mb-2">
          Overall Invoice Status
        </p>
        <span
          className="text-sm font-bold px-4 py-1.5 rounded-full border"
          style={{
            backgroundColor: statusColors.bg,
            borderColor: statusColors.border,
            color: statusColors.text,
          }}
        >
          {STATUS_LABELS[overallStatus]}
        </span>
      </div>

      {/* ── Milestones ─────────────────────────────────── */}
      <div className="bg-white p-4 rounded-xl shadow mb-4">
        <h2 className="text-base font-bold text-gray-700 mb-3">Milestones</h2>

        <div className="flex flex-col mb-3">
          <label className="text-sm font-semibold mb-1">
            Number of Milestones
          </label>
          <input
            type="number"
            min="1"
            className="border p-2 rounded bg-gray-50 w-40"
            value={milestoneCount}
            onChange={(e) => handleMilestoneCountChange(e.target.value)}
          />
          {total > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              Auto-split: ₹ {(total / milestoneCount).toFixed(2)} per milestone
            </p>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {milestones.map((m, index) => {
            const statusColor =
              m.status === "paid"
                ? "#16a34a"
                : m.status === "overdue"
                  ? "#dc2626"
                  : "#f59e0b";
            return (
              <div
                key={index}
                className="bg-gray-50 rounded-xl p-4 border border-gray-200"
              >
                <p className="text-base font-bold text-gray-900 mb-1">
                  Milestone {index + 1}
                </p>
                <p
                  className="text-sm font-bold mb-3"
                  style={{ color: statusColor }}
                >
                  Status: {m.status.toUpperCase()}
                </p>

                <div className="flex flex-wrap gap-3 mb-3">
                  <div className="flex flex-col flex-1 min-w-[140px]">
                    <label className="text-xs font-semibold text-gray-600 mb-1">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      className="border p-2 rounded bg-white text-sm"
                      placeholder="Amount"
                      value={m.amount}
                      onChange={(e) =>
                        handleMilestoneAmountChange(index, e.target.value)
                      }
                    />
                  </div>
                  <div className="flex flex-col flex-1 min-w-[140px]">
                    <label className="text-xs font-semibold text-gray-600 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      className="border p-2 rounded bg-white text-sm"
                      value={
                        m.dueDate
                          ? new Date(m.dueDate).toISOString().split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        updateMilestone(index, "dueDate", e.target.value)
                      }
                    />
                  </div>
                  <div className="flex flex-col flex-1 min-w-[140px]">
                    <label className="text-xs font-semibold text-gray-600 mb-1">
                      Expected Date
                    </label>
                    <input
                      type="date"
                      className="border p-2 rounded bg-white text-sm"
                      value={
                        m.expectedDate
                          ? new Date(m.expectedDate).toISOString().split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        updateMilestone(index, "expectedDate", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setMilestoneStatus(index, "paid")}
                    className="flex-1 py-2 rounded-md text-white text-sm font-bold"
                    style={{
                      backgroundColor:
                        m.status === "paid" ? "#15803d" : "#16a34a",
                    }}
                  >
                    ✓ Paid
                  </button>
                  <button
                    onClick={() => setMilestoneStatus(index, "pending")}
                    className="flex-1 py-2 rounded-md text-white text-sm font-bold"
                    style={{
                      backgroundColor:
                        m.status === "pending" ? "#b45309" : "#f59e0b",
                    }}
                  >
                    ⏳ Pending
                  </button>
                  <button
                    onClick={() => setMilestoneStatus(index, "overdue")}
                    className="flex-1 py-2 rounded-md text-white text-sm font-bold"
                    style={{
                      backgroundColor:
                        m.status === "overdue" ? "#991b1b" : "#dc2626",
                    }}
                  >
                    ⚠ Overdue
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Items ──────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-xl shadow mb-4">
        <h2 className="text-base font-bold text-gray-700 mb-3">Items</h2>
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 mb-2 items-start">
            <input
              className="border p-2 rounded bg-gray-50 flex-[2]"
              placeholder="Item name"
              value={item.name}
              onChange={(e) => updateItem(i, "name", e.target.value)}
            />
            <input
              type="number"
              className="border p-2 rounded bg-gray-50 flex-1"
              placeholder="Qty"
              value={item.qty}
              onChange={(e) => updateItem(i, "qty", e.target.value)}
            />
            <input
              type="number"
              className="border p-2 rounded bg-gray-50 flex-1"
              placeholder="Price"
              value={item.price}
              onChange={(e) => updateItem(i, "price", e.target.value)}
            />
            <button
              onClick={() => removeItem(i)}
              className="text-gray-400 text-xs px-2 py-2 mt-0.5"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          onClick={addItem}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold mt-1 w-full"
        >
          + Add Item
        </button>
      </div>

      {/* ── GST & Discount ─────────────────────────────── */}
      <div className="bg-white p-4 rounded-xl shadow mb-4">
        <div className="flex justify-between items-center mb-3">
          <label className="text-sm text-gray-700 font-medium">
            Add GST (18%)
          </label>
          <input
            type="checkbox"
            checked={gst}
            onChange={() => setGst(!gst)}
            className="w-5 h-5 cursor-pointer"
          />
        </div>
        <div className="flex justify-between items-center">
          <label className="text-sm text-gray-700 font-medium">
            Discount (₹)
          </label>
          <input
            type="number"
            className="border p-2 rounded bg-gray-50 w-28 text-sm"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
          />
        </div>
      </div>

      {/* ── Totals ─────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-xl shadow mb-4">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>Subtotal</span>
          <span>₹ {subtotal.toFixed(2)}</span>
        </div>
        {gst && (
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>GST (18%)</span>
            <span>₹ {gstAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>Discount</span>
          <span>- ₹ {discount}</span>
        </div>
        {isBirthday && (
          <div className="flex justify-between text-sm text-yellow-600 mb-2 font-semibold">
            <span>🎂 Birthday Discount (5%)</span>
            <span>- ₹ {birthdayDiscount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-base border-t pt-3 mt-2 text-blue-700">
          <span>Total</span>
          <span>₹ {total.toFixed(2)}</span>
        </div>
      </div>

      {/* ── Action Buttons ──────────────────────────────── */}
      <div className="flex gap-3 mb-10">
        <button
          onClick={handlePreview}
          className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-bold text-sm"
        >
          Preview
        </button>
        <button
          onClick={handleSave}
          className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold text-sm"
        >
          Save Invoice
        </button>
      </div>
    </Layout>
  );
}

export default CreateInvoice;
