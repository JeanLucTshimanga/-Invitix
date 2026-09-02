"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center px-4">
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-xl">
              <i className="fas fa-sparkles text-white text-lg"></i>
            </div>
            <span className="text-2xl font-black text-white">INVITIX</span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {!submitted ? (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-black text-gray-900">Mot de passe oublié</h1>
                <p className="text-gray-500 text-sm mt-1">
                  Entrez votre email pour recevoir un lien de réinitialisation.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                  <div className="relative">
                    <i className="fas fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vous@exemple.com"
                      className="input-field pl-10"
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="w-full py-3.5 gradient-primary text-white font-bold rounded-xl">
                  <i className="fas fa-paper-plane mr-2"></i>Envoyer le lien
                </button>
              </form>
              <p className="text-center text-sm text-gray-500 mt-4">
                <Link href="/login" className="text-violet-600 font-semibold hover:underline">
                  <i className="fas fa-arrow-left mr-1"></i>Retour à la connexion
                </Link>
              </p>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-envelope-circle-check text-emerald-500 text-3xl"></i>
              </div>
              <h2 className="text-xl font-black text-gray-900 mb-2">Email envoyé !</h2>
              <p className="text-gray-500 text-sm mb-6">
                Si un compte existe avec cet email, vous recevrez un lien de réinitialisation dans quelques minutes.
              </p>
              <Link href="/login" className="btn-primary">
                <i className="fas fa-arrow-left"></i> Retour à la connexion
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
