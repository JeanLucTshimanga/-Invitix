"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate, EVENT_TYPE_LABELS, EVENT_STATUS_LABELS } from "@/lib/utils";

interface DashStats {
  events: { total: number; active: number; draft: number; completed: number };
  guests: {
    total: number; present: number; confirmed: number; declined: number;
    sent: number; opened: number; attendanceRate: number;
  };
  totalUsers: number;
  recentEvents: Array<{
    id: string; name: string; type: string; date: string;
    status: string; location: string | null; coverImage: string | null;
    guestCount: { total: number; present: number };
  }>;
  typeStats: Array<{ type: string; count: number }>;
}

const statCards = [
  { key: "events.total", label: "Total événements", icon: "fa-calendar-star", color: "from-indigo-500 to-indigo-700", bg: "bg-indigo-50", text: "text-indigo-600" },
  { key: "events.active", label: "Événements actifs", icon: "fa-calendar-check", color: "from-emerald-500 to-emerald-700", bg: "bg-emerald-50", text: "text-emerald-600" },
  { key: "guests.total", label: "Total invités", icon: "fa-users", color: "from-violet-500 to-violet-700", bg: "bg-violet-50", text: "text-violet-600" },
  { key: "guests.present", label: "Présents", icon: "fa-user-check", color: "from-blue-500 to-blue-700", bg: "bg-blue-50", text: "text-blue-600" },
  { key: "guests.confirmed", label: "Confirmés", icon: "fa-circle-check", color: "from-teal-500 to-teal-700", bg: "bg-teal-50", text: "text-teal-600" },
  { key: "guests.sent", label: "Invitations envoyées", icon: "fa-paper-plane", color: "from-amber-500 to-amber-700", bg: "bg-amber-50", text: "text-amber-600" },
  { key: "guests.attendanceRate", label: "Taux de présence", icon: "fa-percent", color: "from-pink-500 to-pink-700", bg: "bg-pink-50", text: "text-pink-600", suffix: "%" },
  { key: "totalUsers", label: "Utilisateurs", icon: "fa-users-gear", color: "from-orange-500 to-orange-700", bg: "bg-orange-50", text: "text-orange-600" },
];

function getValue(stats: DashStats | null, key: string): number {
  if (!stats) return 0;
  const parts = key.split(".");
  if (parts.length === 2) {
    const section = parts[0] as keyof DashStats;
    const field = parts[1];
    const obj = stats[section];
    if (obj && typeof obj === "object" && field in obj) {
      return (obj as Record<string, number>)[field] || 0;
    }
  }
  return (stats as unknown as Record<string, number>)[key] || 0;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    published: "bg-blue-100 text-blue-700",
    active: "bg-emerald-100 text-emerald-700",
    completed: "bg-purple-100 text-purple-700",
    cancelled: "bg-red-100 text-red-600",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[status] || "bg-gray-100 text-gray-600"}`}>
      {EVENT_STATUS_LABELS[status] || status}
    </span>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card skeleton h-28"></div>
          ))}
        </div>
      </div>
    );
  }

  const visibleStats = user?.role === "super_admin"
    ? statCards
    : statCards.filter((s) => s.key !== "totalUsers");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">
            Bonjour, {user?.firstName} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Voici un aperçu de votre activité aujourd'hui
          </p>
        </div>
        <Link
          href="/dashboard/events/new"
          className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 gradient-primary text-white font-semibold rounded-xl shadow-md hover:opacity-90 transition-all text-sm"
        >
          <i className="fas fa-plus"></i>
          Créer un événement
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleStats.map((card) => {
          const value = getValue(stats, card.key);
          return (
            <div key={card.key} className="card hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <i className={`fas ${card.icon} ${card.text} text-base`}></i>
                </div>
                <i className="fas fa-arrow-trend-up text-emerald-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity"></i>
              </div>
              <div className="text-3xl font-black text-gray-900 mb-1">
                {value}{card.suffix || ""}
              </div>
              <div className="text-xs text-gray-500 font-medium">{card.label}</div>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance overview */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Aperçu général</h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">Total</span>
          </div>
          {stats && (
            <div className="space-y-4">
              {[
                { label: "Invités présents", value: stats.guests.present, total: stats.guests.total, color: "bg-emerald-500" },
                { label: "Invitations confirmées", value: stats.guests.confirmed, total: stats.guests.total, color: "bg-blue-500" },
                { label: "Invitations envoyées", value: stats.guests.sent, total: stats.guests.total, color: "bg-violet-500" },
                { label: "RSVP refusés", value: stats.guests.declined, total: stats.guests.total, color: "bg-red-400" },
              ].map((bar) => (
                <div key={bar.label}>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600 font-medium">{bar.label}</span>
                    <span className="text-gray-900 font-bold">
                      {bar.value}/{bar.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${bar.color} transition-all duration-1000`}
                      style={{ width: bar.total > 0 ? `${Math.min(100, (bar.value / bar.total) * 100)}%` : "0%" }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attendance rate ring */}
        <div className="card flex flex-col items-center justify-center text-center">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Taux de présence</h2>
          <div className="relative w-32 h-32 mb-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                stroke="url(#grad)" strokeWidth="3"
                strokeDasharray={`${stats?.guests.attendanceRate || 0} 100`}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-black text-gray-900">
                {stats?.guests.attendanceRate || 0}%
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 w-full">
            <div className="bg-emerald-50 rounded-xl p-3">
              <div className="text-xl font-black text-emerald-600">{stats?.guests.present || 0}</div>
              <div className="text-xs text-gray-500">Présents</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-xl font-black text-gray-700">{stats?.guests.total || 0}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent events */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Événements récents</h2>
          <Link href="/dashboard/events" className="text-sm text-violet-600 hover:underline font-medium">
            Voir tous <i className="fas fa-arrow-right ml-1 text-xs"></i>
          </Link>
        </div>

        {!stats?.recentEvents?.length ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-calendar-plus text-gray-400 text-2xl"></i>
            </div>
            <h3 className="font-semibold text-gray-700 mb-2">Aucun événement encore</h3>
            <p className="text-sm text-gray-500 mb-4">Créez votre premier événement pour commencer</p>
            <Link href="/dashboard/events/new" className="btn-primary text-sm px-5 py-2.5">
              <i className="fas fa-plus"></i> Créer un événement
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th className="rounded-l-xl">Événement</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Invités</th>
                  <th>Présents</th>
                  <th className="rounded-r-xl">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.recentEvents.map((event) => (
                  <tr key={event.id} className="cursor-pointer" onClick={() => {}}>
                    <td>
                      <Link href={`/dashboard/events/${event.id}`} className="flex items-center gap-3 hover:text-violet-600">
                        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                          <i className="fas fa-calendar-star text-white text-sm"></i>
                        </div>
                        <span className="font-semibold text-gray-900 line-clamp-1">{event.name}</span>
                      </Link>
                    </td>
                    <td>
                      <span className="badge badge-purple">{EVENT_TYPE_LABELS[event.type] || event.type}</span>
                    </td>
                    <td className="text-gray-600">{formatDate(event.date)}</td>
                    <td>
                      <span className="font-semibold text-gray-900">{event.guestCount.total}</span>
                    </td>
                    <td>
                      <span className="font-semibold text-emerald-600">{event.guestCount.present}</span>
                    </td>
                    <td><StatusBadge status={event.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            href: "/dashboard/events/new",
            icon: "fa-calendar-plus",
            title: "Créer un événement",
            desc: "Organisez votre prochain événement",
            color: "from-violet-500 to-purple-600",
            roles: ["super_admin", "organizer"],
          },
          {
            href: "/dashboard/scanner",
            icon: "fa-qrcode",
            title: "Scanner QR Code",
            desc: "Valider les entrées en temps réel",
            color: "from-emerald-500 to-teal-600",
            roles: ["super_admin", "organizer", "protocol"],
          },
          {
            href: "/dashboard/users",
            icon: "fa-users-gear",
            title: "Gérer les utilisateurs",
            desc: "Gérer les accès et les rôles",
            color: "from-blue-500 to-cyan-600",
            roles: ["super_admin"],
          },
        ]
          .filter((a) => !user || a.roles.includes(user.role))
          .map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="card hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group cursor-pointer block"
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform`}>
                <i className={`fas ${action.icon} text-white text-lg`}></i>
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{action.title}</h3>
              <p className="text-gray-500 text-sm">{action.desc}</p>
            </Link>
          ))}
      </div>
    </div>
  );
}
