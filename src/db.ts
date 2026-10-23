/**
 * Connexion à PostgreSQL.
 *
 * Crée un seul pool de connexions à partir de DATABASE_URL et l'exporte.
 * Node n'exécute ce module qu'une fois : tous les fichiers qui l'importent
 * partagent le même pool. Le fichier ne contient aucune requête, elles sont
 * écrites dans les routeurs.
 *
 * Exporte : pool.
 * Utilisé par : index.ts (/health), routes/clients.ts, routes/devis.ts.
 */

import pg from "pg";

const DATABASE_URL = process.env.DATABASE_URL;

if (DATABASE_URL === undefined) {
throw new Error("DATABASE URL NOT DEFINED");
}
