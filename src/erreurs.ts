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
import type { ErrorRequestHandler } from "express";

export class ErreurHttp extends Error {
    readonly status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

export const gestionErreurs: ErrorRequestHandler = (err, req, res, next) => {
    if (err instanceof ErreurHttp) {
        res.status(err.status).json({ "erreur": err.message });
    }
    else if (err.type === "entity.parse.failed") {
        res.status(400).json({ "erreur": "le corps de la requête n’est pas un JSON valide" });
    }
    else {
        const messageErreur = "Une erreur imprévue est survenue";
        res.status(500).json({ "erreur": messageErreur });
        console.error("[ERROR] : " + messageErreur + "; ERREUR => ", err);
    }
};

export function lireId(brut: string): number {
    const nBrut = Number(brut);
    if (!Number.isInteger(nBrut) || nBrut <= 0) {
        throw new ErreurHttp(400, "l'identifiant n'est pas un entier strictement positif");
    }
    return nBrut;
}

export function codePg(err: unknown): string | undefined {
    if (typeof err === "object" && err !== null && "code" in err && typeof err.code === "string") {
        return err.code;
    }
    return undefined;
}