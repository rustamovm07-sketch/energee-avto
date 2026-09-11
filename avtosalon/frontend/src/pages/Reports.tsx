import React, { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { dashboardService } from "../services/miscServices";
import { saleService } from "../services/miscServices";
import { DashboardStats, Sale, PaymentType } from "../types";
import { LoadingState } from "../components/Feedback";

const paymentLabels: Record<PaymentType, string> = {
  cash: "Naqd",
  card: "Karta",
  bank: "Bank",
};

/**
 * V1 reports: simple, real, DB-backed breakdowns built on top of
 * existing endpoints (dashboard stats + sales list). No separate
 * reporting backend needed yet - this is intentionally simple and can
 * grow into a dedicated /api/reports module later without breaking
 * anything here.
 */
const ReportsPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([dashboardService.stats(), saleService.list()])
      .then(([statsRes, salesRes]) => {
        setStats(statsRes.data);
        setSales(salesRes.data);
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <MainLayout title="Hisobotlar">
        <LoadingState />
      </MainLayout>
    );
  }

  const byPaymentType = sales.reduce<Record<string, { count: number; total: number }>>((acc, s) => {
    const key = s.payment_type;
    if (!acc[key]) acc[key] = { count: 0, total: 0 };
    acc[key].count += 1;
    acc[key].total += Number(s.price);
    return acc;
  }, {});

  return (
    <MainLayout title="Hisobotlar">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded border border-line bg-white p-4">
            <p className="text-sm text-muted">Jami sotuvlar</p>
            <p className="mt-1 font-display text-2xl font-semibold text-ink2">{stats?.total_sales ?? 0}</p>
          </div>
          <div className="rounded border border-line bg-white p-4">
            <p className="text-sm text-muted">Jami tushum</p>
            <p className="mt-1 font-display text-2xl font-semibold text-steel">
              {Number(stats?.total_revenue ?? 0).toLocaleString("uz-UZ")} so'm
            </p>
          </div>
          <div className="rounded border border-line bg-white p-4">
            <p className="text-sm text-muted">Sotuvda</p>
            <p className="mt-1 font-display text-2xl font-semibold text-leaf">{stats?.available_cars ?? 0}</p>
          </div>
          <div className="rounded border border-line bg-white p-4">
            <p className="text-sm text-muted">Sotilgan</p>
            <p className="mt-1 font-display text-2xl font-semibold text-rust">{stats?.sold_cars ?? 0}</p>
          </div>
        </div>

        <div className="rounded border border-line bg-white">
          <div className="border-b border-line px-5 py-4">
            <h2 className="font-display text-base font-semibold text-ink2">To'lov turlari bo'yicha</h2>
          </div>
          {Object.keys(byPaymentType).length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">Ma'lumot yo'q</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-muted">
                  <th className="px-5 py-3">To'lov turi</th>
                  <th className="px-5 py-3">Sotuvlar soni</th>
                  <th className="px-5 py-3">Jami summa</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(byPaymentType).map(([type, data]) => (
                  <tr key={type} className="border-b border-line last:border-0">
                    <td className="px-5 py-3 text-ink2">{paymentLabels[type as PaymentType] || type}</td>
                    <td className="px-5 py-3 text-ink2">{data.count}</td>
                    <td className="px-5 py-3 font-medium text-steel">
                      {data.total.toLocaleString("uz-UZ")} so'm
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ReportsPage;
