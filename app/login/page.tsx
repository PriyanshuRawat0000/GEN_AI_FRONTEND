"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Invalid email format");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error || "Login failed");
        return;
      }

      localStorage.setItem("userEmail", data.user.email);
      window.location.assign("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0e0e0e] text-[#eaeaea]">
      <div className="w-full max-w-md bg-[#151515] border border-[#222] rounded-lg p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">
            Prompt<span className="text-[#4f7cff]">Lens</span>
          </h1>
          <p className="mt-2 text-sm text-[#9a9a9a]">
            Sign in to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div className="space-y-2">
            <label className="block text-sm">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoFocus
              className="w-full px-4 py-2 rounded-md bg-[#1e1e1e] border border-[#2a2a2a] text-[#eaeaea] focus:outline-none focus:border-[#4f7cff]"
            />
          </div>

          {error && (
            <div className="bg-[#2a1a1a] text-[#ff6b6b] px-3 py-2 rounded-md text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#4f7cff] text-white py-2 rounded-md hover:opacity-90 disabled:opacity-50 transition"
          >
            {loading ? "Logging in..." : "Continue"}
          </button>
        </form>
      </div>
    </main>
  );
}