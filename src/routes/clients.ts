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

import express from "express";
import { pool } from "../db.js";
import { ErreurHttp, lireId } from "../erreurs.js";

type Client = {
    id: number;
    nom: string;
    email: string | null
    telephone: string | null;
    created_at: Date;
};

export const routeurClients = express.Router();

routeurClients.get("/", async (req, res) => {
    const resultat = await pool.query<Client>(
        `SELECT id, nom, email, telephone, created_at
        FROM clients
        ORDER BY id`
    );

    res.json(resultat.rows);
});

routeurClients.get("/:id", async (req, res) => {
    const id = lireId(req.params.id);

    const resultat = await pool.query<Client>(
        `SELECT id, nom, email, telephone, created_at
        FROM clients
        WHERE id = $1`,
        [id]
    );

    const client = resultat.rows[0];

    if (client === undefined) {
        throw new ErreurHttp(404, "client " + id + " introuvable");
    }

    res.json(client);
});