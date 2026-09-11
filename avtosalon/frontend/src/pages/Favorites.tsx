import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { favoriteService } from "../services/miscServices";
import { Favorite } from "../types";
import CarCard from "../components/CarCard";
import { LoadingState, EmptyState, ErrorBanner } from "../components/Feedback";

const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    favoriteService
      .list()
      .then((res) => setFavorites(res.data))
      .catch(() => setError("Sevimlilarni yuklab bo'lmadi"))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <MainLayout title="Sevimlilar">
      {error && <div className="mb-4"><ErrorBanner message={error} /></div>}

      {isLoading ? (
        <LoadingState />
      ) : favorites.length === 0 ? (
        <EmptyState title="Sevimlilar ro'yxati bo'sh" description="Yoqtirgan avtomobillarni ❤️ bosib qo'shing." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {favorites.map((f) => (
            <CarCard key={f.id} car={f.car} onClick={() => navigate(`/cars/${f.car.id}`)} />
          ))}
        </div>
      )}
    </MainLayout>
  );
};

export default FavoritesPage;
