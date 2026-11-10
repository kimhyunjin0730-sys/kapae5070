const { execSync } = require('child_process');
require('dotenv').config();

// 비밀번호는 코드에 쓰지 않고 .env의 DB_PASS에서 읽음
const dbPass = process.env.DB_PASS;
if (!dbPass) {
  console.error('.env에 DB_PASS를 먼저 설정하세요.');
  process.exit(1);
}

try {
  const mysqlPath = '"C:\\Program Files\\MariaDB 11.4\\bin\\mysql.exe"';
  // Try to create a new user with native password
  const cmd = `${mysqlPath} -u root -e "CREATE USER IF NOT EXISTS 'kapae'@'localhost' IDENTIFIED BY '${dbPass}'; GRANT ALL PRIVILEGES ON kapae5070.* TO 'kapae'@'localhost'; FLUSH PRIVILEGES;"`;
  console.log('Running mysql (password hidden)...');
  const output = execSync(cmd).toString();
  console.log('Output:', output);
} catch (err) {
  console.error('Error:', err.message.replace(dbPass, '***'));
  if (err.stdout) console.log('STDOUT:', err.stdout.toString());
  if (err.stderr) console.log('STDERR:', err.stderr.toString());
}
