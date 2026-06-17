import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
// import logo from "../assets/logo.png";

function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password) {
      return alert("Fill all fields");
    }

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/register`,
        form
      );

      alert("Registered successfully");

      navigate("/");
    }catch (error) {
  console.error(
    "Registration failed:",
    error.response?.data || error
  );

  alert(
    error.response?.data?.message || "Registration failed"
  );
}
  };

  return (
    <div className="min-h-screen bg-[#f2f2f2] flex items-center justify-center px-5">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-10">
          <img
  src="/binjwalogo.png"
  alt="logo"
  className="w-56 h-46 object-contain"
/>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
            Create Account 🚀
          </h1>

          <p className="text-gray-500 mb-8">
            Signup to continue your journey
          </p>

          <form onSubmit={handleSubmit}>
            
            {/* Name */}
            <input
              type="text"
              placeholder="Enter Name"
              className="w-full h-14 px-4 rounded-2xl border border-gray-200 bg-gray-50 outline-none focus:border-orange-500 mb-4"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />

            {/* Email */}
            <input
              type="email"
              placeholder="Enter Email"
              className="w-full h-14 px-4 rounded-2xl border border-gray-200 bg-gray-50 outline-none focus:border-orange-500 mb-4"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />

            {/* Password */}
            <input
              type="password"
              placeholder="Enter Password"
              className="w-full h-14 px-4 rounded-2xl border border-gray-200 bg-gray-50 outline-none focus:border-orange-500 mb-5"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
            />

            {/* Button */}
            <button
              type="submit"
              className="w-full h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 transition-all text-white font-bold text-lg"
            >
              Signup
            </button>
          </form>

          {/* Login */}
          <p className="text-center text-gray-500 mt-6 text-sm">
            Already have an account?{" "}
            <Link
              to="/"
              className="text-orange-500 font-semibold"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;