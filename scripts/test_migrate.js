import { execSync } from 'child_process';

console.log(`Testing migration with US phone number and secure password...`);

try {
  const output = execSync(`clerk users create --email kavin@grevya.com --password "Irookee_Clerk_2026_SecureMigrate!" --phone "+12068839001" --yes`, { encoding: 'utf-8', stdio: 'pipe' });
  console.log("Success:", output);
} catch (error) {
  console.error("Failed command:", error.message);
  console.error("Stdout:", error.stdout ? error.stdout.toString() : 'none');
  console.error("Stderr:", error.stderr ? error.stderr.toString() : 'none');
}
