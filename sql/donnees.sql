-- Données d'exemple pour tester l'API à la main.
--
-- Insère quelques clients (puis des devis et des lignes, au fil des étapes)
-- pour que les routes de lecture aient quelque chose à renvoyer et que les
-- requêtes de requests.http fonctionnent sans préparation.
-- À exécuter après sql/schema.sql, qui vide la base : relancer les deux
-- fichiers dans cet ordre remet la base dans un état connu.
-- Les noms, adresses et numéros sont inventés et ne désignent personne.
--
-- Exécution :
--   $env:PGCLIENTENCODING = "UTF8"
--   psql -U devis_app -d devis -h localhost -f sql/donnees.sql

\set ON_ERROR_STOP on

-- Clients 1 à 6. Les clients 5 et 6 n'ont pas de devis : on peut les supprimer.

INSERT INTO clients (nom, email, telephone)
VALUES ('Alice Lovegood', 'alice.lovegood@d-relics.com', '0752844516');

INSERT INTO clients (nom, email, telephone)
VALUES ('Bob Lennon', 'bob.lennon@les-barbares.fr', '0612984510');

INSERT INTO clients (nom, email, telephone)
VALUES ('Harry Potterhead', 'harry.potterhead@griffin.uk', '0674120039');

INSERT INTO clients (nom, telephone)
VALUES ('Parzival Watts', '0718456167');

INSERT INTO clients (nom, email)
VALUES ('Geralt DeRivière', 'geralt.deriviere@no-monsters.pl');

INSERT INTO clients (nom)
VALUES ('John Smith');

-- Devis 1 à 4. Les identifiants supposent une base vide, d'où l'exécution
-- de schema.sql juste avant.
--   1 : brouillon avec lignes (lecture, total, ajout et retrait de lignes)
--   2 : brouillon sans ligne (envoi refusé : on n'envoie pas un devis vide)
--   3 : envoyé avec lignes (lignes figées, transitions vers signé ou refusé)
--   4 : refusé (statut final, plus aucune transition possible)

INSERT INTO devis (client_id)
VALUES (1);

INSERT INTO devis (client_id)
VALUES (2);

INSERT INTO devis (client_id, statut)
VALUES (3, 'envoye');

INSERT INTO devis (client_id, statut)
VALUES (4, 'refuse');

INSERT INTO lignes_devis (devis_id, designation, quantite, prix_unitaire_ht)
VALUES (1, 'Accès fibre professionnelle 1 Gbit/s, abonnement mensuel', 1, 59.90);

INSERT INTO lignes_devis (devis_id, designation, quantite, prix_unitaire_ht)
VALUES (1, 'Forfait mobile 5G 100 Go', 4, 19.99);

INSERT INTO lignes_devis (devis_id, designation, quantite, prix_unitaire_ht)
VALUES (1, 'Installation et mise en service', 1, 150.00);

INSERT INTO lignes_devis (devis_id, designation, quantite, prix_unitaire_ht)
VALUES (3, 'Standard téléphonique hébergé, licence par utilisateur', 10, 12.50);

INSERT INTO lignes_devis (devis_id, designation, quantite, prix_unitaire_ht)
VALUES (3, 'Téléphone de bureau IP', 10, 89.00);

INSERT INTO lignes_devis (devis_id, designation, quantite, prix_unitaire_ht)
VALUES (4, 'Carte SIM de remplacement', 2, 10.00);
