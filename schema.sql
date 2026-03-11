CREATE DATABASE IF NOT EXISTS gym_management;
USE gym_management;

-- Reset tables if they exist
DROP TABLE IF EXISTS MESSAGE;
DROP TABLE IF EXISTS ATTENDANCE;
DROP TABLE IF EXISTS EQUIPMENT;
DROP TABLE IF EXISTS PAYMENT;
DROP TABLE IF EXISTS MEMBER_PLAN;
DROP TABLE IF EXISTS PLAN;
DROP TABLE IF EXISTS INSTRUCTOR;
DROP TABLE IF EXISTS MEMBER;
DROP TABLE IF EXISTS ADMIN;

-- ADMIN TABLE
CREATE TABLE ADMIN (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- MEMBER TABLE
CREATE TABLE MEMBER (
    member_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    phone VARCHAR(15),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255) NOT NULL,
    address VARCHAR(200),
    date_of_birth DATE,
    join_date DATE
);

-- INSTRUCTOR TABLE
CREATE TABLE INSTRUCTOR (
    instructor_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    phone VARCHAR(15),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255) NOT NULL,
    specialization VARCHAR(100),
    experience_years INT
);

-- PLAN TABLE
CREATE TABLE PLAN (
    plan_id INT AUTO_INCREMENT PRIMARY KEY,
    plan_name VARCHAR(100),
    goal VARCHAR(200),
    duration VARCHAR(50),
    created_by_instructor_id INT,
    FOREIGN KEY (created_by_instructor_id)
        REFERENCES INSTRUCTOR(instructor_id)
);

-- MEMBER_PLAN TABLE
CREATE TABLE MEMBER_PLAN (
    member_plan_id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT,
    plan_id INT,
    instructor_id INT,
    start_date DATE,
    end_date DATE,
    FOREIGN KEY (member_id)
        REFERENCES MEMBER(member_id),
    FOREIGN KEY (plan_id)
        REFERENCES PLAN(plan_id),
    FOREIGN KEY (instructor_id)
        REFERENCES INSTRUCTOR(instructor_id)
);

-- PAYMENT TABLE
CREATE TABLE PAYMENT (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT,
    plan_id INT,
    amount DECIMAL(10,2),
    payment_date DATE,
    valid_from DATE,
    valid_until DATE,
    payment_mode VARCHAR(50),
    FOREIGN KEY (member_id)
        REFERENCES MEMBER(member_id),
    FOREIGN KEY (plan_id)
        REFERENCES PLAN(plan_id)
);

-- EQUIPMENT TABLE
CREATE TABLE EQUIPMENT (
    equipment_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    category VARCHAR(100),
    quantity INT CHECK (quantity >= 0),
    condition_status VARCHAR(50),
    next_maintenance_date DATE
);

-- ATTENDANCE TABLE
CREATE TABLE ATTENDANCE (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT,
    instructor_id INT,
    check_in_time DATETIME,
    check_out_time DATETIME,
    visit_date DATE,
    FOREIGN KEY (member_id)
        REFERENCES MEMBER(member_id),
    FOREIGN KEY (instructor_id)
        REFERENCES INSTRUCTOR(instructor_id)
);

-- MESSAGE TABLE
CREATE TABLE MESSAGE (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    from_instructor_id INT,
    to_member_id INT,
    content TEXT,
    sent_at DATETIME DEFAULT NOW(),
    FOREIGN KEY (from_instructor_id)
        REFERENCES INSTRUCTOR(instructor_id),
    FOREIGN KEY (to_member_id)
        REFERENCES MEMBER(member_id)
);
