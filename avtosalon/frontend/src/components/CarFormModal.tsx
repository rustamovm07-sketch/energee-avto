import React, { useState } from "react";
import { Car, CarStatus } from "../types";
import { carService } from "../services/carService";
import { extractErrorMessage } from "../services/api";
import { ErrorBanner } from "./Feedback";

interface CarFormModalProps {
  car: Car | null;
  onClose: () => void;
  onSaved: () => void;
}

const CarFormModal: React.FC<CarFormModalProps> = ({ car, onClose, onSaved }) => {
  const isEditing = !!car;

  const [form, setForm] = useState({
    brand: car?.brand || "",
    model: car?.model || "",
    year: car?.year || new Date().getFullYear(),
    color: car?.color || "",
    price: car?.price || "",
    vin: car?.vin || "",
    mileage: car?.mileage || 0,
    description: car?.description || "",
    image: car?.image || "",
    status: car?.status || ("available" as CarStatus),
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const payload = {
        brand: form.brand,
        model: form.model,
        year: Number(form.year),
        color: form.color || undefined,
        price: Number(form.price),
        vin: form.vin,
        mileage: Number(form.mileage) || 0,
        description: form.description || undefined,
        image: form.image || undefined,
      };

      if (isEditing && car) {
        await carService.update(car.id, { ...payload, status: form.status });
      } else {
        await carService.create(payload);
      }
      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink2">
            {isEditing ? "Avtomobilni tahrirlash" : "Yangi avtomobil qo'shish"}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-ink2">
            ✕
          </button>
        </div>

        {error && <div className="mb-4"><ErrorBanner message={error} /></div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted">Brand</label>
              <input
                required
                value={form.brand}
                onChange={update("brand")}
                className="w-full rounded border border-line px-3 py-2 text-sm outline-none focus:border-steel"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Model</label>
              <input
                required
                value={form.model}
                onChange={update("model")}
                className="w-full rounded border border-line px-3 py-2 text-sm outline-none focus:border-steel"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted">Yil</label>
              <input
                type="number"
                required
                value={form.year}
                onChange={update("year")}
                className="w-full rounded border border-line px-3 py-2 text-sm outline-none focus:border-steel"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Rang</label>
              <input
                value={form.color}
                onChange={update("color")}
                className="w-full rounded border border-line px-3 py-2 text-sm outline-none focus:border-steel"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Probeg (km)</label>
              <input
                type="number"
                value={form.mileage}
                onChange={update("mileage")}
                className="w-full rounded border border-line px-3 py-2 text-sm outline-none focus:border-steel"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted">Narx (so'm)</label>
              <input
                type="number"
                required
                value={form.price}
                onChange={update("price")}
                className="w-full rounded border border-line px-3 py-2 text-sm outline-none focus:border-steel"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">VIN</label>
              <input
                required
                value={form.vin}
                onChange={update("vin")}
                className="w-full rounded border border-line px-3 py-2 text-sm outline-none focus:border-steel"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted">Rasm URL</label>
            <input
              value={form.image}
              onChange={update("image")}
              placeholder="https://..."
              className="w-full rounded border border-line px-3 py-2 text-sm outline-none focus:border-steel"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted">Tavsif</label>
            <textarea
              value={form.description}
              onChange={update("description")}
              rows={3}
              className="w-full rounded border border-line px-3 py-2 text-sm outline-none focus:border-steel"
            />
          </div>

          {isEditing && (
            <div>
              <label className="mb-1 block text-xs text-muted">Status</label>
              <select
                value={form.status}
                onChange={update("status")}
                className="w-full rounded border border-line px-3 py-2 text-sm outline-none focus:border-steel"
              >
                <option value="available">Sotuvda</option>
                <option value="reserved">Band qilingan</option>
                <option value="sold" disabled={car?.status !== "sold"}>
                  Sotilgan
                </option>
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-line px-4 py-2 text-sm text-ink2 hover:bg-canvas"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded bg-steel px-4 py-2 text-sm font-medium text-white hover:bg-steel-dark disabled:opacity-60"
            >
              {isSubmitting ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CarFormModal;
