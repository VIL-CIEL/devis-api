/**
 * Point d'entrée de l'API, lancé par `npm run dev`.
 *
 * Assemble l'application sans contenir de logique métier : journalise les
 * requêtes en mode DEBUG, active la lecture du JSON, déclare GET /health,
 * branche les routeurs sur leurs préfixes, répond 404 aux routes inconnues,
 * puis branche le middleware d'erreur en dernier pour qu'il reçoive les
 * erreurs de toutes les routes.
 *
 * Importe : DEBUG et PORT (config.ts), pool (db.ts) pour /health,
 * routeurClients (routes/clients.ts), routeurDevis (routes/devis.ts),
 * gestionErreurs (erreurs.ts).
 * N'est importé par aucun fichier.
 */

import express from "express";
import { DEBUG, PORT } from "./config.js";
import { pool } from "./db.js";
import { gestionErreurs } from "./erreurs.js";
import { routeurClients } from "./routes/clients.js";
import { routeurDevis } from "./routes/devis.js";

const app = express();

app.disable("x-powered-by");

// En premier, pour voir aussi les requêtes rejetées par express.json()
app.use((req, res, next) => {
    if (!DEBUG) { return next(); }

    const debut = Date.now();

    res.on("finish", () => {
        const duree = Date.now() - debut;
        console.log(req.method + " " + req.originalUrl + " " + res.statusCode + " " + duree + " ms");
    });

    next();
});

app.use(express.json());

app.get("/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");
        res.json({ status: "Application active" });
    } catch (error) {
        const messageErreur = "La base de données est injoignable";
        res.status(503).json({ erreur: messageErreur });
        console.error("[HEALTH] " + messageErreur + " :", error);
    }
});

app.use("/clients", routeurClients);

app.use("/devis", routeurDevis);

app.use((req, res) => {
    res.status(404).json({ erreur: "Route introuvable" });
});

app.use(gestionErreurs);

app.listen(PORT, () => {
    console.log("[DEMARRAGE] API à l'écoute sur http://localhost:" + PORT);
});
