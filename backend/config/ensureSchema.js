/**
 * sequelize.sync() (without { alter: true }) creates missing tables but never
 * adds new columns to a table that already exists. Because the `users` table
 * predates the Car Hive fields, we add the new columns idempotently here.
 *
 * MySQL has no "ADD COLUMN IF NOT EXISTS", so we check information_schema first.
 */
const ensureCarHiveSchema = async (sequelize) => {
  const qi = sequelize.getQueryInterface();
  try {
    const table = await qi.describeTable('users');

    const addColumn = async (name, ddl) => {
      if (!table[name]) {
        await sequelize.query(`ALTER TABLE \`users\` ADD COLUMN ${ddl}`);
        console.log(`🔧 users.${name} column added`);
      }
    };

    await addColumn('username', '`username` VARCHAR(50) NULL UNIQUE');
    await addColumn('dob', '`dob` DATE NULL');
    await addColumn('address', "`address` VARCHAR(255) NULL DEFAULT ''");
  } catch (err) {
    console.error('ensureCarHiveSchema error:', err.message);
  }
};

module.exports = { ensureCarHiveSchema };
