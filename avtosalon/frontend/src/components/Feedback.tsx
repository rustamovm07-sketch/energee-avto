import React from "react";

const carStatusStyles: Record<string, string> = {
  available: "bg-leaf/10 text-leaf border-leaf/30",
  reserved: "bg-signal/10 text-signal-light border-signal/30",
  sold: "bg-rust/10 text-rust border-rust/30",
};

const carStatusLabels: Record<string, string> = {
  available: "Sotuvda",
  reserved: "Band qilingan",
  sold: "Sotilgan",
};

const applicationStatusStyles: Record<string, string> = {
  new: "bg-steel/10 text-steel border-steel/30",
  contacted: "bg-signal/10 text-signal-light border-signal/30",
  completed: "bg-leaf/10 text-leaf border-leaf/30",
  cancelled: "bg-rust/10 text-rust border-rust/30",
};

const applicationStatusLabels: Record<string, string> = {
  new: "Yangi",
  contacted: "Bog'lanildi",
  completed: "Bajarildi",
  cancelled: "Bekor qilindi",
};

export const CarStatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span
    className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${carStatusStyles[status] || ""}`}
  >
    {carStatusLabels[status] || status}
  </span>
);

export const ApplicationStatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span
    className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${applicationStatusStyles[status] || ""}`}
  >
    {applicationStatusLabels[status] || status}
  </span>
);

export const LoadingState: React.FC<{ label?: string }> = ({ label = "Yuklanmoqda..." }) => (
  <div className="flex items-center justify-center py-16 text-muted">
    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-line border-t-steel" />
    {label}
  </div>
);

export const EmptyState: React.FC<{ title: string; description?: string }> = ({ title, description }) => (
  <div className="flex flex-col items-center justify-center rounded border border-dashed border-line bg-white py-16 text-center">
    <p className="font-display text-base font-semibold text-ink2">{title}</p>
    {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
  </div>
);

export const ErrorBanner: React.FC<{ message: string }> = ({ message }) => (
  <div className="rounded border border-rust/30 bg-rust/5 px-4 py-3 text-sm text-rust">{message}</div>
);

export const SuccessBanner: React.FC<{ message: string }> = ({ message }) => (
  <div className="rounded border border-leaf/30 bg-leaf/5 px-4 py-3 text-sm text-leaf">{message}</div>
);
