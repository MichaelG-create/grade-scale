import { describe, it, expect } from 'vitest';
import { EXAMPLES_DATA } from '../examples';

describe('Frontend Logic - Pedagogy Examples', () => {
  
  it('doit contenir les exercices fondamentaux', () => {
    expect(EXAMPLES_DATA).toHaveProperty("Le mouvement d'un palet");
    expect(EXAMPLES_DATA).toHaveProperty("Quantité de matière");
  });

  it('chaque exercice doit avoir au moins un exemple parfait', () => {
    for (const exercise in EXAMPLES_DATA) {
      const examples = EXAMPLES_DATA[exercise];
      const hasPerfect = examples.some(ex => ex.label.includes('✅'));
      expect(hasPerfect).toBe(true);
    }
  });

  it('chaque exemple doit avoir un ID unique pour le mapping', () => {
    const ids = [];
    for (const exercise in EXAMPLES_DATA) {
      EXAMPLES_DATA[exercise].forEach(ex => {
        expect(ids).not.toContain(ex.id);
        ids.push(ex.id);
      });
    }
  });
});
