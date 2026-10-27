/**
 * Règles du cycle de vie d'un devis : brouillon, envoye, signe, refuse.
 *
 * Seul fichier de règles métier du projet, isolé pour qu'on lise tout le
 * cycle de vie au même endroit. Fonctions pures : aucun accès à la base,
 * aucune dépendance à Express, donc testables seules. Elles répondent oui ou
 * non ; c'est le routeur qui lit le devis, applique la décision et renvoie
 * un 409 en cas de refus.
 *
 * Exporte : STATUTS, Statut, estStatut, peutPasser, lignesModifiables.
 * Utilisé par : routes/devis.ts. N'importe rien.
 */

export const STATUTS = [
    "brouillon",
    "envoye",
    "signe",
    "refuse"
] as const;

export type Statut = (typeof STATUTS)[number];

const TRANSITIONS: Record<Statut, readonly Statut[]> = {
    brouillon: ["envoye"],
    envoye: ["signe", "refuse"],
    signe: [],
    refuse: []
};

export function lignesModifiables(statut: Statut): boolean {
    return statut === "brouillon";
}

export function estStatut(valeur: unknown): valeur is Statut {
    return (
        typeof valeur === "string" &&
        (STATUTS as readonly string[]).includes(valeur)
    );
}

export function peutPasser(de: Statut, vers: Statut): boolean {
    return TRANSITIONS[de].includes(vers);
}