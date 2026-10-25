-- Données d'exemple pour tester l'API à la main.
--
-- Insère quelques clients (puis des devis et des lignes, au fil des étapes)
-- pour que les routes de lecture aient quelque chose à renvoyer et que les
-- requêtes de requests.http fonctionnent sans préparation.
-- À exécuter après sql/schema.sql, qui vide la base : relancer les deux
-- fichiers dans cet ordre remet la base dans un état connu.
--
-- Exécution :
--   $env:PGCLIENTENCODING = "UTF8"
--   psql -U devis_app -d devis -h localhost -f sql/donnees.sql

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