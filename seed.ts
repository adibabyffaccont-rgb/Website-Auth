import 'dotenv/config';
import { storage } from './server/storage';
import { db } from './server/db';
import * as schema from './server/schema';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('--- Database Seeding Started ---');

  const email = 'adicheatsontop@gmail.com';
  const password = 'Aditya@1234#'; // USER should change this later

  console.log(`Checking if user ${email} exists...`);
  const user = await storage.getUser(email);

  if (!user) {
    console.log(`User ${email} does not exist. Creating...`);
    await storage.createUserWithCredentials({
      email,
      password,
      firstName: 'Adi',
      lastName: 'Cheats',
      role: 'admin',
      permissions: ['all'],
      isActive: true
    });
    console.log(`✓ User ${email} created successfully.`);
  } else {
    console.log(`User ${email} already exists.`);
  }

  console.log('--- Database Seeding Completed ---');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
