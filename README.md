# 🚀 Gradly Backend V2.5

Backend API pour **Gradly** - _Le cœur avant les yeux_ 💚

Application de rencontre révolutionnaire avec photo 100% floutée et défloutage progressif basé sur les conversations.

---

## 📋 Stack Technique

- **Runtime :** Node.js 20+
- **Framework :** Express.js
- **Base de données :** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Paiements :** Stripe (Checkout + Subscriptions + Webhooks)
- **Monitoring :** Sentry + Winston
- **Cache :** Redis (optionnel, >50k users)
- **Géocodage :** OpenStreetMap Nominatim

---

## 🔧 Installation

### 1. Prérequis

- Node.js >= 20.0.0
- npm >= 9.0.0
- Compte Supabase (base de données + storage)
- Compte Stripe (paiements)
- Compte Sentry (optionnel, monitoring)

### 2. Installation des dépendances

```bash
npm install
```

### 3. Configuration

Copier `.env.example` vers `.env.development` :

```bash
cp .env.example .env.development
```

Remplir toutes les variables dans `.env.development` :

```bash
# Serveur
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Stripe (MODE TEST)
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_PACK_3=price_test_xxxxx
STRIPE_PRICE_PACK_10=price_test_xxxxx
STRIPE_PRICE_MONTHLY=price_test_xxxxx
STRIPE_PRICE_YEARLY=price_test_xxxxx

# Email
EMAIL_API_KEY=your_email_api_key
EMAIL_FROM=dev@gradly.me

# Admin
ADMIN_EMAILS=admin@gradly.me,dev@gradly.me

# Sécurité
CRON_SECRET=your_very_long_random_secret_here_min_32_chars
SENTRY_DSN=

# Redis (optionnel)
REDIS_URL=
```

### 4. Configuration Supabase

Exécuter les 3 fichiers SQL dans **Supabase SQL Editor** (dans l'ordre) :

1. `supabase-sql/1-database.sql` (tables + vues + fonction + RLS)
2. `supabase-sql/2-functions.sql` (trigger + RPC functions)
3. `supabase-sql/3-seeds.sql` (70 questions)

Vérifier :
```sql
SELECT COUNT(*) FROM questions; -- Doit retourner 70
SHOW timezone; -- Doit retourner 'UTC'
```

Créer bucket Storage :
- Nom : `avatars`
- Visibilité : **Privé**
- Taille max : **8 MB**

### 5. Seed (optionnel si déjà fait dans Supabase)

```bash
npm run seed
```

---

## 🚀 Démarrage

### Mode développement

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:3000`

### Mode production

```bash
npm start
```

---

## 📚 Scripts disponibles

| Script | Description |
|--------|-------------|
| `npm run dev` | Démarrer en mode développement (nodemon) |
| `npm start` | Démarrer en mode production |
| `npm run seed` | Insérer les 70 questions dans la base |
| `npm run reconcile` | Exécuter le cron de réconciliation |
| `npm run setup` | Installation complète (vérifications + seed) |
| `npm test` | Lancer les tests unitaires |
| `npm run test:watch` | Tests en mode watch |
| `npm run lint` | Linter le code |
| `npm run lint:fix` | Corriger automatiquement les erreurs de linting |

---

## 🗂️ Structure du projet

```
gradly-backend/
├── server.js              # Point d'entrée (Sentry EN PREMIER)
├── config/                # Configuration (DB, Stripe, Logger, CORS, Security)
├── middleware/            # Middlewares (auth, errorHandler, rateLimit, etc.)
├── routes/                # Routes API (auth, matches, chat, payments, etc.)
├── services/              # Services métier (matching, stripe, geocode, etc.)
├── utils/                 # Utilitaires (AppError, constants, validators, etc.)
├── tests/                 # Tests (unit, integration, e2e)
├── scripts/               # Scripts (seed, reconcile, migrate, setup)
├── logs/                  # Logs Winston (error, stripe, matching)
├── docs/                  # Documentation (API, Webhooks, Architecture, etc.)
└── assets/                # Assets (sons)
```

---

## 🔐 Sécurité

### 12 Correctifs Critiques Appliqués

✅ Vue `public_profiles` (pas de SELECT public direct)  
✅ Age calculé dynamiquement (fonction `calculate_age`)  
✅ Trigger avec `SECURITY DEFINER`  
✅ Storage policies strictes (préfixe check)  
✅ Stripe `idempotencyKey` côté client  
✅ Cache Nominatim (`geocode_cache` table)  
✅ RLS messages strict (protection Realtime)  
✅ Health check Stripe en cache (pas bloquant)  
✅ Vue `profiles_with_subscription` (is_subscribed calculé)  
✅ Face-api modèles préchargés  
✅ DevTools obfuscation réaliste  
✅ Cron endpoint protégé (`X-Cron-Secret`)  

---

## 📡 API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Profil utilisateur
- `POST /api/auth/logout` - Déconnexion

### Matching
- `POST /api/matches/find` - Trouver un match (3 niveaux géo)
- `GET /api/matches/current` - Match actif
- `GET /api/matches/history` - Historique matchs

### Chat
- `POST /api/chat/start` - Démarrer conversation
- `POST /api/chat/send` - Envoyer message
- `GET /api/chat/:id/messages` - Récupérer messages
- `POST /api/chat/:id/end` - Terminer conversation

### Paiements
- `POST /api/payments/create-checkout` - Créer session Stripe
- `POST /api/payments/webhook` - Webhook Stripe
- `GET /api/payments/history` - Historique transactions

### Admin (protégé)
- `GET /api/admin/stats` - Statistiques globales
- `GET /api/admin/reports` - Liste reports
- `GET /api/admin/users` - Liste users
- `POST /api/admin/users/:id/action` - Actions admin

### Health
- `GET /api/health` - Health check (public)

---

## 🧪 Tests

### Tests unitaires

```bash
npm test
```

### Tests E2E (avec Playwright)

```bash
npm run test:e2e
```

---

## 📊 Monitoring

### Logs Winston

- **logs/error.log** - Erreurs uniquement
- **logs/combined.log** - Tous les logs
- **logs/stripe.log** - Webhooks Stripe
- **logs/matching.log** - Matchs avec score + distance + niveau

### Sentry

Configuré automatiquement si `SENTRY_DSN` défini dans `.env`.

### Health Check

```bash
curl http://localhost:3000/api/health
```

Retour attendu :
```json
{
  "status": "ok",
  "version": "2.5.0",
  "database": "connected",
  "stripe": "reachable",
  "sentry": "active",
  "timestamp": "2025-11-03T14:30:00.000Z"
}
```

---

## 🔄 Cron Jobs

### Reconcile (quotidien 3h)

Libère les users bloqués avec `in_conversation=true` mais sans conversation active.

```bash
curl -X POST http://localhost:3000/api/internal/reconcile \
  -H "X-Cron-Secret: your_secret_here"
```

---

## 🌍 Déploiement

### Railway

1. Créer projet Railway
2. Connecter GitHub repo
3. Ajouter toutes les variables d'environnement
4. Déploiement automatique à chaque push

### Variables d'environnement Production

- `NODE_ENV=production`
- `FRONTEND_URL=https://app.gradly.me`
- `STRIPE_SECRET_KEY=sk_live_xxxxx` (MODE LIVE)
- `STRIPE_WEBHOOK_SECRET=whsec_live_xxxxx`
- `SENTRY_DSN=https://xxxxx@sentry.io/xxxxx` (obligatoire)
- `CRON_SECRET=xxxxx` (obligatoire)

---

## 📖 Documentation

- **API.md** - Documentation API complète
- **WEBHOOKS.md** - Doc webhooks Stripe
- **ARCHITECTURE.md** - Schémas infra + flux
- **DEPLOY.md** - Guide déploiement
- **MONITORING.md** - Accès services + métriques
- **TROUBLESHOOTING.md** - 10+ erreurs + solutions

---

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/ma-feature`)
3. Commit (`git commit -m 'Ajout ma feature'`)
4. Push (`git push origin feature/ma-feature`)
5. Créer une Pull Request

---

## 📝 License

**UNLICENSED** - Propriété privée de Gradly

---

## 👥 Équipe

Développé avec 💚 par l'équipe **Gradly**

Contact : contact@gradly.me

---

## 🔗 Liens

- [Frontend React](https://github.com/gradly/gradly-frontend)
- [Documentation complète](https://docs.gradly.me)
- [Site web](https://gradly.me)
- [Application](https://app.gradly.me)