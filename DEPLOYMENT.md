# Déploiement sur Vercel

## Prérequis

- Un projet Vercel connecté au dépôt GitHub
- Une base PostgreSQL accessible depuis Internet (Neon, Supabase, etc.)
- Node.js 20 ou une version plus récente

## Variables d'environnement Vercel

À définir dans **Settings > Environment Variables** pour `Production` (et
éventuellement `Preview`) :

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=remplacer-par-une-cle-aleatoire-d-au-moins-32-caracteres
NEXT_PUBLIC_APP_URL=https://invitix.vercel.app
```

Le fichier `.env.production` contient uniquement des valeurs d'exemple. Ne
commitez jamais les identifiants réels de la base ou une clé JWT réelle.

## Initialiser le schéma PostgreSQL

Après avoir configuré `DATABASE_URL` localement ou dans l'environnement de
déploiement, exécuter depuis la racine du projet :

```bash
npx drizzle-kit push
```

Cette commande utilise `drizzle.config.ts` et `src/db/schema.ts`. Elle doit
être exécutée avant le premier appel à l'API.

Pour charger les comptes et données de démonstration :

```bash
npx tsx src/scripts/seed.ts
```

## Déployer

1. Importer le dépôt dans Vercel.
2. Vérifier les trois variables d'environnement ci-dessus.
3. Laisser Vercel utiliser `npm install` puis `npm run build`.
4. Déployer et vérifier `https://invitix.vercel.app/api/health`.

`vercel.json` fournit les commandes standard Next.js et la région `cdg1`.

## Vérifications locales

```bash
npm run typecheck
npm run build
```

## Dépannage

- **Connexion DB** : vérifier que `DATABASE_URL` est une URL PostgreSQL
  complète et que la base autorise les connexions externes.
- **JWT** : `JWT_SECRET` doit contenir au moins 32 caractères.
- **Build** : consulter les logs du déploiement Vercel et confirmer que les
  variables sont définies pour le bon environnement.
