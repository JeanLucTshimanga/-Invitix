"use client";

import { useEffect, useState, useRef } from "react";
import { formatDateTime, formatDate, formatTime, GUEST_CATEGORY_LABELS } from "@/lib/utils";

interface InvitationData {
  guest: {
    id: string; firstName: string; lastName: string;
    email: string | null; phone: string | null; photo: string | null;
    category: string; allowedPersons: number; rsvpStatus: string;
    invitationCode: string;
  };
  event: {
    id: string; name: string; type: string; date: string; endDate: string | null;
    location: string | null; address: string | null; coverImage: string | null;
    description: string | null; customMessage: string | null; invitationTemplate: number;
  };
  table: { id: string; tableNumber: number; name: string | null } | null;
  qrCode: { id: string; token: string; isUsed: boolean };
  qrDataUrl: string;
  scanUrl: string;
}

const templates = {
  1: { bg: "from-indigo-900 via-purple-900 to-indigo-900", accent: "text-amber-400", border: "border-amber-400/30", cardBg: "bg-white/10" },
  2: { bg: "from-gray-900 via-amber-900/30 to-gray-900", accent: "text-amber-300", border: "border-amber-300/30", cardBg: "bg-white/10" },
  3: { bg: "from-emerald-900 via-teal-900 to-emerald-900", accent: "text-yellow-400", border: "border-yellow-400/30", cardBg: "bg-white/10" },
};

export default function InvitationModal({ guestId, onClose }: { guestId: string; onClose: () => void }) {
  const [data, setData] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sharing, setSharing] = useState(false);
  const invitationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/invitations/${guestId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, [guestId]);

  function handleWhatsApp() {
    if (!data) return;
    const msg = encodeURIComponent(
      `Bonjour ${data.guest.firstName},\n\nVous êtes invité(e) à ${data.event.name}.\n\n📅 ${formatDateTime(data.event.date)}\n📍 ${data.event.location || ""}\n\n🔗 Votre invitation: ${data.scanUrl}\n\nCode: ${data.guest.invitationCode}`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  }

  function handleCopyLink() {
    if (!data) return;
    navigator.clipboard.writeText(data.scanUrl);
    alert("Lien copié !");
  }

  function handleEmail() {
    if (!data) return;
    const subject = encodeURIComponent(`Invitation — ${data.event.name}`);
    const body = encodeURIComponent(
      `Bonjour ${data.guest.firstName} ${data.guest.lastName},\n\nVous êtes invité(e) à l'événement : ${data.event.name}\n\nDate : ${formatDateTime(data.event.date)}\nLieu : ${data.event.location || ""}\n\nVotre lien d'invitation : ${data.scanUrl}\nCode : ${data.guest.invitationCode}`
    );
    window.open(`mailto:${data.guest.email || ""}?subject=${subject}&body=${body}`, "_blank");
  }

  async function handleShare() {
    if (!data || !navigator.share) { handleCopyLink(); return; }
    try {
      await navigator.share({
        title: `Invitation — ${data.event.name}`,
        text: `${data.guest.firstName}, vous êtes invité(e) à ${data.event.name}`,
        url: data.scanUrl,
      });
    } catch {
      handleCopyLink();
    }
  }

  async function handleDownloadQR() {
    if (!data) return;
    const link = document.createElement("a");
    link.href = data.qrDataUrl;
    link.download = `invitation-${data.guest.lastName}-${data.guest.invitationCode}.png`;
    link.click();
  }

  const templateStyle = templates[(data?.event.invitationTemplate as 1 | 2 | 3) || 1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-black text-gray-900">Invitation numérique</h2>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100">
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>

        {loading && (
          <div className="p-12 text-center">
            <i className="fas fa-spinner fa-spin text-violet-500 text-3xl"></i>
            <p className="text-gray-500 text-sm mt-3">Génération de l'invitation...</p>
          </div>
        )}

        {error && (
          <div className="p-6 text-center text-red-500">
            <i className="fas fa-circle-exclamation text-2xl mb-2"></i>
            <p>{error}</p>
          </div>
        )}

        {data && !loading && (
          <div className="p-6 space-y-4">
            {/* Invitation card */}
            <div ref={invitationRef} className={`bg-gradient-to-br ${templateStyle.bg} rounded-2xl p-6 text-white relative overflow-hidden`}>
              {/* Background decorations */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

              {/* Header */}
              <div className="relative">
                {data.event.coverImage && (
                  <div className="h-32 rounded-xl overflow-hidden mb-4">
                    <img src={data.event.coverImage} alt={data.event.name} className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className={`text-xs uppercase tracking-widest ${templateStyle.accent} mb-2 font-semibold`}>
                    Invitation officielle
                  </div>
                  <h1 className="text-2xl font-black text-white mb-1">{data.event.name}</h1>
                  <div className={`w-12 h-0.5 ${templateStyle.accent} mx-auto`} style={{ backgroundColor: "currentColor" }}></div>
                </div>

                {/* Guest info */}
                <div className={`${templateStyle.cardBg} backdrop-blur rounded-xl p-4 border ${templateStyle.border} mb-4`}>
                  <div className="flex items-center gap-3">
                    {data.guest.photo ? (
                      <img src={data.guest.photo} alt="" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                        {data.guest.firstName.charAt(0)}{data.guest.lastName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="text-white/70 text-xs mb-0.5">Cher(e)</p>
                      <p className="text-white font-bold text-lg">{data.guest.firstName} {data.guest.lastName}</p>
                      <p className={`text-xs ${templateStyle.accent}`}>
                        {GUEST_CATEGORY_LABELS[data.guest.category] || data.guest.category}
                        {data.guest.allowedPersons > 1 ? ` • ${data.guest.allowedPersons} personnes` : ""}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Event details */}
                <div className="space-y-2 mb-4">
                  {data.event.customMessage && (
                    <p className="text-white/80 text-sm italic text-center leading-relaxed">
                      "{data.event.customMessage}"
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <div className={`${templateStyle.cardBg} rounded-lg p-3 border ${templateStyle.border}`}>
                      <p className={`text-xs ${templateStyle.accent} mb-1`}>📅 Date</p>
                      <p className="text-white text-sm font-semibold">{formatDate(data.event.date)}</p>
                    </div>
                    <div className={`${templateStyle.cardBg} rounded-lg p-3 border ${templateStyle.border}`}>
                      <p className={`text-xs ${templateStyle.accent} mb-1`}>🕐 Heure</p>
                      <p className="text-white text-sm font-semibold">{formatTime(data.event.date)}</p>
                    </div>
                    {data.event.location && (
                      <div className={`col-span-2 ${templateStyle.cardBg} rounded-lg p-3 border ${templateStyle.border}`}>
                        <p className={`text-xs ${templateStyle.accent} mb-1`}>📍 Lieu</p>
                        <p className="text-white text-sm font-semibold">{data.event.location}</p>
                        {data.event.address && <p className="text-white/60 text-xs mt-0.5">{data.event.address}</p>}
                      </div>
                    )}
                    {data.table && (
                      <div className={`${templateStyle.cardBg} rounded-lg p-3 border ${templateStyle.border}`}>
                        <p className={`text-xs ${templateStyle.accent} mb-1`}>🪑 Table</p>
                        <p className="text-white text-sm font-semibold">Table {data.table.tableNumber}</p>
                      </div>
                    )}
                    <div className={`${data.table ? "" : "col-span-2"} ${templateStyle.cardBg} rounded-lg p-3 border ${templateStyle.border}`}>
                      <p className={`text-xs ${templateStyle.accent} mb-1`}>👥 Personnes</p>
                      <p className="text-white text-sm font-semibold">{data.guest.allowedPersons} personne{data.guest.allowedPersons > 1 ? "s" : ""}</p>
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center">
                  <div className="bg-white p-3 rounded-xl">
                    <img src={data.qrDataUrl} alt="QR Code" className="w-32 h-32" />
                  </div>
                  <p className="text-white/60 text-xs mt-2">Code: {data.guest.invitationCode}</p>
                  <p className="text-white/40 text-xs">Présentez ce QR Code à l'entrée</p>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-white/10 text-center">
                  <p className="text-white/40 text-xs">Invitation numérique générée par INVITIX</p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={handleWhatsApp}
                className="flex flex-col items-center gap-2 p-3 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-colors text-sm font-semibold"
              >
                <i className="fab fa-whatsapp text-xl"></i>
                WhatsApp
              </button>
              <button
                onClick={handleEmail}
                className="flex flex-col items-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors text-sm font-semibold"
              >
                <i className="fas fa-envelope text-xl"></i>
                Email
              </button>
              <button
                onClick={handleCopyLink}
                className="flex flex-col items-center gap-2 p-3 bg-violet-50 text-violet-700 rounded-xl hover:bg-violet-100 transition-colors text-sm font-semibold"
              >
                <i className="fas fa-link text-xl"></i>
                Copier
              </button>
              <button
                onClick={handleDownloadQR}
                className="flex flex-col items-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-100 transition-colors text-sm font-semibold"
              >
                <i className="fas fa-download text-xl"></i>
                QR Code
              </button>
            </div>

            {/* Share button */}
            <button
              onClick={handleShare}
              className="w-full py-3 gradient-primary text-white font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              <i className="fas fa-share-nodes"></i>
              Partager l'invitation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
