import bcrypt from 'bcryptjs';
import { readDB, writeDB } from './fileHandler.js';

/**
 * One-time seed script: hash raw passwords for the 3 default users.
 * Run: node utils/seedUsers.js
 */
const DEFAULT_PASSWORD = 'password123';

async function seedUsers() {
  const db = await readDB();

  if (!db.users || db.users.length === 0) {
    console.log('⚠️  No users in db.json');
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(DEFAULT_PASSWORD, salt);

  db.users = db.users.map((u) => ({
    ...u,
    password: hash,
    status: u.status || 'active',
  }));

  await writeDB(db);

  console.log('✅ Users seeded successfully');
  console.log('─────────────────────────────────');
  console.log(`   Password for ALL users: ${DEFAULT_PASSWORD}`);
  console.log('─────────────────────────────────');
  db.users.forEach((u) => {
    console.log(`   ${u.username.padEnd(15)} → ${u.role}`);
  });
  console.log('─────────────────────────────────');
}

seedUsers().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});