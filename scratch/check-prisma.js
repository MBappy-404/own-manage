const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
console.log('FinanceAccount:', !!prisma.financeAccount);
console.log('Debt:', !!prisma.debt);
prisma.$disconnect();
