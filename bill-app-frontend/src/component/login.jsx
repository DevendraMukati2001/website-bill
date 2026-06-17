import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";


function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      return alert("Please fill all fields");
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/login`,
        form,
      );

      const { token, ...userData } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));

      navigate("/dashboard");
    } catch (error) {
      console.log("Login Error =>", error);

      alert("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen bg-[#f2f2f2] flex items-center justify-center px-5">
      <div className="w-full max-w-md">
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
            Welcome Back 👋
          </h1>

          <p className="text-gray-500 mb-8">Login to continue your account</p>

          <form onSubmit={handleLogin}>
            {/* Email */}
            <input
              type="email"
              placeholder="Enter Email"
              className="w-full h-14 px-4 rounded-2xl border border-gray-200 bg-gray-50 outline-none focus:border-orange-500 mb-4"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            {/* Password */}
            <input
  type="password"
  placeholder="Enter Password"
  className="w-full h-14 px-4 rounded-2xl border border-gray-200 bg-gray-50 outline-none focus:border-orange-500 mb-2"
  value={form.password}
  onChange={(e) => setForm({ ...form, password: e.target.value })}
/>

<div className="flex justify-end mb-5">
  <Link
    to="/forgot-password"
    className="text-sm text-orange-500 font-medium"
  >
    Forgot Password?
  </Link>
</div>

            {/* Button */}
            <button
              type="submit"
              className="w-full h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 transition-all text-white font-bold text-lg"
            >
              Login
            </button>
          </form>

          {/* Signup */}
          <p className="text-center text-gray-500 mt-6 text-sm">
            Don’t have an account?{" "}
            <Link to="/signup" className="text-orange-500 font-semibold">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
