"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { formatDate, ROLE_LABELS, getInitials } from "@/lib/utils";

interface User {
  id: string; firstName: string; lastName: string; email: string;
  role: string; phone: string | null; isActive: boolean;
  lastLoginAt: string | null; createdAt: string;
}

const ROLE_COLORS: Record<string, string> = {
  super_admin: "badge-gold",
  organizer: "badge-purple",
  protocol: "badge-info",
};

export default function UsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", role: "organizer", phone: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && user.role !== "super_admin") router.push("/dashboard");
  }, [user, router]);

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  function openCreateModal() {
    setEditingUser(null);
    setForm({ firstName: "", lastName: "", email: "", password: "", role: "organizer", phone: "" });
    setError("");
    setShowModal(true);
  }

  function openEditModal(u: User) {
    setEditingUser(u);
    setForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, password: "", role: u.role, phone: u.phone || "" });
    setError("");
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    setError("");
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
      const method = editingUser ? "PUT" : "POST";
      const body: Record<string, string> = { ...form };
      if (!body.password) delete body.password;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erreur"); return; }
      setShowModal(false);
      fetchUsers();
    } catch { setError("Erreur de connexion"); }
    finally { setFormLoading(false); }
  }

  async function handleToggleActive(userId: string, isActive: boolean) {
    await fetch(`/api/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    fetchUsers();
  }

  async function handleDelete() {
    if (!deleteId) return;
    await fetch(`/api/users/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    fetchUsers();
  }

  if (user?.role !== "super_admin") return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Utilisateurs</h1>
          <p className="text-gray-500 text-sm">{users.length} utilisateur{users.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary text-sm">
          <i className="fas fa-user-plus"></i> Ajouter
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="card skeleton h-20"></div>)}
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th>Dernière connexion</th>
                  <th>Créé le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${u.isActive ? "gradient-primary" : "bg-gray-300"}`}>
                          {getInitials(u.firstName, u.lastName)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{u.firstName} {u.lastName}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge ${ROLE_COLORS[u.role] || "badge-info"}`}>{ROLE_LABELS[u.role] || u.role}</span></td>
                    <td>
                      <span className={`badge ${u.isActive ? "badge-success" : "bg-gray-100 text-gray-500"}`}>
                        {u.isActive ? "Actif" : "Désactivé"}
                      </span>
                    </td>
                    <td className="text-gray-500 text-sm">{u.lastLoginAt ? formatDate(u.lastLoginAt) : "Jamais"}</td>
                    <td className="text-gray-500 text-sm">{formatDate(u.createdAt)}</td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => openEditModal(u)} className="p-1.5 text-violet-500 hover:bg-violet-50 rounded-lg" title="Modifier">
                          <i className="fas fa-pen text-sm"></i>
                        </button>
                        <button
                          onClick={() => handleToggleActive(u.id, u.isActive)}
                          className={`p-1.5 rounded-lg ${u.isActive ? "text-amber-500 hover:bg-amber-50" : "text-emerald-500 hover:bg-emerald-50"}`}
                          title={u.isActive ? "Désactiver" : "Activer"}
                        >
                          <i className={`fas ${u.isActive ? "fa-user-slash" : "fa-user-check"} text-sm`}></i>
                        </button>
                        {u.id !== user?.id && (
                          <button onClick={() => setDeleteId(u.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg" title="Supprimer">
                            <i className="fas fa-trash text-sm"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-black text-gray-900">{editingUser ? "Modifier" : "Ajouter"} un utilisateur</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100">
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 rounded-xl text-red-600 text-sm">{error}</div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">Prénom *</label>
                  <input type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="input-field" required />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">Nom *</label>
                  <input type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="input-field" required />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Email *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" required disabled={!!editingUser} />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Téléphone</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                  Mot de passe {editingUser ? "(laisser vide pour ne pas modifier)" : "*"}
                </label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-field" required={!editingUser} placeholder="••••••••" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Rôle</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input-field">
                  <option value="organizer">Organisateur</option>
                  <option value="protocol">Protocole</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl">Annuler</button>
                <button type="submit" disabled={formLoading} className="flex-1 py-3 gradient-primary text-white font-semibold rounded-xl disabled:opacity-50">
                  {formLoading ? <i className="fas fa-spinner fa-spin"></i> : editingUser ? "Modifier" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full animate-fade-in">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-triangle-exclamation text-red-500 text-2xl"></i>
            </div>
            <h3 className="text-xl font-black text-gray-900 text-center mb-2">Supprimer l'utilisateur ?</h3>
            <p className="text-gray-500 text-sm text-center mb-6">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl">Annuler</button>
              <button onClick={handleDelete} className="flex-1 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600">
                <i className="fas fa-trash mr-2"></i>Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
