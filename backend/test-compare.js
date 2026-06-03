const bcrypt = require('bcryptjs');

const run = async () => {
  const hash = '$2a$10$s7WcYhYjWrBjDnRPUgKLTuF2BGLL9J20xMxB8aPJzmv1IP.3AFKBe';
  const match = await bcrypt.compare('password', hash);
  console.log('Does "password" match new hash?', match);
  process.exit(0);
};

run();
