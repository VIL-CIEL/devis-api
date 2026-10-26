-- Schéma de la base devis : tables clients, devis et lignes_devis.
--
-- Supprime puis recrée les tables, dans l'ordre inverse de leurs dépendances.
-- À relancer en développement uniquement : toutes les données sont effacées.
-- Les contraintes (NOT NULL, CHECK, clés étrangères) garantissent les règles même si le code TypeScript se trompe.
--
-- Exécution : psql -U devis_app -d devis -h localhost -f sql/schema.sql

\set ON_ERROR_STOP on

DROP TABLE IF EXISTS lignes_devis;
DROP TABLE IF EXISTS devis;
DROP TABLE IF EXISTS clients;

CREATE TABLE clients (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nom TEXT NOT NULL CHECK (length(btrim(nom)) > 0),
    email TEXT NULL,
    telephone TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE devis (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    statut TEXT NOT NULL DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'envoye', 'signe', 'refuse')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE lignes_devis (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    devis_id INTEGER NOT NULL REFERENCES devis(id) ON DELETE CASCADE,
    designation TEXT NOT NULL CHECK (length(btrim(designation)) > 0),
    quantite INTEGER NOT NULL CHECK (quantite > 0),
    prix_unitaire_ht NUMERIC(10,2) NOT NULL CHECK (prix_unitaire_ht >= 0)
);