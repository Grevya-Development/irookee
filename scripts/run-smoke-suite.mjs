import { spawn } from 'child_process';

const preview = spawn('npx', ['vite', 'preview', '--port', '4176'], {
  shell: true,
});

let actualPort = 4176;

preview.stdout.on('data', (data) => {
  const str = data.toString();
  process.stdout.write(str);
  const match = str.match(/Local:\s+http:\/\/localhost:(\d+)/);
  if (match) {
    actualPort = parseInt(match[1], 10);
  }
});

preview.stderr.on('data', (data) => {
  process.stderr.write(data.toString());
});

await new Promise((resolve) => setTimeout(resolve, 3500));

console.log(`\nUsing actual server port ${actualPort} for smoke suite...\n`);

const smoke = spawn('node', ['scripts/smoke-app.cjs'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, SMOKE_BASE: `http://localhost:${actualPort}` },
});

smoke.on('close', (code) => {
  preview.kill();
  process.exit(code || 0);
});
