# devis-api

Une API REST de gestion de devis, écrite en TypeScript avec Express 5 et PostgreSQL. Elle gère des clients, leurs devis et les lignes de ces devis, et fait respecter le cycle de vie d'un devis : brouillon, envoyé, puis signé ou refusé. C'est un morceau volontairement réduit d'un ERP, que j'ai réalisé en octobre 2026 pour ma candidature en alternance chez UP IT.

## Démarrer

Il faut Node.js 22 ou plus récent (j'ai développé avec Node 26) et PostgreSQL 16 ou plus récent.

1. Créer un rôle et une base, connecté à psql en tant que `postgres` :

   ```sql
   CREATE ROLE devis_app LOGIN PASSWORD 'choisir-un-mot-de-passe';
   CREATE DATABASE devis OWNER devis_app;
   ```

2. Installer les dépendances :

   ```
   npm install
   ```

3. Copier `.env.example` en `.env` et y mettre le mot de passe choisi :

   ```
   DATABASE_URL=postgres://devis_app:choisir-un-mot-de-passe@localhost:5432/devis
   PORT=3000
   DEBUG=0
   ```

4. Créer les tables puis charger les données d'exemple. Sous Windows, la première ligne indique à psql que les fichiers sont en UTF-8 :

   ```
   $env:PGCLIENTENCODING = "UTF8"
   psql -U devis_app -d devis -h localhost -f sql/schema.sql
   psql -U devis_app -d devis -h localhost -f sql/donnees.sql
   ```

   Sous Linux ou macOS : `PGCLIENTENCODING=UTF8 psql ...` avec les mêmes arguments.

5. Lancer l'API :

   ```
   npm run dev
   ```

   `GET http://localhost:3000/health` doit répondre `200`.

| Commande | Rôle |
|---|---|
| `npm run dev` | Lance l'API et la redémarre à chaque modification |
| `npm run typecheck` | Vérifie les types de tout le projet, sans rien produire |
| `npm test` | Lance les tests des règles de statut |

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Adresse de connexion à PostgreSQL (obligatoire) |
| `PORT` | Port d'écoute, 3000 par défaut |
| `DEBUG` | `1` affiche dans la console une ligne par requête (méthode, chemin, code, durée) et le détail des erreurs prévues |

## Les routes

| Méthode | Route | Rôle | Codes |
|---|---|---|---|
| GET | `/health` | Vérifie que l'API et la base répondent | 200, 503 |
| GET | `/clients` | Liste des clients | 200 |
| GET | `/clients/:id` | Un client | 200, 400, 404 |
| POST | `/clients` | Crée un client : `{ "nom", "email", "telephone" }` | 201, 400 |
| PATCH | `/clients/:id` | Modifie seulement les champs envoyés | 200, 400, 404 |
| DELETE | `/clients/:id` | Supprime un client qui n'a pas de devis | 204, 400, 404, 409 |
| GET | `/devis` | Liste des devis, filtrable avec `?statut=` | 200, 400 |
| GET | `/devis/:id` | Un devis avec ses lignes et son total HT | 200, 400, 404 |
| POST | `/devis` | Crée un brouillon pour un client : `{ "client_id" }` | 201, 400, 404 |
| POST | `/devis/:id/statut` | Change le statut : `{ "statut": "envoye" }` | 200, 400, 404, 409 |
| POST | `/devis/:id/lignes` | Ajoute une ligne à un brouillon : `{ "designation", "quantite", "prix_unitaire_ht" }` | 201, 400, 404, 409 |
| DELETE | `/devis/:id/lignes/:ligneId` | Retire une ligne d'un brouillon | 204, 400, 404, 409 |

Toutes les erreurs ont la même forme : `{ "erreur": "message lisible" }`.

Les règles métier :

- un devis naît en brouillon ;
- les transitions autorisées sont brouillon vers envoyé, puis envoyé vers signé ou refusé, et rien d'autre ;
- on n'envoie pas un devis sans ligne ;
- les lignes ne se modifient que sur un brouillon ;
- on ne supprime pas un client qui a des devis.

## Organisation du code

```
sql/schema.sql          création des trois tables (efface la base)
sql/donnees.sql         données d'exemple
src/index.ts            assemblage de l'application et démarrage
src/config.ts           lecture de PORT et DEBUG
src/db.ts               le pool de connexions PostgreSQL
src/erreurs.ts          ErreurHttp, middleware d'erreur, lecture des entrées
src/statuts.ts          les statuts et les transitions, en fonctions pures
src/routes/clients.ts   les routes /clients
src/routes/devis.ts     les routes /devis et leurs lignes
tests/statuts.test.ts   tests des règles de statut
requests.http           requêtes d'exemple, rejouables dans l'ordre
```

```mermaid
flowchart TD
  C[Client HTTP] --> I[index.ts]
  I --> RC[routes/clients.ts]
  I --> RD[routes/devis.ts]
  RD --> S[statuts.ts<br/>règles de statut]
  RC --> DB[db.ts<br/>pool]
  RD --> DB
  DB --> PG[(PostgreSQL)]
  RC -. ErreurHttp .-> E[erreurs.ts<br/>middleware d'erreur]
  RD -. ErreurHttp .-> E
  E -. "{ erreur }" .-> C
```

Les deux routeurs ne se connaissent pas : la base est leur seul point commun. Une route lit et valide sa requête, interroge la base, puis répond ou lève une `ErreurHttp`. Le middleware de `erreurs.ts` transforme toutes les erreurs en `{ erreur }` avec le bon code, et une erreur imprévue devient un 500 dont le détail ne part que dans la console.

## Mes choix

**Du SQL écrit à la main, sans ORM.** Le projet est petit, et je voulais voir exactement ce qui part vers la base. Toutes les requêtes sont paramétrées (`$1`, `$2`) : aucune valeur reçue n'est jamais collée dans le texte SQL, ce qui ferme la porte à l'injection SQL.

**Le total n'est pas stocké.** Il est calculé à chaque lecture avec `SUM(quantite * prix_unitaire_ht)`. Un total stocké peut se désynchroniser des lignes, un total calculé ne le peut pas.

**Les montants sortent en chaînes de caractères** (`"289.86"`). Ils sont stockés en `NUMERIC(10, 2)`, un décimal exact, et la bibliothèque `pg` les rend en texte pour ne pas perdre de précision. Les convertir en `number` réintroduirait les erreurs d'arrondi des flottants. Si un prix arrive avec plus de deux décimales, PostgreSQL l'arrondit au centime.

**Les règles de statut vivent dans une fonction pure.** `statuts.ts` contient la table des transitions et ne dépend ni de la base ni d'Express. On lit tout le cycle de vie d'un devis à un seul endroit, on peut le tester sans serveur, et ajouter un statut ne touche qu'à cette table.

**400, 404 et 409.** Un 400 répond à une requête mal formée, qui serait refusée dans tous les cas. Un 409 répond à une requête valide qui contredit l'état actuel : envoyer un devis déjà envoyé, modifier les lignes d'un devis signé, supprimer un client qui a des devis. Une clé étrangère qui échoue (code PostgreSQL `23503`) devient un 404 à la création d'un devis (le client n'existe pas) et un 409 à la suppression d'un client (il est encore utilisé).

**Un changement de statut conditionnel.** L'`UPDATE` porte sur l'identifiant et sur l'ancien statut. Si deux personnes envoient le même devis en même temps, une seule réussit, l'autre reçoit un 409.

**La base garantit aussi les règles.** `NOT NULL`, `CHECK` sur les statuts, les quantités, les prix et les noms vides, clés étrangères : même si le code se trompe, la base refuse les données incohérentes. Le code vérifie d'abord pour renvoyer des messages clairs.

**La validation des entrées est écrite à la main.** Le corps d'une requête est traité comme `unknown` et vérifié champ par champ avant tout accès à la base. Quelques décisions :

- `client_id` doit être un nombre JSON : la chaîne `"5"` est refusée ;
- pour l'email et le téléphone, une chaîne vide vaut `null`, et l'email est enregistré en minuscules ;
- l'email et le téléphone ne sont pas uniques : ce sont de simples informations de contact ;
- un `PATCH` distingue une clé absente (on garde la valeur) d'une clé à `null` (on l'efface), refuse un corps sans champ connu et ignore les champs inconnus.

**Les lignes et le total d'un devis sont lus en parallèle** avec `Promise.all`, puisque les deux requêtes sont indépendantes. Le devis est lu avant, pour répondre 404 sans lancer les deux autres requêtes.

## Limites connues

- **Modification d'un client.** Le `PATCH` lit le client, fusionne les champs, puis écrit. Si le client est supprimé entre la lecture et l'écriture, l'API répond 404 avec le même message que s'il n'avait jamais existé. Ce cas est sans gravité, mais il faut le savoir si on ajoute d'autres écritures en plusieurs temps.
- **Ajout et retrait de lignes.** La vérification du statut et l'écriture sont deux requêtes séparées. Un changement de statut qui tomberait exactement entre les deux pourrait laisser modifier les lignes d'un devis qui vient d'être envoyé. La correction est une transaction avec `SELECT ... FOR UPDATE`, que je n'ai pas faite ici.
- **`updated_at`** est mis à jour par le code lors d'un changement de statut, mais pas lors d'un ajout ou d'un retrait de ligne.
- **`schema.sql` efface toutes les données.** Il convient au développement, pas à une base en service.
- Pas d'authentification, pas de pagination.

## Tests

`npm test` lance 17 tests sur `statuts.ts` : les transitions autorisées et interdites, les statuts finaux, la reconnaissance des statuts valides et la modification des lignes.

`requests.http` contient 54 requêtes, à rejouer de haut en bas avec l'extension REST Client de VS Code sur une base fraîchement créée. Le code de réponse attendu est indiqué entre crochets dans le titre de chaque requête, cas d'erreur compris.

## Ce que je ferais ensuite

- **Une table `contacts`.** Un client est souvent une entreprise avec plusieurs interlocuteurs. Le client garderait le nom de l'entreprise, et chaque contact aurait son prénom, son nom, son email et son téléphone.
- **Une bibliothèque de validation**, comme Zod, à la place des fonctions écrites à la main.
- **Des transactions** pour l'ajout et le retrait de lignes (voir les limites).
- **Des tests d'intégration automatiques**, qui rejoueraient les scénarios de `requests.http` sur une base de test à chaque `npm test`.
- **Des migrations** à la place de `schema.sql`, pour faire évoluer le schéma sans perdre de données.
- **Un journal structuré** (pino par exemple), sans données personnelles dans les logs.
- L'authentification, la pagination des listes, puis un front pour l'espace client.

## Méthode de travail

J'ai découvert TypeScript avec ce projet. J'ai travaillé avec un assistant IA (Claude) utilisé comme tuteur : il m'a expliqué les notions, m'a donné des exemples sur un autre sujet, a relu chaque étape et m'a signalé les erreurs. J'ai écrit le code étape par étape, avec un commit par étape, et l'harmonisation finale du style a été faite avec son aide. L'historique des commits montre cette progression.

Fabien Villedieu, octobre 2026
