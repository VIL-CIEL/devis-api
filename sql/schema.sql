-- Schéma de la base devis : tables clients, devis et lignes_devis.
--
-- Supprime puis recrée les tables, dans l'ordre inverse de leurs dépendances.
-- À relancer en développement uniquement : toutes les données sont effacées.
-- Les contraintes (NOT NULL, CHECK, clés étrangères) garantissent les règles même si le code TypeScript se trompe.
--
-- Exécution : psql -U devis_app -d devis -h localhost -f sql/schema.sql

DROP TABLE IF EXISTS clients;

CREATE TABLE clients (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nom TEXT NOT NULL CHECK (length(btrim(nom)) > 0),
    email TEXT NULL,
    telephone TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

