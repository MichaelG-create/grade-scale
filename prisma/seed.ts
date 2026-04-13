import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Start seeding...');

  // 1. Subject
  const subject = await prisma.subject.upsert({
    where: { code: 'SPC' },
    update: {},
    create: {
      name: 'Physique-Chimie',
      code: 'SPC',
    },
  });

  // 2. Question
  const question = await prisma.question.create({
    data: {
      title: "Le mouvement d'un palet",
      content: "Un palet de masse m=200g glisse sans frottement sur une surface horizontale. On donne g=9.81 N/kg. Calculer la valeur du poids P du palet en précisant l'unité.",
      subjectId: subject.id,
    },
  });

  // 3. Rubric
  const rubric = await prisma.rubric.create({
    data: {
      title: 'Barème Dynamique',
      questionId: question.id,
    },
  });

  // 4. Criteria
  await prisma.criterion.createMany({
    data: [
      {
        name: 'Utilisation de la formule P=m*g',
        description: "L'élève doit citer explicitement la relation entre poids et masse.",
        maxScore: 1.0,
        step: 0.5,
        rubricId: rubric.id,
      },
      {
        name: 'Conversion de la masse en kg',
        description: "Vérifier que m est bien converti en 0.200 kg.",
        maxScore: 0.5,
        step: 0.5,
        rubricId: rubric.id,
      },
      {
        name: 'Résultat numérique et unité (Newton)',
        description: "P = 1.96 N. Sanctionner l'absence d'unité ou une erreur de chiffre significatif.",
        maxScore: 0.5,
        step: 0.25,
        rubricId: rubric.id,
      },
    ],
  });

  console.log('✅ Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
