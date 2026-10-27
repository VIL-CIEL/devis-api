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
 * Importe : pool (db.ts), ErreurHttp, lireObjet, lireId, codePg (erreurs.ts).
 */

import express from "express";
import { pool } from "../db.js";
import { ErreurHttp, lireObjet, lireId, codePg } from "../erreurs.js";

type Client = {
    id: number;
    nom: string;
    email: string | null;
    telephone: string | null;
    created_at: Date;
};

type NouveauClient = {
    nom: string;
    email: string | null;
    telephone: string | null;
};

type ModifClient = {
    nom?: string;
    email?: string | null;
    telephone?: string | null;
};

function lireNom(valeur: unknown): string {
    if (typeof valeur !== "string") {
        throw new ErreurHttp(400, "Le nom est obligatoire et doit être une chaîne");
    }

    const nom = valeur.trim();

    if (nom === "") {
        throw new ErreurHttp(400, "Le nom ne doit pas être vide");
    }

    return nom;
}

function lireTexteFacultatif(valeur: unknown, champ: string): string | null {
    if (valeur === undefined || valeur === null) {
        return null;
    }

    if (typeof valeur !== "string") {
        throw new ErreurHttp(400, "Le champ " + champ + " doit être une chaîne");
    }

    const texte = valeur.trim();

    if (texte === "") {
        return null;
    }

    return texte;
}

// Email en minuscules : deux écritures de la même adresse donnent la même valeur en base
function lireEmail(valeur: unknown): string | null {
    return lireTexteFacultatif(valeur, "email")?.toLowerCase() ?? null;
}

function lireNouveauClient(corps: unknown): NouveauClient {
    const objet = lireObjet(corps);

    return {
        nom: lireNom(objet.nom),
        email: lireEmail(objet.email),
        telephone: lireTexteFacultatif(objet.telephone, "telephone")
    };
}

// Une clé absente ne modifie rien ; une clé à null efface la valeur
function lireModifClient(corps: unknown): ModifClient {
    const objet = lireObjet(corps);

    const modif: ModifClient = {};

    if (objet.nom !== undefined) {
        modif.nom = lireNom(objet.nom);
    }

    if (objet.email !== undefined) {
        modif.email = lireEmail(objet.email);
    }

    if (objet.telephone !== undefined) {
        modif.telephone = lireTexteFacultatif(objet.telephone, "telephone");
    }

    if (modif.nom === undefined && modif.email === undefined && modif.telephone === undefined) {
        throw new ErreurHttp(400, "Il n'y a aucun champ à modifier");
    }

    return modif;
}

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
        throw new ErreurHttp(404, "Client " + id + " introuvable");
    }

    res.json(client);
});

routeurClients.post("/", async (req, res) => {
    const nouveauClient = lireNouveauClient(req.body);

    const resultat = await pool.query<Client>(
        `INSERT INTO clients (nom, email, telephone)
        VALUES ($1, $2, $3)
        RETURNING id, nom, email, telephone, created_at`,
        [nouveauClient.nom, nouveauClient.email, nouveauClient.telephone]
    );

    const client = resultat.rows[0];

    if (client === undefined) {
        throw new Error("Insertion échouée lors de la création d'un client");
    }

    res.status(201).json(client);
});

routeurClients.patch("/:id", async (req, res) => {
    const id = lireId(req.params.id);

    const modif = lireModifClient(req.body);

    const resultatLecture = await pool.query<Client>(
        `SELECT id, nom, email, telephone, created_at
        FROM clients
        WHERE id = $1`,
        [id]
    );

    const clientActuel = resultatLecture.rows[0];

    if (clientActuel === undefined) {
        throw new ErreurHttp(404, "Client " + id + " introuvable");
    }

    // "in" et non "??" : un email ou un téléphone envoyé à null doit être effacé
    const nomFinal = modif.nom ?? clientActuel.nom;
    const emailFinal = "email" in modif ? modif.email : clientActuel.email;
    const telephoneFinal = "telephone" in modif ? modif.telephone : clientActuel.telephone;

    const resultatUpdate = await pool.query<Client>(
        `UPDATE clients
        SET nom = $1, email = $2, telephone = $3
        WHERE id = $4
        RETURNING id, nom, email, telephone, created_at`,
        [nomFinal, emailFinal, telephoneFinal, id]
    );

    const clientModifie = resultatUpdate.rows[0];

    // Le client peut avoir été supprimé entre la lecture et l'écriture
    if (clientModifie === undefined) {
        throw new ErreurHttp(404, "Client " + id + " introuvable");
    }

    res.json(clientModifie);
});

routeurClients.delete("/:id", async (req, res) => {
    const id = lireId(req.params.id);

    try {
        const resultat = await pool.query(
            `DELETE FROM clients
            WHERE id = $1`,
            [id]
        );

        if (resultat.rowCount === 0) {
            throw new ErreurHttp(404, "Client " + id + " introuvable");
        }

        res.sendStatus(204);
    } catch (err) {
        if (codePg(err) === "23503") {
            throw new ErreurHttp(409, "Le client " + id + " a des devis et ne peut pas être supprimé");
        }

        throw err;
    }
});
