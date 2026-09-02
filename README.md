# INVITIX — Gérez. Invitez. Rassemblez.

Application web complète de gestion d'événements et d'invitations professionnelles avec QR Codes.

## 🚀 Fonctionnalités

- **Gestion d'événements** : Créer, modifier, supprimer, dupliquer des événements
- **Gestion des invités** : Ajouter, modifier, rechercher, filtrer les invités
- **QR Codes uniques** : Génération automatique pour chaque invitation
- **Scanner QR** : Scanner les QR Codes via la caméra du téléphone
- **Invitations personnalisées** : 3 modèles d'invitation avec partage WhatsApp/Email
- **Gestion des tables** : Organisation des places et affectation des invités
- **Statistiques** : Tableaux de bord avec taux de présence et rapports
- **Authentification** : Inscription, connexion, gestion des rôles
- **Responsive** : Optimisé pour mobile, tablette et ordinateur

## 👥 Rôles utilisateur

| Rôle | Accès |
|------|-------|
| **Super Admin** | Tout (utilisateurs, événements, paramètres) |
| **Organisateur** | Événements, invités, statistiques |
| **Protocole** | Scanner QR Code, voir les invités |

## 🔑 Comptes de démonstration

```
admin@invitix.com / admin123    (Super Admin)
organizer@invitix.com / demo123  (Organisateur)
protocol@invitix.com / demo123   (Protocole)
```

## 🛠 Technologies

- **Frontend** : Next.js 16 (App Router), React 19, TypeScript
- **Styling** : Tailwind CSS v4, Font Awesome 6
- **Base de données** : PostgreSQL + Drizzle ORM
- **Auth** : JWT (cookies httpOnly), bcryptjs
- **QR Code** : qrcode (génération), jsqr (lecture caméra)

## 📦 Installation

```bash
# 1. Cloner le projet
git clone <repo-url>
cd invitix

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env
# Modifier DATABASE_URL dans .env

# 4. Créer les tables
npx drizzle-kit push

# 5. Seeder la base de données (comptes démo)
DATABASE_URL=<your-db-url> npx tsx src/scripts/seed.ts

# 6. Démarrer en développement
npm run dev
```

## 🌐 Variables d'environnement

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your-super-secret-jwt-key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 📁 Structure du projet

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── auth/          # Authentification
│   │   ├── events/        # CRUD événements
│   │   ├── guests/        # CRUD invités
│   │   ├── qr/            # QR Code scan/générer/check-in
│   │   ├── invitations/   # Pages d'invitation
│   │   ├── tables/        # Gestion des tables
│   │   ├── users/         # Gestion des utilisateurs
│   │   └── dashboard/     # Statistiques
│   ├── dashboard/         # Pages du tableau de bord
│   ├── login/             # Connexion
│   ├── register/          # Inscription
│   ├── scan/              # Page invitation publique
│   └── forgot-password/   # Récupération mot de passe
├── components/            # Composants réutilisables
│   ├── dashboard/         # Shell du dashboard + sidebar
│   ├── events/            # Modales invité/invitation
│   └── landing/           # Page d'accueil
├── contexts/              # Contextes React (Auth)
├── db/                    # Drizzle ORM
│   ├── index.ts           # Client DB
│   └── schema.ts          # Schéma complet
├── lib/                   # Utilitaires
│   ├── auth.ts            # JWT, bcrypt, helpers
│   └── utils.ts           # Formatage, labels
└── scripts/               # Scripts utilitaires
    └── seed.ts            # Données de démonstration
```

## 🚀 Déploiement Vercel

1. Connecter le repo à Vercel
2. Ajouter les variables d'environnement dans Vercel Dashboard
3. Configurer une base de données PostgreSQL (ex: Neon, Supabase)
4. Déployer !

## 📱 Scanner QR Code

La page `/dashboard/scanner` :
- Utilise la caméra du téléphone (API MediaDevices)
- Décode les QR Codes en temps réel avec jsQR
- Affiche le résultat (valide / déjà utilisé / invalide)
- Permet de valider l'entrée d'un invité en un clic
- Conserve un historique des 10 derniers scans

## 🎨 Design

- Palette : Bleu nuit (#1e1b4b), Violet (#7c3aed), Blanc, touches dorées (#f59e0b)
- Interface SaaS moderne avec sidebar, cards, tableaux, badges
- Animations fluides et états de chargement
- 100% responsive et mobile-first
