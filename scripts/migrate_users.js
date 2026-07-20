import { execSync } from 'child_process';

const emails = [
  "kavin@grevya.com",
  "nrkavin005@gmail.com",
  "snegagrevya@gmail.com",
  "hemanthmavuri86@gmail.com",
  "arunikatup2021@gmail.com",
  "nrkavin2000@gmail.com",
  "irookee.e2e.1781278118@gmail.com",
  "ruchasambare1@gmail.com",
  "yuvetharaja782@gmail.com",
  "sakthi.grevya@gmail.com",
  "sakthimahenthar23@gmail.com",
  "positivemindgentlespirit@gmail.com",
  "snega.it21@bitsathy.ac.in",
  "vishal.grevya@gmail.com",
  "gkhandare503@gmail.com",
  "harikanth.grevya@gmail.com",
  "jennifer.grevya@gmail.com",
  "gopalgajanankhandare@gmail.com",
  "kavinvsa@gmail.com",
  "edenterra.0@gmail.com",
  "gopal.grevya@gmail.com",
  "hemanthmavuri01@gmail.com",
  "jennifersaba943@gmail.com",
  "kavinsenthil123@gmail.com",
  "kavin.s2198@gmail.com",
  "vishal.grevya@a.com"
];

console.log(`Starting migration of ${emails.length} users to Clerk...`);

let counter = 1001;

for (const email of emails) {
  const phone = `+1206883${counter}`;
  counter++;

  console.log(`Migrating: ${email} with phone ${phone}...`);
  try {
    const output = execSync(`clerk users create --email "${email}" --password "Irookee_Clerk_2026_SecureMigrate!" --phone "${phone}" --yes`, { encoding: 'utf-8', stdio: 'pipe' });
    console.log(`Successfully migrated ${email}`);
  } catch (error) {
    const errMsg = error.message + (error.stdout ? " | " + error.stdout.toString() : "");
    if (errMsg.includes('already exists') || errMsg.includes('already_exists')) {
      console.log(`User ${email} already exists in Clerk.`);
    } else {
      console.error(`Error migrating ${email}:`, errMsg);
    }
  }
}

console.log("Migration complete!");
