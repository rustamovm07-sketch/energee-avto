import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../context/AuthContext";
import { carService } from "../services/carService";
import { favoriteService } from "../services/miscServices";
import { applicationService } from "../services/customerService";
import { Car } from "../types";
import { CarStatusBadge, LoadingState, ErrorBanner, SuccessBanner } from "../components/Feedback";
import { extractErrorMessage } from "../services/api";

function formatPrice(price: string): string {
  return Number(price).toLocaleString("uz-UZ") + " so'm";
}

const CarDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [car, setCar] = useState<Car | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [isFavorite, setIsFavorite] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [applySuccess, setApplySuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    carService
      .get(Number(id))
      .then((res) => setCar(res.data))
      .catch(() => setError("Avtomobil topilmadi"))
      .finally(() => setIsLoading(false));

    if (user?.role === "customer") {
      favoriteService.list().then((res) => {
        setIsFavorite(res.data.some((f) => f.car_id === Number(id)));
      });
    }
  }, [id, user?.role]);

  const toggleFavorite = async () => {
    if (!car) return;
    if (isFavorite) {
      await favoriteService.remove(car.id);
      setIsFavorite(false);
    } else {
      await favoriteService.add(car.id);
      setIsFavorite(true);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!car) return;
    setApplyError("");
    setApplySubmitting(true);
    try {
      await applicationService.create({ car_id: car.id, phone, message });
      setApplySuccess(true);
      setShowApplyForm(false);
    } catch (err) {
      setApplyError(extractErrorMessage(err));
    } finally {
      setApplySubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="Avtomobil">
        <LoadingState />
      </MainLayout>
    );
  }

  if (error || !car) {
    return (
      <MainLayout title="Avtomobil">
        <ErrorBanner message={error || "Avtomobil topilmadi"} />
      </MainLayout>
    );
  }

  const isCustomer = user?.role === "customer";
  const canApply = isCustomer && car.status !== "sold";

  return (
    <MainLayout title={`${car.brand} ${car.model}`}>
      <button onClick={() => navigate(-1)} className="mb-4 text-sm text-steel hover:underline">
        ← Orqaga
      </button>

      {applySuccess && (
        <div className="mb-4">
          <SuccessBanner message="Arizangiz yuborildi. Tez orada siz bilan bog'lanamiz." />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex h-72 w-full items-center justify-center overflow-hidden rounded border border-line bg-slate">
            {car.image ? (
              <img src={car.image} alt={`${car.brand} ${car.model}`} className="h-full w-full object-cover" />
            ) : (
              <span className="text-5xl text-white/40">🚘</span>
            )}
          </div>

          {car.description && (
            <div className="mt-4 rounded border border-line bg-white p-4">
              <h3 className="mb-2 font-display text-sm font-semibold text-ink2">Tavsif</h3>
              <p className="text-sm text-muted">{car.description}</p>
            </div>
          )}
        </div>

        <div className="rounded border border-line bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink2">
              {car.brand} {car.model}
            </h2>
            <CarStatusBadge status={car.status} />
          </div>

          <p className="mb-4 font-display text-2xl font-semibold text-steel">{formatPrice(car.price)}</p>

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Yil</dt>
              <dd className="text-ink2">{car.year}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Rang</dt>
              <dd className="text-ink2">{car.color || "-"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Probeg</dt>
              <dd className="text-ink2">{car.mileage?.toLocaleString("uz-UZ") || 0} km</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">VIN</dt>
              <dd className="text-ink2">{car.vin}</dd>
            </div>
          </dl>

          {isCustomer && (
            <div className="mt-5 space-y-2">
              <button
                onClick={toggleFavorite}
                className="w-full rounded border border-line py-2.5 text-sm font-medium text-ink2 hover:bg-canvas"
              >
                {isFavorite ? "❤️ Sevimlilardan olib tashlash" : "🤍 Sevimlilarga qo'shish"}
              </button>
              {canApply && (
                <button
                  onClick={() => setShowApplyForm(true)}
                  className="w-full rounded bg-steel py-2.5 text-sm font-medium text-white hover:bg-steel-dark"
                >
                  📋 Ariza yuborish
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showApplyForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
          <div className="w-full max-w-md rounded bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink2">Ariza yuborish</h2>
              <button onClick={() => setShowApplyForm(false)} className="text-muted hover:text-ink2">
                ✕
              </button>
            </div>
            {applyError && <div className="mb-3"><ErrorBanner message={applyError} /></div>}
            <form onSubmit={handleApply} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-muted">Telefon</label>
                <input
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998901234567"
                  className="w-full rounded border border-line px-3 py-2 text-sm outline-none focus:border-steel"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Xabar</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Qo'shimcha savol yoki izoh..."
                  className="w-full rounded border border-line px-3 py-2 text-sm outline-none focus:border-steel"
                />
              </div>
              <button
                type="submit"
                disabled={applySubmitting}
                className="w-full rounded bg-steel py-2.5 text-sm font-medium text-white hover:bg-steel-dark disabled:opacity-60"
              >
                {applySubmitting ? "Yuborilmoqda..." : "Yuborish"}
              </button>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default CarDetailPage;
