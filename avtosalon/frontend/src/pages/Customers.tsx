import React, { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { customerService } from "../services/customerService";
import { User, Application, Sale } from "../types";
import { LoadingState, EmptyState, ErrorBanner, ApplicationStatusBadge } from "../components/Feedback";

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState<User | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = async (searchTerm?: string) => {
    setIsLoading(true);
    try {
      const { data } = await customerService.list(searchTerm);
      setCustomers(data);
    } catch {
      setError("Xaridorlarni yuklab bo'lmadi");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openDetail = async (customer: User) => {
    setSelected(customer);
    setDetailLoading(true);
    try {
      const [appsRes, salesRes] = await Promise.all([
        customerService.getApplications(customer.id),
        customerService.getSales(customer.id),
      ]);
      setApplications(appsRes.data);
      setSales(salesRes.data as Sale[]);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <MainLayout title="Xaridorlar">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          load(search);
        }}
        className="mb-4 flex gap-3"
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ism yoki telefon bo'yicha qidirish..."
          className="w-full max-w-sm rounded border border-line bg-white px-3 py-2 text-sm outline-none focus:border-steel"
        />
        <button type="submit" className="rounded bg-steel px-4 py-2 text-sm font-medium text-white hover:bg-steel-dark">
          Qidirish
        </button>
      </form>

      {error && <div className="mb-4"><ErrorBanner message={error} /></div>}

      {isLoading ? (
        <LoadingState />
      ) : customers.length === 0 ? (
        <EmptyState title="Xaridorlar yo'q" />
      ) : (
        <div className="overflow-hidden rounded border border-line bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-muted">
                <th className="px-5 py-3">Ism</th>
                <th className="px-5 py-3">Telefon</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Ro'yxatdan o'tgan</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3 text-ink2">
                    {c.first_name} {c.last_name}
                  </td>
                  <td className="px-5 py-3 text-ink2">{c.phone}</td>
                  <td className="px-5 py-3 text-ink2">{c.email}</td>
                  <td className="px-5 py-3 text-muted">
                    {new Date(c.created_at).toLocaleDateString("uz-UZ")}
                  </td>
                  <td className="px-5 py-3">
                    <button onClick={() => openDetail(c)} className="text-xs font-medium text-steel hover:underline">
                      Batafsil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink2">
                {selected.first_name} {selected.last_name}
              </h2>
              <button onClick={() => setSelected(null)} className="text-muted hover:text-ink2">
                ✕
              </button>
            </div>
            <p className="text-sm text-muted">{selected.phone} • {selected.email}</p>

            {detailLoading ? (
              <LoadingState />
            ) : (
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="mb-2 font-display text-sm font-semibold text-ink2">
                    Arizalar ({applications.length})
                  </h3>
                  {applications.length === 0 ? (
                    <p className="text-sm text-muted">Arizalar yo'q</p>
                  ) : (
                    <ul className="space-y-2">
                      {applications.map((a) => (
                        <li key={a.id} className="flex items-center justify-between rounded border border-line px-3 py-2 text-sm">
                          <span>{a.car ? `${a.car.brand} ${a.car.model}` : "-"}</span>
                          <ApplicationStatusBadge status={a.status} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h3 className="mb-2 font-display text-sm font-semibold text-ink2">
                    Sotib olganlari ({sales.length})
                  </h3>
                  {sales.length === 0 ? (
                    <p className="text-sm text-muted">Hozircha xarid yo'q</p>
                  ) : (
                    <ul className="space-y-2">
                      {sales.map((s) => (
                        <li key={s.id} className="flex items-center justify-between rounded border border-line px-3 py-2 text-sm">
                          <span>{s.car ? `${s.car.brand} ${s.car.model}` : "-"}</span>
                          <span className="font-medium text-steel">
                            {Number(s.price).toLocaleString("uz-UZ")} so'm
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default CustomersPage;
