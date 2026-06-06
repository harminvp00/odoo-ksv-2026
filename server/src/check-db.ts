import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching database users...');
  const users = await prisma.user.findMany({
    include: {
      vendorProfile: true
    }
  });
  console.log('--- USERS ---');
  users.forEach(u => {
    console.log(`ID: ${u.id} | Email: ${u.email} | Name: ${u.firstName} ${u.lastName} | Role: ${u.role} | Phone: ${u.phone} | Linked Vendor Profile: ${u.vendorProfile ? u.vendorProfile.name : 'None'}`);
  });

  const vendors = await prisma.vendor.findMany();
  console.log('--- VENDORS ---');
  vendors.forEach(v => {
    console.log(`ID: ${v.id} | Name: ${v.name} | Category: ${v.category} | GSTIN: ${v.gstNo} | UserId: ${v.userId}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
