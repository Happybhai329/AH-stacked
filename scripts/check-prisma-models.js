import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres.jgckdllcffnzacacqjzp:8x.3wcN%2FV9Q9Yvf@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true',
    },
  },
});

async function main() {
  const models = [
    ['user', () => prisma.user.findFirst()],
    ['employee', () => prisma.employee.findFirst()],
    ['teacher', () => prisma.teacher.findFirst()],
    ['subject', () => prisma.subject.findFirst()],
    ['batch', () => prisma.batch.findFirst()],
    ['batchSubject', () => prisma.batchSubject.findFirst()],
    ['student', () => prisma.student.findFirst()],
    ['admission', () => prisma.admission.findFirst()],
    ['batchChangeLog', () => prisma.batchChangeLog.findFirst()],
  ];

  for (const [name, fn] of models) {
    try {
      await fn();
      console.log(`✅ Model ${name}: OK`);
    } catch (e) {
      console.error(`❌ Model ${name}: ${e.message}`);
    }
  }

  await prisma.$disconnect();
}

main();
