"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const features = [
  {
    icon: "fa-calendar-star",
    title: "Gestion d'événements",
    desc: "Créez et gérez tous vos événements : mariages, conférences, cérémonies et plus encore.",
    color: "from-violet-500 to-purple-600",
  },
  {
    icon: "fa-users",
    title: "Gestion des invités",
    desc: "Importez, organisez et suivez chaque invité avec des profils détaillés et personnalisés.",
    color: "from-blue-500 to-cyan-600",
  },
  {
    icon: "fa-qrcode",
    title: "QR Code unique",
    desc: "Générez automatiquement un QR Code sécurisé et unique pour chaque invitation.",
    color: "from-emerald-500 to-teal-600",
  },
  {
    icon: "fa-camera",
    title: "Scanner en temps réel",
    desc: "Validez les entrées instantanément depuis n'importe quel smartphone.",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: "fa-chart-bar",
    title: "Statistiques avancées",
    desc: "Tableaux de bord et rapports détaillés sur la participation et les confirmations.",
    color: "from-pink-500 to-rose-600",
  },
  {
    icon: "fa-paper-plane",
    title: "Partage facile",
    desc: "Partagez les invitations via WhatsApp, email ou lien direct en un clic.",
    color: "from-amber-500 to-yellow-600",
  },
];

const steps = [
  { step: "01", title: "Créez votre événement", desc: "Renseignez les détails de votre événement : nom, date, lieu, type et image de couverture." },
  { step: "02", title: "Ajoutez vos invités", desc: "Importez votre liste ou ajoutez les invités manuellement avec leurs informations." },
  { step: "03", title: "Envoyez les invitations", desc: "Chaque invité reçoit une invitation personnalisée avec un QR Code unique." },
  { step: "04", title: "Gérez l'accueil", desc: "Scannez les QR Codes à l'entrée pour valider les présences en temps réel." },
];

const plans = [
  {
    name: "Starter",
    price: "Gratuit",
    desc: "Parfait pour débuter",
    features: ["1 événement actif", "Jusqu'à 50 invités", "QR Codes basiques", "Dashboard simple"],
    cta: "Commencer gratuitement",
    popular: false,
  },
  {
    name: "Pro",
    price: "29€/mois",
    desc: "Pour les organisateurs professionnels",
    features: ["Événements illimités", "Invités illimités", "QR Codes sécurisés", "Statistiques avancées", "Import/Export Excel", "Support prioritaire"],
    cta: "Essai gratuit 14 jours",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Sur devis",
    desc: "Pour les grandes organisations",
    features: ["Tout du plan Pro", "Multi-organisations", "API dédiée", "Personnalisation totale", "Formation incluse", "Support dédié 24/7"],
    cta: "Nous contacter",
    popular: false,
  },
];

const faqs = [
  { q: "Comment fonctionne le QR Code ?", a: "Chaque invité reçoit un QR Code unique et sécurisé. Au moment de l'entrée, le personnel scanne ce code depuis son téléphone pour valider la présence en temps réel." },
  { q: "Puis-je personnaliser les invitations ?", a: "Oui, INVITIX propose plusieurs modèles d'invitations que vous pouvez personnaliser avec votre message, vos couleurs et le logo de votre événement." },
  { q: "Comment importer ma liste d'invités ?", a: "Vous pouvez importer votre liste d'invités depuis un fichier Excel ou CSV. INVITIX s'occupe du reste automatiquement." },
  { q: "L'application fonctionne-t-elle sur mobile ?", a: "Oui, INVITIX est entièrement responsive et optimisée pour mobile, tablette et ordinateur. Le scanner QR est particulièrement conçu pour les smartphones." },
  { q: "Mes données sont-elles sécurisées ?", a: "Absolument. Toutes les données sont chiffrées et stockées de manière sécurisée. Nous respectons le RGPD et ne partageons jamais vos données." },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#020408] text-white font-sans">
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-slate-950/80 border-b border-amber-300/15 backdrop-blur-xl shadow-2xl" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-amber-500/20">
                <i className="fa-solid fa-sparkles text-slate-950 text-sm"></i>
              </div>
              <span className="text-xl font-black tracking-tight text-gradient">
                INVITIX
              </span>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8">
              {["Fonctionnalités", "Comment ça marche", "Tarifs", "FAQ"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s+/g, "-").replace(/[éè]/g, "e").replace(/[àâ]/g, "a")}`}
                  className={`text-sm font-medium transition-colors hover:text-violet-400 ${scrolled ? "text-gray-600" : "text-white/80"}`}
                >
                  {item}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/login"
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${scrolled ? "text-indigo-900 hover:bg-indigo-50" : "text-white hover:bg-white/10"}`}
              >
                Connexion
              </Link>
              <Link
                href="/register"
                className="px-5 py-2 bg-gradient-to-r from-violet-600 to-purple-700 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg hover:opacity-90 transition-all"
              >
                Essai gratuit
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className={`md:hidden p-2 rounded-lg ${scrolled ? "text-gray-700" : "text-white"}`}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <i className={`fas ${menuOpen ? "fa-xmark" : "fa-bars"} text-lg`}></i>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-slate-950/95 border-t border-white/10 shadow-2xl backdrop-blur-xl">
            <div className="px-4 py-4 flex flex-col gap-3">
              {["Fonctionnalités", "Tarifs", "FAQ"].map((item) => (
                <a key={item} href={`#${item.toLowerCase()}`} className="text-slate-200 font-medium py-2" onClick={() => setMenuOpen(false)}>
                  {item}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-2 border-t">
                <Link href="/login" className="text-center px-4 py-2.5 border border-amber-300/50 text-amber-200 font-semibold rounded-xl">
                  Connexion
                </Link>
                <Link href="/register" className="text-center px-4 py-2.5 gradient-primary text-white font-semibold rounded-xl">
                  Essai gratuit
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center gradient-hero overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-900/10 rounded-full blur-3xl"></div>
        </div>

        {/* Floating cards decoration */}
        <div className="absolute right-8 top-1/3 hidden xl:block opacity-80 animate-float">
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-4 w-52 shadow-2xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-emerald-400 rounded-full flex items-center justify-center">
                <i className="fas fa-check text-white text-xs"></i>
              </div>
              <div>
                <p className="text-white text-xs font-semibold">Jean-Luc T.</p>
                <p className="text-white/60 text-xs">Validé • Table 12</p>
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-2 text-center">
              <p className="text-white/80 text-xs">✅ Entrée confirmée</p>
            </div>
          </div>
        </div>

        <div className="absolute right-24 bottom-1/3 hidden xl:block opacity-70 animate-bounce" style={{ animationDuration: "3s" }}>
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-3 shadow-xl">
            <div className="text-white text-xs font-medium mb-1">📊 Taux de présence</div>
            <div className="text-2xl font-black text-amber-400">87%</div>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur border border-white/20 rounded-full text-white/90 text-sm font-medium mb-8">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              Plateforme de gestion d'événements #1
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-tight mb-6">
              Créez.{" "}
              <span className="text-gradient bg-gradient-to-r from-violet-400 to-amber-400" style={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Invitez.
              </span>
              <br />
              Rassemblez.
            </h1>

            <p className="text-xl text-white/70 mb-10 leading-relaxed max-w-xl">
              INVITIX vous permet de créer, gérer et contrôler vos invitations d'événements en toute simplicité. QR Codes, scanner en temps réel, statistiques avancées.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-700 text-white font-bold rounded-2xl shadow-2xl hover:shadow-violet-500/50 hover:opacity-90 transition-all text-lg"
              >
                <i className="fas fa-rocket"></i>
                Créer un événement
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur border border-white/30 text-white font-bold rounded-2xl hover:bg-white/20 transition-all text-lg"
              >
                <i className="fas fa-arrow-right-to-bracket"></i>
                Se connecter
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 mt-16 pt-8 border-t border-white/10">
              {[
                { value: "500+", label: "Événements gérés" },
                { value: "50K+", label: "Invités traités" },
                { value: "99.9%", label: "Disponibilité" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-3xl font-black text-white">{stat.value}</div>
                  <div className="text-white/50 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="fonctionnalités" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 text-violet-700 rounded-full text-sm font-semibold mb-4">
              <i className="fas fa-sparkles"></i> Fonctionnalités
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-white mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Une suite complète d'outils pour gérer vos événements de A à Z
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-amber-300/15 hover:border-amber-300/40 hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform`}>
                  <i className={`fas ${feature.icon} text-white text-lg`}></i>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="comment-ca-marche" className="py-24 bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold mb-4">
              <i className="fas fa-list-check"></i> Processus
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">
              Comment ça fonctionne ?
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              4 étapes simples pour gérer votre événement parfaitement
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, idx) => (
              <div key={step.step} className="relative text-center group">
                {idx < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-violet-200 to-indigo-200 z-0"></div>
                )}
                <div className="relative z-10">
                  <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform">
                    <span className="text-white font-black text-lg">{step.step}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo / Screenshot section */}
      <section className="py-24 gradient-hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 text-white/90 rounded-full text-sm font-semibold mb-6">
            <i className="fas fa-play-circle"></i> Démonstration
          </div>
          <h2 className="text-4xl lg:text-5xl font-black text-white mb-6">
            Voyez INVITIX en action
          </h2>
          <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto">
            Un dashboard intuitif, des fonctionnalités puissantes, une expérience fluide
          </p>
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-3xl p-8 max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { icon: "fa-calendar", value: "12", label: "Événements", color: "text-violet-400" },
                { icon: "fa-users", value: "1,248", label: "Invités", color: "text-blue-400" },
                { icon: "fa-check-circle", value: "847", label: "Présents", color: "text-emerald-400" },
                { icon: "fa-percent", value: "87%", label: "Présence", color: "text-amber-400" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/10 rounded-2xl p-4 text-center">
                  <i className={`fas ${stat.icon} ${stat.color} text-2xl mb-2`}></i>
                  <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                  <div className="text-white/60 text-xs">{stat.label}</div>
                </div>
              ))}
            </div>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-700 text-white font-bold rounded-2xl shadow-xl hover:opacity-90 transition-all"
            >
              <i className="fas fa-arrow-right"></i>
              Essayer gratuitement maintenant
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="tarifs" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold mb-4">
              <i className="fas fa-tags"></i> Tarifs
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">
              Des tarifs transparents
            </h2>
            <p className="text-xl text-gray-500">Choisissez le plan qui correspond à vos besoins</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-white rounded-3xl p-8 shadow-sm border ${plan.popular ? "border-violet-500 shadow-xl shadow-violet-100 scale-105" : "border-gray-100"}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-violet-600 to-purple-700 text-white text-sm font-bold rounded-full">
                    Le plus populaire
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                  <p className="text-gray-500 text-sm mb-4">{plan.desc}</p>
                  <div className="text-3xl font-black text-gray-900">{plan.price}</div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <i className="fas fa-check text-emerald-500"></i> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block text-center py-3 rounded-xl font-bold transition-all ${plan.popular ? "gradient-primary text-white shadow-lg hover:opacity-90" : "border-2 border-gray-200 text-gray-700 hover:border-violet-500 hover:text-violet-600"}`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-4">
              <i className="fas fa-question-circle"></i> FAQ
            </div>
            <h2 className="text-4xl font-black text-gray-900 mb-4">Questions fréquentes</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-gray-100 rounded-2xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-5 text-left bg-white hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                >
                  <span className="font-semibold text-gray-900">{faq.q}</span>
                  <i className={`fas fa-chevron-${openFaq === idx ? "up" : "down"} text-violet-500 text-sm flex-shrink-0 ml-4`}></i>
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-50">
                    <div className="pt-4">{faq.a}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 gradient-primary">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="text-5xl mb-6">🎉</div>
          <h2 className="text-4xl lg:text-5xl font-black text-white mb-6">
            Prêt à transformer vos événements ?
          </h2>
          <p className="text-xl text-white/70 mb-10">
            Rejoignez des centaines d'organisateurs qui font confiance à INVITIX
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/register"
              className="px-10 py-4 bg-white text-indigo-900 font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all text-lg"
            >
              <i className="fas fa-rocket mr-2"></i> Démarrer gratuitement
            </Link>
            <Link
              href="/login"
              className="px-10 py-4 bg-white/10 border border-white/30 text-white font-bold rounded-2xl hover:bg-white/20 transition-all text-lg"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                  <i className="fas fa-sparkles text-white text-xs"></i>
                </div>
                <span className="text-lg font-black">INVITIX</span>
              </div>
              <p className="text-gray-400 text-sm">Gérez. Invitez. Rassemblez.</p>
            </div>
            {[
              { title: "Produit", links: ["Fonctionnalités", "Tarifs", "Sécurité"] },
              { title: "Ressources", links: ["Documentation", "Blog", "Support"] },
              { title: "Légal", links: ["Confidentialité", "CGU", "RGPD"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-bold mb-4 text-gray-200">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">© 2024 INVITIX. Tous droits réservés.</p>
            <div className="flex gap-4">
              {["fa-twitter", "fa-linkedin", "fa-instagram", "fa-facebook"].map((icon) => (
                <a key={icon} href="#" className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-violet-600 transition-colors">
                  <i className={`fab ${icon} text-sm`}></i>
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
