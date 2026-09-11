import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ErrorBanner } from "../components/Feedback";

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login({ identifier, password });
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Kirishda xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm rounded border border-white/10 bg-slate p-8">
        <div className="mb-6 text-center">
          <p className="text-2xl">🚗</p>
          <h1 className="mt-2 font-display text-xl font-semibold text-white">Avtosalon</h1>
          <p className="mt-1 text-sm text-white/50">Tizimga kirish</p>
        </div>

        {error && <div className="mb-4"><ErrorBanner message={error} /></div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-white/70">Email yoki telefon</label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full rounded border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:border-steel"
              placeholder="email@misol.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-white/70">Parol</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:border-steel"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded bg-steel py-2.5 text-sm font-medium text-white transition-colors hover:bg-steel-dark disabled:opacity-60"
          >
            {isSubmitting ? "Kirilmoqda..." : "Kirish"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-white/50">
          Hisobingiz yo'qmi?{" "}
          <Link to="/register" className="font-medium text-steel-light hover:underline">
            Ro'yxatdan o'tish
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
