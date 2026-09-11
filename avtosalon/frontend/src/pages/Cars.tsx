import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../context/AuthContext";
import { carService, CarFilters } from "../services/carService";
import { Car, CarStatus } from "../types";
import CarCard from "../components/CarCard";
import { LoadingState, EmptyState, ErrorBanner } from "../components/Feedback";
import CarFormModal from "../components/CarFormModal";
import { GlassContainer, AnimatedButton, FloatingLabelInput } from "../components/GlassComponents";

const CarsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cars, setCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("");
  const [status, setStatus] = useState<CarStatus | "">("");
  const [maxPrice, setMaxPrice] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);

  const loadCars = async () => {
    setIsLoading(true);
    setError("");
    try {
      const filters: CarFilters = {};
      if (search) filters.search = search;
      if (brand) filters.brand = brand;
      if (status) filters.status = status;
      if (maxPrice) filters.max_price = Number(maxPrice);

      const { data } = await carService.list(filters);
      setCars(data);
    } catch {
      setError("Avtomobillarni yuklab bo'lmadi");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCars();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCars();
  };

  const isDirector = user?.role === "director";

  return (
    <MainLayout title="Avtomobillar">
      <div className="space-y-8">
        {/* Filters Card */}
        <GlassContainer className="animate-fade-in-up">
          <form onSubmit={handleFilterSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search Input */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">🔍 Qidiruv</label>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Brand, model, VIN..."
                  className="input-glass w-full"
                />
              </div>

              {/* Brand Input */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">🏷️ Brand</label>
                <input
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Avtomobil brendi..."
                  className="input-glass w-full"
                />
              </div>

              {/* Status Select */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">📊 Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CarStatus | "")}
                  className="input-glass w-full appearance-none"
                >
                  <option value="">Barchasi</option>
                  <option value="available">Sotuvda</option>
                  <option value="reserved">Band qilingan</option>
                  <option value="sold">Sotilgan</option>
                </select>
              </div>

              {/* Price Input */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">💰 Max Narx</label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Maksimal narx..."
                  className="input-glass w-full"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <AnimatedButton variant="primary" onClick={handleFilterSubmit}>
                🔍 Filtrlash
              </AnimatedButton>
              
              {isDirector && (
                <AnimatedButton
                  variant="secondary"
                  onClick={() => {
                    setEditingCar(null);
                    setShowForm(true);
                  }}
                >
                  ➕ Avtomobil Qo'shish
                </AnimatedButton>
              )}
            </div>
          </form>
        </GlassContainer>

        {/* Results */}
        {error && <ErrorBanner message={error} />}

        {isLoading ? (
          <LoadingState />
        ) : cars.length === 0 ? (
          <EmptyState
            title="Avtomobil topilmadi"
            description="Filtrni o'zgartirib qayta urinib ko'ring."
          />
        ) : (
          <div>
            <h2 className="text-xl font-bold text-gradient mb-6">
              🚘 Topilgan Avtomobillar ({cars.length})
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {cars.map((car, idx) => (
                <div
                  key={car.id}
                  className="relative group animate-fade-in-up"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <CarCard car={car} onClick={() => navigate(`/cars/${car.id}`)} />
                  
                  {isDirector && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCar(car);
                        setShowForm(true);
                      }}
                      className="absolute bottom-4 right-4 glass glass-light px-3 py-2 text-xs font-semibold text-steel-light opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg hover:scale-110"
                    >
                      ✏️ Tahrirlash
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <CarFormModal
          car={editingCar}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            loadCars();
          }}
        />
      )}
    </MainLayout>
  );
};

export default CarsPage;
