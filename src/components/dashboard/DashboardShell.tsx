"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getInitials, ROLE_LABELS } from "@/lib/utils";

const navLinks = [
  { href: "/dashboard", icon: "fa-grid-2", label: "Tableau de bord", roles: ["super_admin", "organizer", "protocol"] },
  { href: "/dashboard/events", icon: "fa-calendar-star", label: "Événements", roles: ["super_admin", "organizer", "protocol"] },
  { href: "/dashboard/scanner", icon: "fa-qrcode", label: "Scanner QR", roles: ["super_admin", "organizer", "protocol"] },
  { href: "/dashboard/users", icon: "fa-users-gear", label: "Utilisateurs", roles: ["super_admin"] },
  { href: "/dashboard/settings", icon: "fa-gear", label: "Paramètres", roles: ["super_admin", "organizer"] },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifCount] = useState(3);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-xl animate-pulse">
            <i className="fas fa-sparkles text-white text-2xl"></i>
          </div>
          <p className="text-white/70 text-sm">Chargement de INVITIX...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const filteredLinks = navLinks.filter((link) =>
    link.roles.includes(user.role)
  );

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-[#020408] overflow-hidden">
      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-950/90 border-r border-amber-300/15 backdrop-blur-2xl flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
            <i className="fas fa-sparkles text-slate-950 text-base"></i>
          </div>
          <div>
            <div className="text-white font-black text-lg tracking-tight">INVITIX</div>
            <div className="text-white/40 text-xs">Gérez. Invitez. Rassemblez.</div>
          </div>
        </div>

        {/* User info */}
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-3 p-3 bg-white/10 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {getInitials(user.firstName, user.lastName)}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-white/50 text-xs truncate">{ROLE_LABELS[user.role]}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto scrollbar-hide">
          {filteredLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setSidebarOpen(false)}
              className={`sidebar-link ${isActive(link.href) ? "active" : "text-white/70"}`}
            >
              <i className={`fas ${link.icon} w-5 text-center`}></i>
              <span>{link.label}</span>
              {isActive(link.href) && (
                <span className="ml-auto w-2 h-2 bg-amber-400 rounded-full"></span>
              )}
            </Link>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-4 py-4 border-t border-white/10">
          <Link
            href="/dashboard/settings"
            className="sidebar-link text-white/70 mb-2"
            onClick={() => setSidebarOpen(false)}
          >
            <i className="fas fa-user-circle w-5 text-center"></i>
            <span>Mon profil</span>
          </Link>
          <button
            onClick={logout}
            className="sidebar-link text-white/70 w-full"
          >
            <i className="fas fa-arrow-right-from-bracket w-5 text-center"></i>
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top navbar */}
        <header className="h-16 bg-slate-950/65 border-b border-white/10 backdrop-blur-xl flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            >
              <i className="fas fa-bars text-lg"></i>
            </button>
            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
              <span className="font-semibold text-amber-300">INVITIX</span>
              <i className="fas fa-chevron-right text-xs text-slate-600"></i>
              <span className="text-slate-300">{getPageTitle(pathname)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick action */}
            {(user.role === "organizer" || user.role === "super_admin") && (
              <Link
                href="/dashboard/events/new"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 gradient-primary text-white text-sm font-semibold rounded-xl shadow-md hover:opacity-90 transition-all"
              >
                <i className="fas fa-plus"></i>
                Nouvel événement
              </Link>
            )}

            {/* Notifications */}
            <button className="relative p-2 rounded-xl text-slate-400 hover:bg-white/10 transition-colors">
              <i className="fas fa-bell text-lg"></i>
              {notifCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                  {notifCount}
                </span>
              )}
            </button>

            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold cursor-pointer">
              {getInitials(user.firstName, user.lastName)}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function getPageTitle(pathname: string): string {
  const map: Record<string, string> = {
    "/dashboard": "Tableau de bord",
    "/dashboard/events": "Événements",
    "/dashboard/events/new": "Nouvel événement",
    "/dashboard/scanner": "Scanner QR Code",
    "/dashboard/users": "Utilisateurs",
    "/dashboard/settings": "Paramètres",
  };
  if (map[pathname]) return map[pathname];
  if (pathname.includes("/dashboard/events/")) return "Détail événement";
  return "Dashboard";
}
