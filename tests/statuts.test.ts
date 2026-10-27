import test from "node:test";
import assert from "node:assert/strict";

import {
    estStatut,
    lignesModifiables,
    peutPasser
} from "../src/statuts.js";

test("brouillon vers envoye est autorise", () => {
    assert.equal(peutPasser("brouillon", "envoye"), true);
});

test("envoye vers signe est autorise", () => {
    assert.equal(peutPasser("envoye", "signe"), true);
});

test("envoye vers refuse est autorise", () => {
    assert.equal(peutPasser("envoye", "refuse"), true);
});

test("brouillon vers signe est interdit", () => {
    assert.equal(peutPasser("brouillon", "signe"), false);
});

test("envoye vers brouillon est interdit", () => {
    assert.equal(peutPasser("envoye", "brouillon"), false);
});

test("signe vers refuse est interdit", () => {
    assert.equal(peutPasser("signe", "refuse"), false);
});

test("aucune transition depuis signe", () => {
    assert.equal(peutPasser("signe", "brouillon"), false);
    assert.equal(peutPasser("signe", "envoye"), false);
    assert.equal(peutPasser("signe", "refuse"), false);
});

test("aucune transition depuis refuse", () => {
    assert.equal(peutPasser("refuse", "brouillon"), false);
    assert.equal(peutPasser("refuse", "envoye"), false);
    assert.equal(peutPasser("refuse", "signe"), false);
});

test("estStatut accepte brouillon", () => {
    assert.equal(estStatut("brouillon"), true);
});

test("estStatut refuse valide", () => {
    assert.equal(estStatut("valide"), false);
});

test("estStatut refuse Brouillon", () => {
    assert.equal(estStatut("Brouillon"), false);
});

test("estStatut refuse 42", () => {
    assert.equal(estStatut(42), false);
});

test("estStatut refuse null", () => {
    assert.equal(estStatut(null), false);
});

test("lignes modifiables pour brouillon", () => {
    assert.equal(lignesModifiables("brouillon"), true);
});

test("lignes non modifiables pour envoye", () => {
    assert.equal(lignesModifiables("envoye"), false);
});

test("lignes non modifiables pour signe", () => {
    assert.equal(lignesModifiables("signe"), false);
});

test("lignes non modifiables pour refuse", () => {
    assert.equal(lignesModifiables("refuse"), false);
});