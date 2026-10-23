/**
 * Point d'entrée de l'API, lancé par `npm run dev`.
 *
 * Assemble l'application sans contenir de logique métier : active la lecture
 * du JSON, déclare GET /health, branche les routeurs sur leurs préfixes,
 * répond 404 aux routes inconnues, puis branche le middleware d'erreur en
 * dernier pour qu'il reçoive les erreurs de toutes les routes.
 *
 * Importe : pool (db.ts) pour /health, routeurClients (routes/clients.ts),
 * routeurDevis (routes/devis.ts), gestionErreurs (erreurs.ts).
 * N'est importé par aucun fichier.
 */

