CREATE DATABASE IF NOT EXISTS gym_management;
USE gym_management;

-- Reset tables if they exist
DROP TABLE IF EXISTS DIET_PLAN;
DROP TABLE IF EXISTS MESSAGE;
DROP TABLE IF EXISTS ATTENDANCE;
DROP TABLE IF EXISTS EQUIPMENT_TICKET;
DROP TABLE IF EXISTS EQUIPMENT;
DROP TABLE IF EXISTS PAYMENT;
DROP TABLE IF EXISTS MEMBER_PLAN;
DROP TABLE IF EXISTS PLAN;
DROP TABLE IF EXISTS INSTRUCTOR;
DROP TABLE IF EXISTS MEMBER;
DROP TABLE IF EXISTS ADMIN;
DROP TABLE IF EXISTS NOTIFICATION;

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

-- EQUIPMENT_TICKET TABLE (Repair Workflow)
CREATE TABLE EQUIPMENT_TICKET (
    ticket_id INT AUTO_INCREMENT PRIMARY KEY,
    equipment_id INT,
    reported_by_id INT,
    reported_by_role ENUM('member','instructor','admin'),
    description TEXT NOT NULL,
    priority ENUM('low','medium','high') DEFAULT 'medium',
    status ENUM('open','in_progress','resolved','closed') DEFAULT 'open',
    resolution_notes TEXT,
    created_at DATETIME DEFAULT NOW(),
    resolved_at DATETIME,
    FOREIGN KEY (equipment_id) REFERENCES EQUIPMENT(equipment_id)
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

-- DIET_PLAN TABLE
CREATE TABLE DIET_PLAN (
    diet_plan_id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT,
    instructor_id INT,
    protein_g INT NOT NULL,
    carbs_g INT NOT NULL,
    kcal_goal INT NOT NULL,
    breakfast TEXT,
    lunch TEXT,
    dinner TEXT,
    snacks TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT NOW(),
    updated_at DATETIME DEFAULT NOW() ON UPDATE NOW(),
    FOREIGN KEY (member_id)
        REFERENCES MEMBER(member_id),
    FOREIGN KEY (instructor_id)
        REFERENCES INSTRUCTOR(instructor_id)
);

-- NOTIFICATION TABLE
CREATE TABLE NOTIFICATION (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    recipient_id INT,
    recipient_role ENUM('member','instructor','admin'),
    type VARCHAR(50),
    title VARCHAR(200),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    resolved_at DATETIME,
    created_at DATETIME DEFAULT NOW()
);

-- Drop existing procedure if exists
DROP PROCEDURE IF EXISTS generate_daily_alerts;

DELIMITER //

CREATE PROCEDURE generate_daily_alerts()
BEGIN
    -- 1. Membership expiry
    INSERT INTO NOTIFICATION (recipient_id, recipient_role, type, title, message)
    SELECT member_id, 'member', 'billing_expiry', 'Membership Expiring Soon', CONCAT('Your membership plan expires on ', due_date, '. Please renew to avoid interruption.')
    FROM BILLING_CYCLE
    WHERE status = 'pending' AND due_date = DATE_ADD(CURDATE(), INTERVAL 7 DAY)
    AND NOT EXISTS (SELECT 1 FROM NOTIFICATION WHERE recipient_id = BILLING_CYCLE.member_id AND type = 'billing_expiry' AND DATE(created_at) = CURDATE());

    -- 2. Payment overdue (Member)
    INSERT INTO NOTIFICATION (recipient_id, recipient_role, type, title, message)
    SELECT member_id, 'member', 'billing_overdue', 'Payment Overdue', CONCAT('Your payment of $', amount, ' is overdue since ', due_date, '.')
    FROM BILLING_CYCLE
    WHERE status = 'pending' AND due_date < CURDATE()
    AND NOT EXISTS (SELECT 1 FROM NOTIFICATION WHERE recipient_id = BILLING_CYCLE.member_id AND type = 'billing_overdue' AND DATE(created_at) = CURDATE());
    
    -- 2b. Payment overdue (Admin)
    INSERT INTO NOTIFICATION (recipient_id, recipient_role, type, title, message)
    SELECT 1, 'admin', 'admin_overdue', 'Overdue Payment Alert', CONCAT('Member ID ', member_id, ' has an overdue payment of $', amount, ' from ', due_date, '.')
    FROM BILLING_CYCLE
    WHERE status = 'pending' AND due_date < CURDATE()
    AND NOT EXISTS (SELECT 1 FROM NOTIFICATION WHERE type = 'admin_overdue' AND DATE(created_at) = CURDATE() AND message LIKE CONCAT('%Member ID ', member_id, '%'));

    -- 3. Equipment maintenance (Admin)
    INSERT INTO NOTIFICATION (recipient_id, recipient_role, type, title, message)
    SELECT 1, 'admin', 'equipment_maintenance', 'Equipment Maintenance Due', CONCAT('Equipment "', name, '" is due for maintenance on ', next_maintenance_date, '.')
    FROM EQUIPMENT
    WHERE next_maintenance_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 DAY)
    AND NOT EXISTS (SELECT 1 FROM NOTIFICATION WHERE type = 'equipment_maintenance' AND DATE(created_at) = CURDATE() AND message LIKE CONCAT('%', name, '%'));

    -- 4. Open repair tickets > 2 days (Admin)
    INSERT INTO NOTIFICATION (recipient_id, recipient_role, type, title, message)
    SELECT 1, 'admin', 'ticket_overdue', 'Unresolved Repair Ticket',
        CONCAT('Ticket #', t.ticket_id, ' for "', e.name, '" has been open since ', DATE(t.created_at), '.')
    FROM EQUIPMENT_TICKET t
    JOIN EQUIPMENT e ON t.equipment_id = e.equipment_id
    WHERE t.status IN ('open','in_progress') AND t.created_at < DATE_SUB(NOW(), INTERVAL 2 DAY)
    AND NOT EXISTS (SELECT 1 FROM NOTIFICATION WHERE type = 'ticket_overdue' AND DATE(created_at) = CURDATE() AND message LIKE CONCAT('%Ticket #', t.ticket_id, '%'));
END //

DELIMITER ;
