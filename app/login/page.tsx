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
      // Call server to create user if not exists
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

      //console.log("Login success:", data.user);

      // Store email in localStorage
      localStorage.setItem("userEmail", data.user.email);

      // redirect to dashboard
      window.location.assign("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background text-[#F8F8F8]">
      <div className="w-full max-w-md bg-[#0B0B0B] rounded-xl shadow-lg p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-[#F8F8F8]">
            Analysing <span className="text-[#4757FF] italic">LLMs</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to continue
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-[#1A1A1A] border-border text-[#F8F8F8]"
              autoFocus 
            />
          </div>

          {error && (
            <div className="flex items-center bg-red-100 text-red-700 px-3 py-2 rounded-md text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#4757FF] text-white py-2 rounded-md hover:bg-[#4757FF]/90 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Continue"}
          </button>
        </form>
      </div>
    </main>
  );
}
