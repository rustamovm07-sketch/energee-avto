import React, { useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../context/AuthContext";
import { customerService } from "../services/customerService";
import { ErrorBanner, SuccessBanner } from "../components/Feedback";
import { extractErrorMessage } from "../services/api";

const roleLabels: Record<string, string> = {
  director: "Direktor",
  worker: "Ishchi",
  customer: "Xaridor",
};

const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();

  const [form, setForm] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    phone: user?.phone || "",
    email: user?.email || "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsSubmitting(true);
    try {
      await customerService.updateMyProfile(form);
      await refreshUser();
      setSuccess(true);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <MainLayout title="Profil">
      <div className="max-w-md space-y-4">
        <div className="rounded border border-line bg-white p-5">
          <p className="text-sm text-muted">Rol</p>
          <p className="mt-1 font-display text-base font-semibold text-ink2">{roleLabels[user.role]}</p>
        </div>

        <div className="rounded border border-line bg-white p-5">
          {error && <div className="mb-3"><ErrorBanner message={error} /></div>}
          {success && <div className="mb-3"><SuccessBanner message="Profil muvaffaqiyatli yangilandi" /></div>}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-muted">Ism</label>
                <input
                  value={form.first_name}
                  onChange={update("first_name")}
                  className="w-full rounded border border-line px-3 py-2 text-sm outline-none focus:border-steel"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Familiya</label>
                <input
                  value={form.last_name}
                  onChange={update("last_name")}
                  className="w-full rounded border border-line px-3 py-2 text-sm outline-none focus:border-steel"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Telefon</label>
              <input
                value={form.phone}
                onChange={update("phone")}
                className="w-full rounded border border-line px-3 py-2 text-sm outline-none focus:border-steel"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={update("email")}
                className="w-full rounded border border-line px-3 py-2 text-sm outline-none focus:border-steel"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded bg-steel py-2.5 text-sm font-medium text-white hover:bg-steel-dark disabled:opacity-60"
            >
              {isSubmitting ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProfilePage;
