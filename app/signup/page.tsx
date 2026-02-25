"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
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
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error || "Signup failed");
        return;
      }

      localStorage.setItem("userEmail", data.user.email);
      window.location.assign("/dashboard");
    } catch (err) {
      console.error("Signup error:", err);
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0e0e0e] text-[#eaeaea]">
      <div className="w-full max-w-md bg-[#151515] border border-[#222] rounded-lg p-8">

        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">
            Create your <span className="text-[#4f7cff]">PromptLens</span> account
          </h1>
          <p className="mt-2 text-sm text-[#9a9a9a]">
            Sign up to start comparing model outputs
          </p>
        </div>

        {/* Form */}
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
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-[#9a9a9a]">
          Already have an account?{" "}
          <a href="/login" className="text-[#4f7cff] hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </main>
  );
}