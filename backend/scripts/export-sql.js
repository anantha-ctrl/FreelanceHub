// Generates database/freehub.sql from the live Sequelize schema.
// Run: node scripts/export-sql.js
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const { sequelize } = require('../models');
const { connectDatabase } = require('../config/database');
const { seedAdmin } = require('../config/seed');

const TABLES = ['users', 'posts', 'login_logs', 'likes', 'comments', 'blocked_users'];

function sqlValue(v) {
  if (v === null || v === undefined) return 'NULL';
  if (v instanceof Date) return `'${v.toISOString().slice(0, 19).replace('T', ' ')}'`;
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? '1' : '0';
  return `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

(async () => {
  await connectDatabase();         // create freehub database if missing
  await sequelize.sync();          // create tables to match models
  await seedAdmin();               // ensure admin row exists

  let out = '';
  out += '-- FreelanceHub MySQL schema + seed data\n';
  out += '-- Generated from Sequelize models. Import via MySQL Workbench.\n\n';
  out += 'CREATE DATABASE IF NOT EXISTS `freehub` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n';
  out += 'USE `freehub`;\n\n';
  out += 'SET FOREIGN_KEY_CHECKS = 0;\n\n';

  for (const table of TABLES) {
    const [[createRow]] = await sequelize.query(`SHOW CREATE TABLE \`${table}\``);
    const ddl = createRow['Create Table'];
    out += `DROP TABLE IF EXISTS \`${table}\`;\n${ddl};\n\n`;

    const [rows] = await sequelize.query(`SELECT * FROM \`${table}\``);
    if (rows.length) {
      const cols = Object.keys(rows[0]);
      out += `INSERT INTO \`${table}\` (${cols.map(c => `\`${c}\``).join(', ')}) VALUES\n`;
      out += rows.map(r => `  (${cols.map(c => sqlValue(r[c])).join(', ')})`).join(',\n');
      out += ';\n\n';
    }
  }

  out += 'SET FOREIGN_KEY_CHECKS = 1;\n';

  const outDir = path.resolve(__dirname, '..', '..', 'database');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'freehub.sql');
  fs.writeFileSync(outPath, out, 'utf8');
  console.log('Wrote ' + outPath);
  await sequelize.close();
})().catch(e => { console.error(e); process.exit(1); });
