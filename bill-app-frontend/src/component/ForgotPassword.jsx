import React, { useState } from "react";
import axios from "axios";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      return alert("Please enter email");
    }

    try {
      setLoading(true);

      await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/forgot-password`,
        { email }
      );

      alert("Password reset link sent to your email");
    } catch (error) {
      console.log(error);
      alert(
        error.response?.data?.message ||
          "Failed to send reset email"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f2f2f2] flex items-center justify-center px-5">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold mb-2">
          Forgot Password
        </h1>

        <p className="text-gray-500 mb-6">
          Enter your registered email
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Enter Email"
            className="w-full h-14 px-4 rounded-2xl border border-gray-200 bg-gray-50 outline-none focus:border-orange-500 mb-5"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;