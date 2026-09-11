import React, { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../context/AuthContext";
import { applicationService } from "../services/customerService";
import { Application, ApplicationStatus } from "../types";
import { LoadingState, EmptyState, ApplicationStatusBadge, ErrorBanner } from "../components/Feedback";
import { extractErrorMessage } from "../services/api";

const statusOptions: ApplicationStatus[] = ["new", "contacted", "completed", "cancelled"];

const statusLabels: Record<ApplicationStatus, string> = {
  new: "Yangi",
  contacted: "Bog'lanildi",
  completed: "Bajarildi",
  cancelled: "Bekor qilindi",
};

const ApplicationsPage: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const canManage = user?.role === "director" || user?.role === "worker";

  const load = async () => {
    setIsLoading(true);
    try {
      const { data } = await applicationService.list();
      setApplications(data);
    } catch {
      setError("Arizalarni yuklab bo'lmadi");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleStatusChange = async (app: Application, status: ApplicationStatus) => {
    try {
      const { data } = await applicationService.update(app.id, { status });
      setApplications((prev) => prev.map((a) => (a.id === app.id ? data : a)));
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const title = user?.role === "customer" ? "Mening arizalarim" : "Arizalar";

  return (
    <MainLayout title={title}>
      {error && <div className="mb-4"><ErrorBanner message={error} /></div>}

      {isLoading ? (
        <LoadingState />
      ) : applications.length === 0 ? (
        <EmptyState title="Arizalar yo'q" description="Hozircha hech qanday ariza mavjud emas." />
      ) : (
        <div className="overflow-hidden rounded border border-line bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-muted">
                <th className="px-5 py-3">Avtomobil</th>
                {canManage && <th className="px-5 py-3">Xaridor</th>}
                <th className="px-5 py-3">Telefon</th>
                <th className="px-5 py-3">Xabar</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Sana</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3 text-ink2">
                    {app.car ? `${app.car.brand} ${app.car.model}` : "-"}
                  </td>
                  {canManage && (
                    <td className="px-5 py-3 text-ink2">
                      {app.customer ? `${app.customer.first_name} ${app.customer.last_name}` : "-"}
                    </td>
                  )}
                  <td className="px-5 py-3 text-ink2">{app.phone || "-"}</td>
                  <td className="max-w-[220px] truncate px-5 py-3 text-muted">{app.message || "-"}</td>
                  <td className="px-5 py-3">
                    {canManage ? (
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app, e.target.value as ApplicationStatus)}
                        className="rounded border border-line bg-white px-2 py-1 text-xs outline-none focus:border-steel"
                      >
                        {statusOptions.map((s) => (
                          <option key={s} value={s}>
                            {statusLabels[s]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <ApplicationStatusBadge status={app.status} />
                    )}
                  </td>
                  <td className="px-5 py-3 text-muted">
                    {new Date(app.created_at).toLocaleDateString("uz-UZ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </MainLayout>
  );
};

export default ApplicationsPage;
