"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";

export default function InvitePage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);

    try {
      const res = await axios.post("/api/auth/invite", { email });
      console.log(res.data);
      toast.success(res.data.message);
      setEmail("");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to send invite"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">

        <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">
          Invite User
        </h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Send an invitation link to join ChatApp
        </p>

        <form onSubmit={handleInvite} className="space-y-5">
          <div>
       

            <input
              type="email"
              required
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 
                         focus:border-blue-500 transition duration-200"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600  text-white py-2.5 
                       font-medium hover:bg-blue-700 active:scale-[0.98] 
                       transition duration-150 disabled:opacity-60 
                       disabled:cursor-not-allowed"
          >
            {loading ? "Sending Invite..." : "Send Invite"}
          </button>
        </form>

        {/* Divider */}
        <div className="my-4 flex items-center">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="px-3 text-xs text-gray-400 uppercase">
            or
          </span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Go Dashboard Button */}
        <button
          onClick={() => router.push("/dashboard")}
          className="w-full rounded-lg border border-gray-300 
                     py-2.5 font-medium text-gray-700 
                     hover:bg-gray-50 active:scale-[0.98] 
                     transition duration-150"
        >
          Go to Dashboard
        </button>

      </div>
    </div>
  );
}