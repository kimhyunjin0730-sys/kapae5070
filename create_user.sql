-- 실행 전에 CHANGE_ME를 강한 비밀번호로 바꾸고, 같은 값을 .env의 DB_PASS에 넣으세요.
CREATE DATABASE IF NOT EXISTS kapae5070;
CREATE USER IF NOT EXISTS 'kapae'@'localhost' IDENTIFIED BY 'CHANGE_ME';
GRANT ALL PRIVILEGES ON kapae5070.* TO 'kapae'@'localhost';
FLUSH PRIVILEGES;
