import React, { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { paymentService } from "../services/miscServices";
import { Payment, PaymentType } from "../types";
import { LoadingState, EmptyState, ErrorBanner } from "../components/Feedback";

const paymentLabels: Record<PaymentType, string> = {
  cash: "Naqd",
  card: "Karta",
  bank: "Bank",
};

const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    paymentService
      .list()
      .then((res) => setPayments(res.data))
      .catch(() => setError("To'lovlarni yuklab bo'lmadi"))
      .finally(() => setIsLoading(false));
  }, []);

  const total = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <MainLayout title="To'lovlar">
      {error && <div className="mb-4"><ErrorBanner message={error} /></div>}

      {isLoading ? (
        <LoadingState />
      ) : payments.length === 0 ? (
        <EmptyState title="To'lovlar yo'q" />
      ) : (
        <div className="space-y-4">
          <div className="rounded border border-line bg-white p-4">
            <p className="text-sm text-muted">Jami tushum</p>
            <p className="mt-1 font-display text-2xl font-semibold text-steel">
              {total.toLocaleString("uz-UZ")} so'm
            </p>
          </div>

          <div className="overflow-hidden rounded border border-line bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-muted">
                  <th className="px-5 py-3">Sotuv ID</th>
                  <th className="px-5 py-3">Summa</th>
                  <th className="px-5 py-3">To'lov turi</th>
                  <th className="px-5 py-3">Sana</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-line last:border-0">
                    <td className="px-5 py-3 text-ink2">#{p.sale_id}</td>
                    <td className="px-5 py-3 font-medium text-steel">
                      {Number(p.amount).toLocaleString("uz-UZ")} so'm
                    </td>
                    <td className="px-5 py-3 text-ink2">{paymentLabels[p.payment_type]}</td>
                    <td className="px-5 py-3 text-muted">{new Date(p.created_at).toLocaleDateString("uz-UZ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default PaymentsPage;
