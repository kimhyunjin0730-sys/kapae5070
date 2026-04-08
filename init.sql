# 1. 터미널(또는 워크벤치)에서 아래 명령어 실행 전
# mysql -u root -p 접속 (또는 MariaDB)

CREATE DATABASE IF NOT EXISTS kapae5070;
USE kapae5070;

# 2. 문의하기 테이블(inquiries) 생성
CREATE TABLE IF NOT EXISTS inquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50) DEFAULT '일반 문의',
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(100) NOT NULL,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

# 3. 알림마당 게시판 테이블(notice_board) 생성
CREATE TABLE IF NOT EXISTS notice_board (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    content TEXT,
    author VARCHAR(50),
    published_at DATE, -- app.js 프론트엔드 정렬을 위해 published_at (또는 date) 사용
    views INT DEFAULT 0,
    is_new BOOLEAN DEFAULT FALSE,
    is_hot BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

# 4. 워크그래피 폼 데이터 테이블(workgraphy_requests) 생성
CREATE TABLE IF NOT EXISTS workgraphy_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(100),
    age_group VARCHAR(20),
    status VARCHAR(50),
    region VARCHAR(100),
    work_type VARCHAR(50),
    total_years VARCHAR(20),
    skills JSON,
    summary TEXT,
    careers JSON,
    ai_result JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

# 5. 수집된 고용정보 테이블 (jobs) 생성
CREATE TABLE IF NOT EXISTS jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    source VARCHAR(50),          -- worknet, private, public 등
    title VARCHAR(255) NOT NULL,
    company VARCHAR(100),
    content TEXT,                -- 공고 상세 내용 (AI 분석용)
    region VARCHAR(100),
    salary VARCHAR(100),
    job_type VARCHAR(50),        -- 재취업, 자문, 프로젝트 등
    is_senior_friendly BOOLEAN DEFAULT TRUE,
    raw_url TEXT,                -- 원본 공고 링크
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
