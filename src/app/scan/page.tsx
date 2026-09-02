"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { formatDateTime, formatDate, formatTime } from "@/lib/utils";

interface InvitationData {
  guest: {
    id: string; firstName: string; lastName: string;
    category: string; allowedPersons: number;
    invitationCode: string; rsvpStatus: string; isPresent: boolean;
  };
  event: {
    name: string; type: string; date: string; endDate: string | null;
    location: string | null; address: string | null; coverImage: string | null;
    customMessage: string | null; invitationTemplate: number;
  };
  table: { tableNumber: number; name: string | null } | null;
  qrDataUrl: string;
}

function ScanPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const guestId = searchParams.get("guestId");
  const [data, setData] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token && !guestId) {
      setError("Lien d'invitation invalide");
      setLoading(false);
      return;
    }

    // Try to find guest by token
    if (token) {
      fetch("/api/qr/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
        .then((r) => r.json())
        .then(async (scanResult) => {
          if (scanResult.guest?.id) {
            const invRes = await fetch(`/api/invitations/${scanResult.guest.id}`);
            const invData = await invRes.json();
            if (invData.error) setError(invData.error);
            else setData(invData);
          } else {
            setError("Invitation non trouvée");
          }
        })
        .catch(() => setError("Erreur de chargement"))
        .finally(() => setLoading(false));
    } else if (guestId) {
      fetch(`/api/invitations/${guestId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.error) setError(d.error);
          else setData(d);
        })
        .catch(() => setError("Erreur de chargement"))
        .finally(() => setLoading(false));
    }
  }, [token, guestId]);

  if (loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 animate-pulse">
            <i className="fas fa-sparkles text-white text-2xl"></i>
          </div>
          <p className="text-white/70">Chargement de votre invitation...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-circle-xmark text-red-500 text-3xl"></i>
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">Invitation invalide</h2>
          <p className="text-gray-500 text-sm">{error || "Ce lien n'est pas valide"}</p>
        </div>
      </div>
    );
  }

  const templates: Record<number, { bg: string; accent: string; border: string; cardBg: string }> = {
    1: { bg: "from-indigo-900 via-purple-900 to-indigo-900", accent: "text-amber-400", border: "border-amber-400/30", cardBg: "bg-white/10" },
    2: { bg: "from-gray-900 via-amber-900/30 to-gray-900", accent: "text-amber-300", border: "border-amber-300/30", cardBg: "bg-white/10" },
    3: { bg: "from-emerald-900 via-teal-900 to-emerald-900", accent: "text-yellow-400", border: "border-yellow-400/30", cardBg: "bg-white/10" },
  };

  const t = templates[data.event.invitationTemplate || 1];

  return (
    <div className={`min-h-screen bg-gradient-to-br ${t.bg} flex items-center justify-center p-4`}>
      <div className="max-w-sm w-full">
        {/* Card */}
        <div className="relative overflow-hidden rounded-3xl shadow-2xl">
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl"></div>

          <div className="relative p-6">
            {/* App logo */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <i className="fas fa-sparkles text-white text-sm"></i>
              </div>
              <span className="text-white font-black text-base">INVITIX</span>
            </div>

            {/* Cover image */}
            {data.event.coverImage && (
              <div className="h-40 rounded-2xl overflow-hidden mb-4">
                <img src={data.event.coverImage} alt={data.event.name} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Event name */}
            <div className="text-center mb-4">
              <p className={`text-xs uppercase tracking-widest ${t.accent} mb-1 font-semibold`}>Invitation officielle</p>
              <h1 className="text-2xl font-black text-white mb-1">{data.event.name}</h1>
              <div className={`w-10 h-0.5 mx-auto opacity-60`} style={{ backgroundColor: "currentColor", color: "rgb(251, 191, 36)" }}></div>
            </div>

            {/* Guest */}
            <div className={`${t.cardBg} backdrop-blur border ${t.border} rounded-2xl p-4 mb-4`}>
              <p className="text-white/60 text-xs mb-1">Cher(e)</p>
              <p className="text-white font-bold text-xl">{data.guest.firstName} {data.guest.lastName}</p>
              <p className={`text-xs ${t.accent} mt-0.5`}>
                {data.guest.allowedPersons > 1 ? `${data.guest.allowedPersons} personnes` : "1 personne"}
              </p>
            </div>

            {/* Details */}
            {data.event.customMessage && (
              <p className="text-white/70 text-sm italic text-center mb-4 leading-relaxed">
                "{data.event.customMessage}"
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className={`${t.cardBg} border ${t.border} rounded-xl p-3`}>
                <p className={`text-xs ${t.accent} mb-1`}>📅 Date</p>
                <p className="text-white text-sm font-semibold">{formatDate(data.event.date)}</p>
              </div>
              <div className={`${t.cardBg} border ${t.border} rounded-xl p-3`}>
                <p className={`text-xs ${t.accent} mb-1`}>🕐 Heure</p>
                <p className="text-white text-sm font-semibold">{formatTime(data.event.date)}</p>
              </div>
              {data.event.location && (
                <div className={`col-span-2 ${t.cardBg} border ${t.border} rounded-xl p-3`}>
                  <p className={`text-xs ${t.accent} mb-1`}>📍 Lieu</p>
                  <p className="text-white text-sm font-semibold">{data.event.location}</p>
                  {data.event.address && <p className="text-white/50 text-xs mt-0.5">{data.event.address}</p>}
                </div>
              )}
              {data.table && (
                <div className={`${t.cardBg} border ${t.border} rounded-xl p-3`}>
                  <p className={`text-xs ${t.accent} mb-1`}>🪑 Table</p>
                  <p className="text-white text-sm font-semibold">Table {data.table.tableNumber}</p>
                </div>
              )}
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center py-4">
              <div className="bg-white p-3 rounded-2xl shadow-xl">
                <img src={data.qrDataUrl} alt="QR Code" className="w-36 h-36" />
              </div>
              <p className="text-white/60 text-xs mt-2">Code: <strong className="text-white">{data.guest.invitationCode}</strong></p>
              <p className="text-white/40 text-xs mt-1">Présentez ce code à l'entrée</p>
            </div>

            {/* Status */}
            {data.guest.isPresent && (
              <div className="mt-2 p-3 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-center">
                <i className="fas fa-check-circle text-emerald-400 mr-2"></i>
                <span className="text-emerald-300 text-sm font-semibold">Présence déjà enregistrée</span>
              </div>
            )}

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-white/10 text-center">
              <p className="text-white/30 text-xs">Invitation générée par INVITIX</p>
              <p className="text-white/20 text-xs">Gérez. Invitez. Rassemblez.</p>
            </div>
          </div>
        </div>

        {/* Share actions */}
        <div className="mt-4 flex gap-3 justify-center">
          <button
            onClick={() => {
              const url = window.location.href;
              if (navigator.share) {
                navigator.share({ title: `Invitation — ${data.event.name}`, url });
              } else {
                navigator.clipboard.writeText(url);
                alert("Lien copié !");
              }
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/10 border border-white/20 text-white text-sm font-semibold rounded-xl hover:bg-white/20 transition-colors"
          >
            <i className="fas fa-share-nodes"></i> Partager
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Mon invitation: ${window.location.href}`)}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-sm font-semibold rounded-xl hover:bg-emerald-500/30 transition-colors"
          >
            <i className="fab fa-whatsapp"></i> WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-white text-3xl"></i>
        </div>
      </div>
    }>
      <ScanPageContent />
    </Suspense>
  );
}
