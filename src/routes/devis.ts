/**
 * Routes /devis : création d'un brouillon, lecture avec lignes et total,
 * ajout et retrait de lignes, changement de statut.
 *
 * Applique les règles de statuts.ts sans les réécrire : lit l'état du devis
 * en base, demande à statuts.ts si l'action est permise, puis écrit ou lève
 * un 409. Le total n'est pas stocké, il est calculé en SQL à chaque lecture.
 * Un client_id inexistant à la création donne un 404.
 *
 * Exporte : routeurDevis, branché par index.ts sur /devis.
 * Importe : pool (db.ts), ErreurHttp, lireId, codePg (erreurs.ts),
 * Statut, estStatut, peutPasser, lignesModifiables (statuts.ts).
 */

