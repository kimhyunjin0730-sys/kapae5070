-- backend_test/db_schema.sql
-- 고용정보 및 교육정보 크롤링 데이터 저장 테이블

CREATE TABLE IF NOT EXISTS scraped_jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    site_source VARCHAR(50), -- 'worknet', 'seniorro', 'gjf' 등
    job_id VARCHAR(100) UNIQUE, -- 원본 사이트의 고유 ID
    title VARCHAR(255) NOT NULL,
    company VARCHAR(100),
    region VARCHAR(100),
    salary VARCHAR(100),
    job_type VARCHAR(50), -- 정규직, 계약직 등
    deadline VARCHAR(50),
    url TEXT,
    original_data JSON, -- 전체 응답 보관 (필요시)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scraped_education (
    id INT AUTO_INCREMENT PRIMARY KEY,
    site_source VARCHAR(50), -- '50plus', 'nosa', 'moel' 등
    course_id VARCHAR(100) UNIQUE,
    title VARCHAR(255) NOT NULL,
    institution VARCHAR(100),
    edu_period VARCHAR(100),
    location VARCHAR(100),
    cost VARCHAR(50),
    target_audience VARCHAR(100),
    url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workgraphy_parsed (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_name VARCHAR(50),
    file_name VARCHAR(255),
    parsed_text LONGTEXT,
    summary TEXT,
    skills JSON,
    experience_summary TEXT, -- Gemini를 통한 분석 결과 요약
    assessment_report LONGTEXT, -- 최종 '사주평' 리포트
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
