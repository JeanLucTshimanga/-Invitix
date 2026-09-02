"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate, EVENT_TYPE_LABELS, EVENT_STATUS_LABELS } from "@/lib/utils";

interface Event {
  id: string;
  name: string;
  type: string;
  description: string | null;
  date: string;
  endDate: string | null;
  location: string | null;
  address: string | null;
  coverImage: string | null;
  maxGuests: number;
  status: string;
  guestCount: { total: number; present: number; confirmed: number };
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  published: "bg-blue-100 text-blue-700",
  active: "bg-emerald-100 text-emerald-700",
  completed: "bg-purple-100 text-purple-700",
  cancelled: "bg-red-100 text-red-600",
};

const TYPE_ICONS: Record<string, string> = {
  wedding: "fa-rings-wedding",
  birthday: "fa-cake-candles",
  conference: "fa-presentation-screen",
  ceremony: "fa-award",
  graduation: "fa-graduation-cap",
  meeting: "fa-handshake",
  other: "fa-calendar-star",
};

export default function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const fetchEvents = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (typeFilter) params.set("type", typeFilter);

    const res = await fetch(`/api/events?${params}`);
    const data = await res.json();
    setEvents(data.events || []);
    setLoading(false);
  }, [search, statusFilter, typeFilter]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    await fetch(`/api/events/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    setDeleting(false);
    fetchEvents();
  }

  const canManage = user?.role !== "protocol";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Événements</h1>
          <p className="text-gray-500 text-sm mt-1">{events.length} événement{events.length !== 1 ? "s" : ""} au total</p>
        </div>
        {canManage && (
          <Link href="/dashboard/events/new" className="btn-primary text-sm">
            <i className="fas fa-plus"></i> Nouveau
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input
              type="text"
              placeholder="Rechercher un événement..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9 py-2"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field py-2 w-full sm:w-40"
          >
            <option value="">Tous les statuts</option>
            {Object.entries(EVENT_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input-field py-2 w-full sm:w-40"
          >
            <option value="">Tous les types</option>
            {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <div className="flex rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-2 text-sm ${viewMode === "grid" ? "gradient-primary text-white" : "bg-white text-gray-500"}`}
            >
              <i className="fas fa-grid-2"></i>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-2 text-sm ${viewMode === "table" ? "gradient-primary text-white" : "bg-white text-gray-500"}`}
            >
              <i className="fas fa-list"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card skeleton h-64"></div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-calendar-plus text-gray-400 text-3xl"></i>
          </div>
          <h3 className="text-lg font-bold text-gray-700 mb-2">Aucun événement trouvé</h3>
          <p className="text-gray-500 text-sm mb-6">
            {search || statusFilter || typeFilter
              ? "Aucun résultat pour ces filtres."
              : "Créez votre premier événement pour commencer."}
          </p>
          {canManage && !search && !statusFilter && !typeFilter && (
            <Link href="/dashboard/events/new" className="btn-primary">
              <i className="fas fa-plus"></i> Créer un événement
            </Link>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event.id} className="card p-0 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">
              {/* Cover */}
              <div className="h-36 gradient-primary relative overflow-hidden">
                {event.coverImage ? (
                  <img src={event.coverImage} alt={event.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <i className={`fas ${TYPE_ICONS[event.type] || "fa-calendar-star"} text-white/50 text-4xl`}></i>
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <span className={`badge ${STATUS_COLORS[event.status] || "bg-gray-100 text-gray-600"}`}>
                    {EVENT_STATUS_LABELS[event.status] || event.status}
                  </span>
                </div>
                <div className="absolute top-3 left-3">
                  <span className="badge bg-black/30 text-white border border-white/20">
                    {EVENT_TYPE_LABELS[event.type] || event.type}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-1">{event.name}</h3>
                <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-1">
                  <i className="fas fa-calendar text-violet-400 text-xs"></i>
                  {formatDate(event.date)}
                </div>
                {event.location && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                    <i className="fas fa-location-dot text-violet-400 text-xs"></i>
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 py-3 border-t border-gray-50">
                  <div className="text-center">
                    <div className="text-lg font-black text-gray-900">{event.guestCount.total}</div>
                    <div className="text-xs text-gray-500">Invités</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-black text-emerald-600">{event.guestCount.present}</div>
                    <div className="text-xs text-gray-500">Présents</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-black text-blue-600">{event.guestCount.confirmed}</div>
                    <div className="text-xs text-gray-500">Confirmés</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-gray-50">
                  <Link
                    href={`/dashboard/events/${event.id}`}
                    className="flex-1 text-center py-2 text-sm font-semibold text-violet-600 bg-violet-50 rounded-lg hover:bg-violet-100 transition-colors"
                  >
                    <i className="fas fa-eye mr-1"></i> Voir
                  </Link>
                  {canManage && (
                    <>
                      <Link
                        href={`/dashboard/events/${event.id}/edit`}
                        className="px-3 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <i className="fas fa-pen"></i>
                      </Link>
                      <button
                        onClick={() => setDeleteId(event.id)}
                        className="px-3 py-2 text-sm text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th>Événement</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Lieu</th>
                  <th>Invités</th>
                  <th>Statut</th>
                  {canManage && <th>Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {events.map((event) => (
                  <tr key={event.id}>
                    <td>
                      <Link href={`/dashboard/events/${event.id}`} className="font-semibold text-gray-900 hover:text-violet-600">
                        {event.name}
                      </Link>
                    </td>
                    <td><span className="badge badge-purple">{EVENT_TYPE_LABELS[event.type] || event.type}</span></td>
                    <td>{formatDate(event.date)}</td>
                    <td className="text-gray-500">{event.location || "—"}</td>
                    <td>
                      <span className="font-semibold">{event.guestCount.total}</span>
                      <span className="text-gray-400 text-xs ml-1">({event.guestCount.present} présents)</span>
                    </td>
                    <td><span className={`badge ${STATUS_COLORS[event.status]}`}>{EVENT_STATUS_LABELS[event.status]}</span></td>
                    {canManage && (
                      <td>
                        <div className="flex gap-2">
                          <Link href={`/dashboard/events/${event.id}/edit`} className="text-gray-500 hover:text-violet-600 p-1">
                            <i className="fas fa-pen text-sm"></i>
                          </Link>
                          <button onClick={() => setDeleteId(event.id)} className="text-gray-400 hover:text-red-500 p-1">
                            <i className="fas fa-trash text-sm"></i>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full animate-fade-in">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-triangle-exclamation text-red-500 text-2xl"></i>
            </div>
            <h3 className="text-xl font-black text-gray-900 text-center mb-2">Supprimer l'événement</h3>
            <p className="text-gray-500 text-sm text-center mb-6">
              Cette action est irréversible. Tous les invités et données associés seront supprimés.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-trash"></i>}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
