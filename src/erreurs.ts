/**
 * Gestion des erreurs et lecture des entrées, communes à toute l'API.
 *
 * Les routeurs ne construisent jamais eux-mêmes une réponse d'erreur : ils
 * lèvent une ErreurHttp, et gestionErreurs la transforme en { erreur } avec
 * le bon code. Toute autre erreur devient un 500 au message générique, et
 * son détail ne part que dans la console. lireObjet, lireId et codePg sont
 * ici parce que les deux routeurs en ont besoin ; les placer dans index.ts
 * créerait un import circulaire.
 *
 * Exporte : ErreurHttp, gestionErreurs, lireObjet, lireId, codePg.
 * Utilisé par : index.ts (gestionErreurs), routes/clients.ts et
 * routes/devis.ts (le reste).
 * Importe : DEBUG (config.ts), le type ErrorRequestHandler d'Express.
 */

import type { ErrorRequestHandler } from "express";
import { DEBUG } from "./config.js";

/**
 * Erreur prévue, qui porte le code HTTP à renvoyer.
 * Son message part tel quel chez le client : il doit être lisible et ne rien
 * révéler du fonctionnement interne.
 */
export class ErreurHttp extends Error {
    readonly status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

/**
 * Middleware d'erreur, branché en dernier dans index.ts.
 * Une ErreurHttp donne son code et son message, un JSON mal formé donne 400,
 * toute autre erreur donne 500 avec un message générique, le détail allant
 * seulement dans la console.
 */
export const gestionErreurs: ErrorRequestHandler = (err, req, res, next) => {
    if (err instanceof ErreurHttp) {
        res.status(err.status).json({ erreur: err.message });
        if (DEBUG) console.log("[" + err.status + "] " + err.message);
    } else if (err.type === "entity.parse.failed") {
        const message = "Le corps de la requête n'est pas un JSON valide";
        res.status(400).json({ erreur: message });
        if (DEBUG) console.log("[400] " + message);
    } else {
        const message = "Une erreur imprévue est survenue";
        res.status(500).json({ erreur: message });
        console.error("[500] " + message + " :", err);
    }
};

/**
 * Vérifie que le corps d'une requête est un objet JSON (ni null, ni tableau)
 * et le renvoie avec des propriétés de type unknown, à vérifier une à une.
 * Lève une ErreurHttp 400 sinon.
 */
export function lireObjet(corps: unknown): Record<string, unknown> {
    if (typeof corps !== "object" || corps === null || Array.isArray(corps)) {
        throw new ErreurHttp(400, "Le corps de la requête doit être un objet JSON");
    }

    return corps as Record<string, unknown>;
}

/**
 * Convertit un paramètre de chemin (toujours une chaîne) en entier strictement
 * positif. Lève une ErreurHttp 400 sinon : "abc", "0", "-3", "1.5" et la
 * chaîne vide sont refusés.
 */
export function lireId(brut: string): number {
    const id = Number(brut);

    if (!Number.isInteger(id) || id <= 0) {
        throw new ErreurHttp(400, "L'identifiant doit être un entier strictement positif");
    }

    return id;
}

/**
 * Renvoie le code d'une erreur PostgreSQL ("23503", "23505"...), ou undefined
 * si l'erreur n'en porte pas, par exemple une ErreurHttp.
 */
export function codePg(err: unknown): string | undefined {
    if (typeof err === "object" && err !== null && "code" in err && typeof err.code === "string") {
        return err.code;
    }

    return undefined;
}
