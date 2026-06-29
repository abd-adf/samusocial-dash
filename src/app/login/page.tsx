"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(false);
    setLoading(true);

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/");
    } else {
      setError(true);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex justify-center mb-6">
            <img src="/logos/adfinitas.png" alt="Adfinitas" className="h-10" />
          </div>
          <h1 className="text-lg font-semibold text-center text-gray-800 mb-1">
            Reporting Dashboard
          </h1>
          <p className="text-sm text-center text-gray-500 mb-6">
            Accès réservé — entrez le mot de passe
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
                autoFocus
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 text-center">
                Mot de passe incorrect
              </p>
            )}
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Connexion…" : "Accéder au dashboard"}
            </button>
          </form>
        </div>
        <p className="text-xs text-gray-400 text-center mt-4">
          New Samusocial ASBL
        </p>
      </div>
    </div>
  );
}
