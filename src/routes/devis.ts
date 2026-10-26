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

import express from "express";
import { pool } from "../db.js";
import { ErreurHttp, codePg } from "../erreurs.js";

type Devis = {
    id: number;
    client_id: number;
    statut: string;
    created_at: Date;
    updated_at: Date;
};

type NouveauDevis = {
    client_id: number;
};

function lireNouveauDevis(corps: unknown): NouveauDevis {
    if (typeof corps !== "object" || corps === null) {
        throw new ErreurHttp(400, "Corps JSON invalide lors de la création d'un nouveau devis");
    }

    const objet = corps as Record<string, unknown>;

    const clientId = objet.client_id;

    if (typeof clientId !== "number" || !Number.isInteger(clientId) || clientId <= 0) {
        throw new ErreurHttp(400, "Le champ client_id doit être un entier strictement positif");
    }

    return { client_id: clientId };
}

export const routeurDevis = express.Router();

routeurDevis.get("/", async (req, res) => {
    const resultat = await pool.query<Devis>(
        `SELECT id, client_id, statut, created_at, updated_at
        FROM devis
        ORDER BY id`
    );

    res.json(resultat.rows);
});

routeurDevis.post("/", async (req, res) => {
    const nouveauDevis = lireNouveauDevis(req.body);

    try {
        const resultat = await pool.query<Devis>(
            `INSERT INTO devis (client_id)
            VALUES ($1)
            RETURNING id, client_id, statut, created_at, updated_at`,
            [nouveauDevis.client_id]
        );

        const devis = resultat.rows[0];

        if (devis === undefined) {
            throw new Error("Insertion échouée lors de la création d'un nouveau devis");
        }

        res.status(201).json(devis);
    } catch (err) {
        if (codePg(err) === "23503") {
            throw new ErreurHttp(404, "Client " + nouveauDevis.client_id + " introuvable");
        }

        throw err;
    }
});
