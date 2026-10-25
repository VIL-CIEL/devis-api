/**
 * Point d'entrée de l'API, lancé par `npm run dev`.
 *
 * Assemble l'application sans contenir de logique métier : active la lecture
 * du JSON, déclare GET /health, branche les routeurs sur leurs préfixes,
 * répond 404 aux routes inconnues, puis branche le middleware d'erreur en
 * dernier pour qu'il reçoive les erreurs de toutes les routes.
 *
 * Importe : pool (db.ts) pour /health, routeurClients (routes/clients.ts),
 * routeurDevis (routes/devis.ts), gestionErreurs (erreurs.ts).
 * N'est importé par aucun fichier.
 */
import express from "express";
import { pool } from "./db.js";
import { gestionErreurs } from "./erreurs.js";

const DEBUG = process.env.DEBUG === "1";

const app = express();

app.use(express.json());

app.get("/health", async (req, res) => {
    try {
        const message = "Application active";
        await pool.query("SELECT 1");
        res.json({ status: message });
        if (DEBUG) console.log("[CALL /health] : " + message);
    } catch (error) {
        const messageErreur = "Une erreur est survenue lors de l'appel de la base de données";
        res.status(503).json({ "erreur": messageErreur });
        console.error("[CALL ERROR] : " + messageErreur + "; ERREUR => ", error);
    }
});

app.use((req, res) => {
    res.status(404).json({
        erreur: "Route introuvable"
    });
});

app.use(gestionErreurs);

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => {
    console.log("[APPLICATION ACTIVE] : Ecoute sur le port '" + PORT + "'");
});