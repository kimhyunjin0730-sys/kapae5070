const { execSync } = require('child_process');

try {
  const mysqlPath = '"C:\\Program Files\\MariaDB 11.4\\bin\\mysql.exe"';
  // Try to create a new user with native password
  const cmd = `${mysqlPath} -u root -e "CREATE USER IF NOT EXISTS 'kapae'@'localhost' IDENTIFIED BY 'kapae123'; GRANT ALL PRIVILEGES ON kapae5070.* TO 'kapae'@'localhost'; FLUSH PRIVILEGES;"`;
  console.log('Running command:', cmd);
  const output = execSync(cmd).toString();
  console.log('Output:', output);
} catch (err) {
  console.error('Error:', err.message);
  if (err.stdout) console.log('STDOUT:', err.stdout.toString());
  if (err.stderr) console.log('STDERR:', err.stderr.toString());
}
