"use client";

import { useState, useEffect } from "react";
import { GUEST_CATEGORY_LABELS } from "@/lib/utils";

interface Table { id: string; tableNumber: number; name: string | null; }
interface Guest {
  id: string; firstName: string; lastName: string; email: string | null;
  phone: string | null; photo: string | null; category: string;
  allowedPersons: number; rsvpStatus: string; tableId: string | null; notes: string | null;
}

interface GuestModalProps {
  eventId: string;
  guest: Guest | null;
  tables: Table[];
  onClose: () => void;
  onSave: () => void;
}

export default function GuestModal({ eventId, guest, tables, onClose, onSave }: GuestModalProps) {
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", photo: "",
    category: "other", allowedPersons: "1", tableId: "", rsvpStatus: "pending", notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (guest) {
      setForm({
        firstName: guest.firstName,
        lastName: guest.lastName,
        email: guest.email || "",
        phone: guest.phone || "",
        photo: guest.photo || "",
        category: guest.category,
        allowedPersons: String(guest.allowedPersons),
        tableId: guest.tableId || "",
        rsvpStatus: guest.rsvpStatus,
        notes: guest.notes || "",
      });
    }
  }, [guest]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = guest ? `/api/guests/${guest.id}` : `/api/events/${eventId}/guests`;
      const method = guest ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          allowedPersons: Number(form.allowedPersons),
          tableId: form.tableId || null,
          email: form.email || null,
          phone: form.phone || null,
          photo: form.photo || null,
          notes: form.notes || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de l'enregistrement");
        return;
      }
      onSave();
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-black text-gray-900">
            {guest ? "Modifier l'invité" : "Ajouter un invité"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100">
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-2">
              <i className="fas fa-circle-exclamation"></i> {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Prénom *</label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="input-field"
                required
                placeholder="Jean"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Nom *</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="input-field"
                required
                placeholder="Dupont"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-field"
                placeholder="jean@exemple.com"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Téléphone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input-field"
                placeholder="+243..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Catégorie</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="input-field"
              >
                {Object.entries(GUEST_CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Personnes autorisées</label>
              <input
                type="number"
                value={form.allowedPersons}
                onChange={(e) => setForm({ ...form, allowedPersons: e.target.value })}
                className="input-field"
                min="1"
                max="20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Table</label>
              <select
                value={form.tableId}
                onChange={(e) => setForm({ ...form, tableId: e.target.value })}
                className="input-field"
              >
                <option value="">Sans table assignée</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    Table {t.tableNumber}{t.name ? ` — ${t.name}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">RSVP</label>
              <select
                value={form.rsvpStatus}
                onChange={(e) => setForm({ ...form, rsvpStatus: e.target.value })}
                className="input-field"
              >
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmé</option>
                <option value="declined">Refusé</option>
                <option value="maybe">Peut-être</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">Photo (URL)</label>
            <input
              type="url"
              value={form.photo}
              onChange={(e) => setForm({ ...form, photo: e.target.value })}
              className="input-field"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="input-field resize-none"
              rows={2}
              placeholder="Notes supplémentaires..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50">
              Annuler
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-3 gradient-primary text-white font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check"></i>}
              {guest ? "Modifier" : "Ajouter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
