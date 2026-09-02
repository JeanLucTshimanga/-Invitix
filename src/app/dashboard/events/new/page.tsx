"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EVENT_TYPE_LABELS } from "@/lib/utils";

export default function NewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    type: "other",
    description: "",
    date: "",
    endDate: "",
    location: "",
    address: "",
    coverImage: "",
    maxGuests: "",
    status: "draft",
    customMessage: "",
    invitationTemplate: 1,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de la création");
        return;
      }
      router.push(`/dashboard/events/${data.event.id}`);
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/events" className="p-2 rounded-xl text-gray-500 hover:bg-gray-100">
          <i className="fas fa-arrow-left"></i>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Nouvel événement</h1>
          <p className="text-gray-500 text-sm">Remplissez les informations de votre événement</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600">
            <i className="fas fa-circle-exclamation"></i> {error}
          </div>
        )}

        {/* Basic info */}
        <div className="card space-y-5">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <i className="fas fa-circle-info text-violet-500"></i> Informations générales
          </h2>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom de l'événement *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Mariage Sarah & David"
              className="input-field"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type d'événement</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="input-field"
              >
                {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Statut</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="input-field"
              >
                <option value="draft">Brouillon</option>
                <option value="published">Publié</option>
                <option value="active">Actif</option>
                <option value="completed">Terminé</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Décrivez votre événement..."
              className="input-field min-h-[100px] resize-none"
              rows={4}
            />
          </div>
        </div>

        {/* Date & Location */}
        <div className="card space-y-5">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <i className="fas fa-calendar text-violet-500"></i> Date et lieu
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date et heure de début *</label>
              <input
                type="datetime-local"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date et heure de fin</label>
              <input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Lieu / Salle</label>
            <div className="relative">
              <i className="fas fa-location-dot absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Ex: Chapiteau Baraka"
                className="input-field pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Adresse complète</label>
            <textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Adresse complète de l'événement..."
              className="input-field resize-none"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre maximum d'invités</label>
            <div className="relative">
              <i className="fas fa-users absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
              <input
                type="number"
                value={form.maxGuests}
                onChange={(e) => setForm({ ...form, maxGuests: e.target.value })}
                placeholder="0 = illimité"
                min="0"
                className="input-field pl-10"
              />
            </div>
          </div>
        </div>

        {/* Invitation */}
        <div className="card space-y-5">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <i className="fas fa-envelope text-violet-500"></i> Invitation
          </h2>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Image de couverture (URL)</label>
            <div className="relative">
              <i className="fas fa-image absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
              <input
                type="url"
                value={form.coverImage}
                onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                placeholder="https://..."
                className="input-field pl-10"
              />
            </div>
            {form.coverImage && (
              <img src={form.coverImage} alt="Aperçu" className="mt-2 h-32 w-full object-cover rounded-xl" />
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Modèle d'invitation</label>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, invitationTemplate: t })}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${form.invitationTemplate === t ? "border-violet-500 bg-violet-50" : "border-gray-200 hover:border-violet-300"}`}
                >
                  <div className="text-2xl mb-1">
                    {t === 1 ? "💜" : t === 2 ? "🌟" : "🎊"}
                  </div>
                  <div className="text-xs font-semibold text-gray-600">
                    {t === 1 ? "Élégant" : t === 2 ? "Luxe" : "Festif"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message personnalisé</label>
            <textarea
              value={form.customMessage}
              onChange={(e) => setForm({ ...form, customMessage: e.target.value })}
              placeholder="Nous avons le plaisir de vous inviter à..."
              className="input-field resize-none"
              rows={3}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link href="/dashboard/events" className="btn-secondary flex-1 justify-center">
            Annuler
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 justify-center disabled:opacity-50"
          >
            {loading ? (
              <><i className="fas fa-spinner fa-spin"></i> Création...</>
            ) : (
              <><i className="fas fa-check"></i> Créer l'événement</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
