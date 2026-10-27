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
import { ErreurHttp, lireId, codePg } from "../erreurs.js";
import { STATUTS, estStatut, lignesModifiables, peutPasser, type Statut } from "../statuts.js";

type Devis = {
    id: number;
    client_id: number;
    statut: Statut;
    created_at: Date;
    updated_at: Date;
};

type NouveauDevis = {
    client_id: number;
};

type LigneDevis = {
    id: number;
    devis_id: number;
    designation: string;
    quantite: number;
    prix_unitaire_ht: string;
};

type DevisDetaille = Devis & {
    lignes: LigneDevis[];
    total_ht: string;
};

type NouvelleLigne = {
    designation: string;
    quantite: number;
    prix_unitaire_ht: number;
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

function lireStatutDemande(corps: unknown): Statut {
    if (typeof corps !== "object" || corps === null) {
        throw new ErreurHttp(400, "Corps JSON invalide lors du changement de statut");
    }

    const objet = corps as Record<string, unknown>;

    const statut = objet.statut;

    if (!estStatut(statut)) {
        throw new ErreurHttp(400, "Le statut doit être l'une des valeurs suivantes : " + STATUTS.join(", "));
    }

    return statut;
}

async function chargerDevis(id: number): Promise<Devis> {
    const resultat = await pool.query<Devis>(
        `SELECT id, client_id, statut, created_at, updated_at
        FROM devis
        WHERE id = $1`,
        [id]
    );

    const devis = resultat.rows[0];

    if (devis === undefined) {
        throw new ErreurHttp(404, "Devis " + id + " introuvable");
    }

    return devis;
}

function lireNouvelleLigne(corps: unknown): NouvelleLigne {
    if (typeof corps !== "object" || corps === null) {
        throw new ErreurHttp(400, "Corps JSON invalide lors de l'ajout d'une ligne");
    }

    const objet = corps as Record<string, unknown>;

    const designation = objet.designation;
    const quantite = objet.quantite;
    const prixUnitaireHt = objet.prix_unitaire_ht;

    if (typeof designation !== "string" || designation.trim() === "") {
        throw new ErreurHttp(400, "La désignation doit être une chaîne non vide");
    }

    if (typeof quantite !== "number" || !Number.isInteger(quantite) || quantite <= 0) {
        throw new ErreurHttp(400, "La quantité doit être un entier strictement positif");
    }

    if (typeof prixUnitaireHt !== "number" || prixUnitaireHt < 0 || prixUnitaireHt > 99999999.99) {
        throw new ErreurHttp(400, "Le prix unitaire HT doit être compris entre 0 et 99999999.99");
    }

    return { designation: designation.trim(), quantite, prix_unitaire_ht: prixUnitaireHt };
}

export const routeurDevis = express.Router();

routeurDevis.get("/", async (req, res) => {
    const statut = req.query.statut;

    let resultat;

    if (statut === undefined) {
        resultat = await pool.query<Devis>(
            `SELECT id, client_id, statut, created_at, updated_at
            FROM devis
            ORDER BY id`
        );
    } else {
        if (!estStatut(statut)) {
            throw new ErreurHttp(400, "Le statut doit être l'une des valeurs suivantes : " + STATUTS.join(", "));
        }

        resultat = await pool.query<Devis>(
            `SELECT id, client_id, statut, created_at, updated_at
            FROM devis
            WHERE statut = $1
            ORDER BY id`,
            [statut]
        );
    }

    res.json(resultat.rows);
});

routeurDevis.get("/:id", async (req, res) => {
    const id = lireId(req.params.id);

    const devis = await chargerDevis(id);

    const [lignesResultat, totalResultat] = await Promise.all([ // Requêtes indépendantes : lancées en parallèle
        pool.query<LigneDevis>(
            `SELECT id, devis_id, designation, quantite, prix_unitaire_ht
            FROM lignes_devis
            WHERE devis_id = $1
            ORDER BY id`,
            [id]
        ),
        pool.query<{ total_ht: string }>(
            `SELECT COALESCE(SUM(quantite * prix_unitaire_ht), 0)::NUMERIC(12, 2) AS total_ht
            FROM lignes_devis
            WHERE devis_id = $1`,
            [id]
        ),
    ]);

    const ligneTotal = totalResultat.rows[0];

    if (ligneTotal === undefined) {
        throw new Error("Le total du devis est introuvable");
    }

    const devisDetaille: DevisDetaille = {
        ...devis,
        lignes: lignesResultat.rows,
        total_ht: ligneTotal.total_ht
    };

    res.json(devisDetaille);
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

routeurDevis.post("/:id/lignes", async (req, res) => {
    const id = lireId(req.params.id);

    const nouvelleLigne = lireNouvelleLigne(req.body);

    const devis = await chargerDevis(id);

    if (!lignesModifiables(devis.statut)) {
        throw new ErreurHttp(409, "Impossible de modifier les lignes d'un devis au statut " + devis.statut);
    }

    const resultat = await pool.query<LigneDevis>(
        `INSERT INTO lignes_devis (devis_id, designation, quantite, prix_unitaire_ht)
        VALUES ($1, $2, $3, $4)
        RETURNING id, devis_id, designation, quantite, prix_unitaire_ht`,
        [id, nouvelleLigne.designation, nouvelleLigne.quantite, nouvelleLigne.prix_unitaire_ht]
    );

    const ligne = resultat.rows[0];

    if (ligne === undefined) {
        throw new Error("Insertion échouée lors de la création d'une ligne de devis");
    }

    res.status(201).json(ligne);
});

routeurDevis.post("/:id/statut", async (req, res) => {
    const id = lireId(req.params.id);

    const statutDemande = lireStatutDemande(req.body);

    const devis = await chargerDevis(id);

    if (!peutPasser(devis.statut, statutDemande)) {
        throw new ErreurHttp(409, "Transition de " + devis.statut + " vers " + statutDemande + " interdite");
    }

    if (statutDemande === "envoye") {
        const resultatCompte = await pool.query<{ count: string }>(
            `SELECT COUNT(*) AS count
            FROM lignes_devis
            WHERE devis_id = $1`,
            [id]
        );

        const ligneCompte = resultatCompte.rows[0];

        if (ligneCompte === undefined) {
            throw new Error("Le nombre de lignes du devis est introuvable");
        }

        if (Number(ligneCompte.count) === 0) {
            throw new ErreurHttp(409, "Impossible d'envoyer un devis sans ligne");
        }
    }

    const resultat = await pool.query<Devis>(
        `UPDATE devis
        SET statut = $1, updated_at = now()
        WHERE id = $2
        AND statut = $3
        RETURNING id, client_id, statut, created_at, updated_at`,
        [statutDemande, id, devis.statut]
    );

    const devisMisAJour = resultat.rows[0];

    if (devisMisAJour === undefined) {
        throw new ErreurHttp(409, "Le statut du devis a été modifié entre-temps");
    }

    res.json(devisMisAJour);
});

routeurDevis.delete("/:id/lignes/:ligneId", async (req, res) => {
    const id = lireId(req.params.id);
    const ligneId = lireId(req.params.ligneId);

    const devis = await chargerDevis(id);

    if (!lignesModifiables(devis.statut)) {
        throw new ErreurHttp(409, "Impossible de modifier les lignes d'un devis au statut " + devis.statut);
    }

    const resultat = await pool.query(
        `DELETE FROM lignes_devis
        WHERE id = $1
        AND devis_id = $2`,
        [ligneId, id]
    );

    if (resultat.rowCount === 0) {
        throw new ErreurHttp(404, "Ligne " + ligneId + " introuvable dans le devis " + id);
    }

    res.sendStatus(204);
});
