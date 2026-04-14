/**
 * RGPD Utility to pseudonymize potentially sensitive data in OCR content.
 * This is a basic implementation for the PoC.
 */
export function pseudonymizeContent(content: string): string {
  // Common patterns for student name introduction in French
  // "Nom : ...", "Prénom : ...", "Élève : ..."
  let cleaned = content;
  
  const patterns = [
    /(?:nom\s*:\s*)([A-Z][a-zà-ÿ]+)/gi,
    /(?:prénom\s*:\s*)([A-Z][a-zà-ÿ]+)/gi,
    /(?:élève\s*:\s*)([A-Z][a-zà-ÿ]+)/gi,
  ];

  patterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, (match, p1) => {
      return match.replace(p1, '[NOM_ÉLÈVE]');
    });
  });

  return cleaned;
}
