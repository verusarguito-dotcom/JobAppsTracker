import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

// Parse optional password argument from CLI
const rawPassword = process.argv[2] || crypto.randomBytes(9).toString('base64url');

console.log('\n=============================================================');
console.log('   JobFlow / Job Application Tracker - Credentials Generator   ');
console.log('=============================================================\n');

console.log(`Password Pengguna   : ${rawPassword}`);
console.log('(Gunakan kata sandi ini untuk login di browser)\n');

// Generate 64-character random session secret
const sessionSecret = crypto.randomBytes(32).toString('hex');
console.log(`SESSION_SECRET     : ${sessionSecret}`);

// Generate bcrypt hash with cost 12
const hash = bcrypt.hashSync(rawPassword, 12);
console.log(`APP_PASSWORD_HASH  : ${hash}\n`);

// Escaped format for compose files
const escapedHash = hash.replace(/\$/g, '$$$$');

console.log('-------------------------------------------------------------');
console.log('1. Salin ke file .env biasa (Local / VPS Host):');
console.log('-------------------------------------------------------------');
console.log(`NODE_ENV=production
PORT=3000
HOST=127.0.0.1
TRUST_PROXY=1
DATA_DIR=/app/data
SESSION_SECRET=${sessionSecret}
APP_PASSWORD_HASH=${hash}`);

console.log('\n-------------------------------------------------------------');
console.log('2. Salin jika dimasukkan langsung ke file podman-compose.yml:');
console.log('-------------------------------------------------------------');
console.log(`APP_PASSWORD_HASH=${escapedHash}`);
console.log('\n=============================================================\n');
