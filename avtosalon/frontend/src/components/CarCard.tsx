import React from "react";
import { Car } from "../types";
import { CarStatusBadge } from "./Feedback";

function formatPrice(price: string): string {
  const num = Number(price);
  return num.toLocaleString("uz-UZ") + " so'm";
}

const CarCard: React.FC<{ car: Car; onClick: () => void }> = ({ car, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="group glass glass-light flex flex-col overflow-hidden rounded-2xl text-left transition-all duration-300 hover:shadow-glass-lg hover:scale-105 hover:backdrop-blur-lg"
    >
      {/* Image Section */}
      <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-steel to-slate">
        {car.image ? (
          <img
            src={car.image}
            alt={`${car.brand} ${car.model}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl opacity-20 group-hover:scale-110 transition-transform duration-300">
            🚘
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute right-3 top-3 animate-fade-in-up">
          <CarStatusBadge status={car.status} />
        </div>

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Info Section */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <p className="font-display text-lg font-bold text-gradient group-hover:scale-105 transition-transform duration-300">
            {car.brand} {car.model}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {car.year} • {car.color || "Color"}
          </p>
        </div>

        {/* Price */}
        <div className="mt-auto pt-2 border-t border-opacity-10">
          <p className="text-gradient font-bold text-lg">{formatPrice(car.price)}</p>
          <p className="text-xs text-gray-400 mt-2">Bosish uchun batafsil…</p>
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none animate-glow" />
    </button>
  );
};

export default CarCard;
