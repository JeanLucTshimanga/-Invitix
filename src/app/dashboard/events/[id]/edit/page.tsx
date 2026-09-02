"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EVENT_TYPE_LABELS } from "@/lib/utils";

interface EventData {
  id: string; name: string; type: string; description: string | null;
  date: string; endDate: string | null; location: string | null;
  address: string | null; coverImage: string | null; maxGuests: number;
  status: string; customMessage: string | null; invitationTemplate: number;
}

function toInputDateTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toISOString().slice(0, 16);
}

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", type: "other", description: "", date: "",
    endDate: "", location: "", address: "", coverImage: "",
    maxGuests: "", status: "draft", customMessage: "", invitationTemplate: 1,
  });

  useEffect(() => {
    fetch(`/api/events/${id}`)
      .then((r) => r.json())
      .then((data) => {
        const e: EventData = data.event;
        setForm({
          name: e.name,
          type: e.type,
          description: e.description || "",
          date: toInputDateTime(e.date),
          endDate: toInputDateTime(e.endDate),
          location: e.location || "",
          address: e.address || "",
          coverImage: e.coverImage || "",
          maxGuests: String(e.maxGuests || ""),
          status: e.status,
          customMessage: e.customMessage || "",
          invitationTemplate: e.invitationTemplate || 1,
        });
      })
      .finally(() => setFetching(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erreur"); return; }
      router.push(`/dashboard/events/${id}`);
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card skeleton h-96"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/events/${id}`} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100">
          <i className="fas fa-arrow-left"></i>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Modifier l'événement</h1>
          <p className="text-gray-500 text-sm">Mettez à jour les informations</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
            <i className="fas fa-circle-exclamation mr-2"></i>{error}
          </div>
        )}

        <div className="card space-y-5">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <i className="fas fa-circle-info text-violet-500"></i> Informations générales
          </h2>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom de l'événement *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input-field">
                {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Statut</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-field">
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
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field resize-none" rows={3} />
          </div>
        </div>

        <div className="card space-y-5">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <i className="fas fa-calendar text-violet-500"></i> Date et lieu
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Début *</label>
              <input type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fin</label>
              <input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Lieu</label>
            <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Adresse</label>
            <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-field resize-none" rows={2} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Capacité max</label>
            <input type="number" value={form.maxGuests} onChange={(e) => setForm({ ...form, maxGuests: e.target.value })} className="input-field" min="0" />
          </div>
        </div>

        <div className="card space-y-5">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <i className="fas fa-envelope text-violet-500"></i> Invitation
          </h2>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Image de couverture (URL)</label>
            <input type="url" value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} className="input-field" />
            {form.coverImage && <img src={form.coverImage} alt="Aperçu" className="mt-2 h-32 w-full object-cover rounded-xl" />}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Modèle d'invitation</label>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((t) => (
                <button key={t} type="button" onClick={() => setForm({ ...form, invitationTemplate: t })}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${form.invitationTemplate === t ? "border-violet-500 bg-violet-50" : "border-gray-200 hover:border-violet-300"}`}>
                  <div className="text-2xl mb-1">{t === 1 ? "💜" : t === 2 ? "🌟" : "🎊"}</div>
                  <div className="text-xs font-semibold text-gray-600">{t === 1 ? "Élégant" : t === 2 ? "Luxe" : "Festif"}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message personnalisé</label>
            <textarea value={form.customMessage} onChange={(e) => setForm({ ...form, customMessage: e.target.value })} className="input-field resize-none" rows={3} />
          </div>
        </div>

        <div className="flex gap-3">
          <Link href={`/dashboard/events/${id}`} className="btn-secondary flex-1 justify-center">Annuler</Link>
          <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center disabled:opacity-50">
            {loading ? <><i className="fas fa-spinner fa-spin"></i> Sauvegarde...</> : <><i className="fas fa-check"></i> Sauvegarder</>}
          </button>
        </div>
      </form>
    </div>
  );
}
