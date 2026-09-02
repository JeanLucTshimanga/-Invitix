"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getInitials, ROLE_LABELS } from "@/lib/utils";

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "password" | "notifications">("profile");
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: user?.phone || "",
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/users/${user?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erreur"); return; }
      setSuccess("Profil mis à jour avec succès !");
      await refreshUser();
    } catch { setError("Erreur de connexion"); }
    finally { setLoading(false); }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/users/${user?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordForm.newPassword }),
      });
      if (!res.ok) { setError("Erreur lors du changement"); return; }
      setSuccess("Mot de passe modifié avec succès !");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch { setError("Erreur de connexion"); }
    finally { setLoading(false); }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Paramètres</h1>
        <p className="text-gray-500 text-sm">Gérez votre profil et vos préférences</p>
      </div>

      {/* Profile card */}
      <div className="card flex items-center gap-4 p-5">
        <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-white text-xl font-black shadow-lg">
          {user ? getInitials(user.firstName, user.lastName) : "?"}
        </div>
        <div>
          <h2 className="text-lg font-black text-gray-900">{user?.firstName} {user?.lastName}</h2>
          <p className="text-gray-500 text-sm">{user?.email}</p>
          <span className="badge badge-gold mt-1">{ROLE_LABELS[user?.role || ""] || user?.role}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { key: "profile", label: "Profil", icon: "fa-user" },
          { key: "password", label: "Mot de passe", icon: "fa-lock" },
          { key: "notifications", label: "Notifications", icon: "fa-bell" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key as typeof activeTab); setSuccess(""); setError(""); }}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === tab.key ? "border-violet-500 text-violet-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <i className={`fas ${tab.icon}`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 text-emerald-700 text-sm">
          <i className="fas fa-check-circle"></i> {success}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-sm">
          <i className="fas fa-circle-exclamation"></i> {error}
        </div>
      )}

      {/* Profile tab */}
      {activeTab === "profile" && (
        <form onSubmit={handleProfileSave} className="card space-y-5">
          <h3 className="font-bold text-gray-900">Informations personnelles</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Prénom</label>
              <input
                type="text"
                value={profileForm.firstName}
                onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom</label>
              <input
                type="text"
                value={profileForm.lastName}
                onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                className="input-field"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
            <input type="email" value={user?.email || ""} className="input-field bg-gray-50" disabled />
            <p className="text-xs text-gray-400 mt-1">L'email ne peut pas être modifié</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Téléphone</label>
            <input
              type="tel"
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              className="input-field"
              placeholder="+243..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Rôle</label>
            <input type="text" value={ROLE_LABELS[user?.role || ""] || user?.role || ""} className="input-field bg-gray-50" disabled />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
            {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check"></i>}
            Sauvegarder le profil
          </button>
        </form>
      )}

      {/* Password tab */}
      {activeTab === "password" && (
        <form onSubmit={handlePasswordChange} className="card space-y-5">
          <h3 className="font-bold text-gray-900">Changer le mot de passe</h3>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nouveau mot de passe</label>
            <div className="relative">
              <i className="fas fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="input-field pl-10"
                required
                minLength={6}
                placeholder="Minimum 6 caractères"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirmer le nouveau mot de passe</label>
            <div className="relative">
              <i className="fas fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="input-field pl-10"
                required
                placeholder="Répétez le mot de passe"
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
            {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-key"></i>}
            Changer le mot de passe
          </button>
        </form>
      )}

      {/* Notifications tab */}
      {activeTab === "notifications" && (
        <div className="card space-y-5">
          <h3 className="font-bold text-gray-900">Préférences de notifications</h3>
          <div className="space-y-4">
            {[
              { label: "Notifications par email", desc: "Recevoir les alertes par email", default: true },
              { label: "Nouvelles inscriptions", desc: "Alertes pour les nouveaux RSVP", default: true },
              { label: "Entrées validées", desc: "Notifications lors des check-ins", default: false },
              { label: "Résumé quotidien", desc: "Rapport journalier par email", default: true },
            ].map((notif) => (
              <div key={notif.label} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{notif.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{notif.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked={notif.default} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                </label>
              </div>
            ))}
          </div>
          <button className="btn-primary w-full justify-center" onClick={() => setSuccess("Préférences sauvegardées !")}>
            <i className="fas fa-check"></i> Sauvegarder
          </button>
        </div>
      )}
    </div>
  );
}
