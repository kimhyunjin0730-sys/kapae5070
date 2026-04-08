const { execSync } = require('child_process');

try {
  const mariaPath = '"C:\\Program Files\\MariaDB 11.4\\bin\\mariadb.exe"';
  const cmd = `${mariaPath} -u root -e "CREATE DATABASE IF NOT EXISTS kapae5070; CREATE USER IF NOT EXISTS 'kapae'@'localhost' IDENTIFIED BY 'kapae123'; GRANT ALL PRIVILEGES ON kapae5070.* TO 'kapae'@'localhost'; FLUSH PRIVILEGES;"`;
  console.log('Running command:', cmd);
  const output = execSync(cmd).toString();
  console.log('Output:', output);
} catch (err) {
  console.error('Error:', err.message);
  if (err.stdout) console.log('STDOUT:', err.stdout.toString());
  if (err.stderr) console.log('STDERR:', err.stderr.toString());
}
