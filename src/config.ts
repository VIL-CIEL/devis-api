/**
 * Configuration lue dans les variables d'environnement.
 *
 * Centralise les valeurs utilisées par plusieurs fichiers, pour que chaque
 * règle de lecture (valeur par défaut, valeur qui active une option) ne soit
 * écrite qu'une fois. N'importe rien, ce qui évite tout import circulaire.
 * DATABASE_URL reste dans db.ts, seul fichier qui en a besoin.
 *
 * Exporte : DEBUG, PORT.
 * Utilisé par : index.ts (DEBUG, PORT), erreurs.ts (DEBUG).
 */

export const DEBUG = process.env.DEBUG === "1";

export const PORT = Number(process.env.PORT ?? 3000);
