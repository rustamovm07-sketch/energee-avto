import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../context/AuthContext";
import { dashboardService } from "../services/miscServices";
import { carService } from "../services/carService";
import { applicationService } from "../services/customerService";
import { saleService } from "../services/miscServices";
import { DashboardStats, Car, Application, Sale } from "../types";
import { LoadingState } from "../components/Feedback";
import { CarStatusBadge, ApplicationStatusBadge } from "../components/Feedback";
import CarCard from "../components/CarCard";
import { GlassCard, CardGrid, StatBox, Badge, GlassContainer } from "../components/GlassComponents";

function formatMoney(value: string | number): string {
  return Number(value).toLocaleString("uz-UZ") + " so'm";
}

const DirectorDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    dashboardService
      .stats()
      .then((res) => setStats(res.data))
      .catch(() => setError("Statistikani yuklab bo'lmadi"));
  }, []);

  if (error) return <p className="text-red-400">{error}</p>;
  if (!stats) return <LoadingState />;

  const statItems = [
    { icon: "🚘", label: "Jami avtomobillar", value: stats.total_cars, trend: "up" as const },
    { icon: "📊", label: "Sotuvda", value: stats.available_cars, trend: "up" as const },
    { icon: "✅", label: "Sotilgan", value: stats.sold_cars, trend: "up" as const },
    { icon: "👥", label: "Xaridorlar", value: stats.total_customers, trend: null },
    { icon: "👨‍💼", label: "Ishchilar", value: stats.total_workers, trend: null },
    { icon: "💰", label: "Sotuvlar", value: stats.total_sales, trend: "up" as const },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div>
        <h2 className="text-xl font-bold text-gradient mb-4">Asosiy Ko'rsatkichlar</h2>
        <CardGrid items={statItems.map((stat, idx) => (
          <StatBox key={stat.label} {...stat} animationDelay={idx * 100} />
        ))} cols={3} />
      </div>

      {/* Revenue Card */}
      <GlassContainer className="animate-fade-in-up">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-gray-400 text-sm mb-2">Jami Tushum</p>
            <h3 className="text-4xl font-bold text-gradient">{formatMoney(stats.total_revenue)}</h3>
            <p className="text-xs text-gray-400 mt-3">Bu oyda: +12%</p>
          </div>
          <div className="text-5xl opacity-30">💵</div>
        </div>
      </GlassContainer>

      {/* Recent Sales Table */}
      <GlassCard className="p-0 overflow-hidden animate-slide-in-up">
        <div className="glass-light px-6 py-4 border-b border-opacity-10">
          <h2 className="text-lg font-bold text-gradient">📊 Oxirgi Sotuvlar</h2>
        </div>
        {stats.recent_sales.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-gray-400">Hozircha sotuvlar yo'q</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-opacity-10 text-left text-gray-400">
                  <th className="px-6 py-4">Avtomobil</th>
                  <th className="px-6 py-4">Xaridor</th>
                  <th className="px-6 py-4">Ishchi</th>
                  <th className="px-6 py-4">Narx</th>
                  <th className="px-6 py-4">Sana</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_sales.map((sale, idx) => (
                  <tr key={sale.id} className="border-b border-opacity-5 hover:glass-accent transition-all duration-300" style={{animation: `fadeInUp 0.5s ease-out ${idx * 50}ms backwards`}}>
                    <td className="px-6 py-4 font-medium">
                      {sale.car ? `${sale.car.brand} ${sale.car.model}` : "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {sale.customer ? `${sale.customer.first_name} ${sale.customer.last_name}` : "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {sale.worker ? `${sale.worker.first_name} ${sale.worker.last_name}` : "-"}
                    </td>
                    <td className="px-6 py-4 text-gradient font-bold">{formatMoney(sale.price)}</td>
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(sale.created_at).toLocaleDateString("uz-UZ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

const WorkerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([applicationService.list(), saleService.list()])
      .then(([appsRes, salesRes]) => {
        setApplications(appsRes.data);
        setSales(salesRes.data);
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <LoadingState />;

  const newApplications = applications.filter((a) => a.status === "new");

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div>
        <h2 className="text-xl font-bold text-gradient mb-4">Mening Statistikam</h2>
        <CardGrid
          items={[
            <StatBox key="1" icon="📋" label="Yangi arizalar" value={newApplications.length} trend="up" animationDelay={0} />,
            <StatBox key="2" icon="📊" label="Jami arizalar" value={applications.length} trend={null} animationDelay={100} />,
            <StatBox key="3" icon="💰" label="Mening sotuvlarim" value={sales.length} trend="up" animationDelay={200} />,
          ]}
          cols={3}
        />
      </div>

      {/* New Applications */}
      <GlassCard className="p-0 overflow-hidden animate-fade-in-up">
        <div className="glass-light px-6 py-4 border-b border-opacity-10 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gradient">📋 Yangi Arizalar</h2>
          <button
            onClick={() => navigate("/applications")}
            className="text-xs text-steel-light hover:text-signal transition-colors"
          >
            Barchasini ko'rish →
          </button>
        </div>
        {newApplications.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-gray-400">Yangi arizalar yo'q</p>
        ) : (
          <div className="divide-y divide-opacity-5">
            {newApplications.slice(0, 5).map((app, idx) => (
              <div
                key={app.id}
                className="px-6 py-4 hover:glass-accent transition-all duration-300 cursor-pointer group"
                style={{ animation: `fadeInUp 0.5s ease-out ${idx * 80}ms backwards` }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white group-hover:text-gradient">
                      {app.customer ? `${app.customer.first_name} ${app.customer.last_name}` : "Xaridor"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {app.car ? `${app.car.brand} ${app.car.model}` : ""} • {app.phone}
                    </p>
                  </div>
                  <Badge text={app.status} variant="warning" />
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
};

const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cars, setCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    carService
      .list({ status: "available" })
      .then((res) => setCars(res.data.slice(0, 6)))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Card */}
      <GlassContainer className="animate-fade-in-up">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gradient">
              👋 Xush kelibsiz, {user?.first_name}!
            </h2>
            <p className="mt-2 text-gray-300">
              Sizga mos avtomobilni tanlang va ariza yuboring yoki sevimlilarga qo'shing.
            </p>
          </div>
          <div className="text-5xl opacity-30 animate-float">🚗</div>
        </div>
      </GlassContainer>

      {/* Featured Cars */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gradient">🚘 Sotuvdagi Avtomobillar</h3>
          <button
            onClick={() => navigate("/cars")}
            className="text-sm text-steel-light hover:text-signal transition-colors"
          >
            Barchasini ko'rish →
          </button>
        </div>
        {isLoading ? (
          <LoadingState />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {cars.map((car, idx) => (
              <div
                key={car.id}
                onClick={() => navigate(`/cars/${car.id}`)}
                style={{ animation: `fadeInUp 0.5s ease-out ${idx * 100}ms backwards` }}
              >
                <CarCard car={car} onClick={() => navigate(`/cars/${car.id}`)} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const title = "Dashboard";

  return (
    <MainLayout title={title}>
      {user?.role === "director" && <DirectorDashboard />}
      {user?.role === "worker" && <WorkerDashboard />}
      {user?.role === "customer" && <CustomerDashboard />}
    </MainLayout>
  );
};

export default DashboardPage;
