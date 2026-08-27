import { chromium } from 'playwright';
import { spawn } from 'child_process';

const PORT = 4175;
const BASE = `http://localhost:${PORT}`;

let pass = 0;
let fail = 0;
const ok = (msg, detail) => {
  console.log(`  PASS  ${msg}${detail ? ` :: ${detail}` : ''}`);
  pass++;
};
const no = (msg, detail) => {
  console.log(`  FAIL  ${msg}${detail ? ` :: ${detail}` : ''}`);
  fail++;
};
const test = (msg, condition, detail) => (condition ? ok(msg, detail) : no(msg, detail));

async function run() {
  console.log(`\n=== Starting Vite Preview on port ${PORT} ===`);
  const preview = spawn('npx', ['vite', 'preview', '--port', String(PORT)], {
    stdio: 'inherit',
    shell: true,
  });

  // Wait for server to start
  await new Promise((resolve) => setTimeout(resolve, 3500));

  let browser;
  try {
    browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('\n=== 1. Testing Route Aliases & Redirects ===');
    // /login -> /auth
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    test('/login alias redirects to /auth', page.url().includes('/auth'), page.url());

    // /signup -> /auth?mode=signup
    await page.goto(`${BASE}/signup`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    test('/signup alias redirects to /auth?mode=signup', page.url().includes('mode=signup'), page.url());

    // /forgot-password -> /auth?mode=forgot
    await page.goto(`${BASE}/forgot-password`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    test('/forgot-password alias redirects to /auth?mode=forgot', page.url().includes('mode=forgot'), page.url());

    // /profile -> /settings -> /auth (when signed out)
    await page.goto(`${BASE}/profile`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    test('/profile alias routes to settings/auth', page.url().includes('/auth') || page.url().includes('/settings'), page.url());

    console.log('\n=== 2. Testing Password Reset Page State (Direct Access / Invalid Token) ===');
    await page.goto(`${BASE}/auth/reset-password`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=This password reset link is invalid or has expired', { timeout: 15000 });
    const expiredContent = await page.textContent('body');
    test(
      'Displays invalid/expired link message when opened without recovery session',
      expiredContent.includes('This password reset link is invalid or has expired'),
      'Invalid link notice displayed'
    );
    test(
      'Provides "Request New Reset Link" button',
      expiredContent.includes('Request New Reset Link'),
      'CTA present'
    );
    test(
      'Provides "Back to Login" link',
      expiredContent.includes('Back to Login'),
      'Login link present'
    );

    console.log('\n=== 3. Testing Forgot Password Request Flow UI ===');
    await page.goto(`${BASE}/auth?mode=forgot`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#auth-email', { timeout: 15000 });
    const forgotEmailInput = await page.$('#auth-email');
    test('Email input present in forgot password mode', Boolean(forgotEmailInput));
    const forgotSubmitBtn = await page.$('button[type="submit"]');
    const submitText = await forgotSubmitBtn?.textContent();
    test('Submit button says "Send Reset Link"', submitText?.includes('Send Reset Link') || submitText?.includes('Send reset link'), submitText?.trim());

    console.log('\n=== 4. Testing Navigation & Avatar Fallback ===');
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('header', { timeout: 10000 });
    const navExists = await page.$('header');
    test('Navigation header is rendered', Boolean(navExists));
    const signInBtn = await page.$('a[href="/auth"]');
    test('Sign in button rendered for guest', Boolean(signInBtn));

    console.log('\n============================================');
    console.log(`E2E SUITE SUMMARY: ${pass} passed, ${fail} failed`);
    console.log('============================================');
  } catch (err) {
    console.error('Test execution error:', err);
    fail++;
  } finally {
    if (browser) await browser.close();
    preview.kill();
    process.exit(fail > 0 ? 1 : 0);
  }
}

run();
