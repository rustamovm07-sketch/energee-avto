import React, { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../context/AuthContext";
import { saleService } from "../services/miscServices";
import { carService } from "../services/carService";
import { customerService } from "../services/customerService";
import { Sale, Car, User, PaymentType } from "../types";
import { LoadingState, EmptyState, ErrorBanner } from "../components/Feedback";
import { extractErrorMessage } from "../services/api";

const paymentLabels: Record<PaymentType, string> = {
  cash: "Naqd",
  card: "Karta",
  bank: "Bank",
};

const SalesPage: React.FC = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [availableCars, setAvailableCars] = useState<Car[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [carId, setCarId] = useState<number | "">("");
  const [customerId, setCustomerId] = useState<number | "">("");
  const [price, setPrice] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType>("cash");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = async (searchTerm?: string) => {
    setIsLoading(true);
    try {
      const { data } = await saleService.list(searchTerm ? { search: searchTerm } : {});
      setSales(data);
    } catch {
      setError("Sotuvlarni yuklab bo'lmadi");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openForm = async () => {
    setShowForm(true);
    const [carsRes, customersRes] = await Promise.all([
      carService.list({ status: "available" }),
      customerService.list(),
    ]);
    setAvailableCars(carsRes.data);
    setCustomers(customersRes.data);
  };

  const handleCarSelect = (id: number) => {
    setCarId(id);
    const car = availableCars.find((c) => c.id === id);
    if (car) setPrice(car.price);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carId || !customerId) return;
    setFormError("");
    setIsSubmitting(true);
    try {
      await saleService.create({
        car_id: carId,
        customer_id: customerId,
        price: Number(price),
        payment_type: paymentType,
      });
      setShowForm(false);
      setCarId("");
      setCustomerId("");
      setPrice("");
      load();
    } catch (err) {
      setFormError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = user?.role === "worker" ? "Mening sotuvlarim" : "Sotuvlar";

  return (
    <MainLayout title={title}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load(search);
          }}
          className="flex flex-1 gap-3"
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Avtomobil yoki xaridor bo'yicha qidirish..."
            className="w-full max-w-sm rounded border border-line bg-white px-3 py-2 text-sm outline-none focus:border-steel"
          />
          <button type="submit" className="rounded border border-line bg-white px-4 py-2 text-sm hover:bg-canvas">
            Qidirish
          </button>
        </form>
        <button
          onClick={openForm}
          className="whitespace-nowrap rounded bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal-light"
        >
          + Yangi sotuv
        </button>
      </div>

      {error && <div className="mb-4"><ErrorBanner message={error} /></div>}

      {isLoading ? (
        <LoadingState />
      ) : sales.length === 0 ? (
        <EmptyState title="Sotuvlar yo'q" />
      ) : (
        <div className="overflow-hidden rounded border border-line bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-muted">
                <th className="px-5 py-3">Avtomobil</th>
                <th className="px-5 py-3">Xaridor</th>
                {user?.role === "director" && <th className="px-5 py-3">Ishchi</th>}
                <th className="px-5 py-3">Narx</th>
                <th className="px-5 py-3">To'lov turi</th>
                <th className="px-5 py-3">Sana</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3 text-ink2">{s.car ? `${s.car.brand} ${s.car.model}` : "-"}</td>
                  <td className="px-5 py-3 text-ink2">
                    {s.customer ? `${s.customer.first_name} ${s.customer.last_name}` : "-"}
                  </td>
                  {user?.role === "director" && (
                    <td className="px-5 py-3 text-ink2">
                      {s.worker ? `${s.worker.first_name} ${s.worker.last_name}` : "-"}
                    </td>
                  )}
                  <td className="px-5 py-3 font-medium text-steel">
                    {Number(s.price).toLocaleString("uz-UZ")} so'm
                  </td>
                  <td className="px-5 py-3 text-ink2">{paymentLabels[s.payment_type]}</td>
                  <td className="px-5 py-3 text-muted">{new Date(s.created_at).toLocaleDateString("uz-UZ")}</td>
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
              <h2 className="font-display text-lg font-semibold text-ink2">Yangi sotuv yaratish</h2>
              <button onClick={() => setShowForm(false)} className="text-muted hover:text-ink2">
                ✕
              </button>
            </div>
            {formError && <div className="mb-3"><ErrorBanner message={formError} /></div>}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-muted">Avtomobil</label>
                <select
                  required
                  value={carId}
                  onChange={(e) => handleCarSelect(Number(e.target.value))}
                  className="w-full rounded border border-line px-3 py-2 text-sm outline-none focus:border-steel"
                >
                  <option value="">Tanlang</option>
                  {availableCars.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.brand} {c.model} ({c.year}) - {Number(c.price).toLocaleString("uz-UZ")} so'm
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Xaridor</label>
                <select
                  required
                  value={customerId}
                  onChange={(e) => setCustomerId(Number(e.target.value))}
                  className="w-full rounded border border-line px-3 py-2 text-sm outline-none focus:border-steel"
                >
                  <option value="">Tanlang</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.first_name} {c.last_name} - {c.phone}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Narx (so'm)</label>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full rounded border border-line px-3 py-2 text-sm outline-none focus:border-steel"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">To'lov turi</label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                  className="w-full rounded border border-line px-3 py-2 text-sm outline-none focus:border-steel"
                >
                  <option value="cash">Naqd</option>
                  <option value="card">Karta</option>
                  <option value="bank">Bank</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded bg-steel py-2.5 text-sm font-medium text-white hover:bg-steel-dark disabled:opacity-60"
              >
                {isSubmitting ? "Yaratilmoqda..." : "Sotuvni yaratish"}
              </button>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default SalesPage;
