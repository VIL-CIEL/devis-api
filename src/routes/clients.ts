/**
 * Routes /clients : création, lecture, modification et suppression.
 *
 * Un client n'a pas de cycle de vie, donc ce routeur ne consulte pas
 * statuts.ts. Il valide les entrées, interroge la base et répond. La
 * suppression d'un client qui a des devis est bloquée par la clé étrangère
 * de la table devis (code 23503), traduite en 409. Ne communique pas avec
 * routes/devis.ts : la base est leur seul point commun.
 *
 * Exporte : routeurClients, branché par index.ts sur /clients.
 * Importe : pool (db.ts), ErreurHttp, lireId, codePg (erreurs.ts).
 */

