import { execSync } from 'child_process';

const getSupabasePassword = (clerkId) => {
  return `ClerkSupabase_${clerkId}_SecretSecurePassword!2026`;
};

try {
  console.log("Fetching users from Clerk...");
  const output = execSync('clerk users list --limit 100 --json', { encoding: 'utf-8' });
  
  // Find JSON array start and end
  const startIndex = output.indexOf('[');
  const endIndex = output.lastIndexOf(']') + 1;
  
  if (startIndex === -1 || endIndex === 0) {
    throw new Error("Could not find JSON array in output: " + output);
  }
  
  const jsonStr = output.substring(startIndex, endIndex);
  const users = JSON.parse(jsonStr);
  
  console.log(`Found ${users.length} users in Clerk. Generating SQL update statements...`);
  
  let sql = 'CREATE EXTENSION IF NOT EXISTS pgcrypto;\n\n';
  
  for (const user of users) {
    const email = user.email_addresses[0]?.email_address;
    if (!email) continue;
    
    const clerkId = user.id;
    const password = getSupabasePassword(clerkId);
    
    sql += `UPDATE auth.users SET encrypted_password = crypt('${password}', gen_salt('bf')) WHERE email = '${email}';\n`;
  }
  
  console.log("\n--- COPY AND EXECUTE THE FOLLOWING SQL IN SUPABASE ---\n");
  console.log(sql);
  console.log("\n----------------------------------------------------\n");
  
} catch (error) {
  console.error("Error running sync script:", error.message);
}
