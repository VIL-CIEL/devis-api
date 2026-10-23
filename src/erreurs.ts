/**
 * Gestion des erreurs, commune à toute l'API.
 *
 * Les routeurs ne construisent jamais eux-mêmes une réponse d'erreur : ils
 * lèvent une ErreurHttp, et gestionErreurs la transforme en { erreur } avec
 * le bon code. Toute autre erreur devient un 500 au message générique.
 * lireId et codePg sont ici parce que les deux routeurs en ont besoin ; les
 * placer dans index.ts créerait un import circulaire.
 *
 * Exporte : ErreurHttp, gestionErreurs, lireId, codePg.
 * Utilisé par : index.ts (gestionErreurs), routes/clients.ts et
 * routes/devis.ts (le reste). N'importe que des types d'Express.
 */

