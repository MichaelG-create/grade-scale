export const EXAMPLES_DATA = {
    "Le mouvement d'un palet": [
        { label: "✅ Parfait", content: "On sait que P = m x g. Avec m = 200 g = 0,200 kg et g = 9,81 N/kg. P = 0,200 * 9,81 = 1,96 N.", id: "bravo" },
        { label: "❌ Erreur kg", content: "P = m x g. P = 200 * 9,81 = 1962 N.", id: "oubli-kg" },
        { label: "❓ Formule", content: "P = g / m. P = 9.81 / 0.2 = 49.05 N.", id: "confusion" }
    ],
    "Quantité de matière": [
        { label: "✅ Correct", content: "n = m / M. n = 5,4 / 27,0 = 0,20 mol.", id: "chimie-ok" },
        { label: "❌ Produit", content: "n = m * M. n = 5,4 * 27 = 145,8 mol.", id: "chimie-err" }
    ]
};
