import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Start seeding...');

  // Cleanup removed for safe automated runs
 
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
  let question = await prisma.question.findFirst({
    where: { title: "Le mouvement d'un palet" },
  });
 
  if (!question) {
    question = await prisma.question.create({
      data: {
        title: "Le mouvement d'un palet",
        content: "Un palet de masse m=200g glisse sans frottement sur une surface horizontale. On donne g=9.81 N/kg. Calculer la valeur du poids P du palet en précisant l'unité.",
        solution: "m = 200g = 0.200kg. P = m * g = 0.200 * 9.81 = 1.962 N.",
        subjectId: subject.id,
      },
    });
  }
 
  // 3. Rubric
  let rubric = await prisma.rubric.findFirst({
    where: { questionId: question.id },
  });
 
  if (!rubric) {
    rubric = await prisma.rubric.create({
      data: {
        title: 'Barème Dynamique',
        questionId: question.id,
      },
    });
  }
 
  // 4. Criteria
  const criteriaCount = await prisma.criterion.count({ where: { rubricId: rubric.id } });
  if (criteriaCount === 0) {
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
  }
 
  // 5. Autre Question (Chimie)
  let question2 = await prisma.question.findFirst({
    where: { title: "Quantité de matière" },
  });
 
  if (!question2) {
    question2 = await prisma.question.create({
      data: {
        title: "Quantité de matière",
        content: "On dispose d'un échantillon de 5.4g d'aluminium (Al). La masse molaire de l'aluminium est M = 27.0 g/mol. Calculer la quantité de matière n d'atomes d'aluminium contenue dans cet échantillon.",
        solution: "m = 5.4g. M = 27.0 g/mol. n = m / M = 5.4 / 27.0 = 0.20 mol.",
        subjectId: subject.id,
      },
    });
  }
 
  let rubric2 = await prisma.rubric.findFirst({
    where: { questionId: question2.id },
  });
 
  if (!rubric2) {
    rubric2 = await prisma.rubric.create({
      data: {
        title: 'Barème Chimie',
        questionId: question2.id,
      },
    });
  }
 
  const criteriaCount2 = await prisma.criterion.count({ where: { rubricId: rubric2.id } });
  if (criteriaCount2 === 0) {
    await prisma.criterion.createMany({
      data: [
        {
          name: 'Relation n = m / M',
          description: "Citer la formule liant n, m et M.",
          maxScore: 1.0,
          step: 1.0,
          rubricId: rubric2.id,
        },
        {
          name: 'Calcul numérique (n = 0.20 mol)',
          description: "Effectuer le calcul 5.4 / 27.0.",
          maxScore: 1.0,
          step: 0.5,
          rubricId: rubric2.id,
        }
      ],
    });
  }
 
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
