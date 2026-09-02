"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  formatDate, formatDateTime, formatTime,
  EVENT_TYPE_LABELS, EVENT_STATUS_LABELS,
  GUEST_CATEGORY_LABELS, RSVP_STATUS_LABELS
} from "@/lib/utils";
import GuestModal from "@/components/events/GuestModal";
import InvitationModal from "@/components/events/InvitationModal";

interface EventData {
  id: string; name: string; type: string; description: string | null;
  date: string; endDate: string | null; location: string | null;
  address: string | null; coverImage: string | null; maxGuests: number;
  status: string; customMessage: string | null; invitationTemplate: number;
}
interface EventStats {
  total: number; present: number; confirmed: number; declined: number;
  pending: number; sent: number; vipPresent: number;
}
interface Guest {
  id: string; firstName: string; lastName: string; email: string | null;
  phone: string | null; photo: string | null; category: string;
  allowedPersons: number; rsvpStatus: string; isPresent: boolean;
  checkedInAt: string | null; invitationCode: string; invitationStatus: string;
  notes: string | null; tableId: string | null;
  table: { tableNumber: number; name: string | null } | null;
}
interface Table { id: string; tableNumber: number; name: string | null; capacity: number; }

const RSVP_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  declined: "bg-red-100 text-red-600",
  maybe: "bg-blue-100 text-blue-700",
};

const CATEGORY_COLORS: Record<string, string> = {
  family: "badge-success",
  friends: "badge-info",
  colleagues: "badge-purple",
  vip: "badge-gold",
  official: "badge-warning",
  other: "bg-gray-100 text-gray-600",
};

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();

  const [event, setEvent] = useState<EventData | null>(null);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [guestsLoading, setGuestsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "guests" | "tables" | "stats">("overview");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [rsvpFilter, setRsvpFilter] = useState("");
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [showInvitation, setShowInvitation] = useState<string | null>(null);
  const [deleteGuestId, setDeleteGuestId] = useState<string | null>(null);
  const [guestPage, setGuestPage] = useState(1);
  const [guestTotal, setGuestTotal] = useState(0);
  const GUESTS_PER_PAGE = 20;

  const fetchEvent = useCallback(async () => {
    const res = await fetch(`/api/events/${id}`);
    const data = await res.json();
    setEvent(data.event);
    setStats(data.stats);
    setTables(data.tables || []);
    setLoading(false);
  }, [id]);

  const fetchGuests = useCallback(async () => {
    setGuestsLoading(true);
    const params = new URLSearchParams({
      page: String(guestPage),
      limit: String(GUESTS_PER_PAGE),
    });
    if (search) params.set("search", search);
    if (categoryFilter) params.set("category", categoryFilter);
    if (rsvpFilter) params.set("rsvpStatus", rsvpFilter);

    const res = await fetch(`/api/events/${id}/guests?${params}`);
    const data = await res.json();
    setGuests(data.guests || []);
    setGuestTotal(data.total || 0);
    setGuestsLoading(false);
  }, [id, search, categoryFilter, rsvpFilter, guestPage]);

  useEffect(() => { fetchEvent(); }, [fetchEvent]);
  useEffect(() => { fetchGuests(); }, [fetchGuests]);

  async function handleDeleteGuest() {
    if (!deleteGuestId) return;
    await fetch(`/api/guests/${deleteGuestId}`, { method: "DELETE" });
    setDeleteGuestId(null);
    fetchGuests();
    fetchEvent();
  }

  async function handleRsvpUpdate(guestId: string, rsvpStatus: string) {
    await fetch(`/api/guests/${guestId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rsvpStatus }),
    });
    fetchGuests();
    fetchEvent();
  }

  async function handleCheckin(guestId: string) {
    await fetch(`/api/guests/${guestId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPresent: true }),
    });
    fetchGuests();
    fetchEvent();
  }

  const canManage = user?.role !== "protocol";
  const totalPages = Math.ceil(guestTotal / GUESTS_PER_PAGE);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card skeleton h-48"></div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="card skeleton h-24"></div>)}
        </div>
      </div>
    );
  }

  if (!event) return (
    <div className="card text-center py-16">
      <i className="fas fa-triangle-exclamation text-red-400 text-4xl mb-4"></i>
      <h2 className="text-xl font-bold text-gray-700">Événement non trouvé</h2>
      <Link href="/dashboard/events" className="btn-primary mt-4">Retour</Link>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/events" className="p-2 rounded-xl text-gray-500 hover:bg-gray-100">
            <i className="fas fa-arrow-left"></i>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black text-gray-900">{event.name}</h1>
              <span className={`badge ${EVENT_STATUS_LABELS[event.status] ? "bg-emerald-100 text-emerald-700" : ""}`}>
                {EVENT_STATUS_LABELS[event.status] || event.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span><i className="fas fa-calendar text-violet-400 mr-1"></i>{formatDateTime(event.date)}</span>
              {event.location && <span><i className="fas fa-location-dot text-violet-400 mr-1"></i>{event.location}</span>}
            </div>
          </div>
        </div>
        {canManage && (
          <div className="flex gap-2 flex-shrink-0">
            <Link href={`/dashboard/events/${id}/edit`} className="btn-secondary text-sm px-4 py-2">
              <i className="fas fa-pen"></i> Modifier
            </Link>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: "Total invités", value: stats?.total || 0, color: "text-indigo-600", bg: "bg-indigo-50", icon: "fa-users" },
          { label: "Présents", value: stats?.present || 0, color: "text-emerald-600", bg: "bg-emerald-50", icon: "fa-user-check" },
          { label: "Confirmés", value: stats?.confirmed || 0, color: "text-blue-600", bg: "bg-blue-50", icon: "fa-check-circle" },
          { label: "Refusés", value: stats?.declined || 0, color: "text-red-500", bg: "bg-red-50", icon: "fa-times-circle" },
          { label: "En attente", value: stats?.pending || 0, color: "text-amber-600", bg: "bg-amber-50", icon: "fa-clock" },
          { label: "Invitations envoyées", value: stats?.sent || 0, color: "text-violet-600", bg: "bg-violet-50", icon: "fa-paper-plane" },
          { label: "VIP présents", value: stats?.vipPresent || 0, color: "text-amber-600", bg: "bg-amber-50", icon: "fa-star" },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center mx-auto mb-2`}>
              <i className={`fas ${s.icon} ${s.color} text-sm`}></i>
            </div>
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5 leading-tight">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1">
          {[
            { key: "overview", label: "Aperçu", icon: "fa-info-circle" },
            { key: "guests", label: `Invités (${guestTotal})`, icon: "fa-users" },
            { key: "tables", label: `Tables (${tables.length})`, icon: "fa-table" },
            { key: "stats", label: "Statistiques", icon: "fa-chart-bar" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-violet-500 text-violet-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <i className={`fas ${tab.icon}`}></i>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {event.coverImage && (
              <div className="rounded-2xl overflow-hidden h-56">
                <img src={event.coverImage} alt={event.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-3">Détails</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <i className="fas fa-tag text-violet-400 mt-0.5 w-4"></i>
                  <div><span className="text-gray-500">Type:</span> <strong>{EVENT_TYPE_LABELS[event.type]}</strong></div>
                </div>
                <div className="flex items-start gap-3">
                  <i className="fas fa-calendar text-violet-400 mt-0.5 w-4"></i>
                  <div>
                    <span className="text-gray-500">Date:</span> <strong>{formatDateTime(event.date)}</strong>
                    {event.endDate && <> → <strong>{formatDateTime(event.endDate)}</strong></>}
                  </div>
                </div>
                {event.location && (
                  <div className="flex items-start gap-3">
                    <i className="fas fa-location-dot text-violet-400 mt-0.5 w-4"></i>
                    <div><span className="text-gray-500">Lieu:</span> <strong>{event.location}</strong></div>
                  </div>
                )}
                {event.address && (
                  <div className="flex items-start gap-3">
                    <i className="fas fa-map text-violet-400 mt-0.5 w-4"></i>
                    <div><span className="text-gray-500">Adresse:</span> <span className="text-gray-700">{event.address}</span></div>
                  </div>
                )}
                {event.maxGuests > 0 && (
                  <div className="flex items-start gap-3">
                    <i className="fas fa-users text-violet-400 mt-0.5 w-4"></i>
                    <div><span className="text-gray-500">Capacité max:</span> <strong>{event.maxGuests} invités</strong></div>
                  </div>
                )}
              </div>
              {event.description && (
                <div className="mt-4 pt-4 border-t border-gray-50">
                  <p className="text-sm text-gray-600 leading-relaxed">{event.description}</p>
                </div>
              )}
              {event.customMessage && (
                <div className="mt-4 p-4 bg-violet-50 rounded-xl">
                  <p className="text-xs font-semibold text-violet-600 mb-1">Message d'invitation</p>
                  <p className="text-sm text-violet-800 italic">"{event.customMessage}"</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-4">Actions rapides</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab("guests")}
                  className="w-full flex items-center gap-3 p-3 bg-violet-50 text-violet-700 rounded-xl hover:bg-violet-100 transition-colors text-sm font-semibold"
                >
                  <i className="fas fa-users w-4"></i> Gérer les invités
                </button>
                {canManage && (
                  <button
                    onClick={() => { setEditingGuest(null); setShowGuestModal(true); setActiveTab("guests"); }}
                    className="w-full flex items-center gap-3 p-3 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-colors text-sm font-semibold"
                  >
                    <i className="fas fa-user-plus w-4"></i> Ajouter un invité
                  </button>
                )}
                <Link
                  href="/dashboard/scanner"
                  className="w-full flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors text-sm font-semibold"
                >
                  <i className="fas fa-qrcode w-4"></i> Ouvrir le scanner
                </Link>
                {canManage && (
                  <Link
                    href={`/dashboard/events/${id}/edit`}
                    className="w-full flex items-center gap-3 p-3 bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-100 transition-colors text-sm font-semibold"
                  >
                    <i className="fas fa-pen w-4"></i> Modifier l'événement
                  </Link>
                )}
              </div>
            </div>

            {/* Attendance rate */}
            <div className="card text-center">
              <h3 className="font-bold text-gray-900 mb-4">Taux de présence</h3>
              <div className="relative w-24 h-24 mx-auto mb-3">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#7c3aed" strokeWidth="3"
                    strokeDasharray={`${stats && stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0} 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-black text-gray-900">
                    {stats && stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500">{stats?.present || 0} sur {stats?.total || 0} invités</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "guests" && (
        <div className="space-y-4">
          {/* Guest filters & actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
              <input
                type="text"
                placeholder="Rechercher un invité..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setGuestPage(1); }}
                className="input-field pl-9 py-2"
              />
            </div>
            <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setGuestPage(1); }} className="input-field py-2 w-full sm:w-36">
              <option value="">Catégorie</option>
              {Object.entries(GUEST_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={rsvpFilter} onChange={(e) => { setRsvpFilter(e.target.value); setGuestPage(1); }} className="input-field py-2 w-full sm:w-36">
              <option value="">RSVP</option>
              {Object.entries(RSVP_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            {canManage && (
              <button onClick={() => { setEditingGuest(null); setShowGuestModal(true); }} className="btn-primary text-sm whitespace-nowrap">
                <i className="fas fa-plus"></i> Ajouter
              </button>
            )}
          </div>

          {/* Guests table */}
          {guestsLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-14 rounded-xl"></div>)}
            </div>
          ) : guests.length === 0 ? (
            <div className="card text-center py-12">
              <i className="fas fa-user-slash text-gray-300 text-4xl mb-3"></i>
              <h3 className="font-bold text-gray-600 mb-1">Aucun invité</h3>
              <p className="text-gray-400 text-sm mb-4">Commencez par ajouter vos invités</p>
              {canManage && (
                <button onClick={() => { setEditingGuest(null); setShowGuestModal(true); }} className="btn-primary text-sm">
                  <i className="fas fa-user-plus"></i> Ajouter un invité
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="card p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full data-table">
                    <thead>
                      <tr>
                        <th>Invité</th>
                        <th>Catégorie</th>
                        <th>Table</th>
                        <th>RSVP</th>
                        <th>Présence</th>
                        <th>Code</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {guests.map((guest) => (
                        <tr key={guest.id}>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {guest.firstName.charAt(0)}{guest.lastName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{guest.firstName} {guest.lastName}</p>
                                <p className="text-xs text-gray-400">{guest.email || guest.phone || "—"}</p>
                              </div>
                            </div>
                          </td>
                          <td><span className={`badge ${CATEGORY_COLORS[guest.category] || "bg-gray-100 text-gray-600"}`}>{GUEST_CATEGORY_LABELS[guest.category] || guest.category}</span></td>
                          <td className="text-gray-600 text-sm">{guest.table ? `Table ${guest.table.tableNumber}` : "—"}</td>
                          <td>
                            <select
                              value={guest.rsvpStatus}
                              onChange={(e) => handleRsvpUpdate(guest.id, e.target.value)}
                              disabled={!canManage}
                              className={`text-xs font-semibold px-2 py-1 rounded-full border-0 ${RSVP_COLORS[guest.rsvpStatus]} disabled:opacity-100 cursor-pointer`}
                            >
                              {Object.entries(RSVP_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                          </td>
                          <td>
                            {guest.isPresent ? (
                              <span className="badge badge-success"><i className="fas fa-check mr-1"></i>Présent</span>
                            ) : canManage ? (
                              <button
                                onClick={() => handleCheckin(guest.id)}
                                className="badge bg-gray-100 text-gray-600 hover:bg-emerald-100 hover:text-emerald-700 cursor-pointer transition-colors"
                              >
                                <i className="fas fa-user-check mr-1"></i>Valider
                              </button>
                            ) : (
                              <span className="badge bg-gray-100 text-gray-500">Absent</span>
                            )}
                          </td>
                          <td><code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">{guest.invitationCode}</code></td>
                          <td>
                            <div className="flex gap-1">
                              <button
                                onClick={() => setShowInvitation(guest.id)}
                                title="Voir l'invitation"
                                className="p-1.5 text-violet-500 hover:bg-violet-50 rounded-lg transition-colors"
                              >
                                <i className="fas fa-envelope text-sm"></i>
                              </button>
                              {canManage && (
                                <>
                                  <button
                                    onClick={() => { setEditingGuest(guest); setShowGuestModal(true); }}
                                    title="Modifier"
                                    className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                                  >
                                    <i className="fas fa-pen text-sm"></i>
                                  </button>
                                  <button
                                    onClick={() => setDeleteGuestId(guest.id)}
                                    title="Supprimer"
                                    className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <i className="fas fa-trash text-sm"></i>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    {(guestPage - 1) * GUESTS_PER_PAGE + 1}–{Math.min(guestPage * GUESTS_PER_PAGE, guestTotal)} sur {guestTotal} invités
                  </p>
                  <div className="flex gap-2">
                    <button
                      disabled={guestPage === 1}
                      onClick={() => setGuestPage(guestPage - 1)}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
                    >
                      <i className="fas fa-chevron-left"></i>
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setGuestPage(i + 1)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${guestPage === i + 1 ? "gradient-primary text-white" : "border border-gray-200 hover:bg-gray-50"}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      disabled={guestPage === totalPages}
                      onClick={() => setGuestPage(guestPage + 1)}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
                    >
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === "tables" && (
        <TablesView eventId={id} tables={tables} guests={guests} canManage={canManage} onRefresh={fetchEvent} />
      )}

      {activeTab === "stats" && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-4">Répartition RSVP</h3>
            <div className="space-y-3">
              {[
                { label: "Confirmés", value: stats.confirmed, total: stats.total, color: "bg-emerald-500" },
                { label: "Refusés", value: stats.declined, total: stats.total, color: "bg-red-400" },
                { label: "En attente", value: stats.pending, total: stats.total, color: "bg-amber-400" },
              ].map((bar) => (
                <div key={bar.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{bar.label}</span>
                    <span className="font-bold">{bar.value} ({stats.total > 0 ? Math.round((bar.value / stats.total) * 100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${bar.color}`} style={{ width: stats.total > 0 ? `${(bar.value / stats.total) * 100}%` : "0%" }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-4">Présence</h3>
            <div className="flex items-center justify-center py-4">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#7c3aed" strokeWidth="3"
                    strokeDasharray={`${stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0} 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-gray-900">{stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%</span>
                  <span className="text-xs text-gray-500">présents</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                <div className="text-2xl font-black text-emerald-600">{stats.present}</div>
                <div className="text-xs text-gray-500">Présents</div>
              </div>
              <div className="bg-violet-50 rounded-xl p-3 text-center">
                <div className="text-2xl font-black text-violet-600">{stats.vipPresent}</div>
                <div className="text-xs text-gray-500">VIP présents</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showGuestModal && (
        <GuestModal
          eventId={id}
          guest={editingGuest}
          tables={tables}
          onClose={() => { setShowGuestModal(false); setEditingGuest(null); }}
          onSave={() => { setShowGuestModal(false); setEditingGuest(null); fetchGuests(); fetchEvent(); }}
        />
      )}

      {showInvitation && (
        <InvitationModal
          guestId={showInvitation}
          onClose={() => setShowInvitation(null)}
        />
      )}

      {deleteGuestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full animate-fade-in">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-triangle-exclamation text-red-500 text-2xl"></i>
            </div>
            <h3 className="text-xl font-black text-gray-900 text-center mb-2">Supprimer l'invité</h3>
            <p className="text-gray-500 text-sm text-center mb-6">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteGuestId(null)} className="flex-1 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50">Annuler</button>
              <button onClick={handleDeleteGuest} className="flex-1 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600">
                <i className="fas fa-trash mr-2"></i>Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TablesView({
  eventId, tables, guests, canManage, onRefresh
}: {
  eventId: string;
  tables: Table[];
  guests: Guest[];
  canManage: boolean;
  onRefresh: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ tableNumber: "", name: "", capacity: "8" });
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, ...form, tableNumber: Number(form.tableNumber), capacity: Number(form.capacity) }),
    });
    setLoading(false);
    setShowForm(false);
    setForm({ tableNumber: "", name: "", capacity: "8" });
    onRefresh();
  }

  async function handleDelete(tableId: string) {
    setDeletingId(tableId);
    await fetch(`/api/tables/${tableId}`, { method: "DELETE" });
    setDeletingId(null);
    onRefresh();
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">{tables.length} table{tables.length !== 1 ? "s" : ""} configurée{tables.length !== 1 ? "s" : ""}</p>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
            <i className={`fas ${showForm ? "fa-times" : "fa-plus"}`}></i>
            {showForm ? "Annuler" : "Ajouter une table"}
          </button>
        </div>
      )}

      {showForm && (
        <div className="card animate-fade-in">
          <h3 className="font-bold text-gray-900 mb-4">Nouvelle table</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">N° table *</label>
              <input type="number" value={form.tableNumber} onChange={(e) => setForm({ ...form, tableNumber: e.target.value })} className="input-field" required min="1" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Nom</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Famille..." />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Capacité</label>
              <input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="input-field" min="1" />
            </div>
            <div className="col-span-3 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600">Annuler</button>
              <button type="submit" disabled={loading} className="btn-primary text-sm">
                {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-plus"></i>}
                Créer
              </button>
            </div>
          </form>
        </div>
      )}

      {tables.length === 0 ? (
        <div className="card text-center py-12">
          <i className="fas fa-table text-gray-300 text-4xl mb-3"></i>
          <h3 className="font-bold text-gray-600 mb-2">Aucune table configurée</h3>
          {canManage && <p className="text-sm text-gray-400">Ajoutez des tables pour organiser vos invités</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map((table) => {
            const tableGuests = guests.filter((g) => g.tableId === table.id);
            const occupancy = Math.round((tableGuests.length / (table.capacity || 8)) * 100);
            return (
              <div key={table.id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">Table {table.tableNumber}</h3>
                    {table.name && <p className="text-xs text-gray-500">{table.name}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{tableGuests.length}/{table.capacity}</span>
                    {canManage && (
                      <button
                        onClick={() => handleDelete(table.id)}
                        disabled={deletingId === table.id}
                        className="text-red-400 hover:text-red-600 p-1"
                      >
                        <i className="fas fa-trash text-xs"></i>
                      </button>
                    )}
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                  <div
                    className={`h-1.5 rounded-full ${occupancy >= 100 ? "bg-red-500" : occupancy >= 80 ? "bg-amber-500" : "bg-emerald-500"}`}
                    style={{ width: `${Math.min(100, occupancy)}%` }}
                  ></div>
                </div>
                {tableGuests.length > 0 ? (
                  <div className="space-y-1">
                    {tableGuests.slice(0, 4).map((g) => (
                      <div key={g.id} className="flex items-center gap-2 text-sm">
                        <div className="w-5 h-5 rounded-full bg-violet-200 flex items-center justify-center text-violet-700 text-xs font-bold">
                          {g.firstName.charAt(0)}
                        </div>
                        <span className="text-gray-700 truncate">{g.firstName} {g.lastName}</span>
                        {g.isPresent && <i className="fas fa-check-circle text-emerald-500 text-xs ml-auto"></i>}
                      </div>
                    ))}
                    {tableGuests.length > 4 && (
                      <p className="text-xs text-gray-400 pl-7">+{tableGuests.length - 4} autres</p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">Aucun invité assigné</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
