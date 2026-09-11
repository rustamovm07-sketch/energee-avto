import React from "react";
import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../context/AuthContext";

/**
 * V1 settings page is intentionally minimal - just account info and a
 * spot to grow into later (branches, notifications, integrations, etc.)
 * without restructuring anything.
 */
const SettingsPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <MainLayout title="Sozlamalar">
      <div className="max-w-md space-y-4">
        <div className="rounded border border-line bg-white p-5">
          <h2 className="mb-3 font-display text-base font-semibold text-ink2">Hisob ma'lumotlari</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Ism</dt>
              <dd className="text-ink2">{user?.first_name} {user?.last_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Email</dt>
              <dd className="text-ink2">{user?.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Telefon</dt>
              <dd className="text-ink2">{user?.phone}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-muted">
            Shaxsiy ma'lumotlarni tahrirlash uchun "Profil" sahifasidan foydalaning.
          </p>
        </div>

        <div className="rounded border border-dashed border-line bg-white p-5 text-sm text-muted">
          Kredit, filiallar, SMS/Telegram integratsiyalari va boshqa kengaytmalar
          keyingi versiyalarda shu sahifaga qo'shiladi.
        </div>
      </div>
    </MainLayout>
  );
};

export default SettingsPage;
