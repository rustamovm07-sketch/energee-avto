import React, { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { workerService, WorkerCreatePayload } from "../services/workerService";
import { User } from "../types";
import { LoadingState, EmptyState, ErrorBanner } from "../components/Feedback";
import { extractErrorMessage } from "../services/api";

const initialForm: WorkerCreatePayload = {
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  password: "",
};

const WorkersPage: React.FC = () => {
  const [workers, setWorkers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const { data } = await workerService.list();
      setWorkers(data);
    } catch {
      setError("Ishchilarni yuklab bo'lmadi");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const update = (field: keyof WorkerCreatePayload) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);
    try {
      await workerService.create(form);
      setForm(initialForm);
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (worker: User) => {
    const { data } = await workerService.toggleActive(worker.id);
    setWorkers((prev) => prev.map((w) => (w.id === worker.id ? data : w)));
  };

  const handleDelete = async (worker: User) => {
    if (!confirm(`${worker.first_name} ${worker.last_name}ni o'chirishni tasdiqlaysizmi?`)) return;
    await workerService.remove(worker.id);
    setWorkers((prev) => prev.filter((w) => w.id !== worker.id));
  };

  return (
    <MainLayout title="Ishchilar">
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setShowForm(true)}
          className="rounded bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal-light"
        >
          + Ishchi qo'shish
        </button>
      </div>

      {error && <div className="mb-4"><ErrorBanner message={error} /></div>}

      {isLoading ? (
        <LoadingState />
      ) : workers.length === 0 ? (
        <EmptyState title="Ishchilar yo'q" description="Birinchi ishchini qo'shish uchun tugmani bosing." />
      ) : (
        <div className="overflow-hidden rounded border border-line bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-muted">
                <th className="px-5 py-3">Ism</th>
                <th className="px-5 py-3">Telefon</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Yaratilgan</th>
                <th className="px-5 py-3">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {workers.map((worker) => (
                <tr key={worker.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3 text-ink2">
                    {worker.first_name} {worker.last_name}
                  </td>
                  <td className="px-5 py-3 text-ink2">{worker.phone}</td>
                  <td className="px-5 py-3 text-ink2">{worker.email}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded border px-2 py-0.5 text-xs ${
                        worker.is_active
                          ? "border-leaf/30 bg-leaf/10 text-leaf"
                          : "border-rust/30 bg-rust/10 text-rust"
                      }`}
                    >
                      {worker.is_active ? "Aktiv" : "Bloklangan"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted">
                    {new Date(worker.created_at).toLocaleDateString("uz-UZ")}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleToggleActive(worker)}
                        className="text-xs font-medium text-steel hover:underline"
                      >
                        {worker.is_active ? "Bloklash" : "Aktivlashtirish"}
                      </button>
                      <button
                        onClick={() => handleDelete(worker)}
                        className="text-xs font-medium text-rust hover:underline"
                      >
                        O'chirish
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
          <div className="w-full max-w-md rounded bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink2">Yangi ishchi qo'shish</h2>
              <button onClick={() => setShowForm(false)} className="text-muted hover:text-ink2">
                ✕
              </button>
            </div>
            {formError && <div className="mb-3"><ErrorBanner message={formError} /></div>}
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-muted">Ism</label>
                  <input
                    required
                    value={form.first_name}
                    onChange={update("first_name")}
                    className="w-full rounded border border-line px-3 py-2 text-sm outline-none focus:border-steel"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">Familiya</label>
                  <input
                    required
                    value={form.last_name}
                    onChange={update("last_name")}
                    className="w-full rounded border border-line px-3 py-2 text-sm outline-none focus:border-steel"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Telefon</label>
                <input
                  required
                  value={form.phone}
                  onChange={update("phone")}
                  placeholder="+998901234567"
                  className="w-full rounded border border-line px-3 py-2 text-sm outline-none focus:border-steel"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={update("email")}
                  className="w-full rounded border border-line px-3 py-2 text-sm outline-none focus:border-steel"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Parol</label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={update("password")}
                  className="w-full rounded border border-line px-3 py-2 text-sm outline-none focus:border-steel"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded bg-steel py-2.5 text-sm font-medium text-white hover:bg-steel-dark disabled:opacity-60"
              >
                {isSubmitting ? "Yaratilmoqda..." : "Yaratish"}
              </button>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default WorkersPage;
