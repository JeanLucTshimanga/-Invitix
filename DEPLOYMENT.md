# Déploiement sur Vercel

## Prérequis
1. Compte Vercel
2. Base de données PostgreSQL (Supabase, Neon, ou autre)
3. Repository GitHub

## Étapes de déploiement

### 1. Préparer la base de données PostgreSQL
- Créer une base de données PostgreSQL (Supabase ou Neon recommandé)
- Récupérer l'URL de connexion : `postgresql://user:password@host:5432/dbname`

### 2. Configurer Vercel
1. Connecter votre repository GitHub à Vercel
2. Ajouter les variables d'environnement dans Vercel Dashboard :

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=ma-cle-secrete (minimum 32 caractères)
NEXT_PUBLIC_APP_URL=https://votre-domaine.vercel.app
```

### 3. Exécuter les migrations
Après le déploiement, exécuter les migrations Drizzle :

```bash
# Installer drizzle-kit globalement
npm install -g drizzle-kit

# Exécuter les migrations
npx drizzle-kit push
```

### 4. Seeder la base de données (optionnel)
Pour créer les comptes de démonstration :

```bash
DATABASE_URL=votre-url-postgresql npx tsx src/scripts/seed.ts
```

## Variables d'environnement requises

| Variable | Description | Exemple |
|----------|-------------|---------|
| DATABASE_URL | URL PostgreSQL | `postgresql://user:password@host:5432/dbname` |
| JWT_SECRET | Clé secrète pour JWT | `ma-cle-secrete-tres-longue` |
| NEXT_PUBLIC_APP_URL | URL de l'application | `https://invitix.vercel.app` |

## Comptes de démonstration
Après le seeding :
- admin@invitix.com / admin123 (Super Admin)
- organizer@invitix.com / demo123 (Organisateur)
- protocol@invitix.com / demo123 (Protocole)

## Dépannage

### Erreur de connexion à la base de données
- Vérifier que DATABASE_URL est correcte
- Vérifier que la base de données est accessible depuis internet
- Vérifier les pare-feux et les règles de sécurité

### Erreur de build
- Vérifier que toutes les dépendances sont installées
- Vérifier la version de Node.js (>= 18)
- Vérifier les logs de build dans Vercel Dashboard

### Problèmes d'authentification
- Vérifier que JWT_SECRET est défini
- Vérifier que les cookies sont correctement configurés

## Support
Pour toute question, consulter la documentation :
- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Drizzle ORM](https://orm.drizzle.team)
- [Documentation Next.js](https://nextjs.org/docs)