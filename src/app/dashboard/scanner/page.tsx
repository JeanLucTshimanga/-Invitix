"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { formatDateTime } from "@/lib/utils";

interface ScanResult {
  valid: boolean;
  status: "valid" | "already_used" | "invalid";
  message: string;
  guest?: {
    id: string; firstName: string; lastName: string;
    category: string; allowedPersons: number;
    table: { number: number; name: string | null } | null;
    checkedInAt?: string;
  };
  event?: { name: string; date: string } | null;
  qrCodeId?: string;
}

export default function ScannerPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastScanRef = useRef<string>("");

  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [checkinDone, setCheckinDone] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [scanHistory, setScanHistory] = useState<Array<ScanResult & { time: Date }>>([]);
  const [torchOn, setTorchOn] = useState(false);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    setScanning(false);
  }, []);

  const processResult = useCallback(async (token: string) => {
    if (token === lastScanRef.current) return;
    lastScanRef.current = token;

    try {
      const res = await fetch("/api/qr/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data: ScanResult = await res.json();
      setResult(data);
      setCheckinDone(false);
      setScanHistory((prev) => [{ ...data, time: new Date() }, ...prev.slice(0, 9)]);
    } catch {
      setResult({ valid: false, status: "invalid", message: "Erreur de connexion" });
    }
  }, []);

  const scanFrame = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      animFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Dynamic import of jsQR
    try {
      const jsQR = (await import("jsqr")).default;
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code) {
        // Extract token from URL or use raw data
        let token = code.data;
        try {
          const url = new URL(code.data);
          const t = url.searchParams.get("token");
          if (t) token = t;
        } catch {
          // Not a URL, use raw data as token
        }
        await processResult(token);
      }
    } catch {
      // jsQR not available yet
    }

    animFrameRef.current = requestAnimationFrame(scanFrame);
  }, [processResult]);

  const startCamera = useCallback(async () => {
    setResult(null);
    setCameraError("");
    lastScanRef.current = "";

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);
      animFrameRef.current = requestAnimationFrame(scanFrame);
    } catch {
      setCameraError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
    }
  }, [scanFrame]);

  useEffect(() => {
    return () => { stopCamera(); };
  }, [stopCamera]);

  async function handleCheckin() {
    if (!result?.guest) return;
    setCheckinLoading(true);
    try {
      await fetch("/api/qr/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId: result.guest.id, qrCodeId: result.qrCodeId }),
      });
      setCheckinDone(true);
      setResult((prev) => prev ? { ...prev, status: "already_used", message: "Entrée validée avec succès" } : prev);
      lastScanRef.current = "";
    } catch {
      alert("Erreur lors de la validation");
    } finally {
      setCheckinLoading(false);
    }
  }

  async function handleManualScan() {
    if (!manualToken.trim()) return;
    await processResult(manualToken.trim());
    setManualToken("");
  }

  async function toggleTorch() {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      const capabilities = track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean };
      if (capabilities.torch) {
        const newTorchState = !torchOn;
        await track.applyConstraints({ advanced: [{ torch: newTorchState } as MediaTrackConstraintSet] });
        setTorchOn(newTorchState);
      }
    } catch {
      // Torch not supported
    }
  }

  const resultConfig = result ? {
    valid: { icon: "fa-circle-check", color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200", title: "✅ INVITATION VALIDE" },
    already_used: { icon: "fa-circle-exclamation", color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-200", title: "⚠️ INVITATION DÉJÀ UTILISÉE" },
    invalid: { icon: "fa-circle-xmark", color: "text-red-500", bg: "bg-red-50", border: "border-red-200", title: "❌ INVITATION INVALIDE" },
  }[result.status] : null;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xl">
          <i className="fas fa-qrcode text-white text-2xl"></i>
        </div>
        <h1 className="text-2xl font-black text-gray-900">Scanner QR Code</h1>
        <p className="text-gray-500 text-sm mt-1">Validez les entrées en temps réel</p>
      </div>

      {/* Camera */}
      <div className="card p-0 overflow-hidden">
        <div className="relative bg-gray-900 min-h-[280px]">
          <video
            ref={videoRef}
            id="qr-video"
            className="w-full"
            autoPlay
            playsInline
            muted
            style={{ display: scanning ? "block" : "none" }}
          />
          <canvas ref={canvasRef} className="hidden" />

          {!scanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
              {cameraError ? (
                <div className="text-center">
                  <i className="fas fa-camera-slash text-red-400 text-4xl mb-3"></i>
                  <p className="text-red-400 text-sm">{cameraError}</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-24 h-24 border-4 border-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 relative">
                    <i className="fas fa-qrcode text-white/40 text-4xl"></i>
                    <div className="absolute inset-0 border-2 border-violet-400 rounded-2xl animate-pulse"></div>
                  </div>
                  <p className="text-white/60 text-sm">Appuyez pour activer la caméra</p>
                </div>
              )}
            </div>
          )}

          {scanning && (
            <>
              {/* Scanning overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-56 h-56 relative">
                  <div className="absolute inset-0 border-2 border-white/40 rounded-2xl"></div>
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-violet-400 rounded-tl-xl"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-violet-400 rounded-tr-xl"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-violet-400 rounded-bl-xl"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-violet-400 rounded-br-xl"></div>
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-violet-400/70 animate-scan"></div>
                </div>
              </div>

              {/* Controls */}
              <div className="absolute bottom-3 left-3 right-3 flex justify-between">
                <button onClick={toggleTorch} className={`p-2 rounded-xl ${torchOn ? "bg-amber-400 text-amber-900" : "bg-white/20 text-white"} backdrop-blur`}>
                  <i className="fas fa-flashlight text-lg"></i>
                </button>
                <button onClick={stopCamera} className="px-4 py-2 bg-red-500/80 backdrop-blur text-white text-sm font-semibold rounded-xl">
                  <i className="fas fa-stop mr-2"></i>Arrêter
                </button>
              </div>
            </>
          )}
        </div>

        {/* Camera button */}
        {!scanning && (
          <button
            onClick={startCamera}
            className="w-full py-4 gradient-primary text-white font-bold text-lg hover:opacity-90 transition-all"
          >
            <i className="fas fa-camera mr-2"></i>
            {cameraError ? "Réessayer" : "Démarrer le scanner"}
          </button>
        )}
      </div>

      {/* Manual input */}
      <div className="card">
        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <i className="fas fa-keyboard text-violet-500"></i> Saisie manuelle
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleManualScan()}
            placeholder="Code ou token d'invitation..."
            className="input-field flex-1"
          />
          <button
            onClick={handleManualScan}
            disabled={!manualToken.trim()}
            className="px-5 py-3 gradient-primary text-white font-semibold rounded-xl disabled:opacity-40 hover:opacity-90"
          >
            <i className="fas fa-search"></i>
          </button>
        </div>
      </div>

      {/* Result */}
      {result && resultConfig && (
        <div className={`card ${resultConfig.bg} border-2 ${resultConfig.border} animate-fade-in`}>
          <div className="text-center mb-4">
            <i className={`fas ${resultConfig.icon} ${resultConfig.color} text-5xl mb-3`}></i>
            <h2 className={`text-xl font-black ${resultConfig.color}`}>{resultConfig.title}</h2>
          </div>

          {result.guest && (
            <div className="space-y-3 mt-4">
              {result.event && (
                <div className="bg-white/80 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-0.5">Événement</p>
                  <p className="font-bold text-gray-900">{result.event.name}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/80 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-0.5">Nom</p>
                  <p className="font-bold text-gray-900">{result.guest.firstName} {result.guest.lastName}</p>
                </div>
                <div className="bg-white/80 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-0.5">Catégorie</p>
                  <p className="font-bold text-gray-900 capitalize">{result.guest.category}</p>
                </div>
                {result.guest.table && (
                  <div className="bg-white/80 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-0.5">Table</p>
                    <p className="font-bold text-gray-900">Table {result.guest.table.number}</p>
                  </div>
                )}
                <div className="bg-white/80 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-0.5">Personnes autorisées</p>
                  <p className="font-bold text-gray-900">{result.guest.allowedPersons}</p>
                </div>
              </div>
              {result.guest.checkedInAt && (
                <div className="bg-white/80 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-0.5">Validé le</p>
                  <p className="font-semibold text-gray-700">{formatDateTime(result.guest.checkedInAt)}</p>
                </div>
              )}
            </div>
          )}

          {result.valid && !checkinDone && (
            <button
              onClick={handleCheckin}
              disabled={checkinLoading}
              className="w-full mt-4 py-4 bg-emerald-500 text-white font-black text-lg rounded-xl hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {checkinLoading ? (
                <><i className="fas fa-spinner fa-spin"></i> Validation...</>
              ) : (
                <><i className="fas fa-door-open text-xl"></i> VALIDER L'ENTRÉE</>
              )}
            </button>
          )}

          {checkinDone && (
            <div className="mt-4 p-4 bg-emerald-500 text-white rounded-xl text-center">
              <i className="fas fa-circle-check text-2xl mb-2"></i>
              <p className="font-black text-lg">ENTRÉE VALIDÉE !</p>
            </div>
          )}

          <button
            onClick={() => { setResult(null); lastScanRef.current = ""; setCheckinDone(false); }}
            className="w-full mt-3 py-3 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50"
          >
            <i className="fas fa-rotate mr-2"></i>Scanner suivant
          </button>
        </div>
      )}

      {/* Scan history */}
      {scanHistory.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <i className="fas fa-history text-violet-500"></i> Historique récent
          </h3>
          <div className="space-y-2">
            {scanHistory.map((scan, idx) => (
              <div key={idx} className={`flex items-center gap-3 p-2.5 rounded-xl ${
                scan.status === "valid" ? "bg-emerald-50" :
                scan.status === "already_used" ? "bg-amber-50" : "bg-red-50"
              }`}>
                <i className={`fas ${
                  scan.status === "valid" ? "fa-check-circle text-emerald-500" :
                  scan.status === "already_used" ? "fa-exclamation-circle text-amber-500" :
                  "fa-times-circle text-red-500"
                } text-lg`}></i>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {scan.guest ? `${scan.guest.firstName} ${scan.guest.lastName}` : "Inconnu"}
                  </p>
                  <p className="text-xs text-gray-500">{scan.time.toLocaleTimeString("fr-FR")}</p>
                </div>
                <span className={`text-xs font-semibold ${
                  scan.status === "valid" ? "text-emerald-600" :
                  scan.status === "already_used" ? "text-amber-600" : "text-red-600"
                }`}>
                  {scan.status === "valid" ? "Valide" : scan.status === "already_used" ? "Déjà utilisé" : "Invalide"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
