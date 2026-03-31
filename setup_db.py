import mysql.connector
import os
from dotenv import load_dotenv
from datetime import date, timedelta

# Load env variables
load_dotenv()

def init_db():
    print("Connecting to MySQL...")
    db_name = os.getenv("DB_NAME", "gym_management")
    try:
        # First try to connect with the database name (Standard for PaaS like Railway)
        conn = mysql.connector.connect(
            host=os.getenv("DB_HOST", "localhost"),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", ""),
            port=int(os.getenv("DB_PORT", "3306")),
            database=db_name
        )
        cursor = conn.cursor()
    except Exception as e:
        # If database doesn't exist, connect globally and create it (Standard for Local Development)
        conn = mysql.connector.connect(
            host=os.getenv("DB_HOST", "localhost"),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", ""),
            port=int(os.getenv("DB_PORT", "3306"))
        )
        cursor = conn.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{db_name}`")
        cursor.execute(f"USE `{db_name}`")

    try:
        print("Creating tables (if not exist)...")

        cursor.execute("""CREATE TABLE IF NOT EXISTS ADMIN (
            admin_id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL
        )""")

        cursor.execute("""CREATE TABLE IF NOT EXISTS MEMBER (
            member_id INT AUTO_INCREMENT PRIMARY KEY,
            first_name VARCHAR(50),
            last_name VARCHAR(50),
            phone VARCHAR(15),
            email VARCHAR(100) UNIQUE,
            password VARCHAR(255) NOT NULL,
            status ENUM('pending', 'active', 'rejected') DEFAULT 'active',
            address VARCHAR(200),
            date_of_birth DATE,
            join_date DATE
        )""")

        cursor.execute("""CREATE TABLE IF NOT EXISTS INSTRUCTOR (
            instructor_id INT AUTO_INCREMENT PRIMARY KEY,
            first_name VARCHAR(50),
            last_name VARCHAR(50),
            phone VARCHAR(15),
            email VARCHAR(100) UNIQUE,
            password VARCHAR(255) NOT NULL,
            status ENUM('pending', 'active', 'rejected') DEFAULT 'active',
            specialization VARCHAR(100),
            experience_years INT
        )""")

        cursor.execute("""CREATE TABLE IF NOT EXISTS PLAN (
            plan_id INT AUTO_INCREMENT PRIMARY KEY,
            plan_name VARCHAR(100),
            goal VARCHAR(200),
            duration VARCHAR(50),
            created_by_instructor_id INT,
            FOREIGN KEY (created_by_instructor_id) REFERENCES INSTRUCTOR(instructor_id)
        )""")

        cursor.execute("""CREATE TABLE IF NOT EXISTS MEMBER_PLAN (
            member_plan_id INT AUTO_INCREMENT PRIMARY KEY,
            member_id INT,
            plan_id INT,
            instructor_id INT,
            start_date DATE,
            end_date DATE,
            FOREIGN KEY (member_id) REFERENCES MEMBER(member_id),
            FOREIGN KEY (plan_id) REFERENCES PLAN(plan_id),
            FOREIGN KEY (instructor_id) REFERENCES INSTRUCTOR(instructor_id)
        )""")

        cursor.execute("""CREATE TABLE IF NOT EXISTS PAYMENT (
            payment_id INT AUTO_INCREMENT PRIMARY KEY,
            member_id INT,
            plan_id INT,
            amount DECIMAL(10,2),
            payment_date DATE,
            valid_from DATE,
            valid_until DATE,
            payment_mode VARCHAR(50),
            invoice_number VARCHAR(100),
            FOREIGN KEY (member_id) REFERENCES MEMBER(member_id),
            FOREIGN KEY (plan_id) REFERENCES PLAN(plan_id)
        )""")

        cursor.execute("""CREATE TABLE IF NOT EXISTS BILLING_CYCLE (
            cycle_id INT AUTO_INCREMENT PRIMARY KEY,
            member_id INT,
            plan_id INT,
            due_date DATE,
            paid_date DATE,
            amount DECIMAL(10,2),
            status ENUM('pending', 'paid', 'overdue'),
            FOREIGN KEY (member_id) REFERENCES MEMBER(member_id),
            FOREIGN KEY (plan_id) REFERENCES PLAN(plan_id)
        )""")

        cursor.execute("""CREATE TABLE IF NOT EXISTS EQUIPMENT (
            equipment_id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100),
            category VARCHAR(100),
            quantity INT,
            condition_status VARCHAR(50),
            next_maintenance_date DATE
        )""")

        cursor.execute("""CREATE TABLE IF NOT EXISTS EQUIPMENT_TICKET (
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
        )""")

        cursor.execute("""CREATE TABLE IF NOT EXISTS ATTENDANCE (
            attendance_id INT AUTO_INCREMENT PRIMARY KEY,
            member_id INT,
            instructor_id INT,
            check_in_time DATETIME,
            check_out_time DATETIME,
            visit_date DATE,
            FOREIGN KEY (member_id) REFERENCES MEMBER(member_id),
            FOREIGN KEY (instructor_id) REFERENCES INSTRUCTOR(instructor_id)
        )""")

        cursor.execute("""CREATE TABLE IF NOT EXISTS MESSAGE (
            message_id INT AUTO_INCREMENT PRIMARY KEY,
            from_instructor_id INT,
            to_member_id INT,
            content TEXT,
            sent_at DATETIME DEFAULT NOW(),
            FOREIGN KEY (from_instructor_id) REFERENCES INSTRUCTOR(instructor_id),
            FOREIGN KEY (to_member_id) REFERENCES MEMBER(member_id)
        )""")

        cursor.execute("""CREATE TABLE IF NOT EXISTS DIET_PLAN (
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
            FOREIGN KEY (member_id) REFERENCES MEMBER(member_id),
            FOREIGN KEY (instructor_id) REFERENCES INSTRUCTOR(instructor_id)
        )""")

        cursor.execute("""CREATE TABLE IF NOT EXISTS EXERCISE (
            exercise_id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100),
            category VARCHAR(50),
            muscle_group VARCHAR(50)
        )""")

        cursor.execute("""CREATE TABLE IF NOT EXISTS WORKOUT_LOG (
            log_id INT AUTO_INCREMENT PRIMARY KEY,
            member_id INT,
            log_date DATE,
            title VARCHAR(100),
            notes TEXT,
            FOREIGN KEY (member_id) REFERENCES MEMBER(member_id)
        )""")

        cursor.execute("""CREATE TABLE IF NOT EXISTS LOG_ENTRY (
            entry_id INT AUTO_INCREMENT PRIMARY KEY,
            log_id INT,
            exercise_id INT,
            set_no INT,
            reps INT,
            weight_kg DECIMAL(6,2),
            FOREIGN KEY (log_id) REFERENCES WORKOUT_LOG(log_id) ON DELETE CASCADE,
            FOREIGN KEY (exercise_id) REFERENCES EXERCISE(exercise_id)
        )""")

        cursor.execute("DROP VIEW IF EXISTS PERSONAL_BESTS")
        cursor.execute("""
            CREATE VIEW PERSONAL_BESTS AS
            SELECT 
                w.member_id, 
                e.exercise_id, 
                e.name as exercise_name, 
                MAX(l.weight_kg) as max_weight 
            FROM LOG_ENTRY l 
            JOIN WORKOUT_LOG w ON l.log_id = w.log_id 
            JOIN EXERCISE e ON l.exercise_id = e.exercise_id 
            GROUP BY w.member_id, e.exercise_id, e.name
        """)

        cursor.execute("""CREATE TABLE IF NOT EXISTS GYM_CLASS (
            class_id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(100) NOT NULL,
            description TEXT,
            instructor_id INT,
            day_of_week ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'),
            start_time TIME,
            end_time TIME,
            max_capacity INT DEFAULT 20,
            category VARCHAR(50),
            is_active BOOLEAN DEFAULT TRUE,
            created_at DATETIME DEFAULT NOW(),
            FOREIGN KEY (instructor_id) REFERENCES INSTRUCTOR(instructor_id)
        )""")

        cursor.execute("""CREATE TABLE IF NOT EXISTS CLASS_BOOKING (
            booking_id INT AUTO_INCREMENT PRIMARY KEY,
            class_id INT,
            member_id INT,
            booked_date DATE,
            status ENUM('confirmed','cancelled','attended') DEFAULT 'confirmed',
            created_at DATETIME DEFAULT NOW(),
            FOREIGN KEY (class_id) REFERENCES GYM_CLASS(class_id),
            FOREIGN KEY (member_id) REFERENCES MEMBER(member_id),
            UNIQUE KEY unique_booking (class_id, member_id, booked_date)
        )""")

        cursor.execute("""CREATE TABLE IF NOT EXISTS BODY_METRIC (
            metric_id INT AUTO_INCREMENT PRIMARY KEY,
            member_id INT,
            recorded_date DATE,
            weight_kg DECIMAL(5,2),
            body_fat_pct DECIMAL(4,1),
            notes TEXT,
            created_at DATETIME DEFAULT NOW(),
            FOREIGN KEY (member_id) REFERENCES MEMBER(member_id)
        )""")

        cursor.execute("""CREATE TABLE IF NOT EXISTS NOTIFICATION (
            notification_id INT AUTO_INCREMENT PRIMARY KEY,
            recipient_id INT,
            recipient_role ENUM('member','instructor','admin'),
            type VARCHAR(50),
            title VARCHAR(200),
            message TEXT,
            is_read BOOLEAN DEFAULT FALSE,
            resolved_at DATETIME,
            created_at DATETIME DEFAULT NOW()
        )""")

        # Drop existing procedure if exists
        cursor.execute("DROP PROCEDURE IF EXISTS generate_daily_alerts")

        cursor.execute("""
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

                -- 4. Open repair tickets (Admin) — alert if any ticket has been open > 2 days
                INSERT INTO NOTIFICATION (recipient_id, recipient_role, type, title, message)
                SELECT 1, 'admin', 'ticket_overdue', 'Unresolved Repair Ticket',
                    CONCAT('Ticket #', t.ticket_id, ' for "', e.name, '" has been open since ', DATE(t.created_at), '.')
                FROM EQUIPMENT_TICKET t
                JOIN EQUIPMENT e ON t.equipment_id = e.equipment_id
                WHERE t.status IN ('open','in_progress') AND t.created_at < DATE_SUB(NOW(), INTERVAL 2 DAY)
                AND NOT EXISTS (SELECT 1 FROM NOTIFICATION WHERE type = 'ticket_overdue' AND DATE(created_at) = CURDATE() AND message LIKE CONCAT('%Ticket #', t.ticket_id, '%'));
            END;
        """)

        # Drop existing trigger if it exists
        cursor.execute("DROP TRIGGER IF EXISTS after_billing_paid")

        # Create Trigger for auto-renewing billing cycles
        cursor.execute("""
            CREATE TRIGGER after_billing_paid
            AFTER UPDATE ON BILLING_CYCLE
            FOR EACH ROW
            BEGIN
                DECLARE cur_duration VARCHAR(50);
                DECLARE num_val INT;
                DECLARE unit VARCHAR(20);
                
                IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
                    SELECT duration INTO cur_duration FROM PLAN WHERE plan_id = NEW.plan_id;
                    
                    SET num_val = CAST(SUBSTRING_INDEX(cur_duration, ' ', 1) AS UNSIGNED);
                    SET unit = SUBSTRING_INDEX(cur_duration, ' ', -1);
                    
                    IF unit LIKE '%Month%' THEN
                        INSERT INTO BILLING_CYCLE (member_id, plan_id, due_date, status, amount)
                        VALUES (NEW.member_id, NEW.plan_id, DATE_ADD(NEW.due_date, INTERVAL num_val MONTH), 'pending', NEW.amount);
                    ELSEIF unit LIKE '%Day%' THEN
                        INSERT INTO BILLING_CYCLE (member_id, plan_id, due_date, status, amount)
                        VALUES (NEW.member_id, NEW.plan_id, DATE_ADD(NEW.due_date, INTERVAL num_val DAY), 'pending', NEW.amount);
                    ELSEIF unit LIKE '%Year%' THEN
                        INSERT INTO BILLING_CYCLE (member_id, plan_id, due_date, status, amount)
                        VALUES (NEW.member_id, NEW.plan_id, DATE_ADD(NEW.due_date, INTERVAL num_val YEAR), 'pending', NEW.amount);
                    ELSE
                        -- Default to 1 month fallback
                        INSERT INTO BILLING_CYCLE (member_id, plan_id, due_date, status, amount)
                        VALUES (NEW.member_id, NEW.plan_id, DATE_ADD(NEW.due_date, INTERVAL 1 MONTH), 'pending', NEW.amount);
                    END IF;
                END IF;
            END;
        """)

        conn.commit()
        print("Tables ready!")

        # Only seed if ADMIN table is empty (first run)
        cursor.execute("SELECT COUNT(*) FROM ADMIN")
        admin_count = cursor.fetchone()[0]

        if admin_count > 0:
            print("Data already exists, skipping seed. Use --force to re-seed.")
            return

        print("Inserting initial seed data...")

        today = date.today()
        expiring_soon = today + timedelta(days=5)
        expired = today - timedelta(days=2)
        active = today + timedelta(days=30)

        # Admin
        cursor.execute("INSERT INTO ADMIN (username, password) VALUES ('admin', 'admin123')")

        # Instructors
        cursor.execute("INSERT INTO INSTRUCTOR (first_name, last_name, phone, email, password, specialization, experience_years) VALUES (%s,%s,%s,%s,%s,%s,%s)",
            ('John', 'Smith', '555-0101', 'john@neoniron.com', 'coach123', 'Bodybuilding', 8))
        cursor.execute("INSERT INTO INSTRUCTOR (first_name, last_name, phone, email, password, specialization, experience_years) VALUES (%s,%s,%s,%s,%s,%s,%s)",
            ('Sarah', 'Connor', '555-0102', 'sarah@neoniron.com', 'coach123', 'CrossFit & Cardio', 5))

        # Plans
        cursor.execute("INSERT INTO PLAN (plan_name, goal, duration, created_by_instructor_id) VALUES (%s,%s,%s,%s)",
            ('Hypertrophy Max', 'Muscle Gain', '3 Months', 1))
        cursor.execute("INSERT INTO PLAN (plan_name, goal, duration, created_by_instructor_id) VALUES (%s,%s,%s,%s)",
            ('Shred 90', 'Fat Loss', '90 Days', 2))

        # Members
        cursor.execute("INSERT INTO MEMBER (first_name, last_name, phone, email, password, join_date) VALUES (%s,%s,%s,%s,%s,%s)",
            ('Mike', 'Ross', '555-0201', 'mike@test.com', 'password123', '2025-01-15'))
        cursor.execute("INSERT INTO MEMBER (first_name, last_name, phone, email, password, join_date) VALUES (%s,%s,%s,%s,%s,%s)",
            ('Harvey', 'Specter', '555-0202', 'harvey@test.com', 'password123', '2024-06-01'))
        cursor.execute("INSERT INTO MEMBER (first_name, last_name, phone, email, password, join_date) VALUES (%s,%s,%s,%s,%s,%s)",
            ('Donna', 'Paulsen', '555-0203', 'donna@test.com', 'password123', '2025-02-10'))

        # Member Plans
        cursor.execute("INSERT INTO MEMBER_PLAN (member_id, plan_id, instructor_id, start_date, end_date) VALUES (1,1,1,'2025-01-15',%s)", (active,))
        cursor.execute("INSERT INTO MEMBER_PLAN (member_id, plan_id, instructor_id, start_date, end_date) VALUES (2,2,2,'2024-06-01',%s)", (expiring_soon,))
        cursor.execute("INSERT INTO MEMBER_PLAN (member_id, plan_id, instructor_id, start_date, end_date) VALUES (3,2,2,'2025-02-10',%s)", (expired,))

        # Payments & Billing Cycles
        inv_year = today.year
        cursor.execute("INSERT INTO PAYMENT (member_id, plan_id, amount, payment_date, valid_from, valid_until, payment_mode, invoice_number) VALUES (1,1,150.00,'2025-01-15','2025-01-15',%s,'Credit Card', %s)", (active, f'INV-{inv_year}-1-001'))
        cursor.execute("INSERT INTO BILLING_CYCLE (member_id, plan_id, due_date, paid_date, amount, status) VALUES (1,1,'2025-01-15','2025-01-15',150.00,'paid')")
        
        cursor.execute("INSERT INTO PAYMENT (member_id, plan_id, amount, payment_date, valid_from, valid_until, payment_mode, invoice_number) VALUES (2,2,120.00,'2024-12-01','2024-12-01',%s,'Cash', %s)", (expiring_soon, f'INV-{inv_year}-2-001'))
        cursor.execute("INSERT INTO BILLING_CYCLE (member_id, plan_id, due_date, paid_date, amount, status) VALUES (2,2,'2024-12-01','2024-12-01',120.00,'paid')")
        
        cursor.execute("INSERT INTO PAYMENT (member_id, plan_id, amount, payment_date, valid_from, valid_until, payment_mode, invoice_number) VALUES (3,2,120.00,'2025-02-10','2025-02-10',%s,'Credit Card', %s)", (expired, f'INV-{inv_year}-3-001'))
        cursor.execute("INSERT INTO BILLING_CYCLE (member_id, plan_id, due_date, paid_date, amount, status) VALUES (3,2,'2025-02-10','2025-02-10',120.00,'paid')")
        
        # Add some pending cycles (auto-generated ones due in future/past)
        cursor.execute("INSERT INTO BILLING_CYCLE (member_id, plan_id, due_date, paid_date, amount, status) VALUES (2,2,%s,NULL,120.00,'pending')", (expiring_soon,))
        cursor.execute("INSERT INTO BILLING_CYCLE (member_id, plan_id, due_date, paid_date, amount, status) VALUES (3,2,%s,NULL,120.00,'overdue')", (expired,))

        # Equipment
        cursor.execute("INSERT INTO EQUIPMENT (name, category, quantity, condition_status, next_maintenance_date) VALUES ('Treadmill X1','Cardio',5,'Good',%s)", (active,))
        cursor.execute("INSERT INTO EQUIPMENT (name, category, quantity, condition_status, next_maintenance_date) VALUES ('Precor Elliptical','Cardio',3,'Needs Repair',%s)", (expiring_soon,))
        cursor.execute("INSERT INTO EQUIPMENT (name, category, quantity, condition_status, next_maintenance_date) VALUES ('Dumbbell Set 5-50lbs','Weights',2,'Excellent',%s)", (active,))
        cursor.execute("INSERT INTO EQUIPMENT (name, category, quantity, condition_status, next_maintenance_date) VALUES ('Squat Rack','Weights',4,'Good',%s)", (expiring_soon,))

        # Equipment Repair Tickets
        cursor.execute("INSERT INTO EQUIPMENT_TICKET (equipment_id, reported_by_id, reported_by_role, description, priority, status, created_at) VALUES (2, 1, 'member', 'Elliptical #2 makes a grinding noise at high resistance levels', 'high', 'open', %s)", (today - timedelta(days=3),))
        cursor.execute("INSERT INTO EQUIPMENT_TICKET (equipment_id, reported_by_id, reported_by_role, description, priority, status, created_at) VALUES (1, 2, 'member', 'Treadmill belt is slipping during sprints', 'medium', 'in_progress', %s)", (today - timedelta(days=1),))
        cursor.execute("INSERT INTO EQUIPMENT_TICKET (equipment_id, reported_by_id, reported_by_role, description, priority, status, resolution_notes, resolved_at, created_at) VALUES (4, 1, 'instructor', 'Squat rack safety pins are loose on unit #3', 'high', 'resolved', 'Tightened all safety pins and replaced worn bolts', %s, %s)", (today, today - timedelta(days=5),))

        # Attendance (7 days)
        for i in range(7):
            d = today - timedelta(days=i)
            if i != 3:
                cursor.execute("INSERT INTO ATTENDANCE (member_id, instructor_id, visit_date) VALUES (1,1,%s)", (d,))
            if i % 2 == 0:
                cursor.execute("INSERT INTO ATTENDANCE (member_id, instructor_id, visit_date) VALUES (2,2,%s)", (d,))
            if i in [0, 2, 5]:
                cursor.execute("INSERT INTO ATTENDANCE (member_id, instructor_id, visit_date) VALUES (3,2,%s)", (d,))

        # Messages
        cursor.execute("INSERT INTO MESSAGE (from_instructor_id, to_member_id, content, sent_at) VALUES (1,1,%s,%s)",
            ('Great session today Mike! Keep pushing on those deadlifts.', today - timedelta(days=1)))
        cursor.execute("INSERT INTO MESSAGE (from_instructor_id, to_member_id, content, sent_at) VALUES (1,1,%s,%s)",
            ('Remember to focus on your form during squats.', today))
        cursor.execute("INSERT INTO MESSAGE (from_instructor_id, to_member_id, content, sent_at) VALUES (2,2,%s,%s)",
            ('Harvey, your cardio endurance is improving! Let\'s add HIIT intervals next week.', today - timedelta(days=2)))
        cursor.execute("INSERT INTO MESSAGE (from_instructor_id, to_member_id, content, sent_at) VALUES (2,3,%s,%s)",
            ('Donna, please renew your membership before it expires.', today))

        # Diet Plans
        cursor.execute("INSERT INTO DIET_PLAN (member_id, instructor_id, protein_g, carbs_g, kcal_goal, breakfast, lunch, dinner, snacks, notes) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
            (1, 1, 180, 250, 2800, '6 egg whites + oatmeal + banana', 'Grilled chicken breast + brown rice + broccoli', 'Salmon + sweet potato + mixed greens', 'Whey protein shake + almonds', 'Drink at least 3L water daily. Take creatine post-workout.'))
        cursor.execute("INSERT INTO DIET_PLAN (member_id, instructor_id, protein_g, carbs_g, kcal_goal, breakfast, lunch, dinner, snacks, notes) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
            (2, 2, 140, 180, 2200, 'Greek yogurt + granola + berries', 'Turkey wrap + quinoa salad', 'Grilled fish + steamed veggies', 'Protein bar + green tea', 'Focus on high-protein, low-carb meals on rest days.'))
        cursor.execute("INSERT INTO DIET_PLAN (member_id, instructor_id, protein_g, carbs_g, kcal_goal, breakfast, lunch, dinner, snacks, notes) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
            (3, 2, 120, 200, 1800, 'Smoothie bowl with spinach + chia seeds + mixed berries', 'Grilled tofu salad + avocado + lemon dressing', 'Baked chicken thighs + roasted zucchini + quinoa', 'Apple slices + peanut butter', 'Keep sugar intake under 25g/day. Add 30 min walk on rest days.'))

        # Exercises
        exercises = [
            ('Bench Press', 'Push', 'Chest'),
            ('Incline Dumbbell Press', 'Push', 'Chest'),
            ('Squat', 'Legs', 'Quads'),
            ('Leg Press', 'Legs', 'Quads'),
            ('Deadlift', 'Pull', 'Back'),
            ('Pull-up', 'Pull', 'Back'),
            ('Overhead Press', 'Push', 'Shoulders'),
            ('Barbell Curl', 'Pull', 'Biceps'),
            ('Tricep Extension', 'Push', 'Triceps'),
            ('Crunch', 'Core', 'Abs')
        ]
        for ex in exercises:
            cursor.execute("INSERT INTO EXERCISE (name, category, muscle_group) VALUES (%s,%s,%s)", ex)
            
        # Workout Logs for Mike (1)
        cursor.execute("INSERT INTO WORKOUT_LOG (member_id, log_date, title, notes) VALUES (1, %s, 'Chest & Triceps Push', 'Felt strong on bench today')", (today - timedelta(days=2),))
        log_id1 = cursor.lastrowid
        cursor.execute("INSERT INTO LOG_ENTRY (log_id, exercise_id, set_no, reps, weight_kg) VALUES (%s,1,1,10,60)", (log_id1,))
        cursor.execute("INSERT INTO LOG_ENTRY (log_id, exercise_id, set_no, reps, weight_kg) VALUES (%s,1,2,8,70)", (log_id1,))
        cursor.execute("INSERT INTO LOG_ENTRY (log_id, exercise_id, set_no, reps, weight_kg) VALUES (%s,1,3,6,80)", (log_id1,))
        cursor.execute("INSERT INTO LOG_ENTRY (log_id, exercise_id, set_no, reps, weight_kg) VALUES (%s,9,1,12,20)", (log_id1,))
        cursor.execute("INSERT INTO LOG_ENTRY (log_id, exercise_id, set_no, reps, weight_kg) VALUES (%s,9,2,10,25)", (log_id1,))
        
        cursor.execute("INSERT INTO WORKOUT_LOG (member_id, log_date, title, notes) VALUES (1, %s, 'Leg Day Pull', 'Tough squats')", (today,))
        log_id2 = cursor.lastrowid
        cursor.execute("INSERT INTO LOG_ENTRY (log_id, exercise_id, set_no, reps, weight_kg) VALUES (%s,3,1,10,80)", (log_id2,))
        cursor.execute("INSERT INTO LOG_ENTRY (log_id, exercise_id, set_no, reps, weight_kg) VALUES (%s,3,2,8,90)", (log_id2,))
        cursor.execute("INSERT INTO LOG_ENTRY (log_id, exercise_id, set_no, reps, weight_kg) VALUES (%s,3,3,5,100)", (log_id2,))
        cursor.execute("INSERT INTO LOG_ENTRY (log_id, exercise_id, set_no, reps, weight_kg) VALUES (%s,4,1,12,150)", (log_id2,))

        # Gym Classes
        cursor.execute("INSERT INTO GYM_CLASS (title, description, instructor_id, day_of_week, start_time, end_time, max_capacity, category) VALUES ('Morning HIIT', 'High-intensity interval training to kickstart your morning', 1, 'Monday', '07:00', '08:00', 15, 'Cardio')")
        cursor.execute("INSERT INTO GYM_CLASS (title, description, instructor_id, day_of_week, start_time, end_time, max_capacity, category) VALUES ('Morning HIIT', 'High-intensity interval training to kickstart your morning', 1, 'Wednesday', '07:00', '08:00', 15, 'Cardio')")
        cursor.execute("INSERT INTO GYM_CLASS (title, description, instructor_id, day_of_week, start_time, end_time, max_capacity, category) VALUES ('Yoga Flow', 'Relaxing vinyasa yoga for flexibility and mindfulness', 2, 'Tuesday', '09:00', '10:00', 20, 'Flexibility')")
        cursor.execute("INSERT INTO GYM_CLASS (title, description, instructor_id, day_of_week, start_time, end_time, max_capacity, category) VALUES ('Yoga Flow', 'Relaxing vinyasa yoga for flexibility and mindfulness', 2, 'Thursday', '09:00', '10:00', 20, 'Flexibility')")
        cursor.execute("INSERT INTO GYM_CLASS (title, description, instructor_id, day_of_week, start_time, end_time, max_capacity, category) VALUES ('Strength Fundamentals', 'Master the big lifts with proper form', 1, 'Tuesday', '17:00', '18:30', 12, 'Strength')")
        cursor.execute("INSERT INTO GYM_CLASS (title, description, instructor_id, day_of_week, start_time, end_time, max_capacity, category) VALUES ('Strength Fundamentals', 'Master the big lifts with proper form', 1, 'Thursday', '17:00', '18:30', 12, 'Strength')")
        cursor.execute("INSERT INTO GYM_CLASS (title, description, instructor_id, day_of_week, start_time, end_time, max_capacity, category) VALUES ('Spin Cycle', 'Indoor cycling with energizing playlists', 2, 'Friday', '18:00', '19:00', 25, 'Cardio')")
        cursor.execute("INSERT INTO GYM_CLASS (title, description, instructor_id, day_of_week, start_time, end_time, max_capacity, category) VALUES ('Weekend Bootcamp', 'Full-body weekend warrior workout', 1, 'Saturday', '10:00', '11:30', 18, 'Functional')")

        # Class Bookings (next occurrence dates)
        from datetime import datetime
        # Find next Monday, Tuesday etc. from today
        def next_weekday(d, weekday):
            days_ahead = weekday - d.weekday()
            if days_ahead <= 0: days_ahead += 7
            return d + timedelta(days=days_ahead)

        next_mon = next_weekday(today, 0)
        next_tue = next_weekday(today, 1)
        next_fri = next_weekday(today, 4)
        next_sat = next_weekday(today, 5)

        cursor.execute("INSERT INTO CLASS_BOOKING (class_id, member_id, booked_date) VALUES (1, 1, %s)", (next_mon,))
        cursor.execute("INSERT INTO CLASS_BOOKING (class_id, member_id, booked_date) VALUES (3, 1, %s)", (next_tue,))
        cursor.execute("INSERT INTO CLASS_BOOKING (class_id, member_id, booked_date) VALUES (7, 2, %s)", (next_fri,))
        cursor.execute("INSERT INTO CLASS_BOOKING (class_id, member_id, booked_date) VALUES (8, 1, %s)", (next_sat,))
        cursor.execute("INSERT INTO CLASS_BOOKING (class_id, member_id, booked_date) VALUES (8, 3, %s)", (next_sat,))

        # Body Metrics for Mike (member 1) — 30 days of weight tracking
        import random
        base_weight = 82.5
        base_bf = 18.0
        for i in range(30, -1, -1):
            d = today - timedelta(days=i)
            # Simulate gradual weight loss / body recomp
            w = base_weight - (30 - i) * 0.08 + random.uniform(-0.3, 0.3)
            bf = base_bf - (30 - i) * 0.05 + random.uniform(-0.2, 0.2)
            if i % 3 == 0:  # Log every 3 days
                cursor.execute("INSERT INTO BODY_METRIC (member_id, recorded_date, weight_kg, body_fat_pct) VALUES (1, %s, %s, %s)", (d, round(w, 2), round(bf, 1)))

        # Also add a few for Harvey (member 2)
        for i in range(14, -1, -1):
            d = today - timedelta(days=i)
            w = 75.0 + random.uniform(-0.5, 0.5)
            if i % 4 == 0:
                cursor.execute("INSERT INTO BODY_METRIC (member_id, recorded_date, weight_kg, body_fat_pct) VALUES (2, %s, %s, %s)", (d, round(w, 2), round(15.5 + random.uniform(-0.3, 0.3), 1)))

        # Notifications Seed Data
        cursor.execute("""
            INSERT INTO NOTIFICATION (recipient_id, recipient_role, type, title, message, is_read, created_at) VALUES 
            (1, 'member', 'system', 'Welcome to Neon Iron', 'Enjoy your new membership plan!', 1, %s),
            (2, 'member', 'billing_overdue', 'Payment Overdue', 'Your payment of $120.00 is overdue.', 0, %s),
            (1, 'admin', 'admin_overdue', 'Overdue Payment Alert', 'Member ID 2 has an overdue payment of $120.00 from 2024-12-01.', 0, %s)
        """, (today - timedelta(days=2), today, today))

        cursor.callproc('generate_daily_alerts')
        
        conn.commit()
        print("Seed data inserted successfully!")

    except mysql.connector.Error as err:
        print(f"Error: {err}")
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn.is_connected():
            conn.close()

if __name__ == "__main__":
    import sys
    if '--force' in sys.argv:
        # Drop and recreate everything
        print("Force mode: dropping all tables first...")
        try:
            conn = mysql.connector.connect(
                host=os.getenv("DB_HOST", "localhost"),
                user=os.getenv("DB_USER", "root"),
                password=os.getenv("DB_PASSWORD", ""),
                port=int(os.getenv("DB_PORT", "3306"))
            )
            cursor = conn.cursor()
            db_name = os.getenv("DB_NAME", "gym_management")
            cursor.execute(f"DROP DATABASE IF EXISTS `{db_name}`")
            conn.commit()
            cursor.close()
            conn.close()
        except:
            pass
    init_db()
