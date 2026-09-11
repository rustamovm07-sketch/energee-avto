import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ErrorBanner } from "../components/Feedback";

const initialForm = {
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  password: "",
  password_confirm: "",
};

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (field: keyof typeof initialForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.password_confirm) {
      setError("Parollar bir xil emas");
      return;
    }

    setIsSubmitting(true);
    try {
      await register(form);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Ro'yxatdan o'tishda xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4 py-10">
      <div className="w-full max-w-md rounded border border-white/10 bg-slate p-8">
        <div className="mb-6 text-center">
          <p className="text-2xl">🚗</p>
          <h1 className="mt-2 font-display text-xl font-semibold text-white">Ro'yxatdan o'tish</h1>
          <p className="mt-1 text-sm text-white/50">Xaridor sifatida hisob yarating</p>
        </div>

        {error && <div className="mb-4"><ErrorBanner message={error} /></div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-white/70">Ism</label>
              <input
                required
                value={form.first_name}
                onChange={update("first_name")}
                className="w-full rounded border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:border-steel"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/70">Familiya</label>
              <input
                required
                value={form.last_name}
                onChange={update("last_name")}
                className="w-full rounded border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:border-steel"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-white/70">Telefon</label>
            <input
              required
              value={form.phone}
              onChange={update("phone")}
              placeholder="+998901234567"
              className="w-full rounded border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:border-steel"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-white/70">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={update("email")}
              className="w-full rounded border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:border-steel"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-white/70">Parol</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={update("password")}
                className="w-full rounded border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:border-steel"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/70">Parolni tasdiqlang</label>
              <input
                type="password"
                required
                value={form.password_confirm}
                onChange={update("password_confirm")}
                className="w-full rounded border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:border-steel"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded bg-steel py-2.5 text-sm font-medium text-white transition-colors hover:bg-steel-dark disabled:opacity-60"
          >
            {isSubmitting ? "Yaratilmoqda..." : "Hisob yaratish"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-white/50">
          Hisobingiz bormi?{" "}
          <Link to="/login" className="font-medium text-steel-light hover:underline">
            Kirish
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
