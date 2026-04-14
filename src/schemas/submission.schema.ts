import { z } from "zod";

// Payload pour l'ingestion d'une nouvelle copie soumise
export const CreateSubmissionSchema = z.object({
  studentPseudoId: z.string().min(3, "L'identifiant pseudo est trop court"),
  questionId: z.uuid("ID de question invalide"),
  content: z.string().min(1, "Le contenu de la copie ne peut pas être vide"),
});

export type CreateSubmissionDTO = z.infer<typeof CreateSubmissionSchema>;
