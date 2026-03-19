import mysql.connector
import os
from dotenv import load_dotenv
from datetime import date, timedelta

# Load env variables
load_dotenv()

def init_db():
    print("Connecting to MySQL...")
    try:
        conn = mysql.connector.connect(
            host=os.getenv("DB_HOST", "localhost"),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", "")
        )
        cursor = conn.cursor()

        # Create DB if not exists
        cursor.execute("CREATE DATABASE IF NOT EXISTS gym_management")
        cursor.execute("USE gym_management")

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

        # Payments
        cursor.execute("INSERT INTO PAYMENT (member_id, plan_id, amount, payment_date, valid_from, valid_until, payment_mode) VALUES (1,1,150.00,'2025-01-15','2025-01-15',%s,'Credit Card')", (active,))
        cursor.execute("INSERT INTO PAYMENT (member_id, plan_id, amount, payment_date, valid_from, valid_until, payment_mode) VALUES (2,2,120.00,'2024-12-01','2024-12-01',%s,'Cash')", (expiring_soon,))
        cursor.execute("INSERT INTO PAYMENT (member_id, plan_id, amount, payment_date, valid_from, valid_until, payment_mode) VALUES (3,2,120.00,'2025-02-10','2025-02-10',%s,'Credit Card')", (expired,))

        # Equipment
        cursor.execute("INSERT INTO EQUIPMENT (name, category, quantity, condition_status, next_maintenance_date) VALUES ('Treadmill X1','Cardio',5,'Good',%s)", (active,))
        cursor.execute("INSERT INTO EQUIPMENT (name, category, quantity, condition_status, next_maintenance_date) VALUES ('Precor Elliptical','Cardio',3,'Needs Repair',%s)", (expiring_soon,))
        cursor.execute("INSERT INTO EQUIPMENT (name, category, quantity, condition_status, next_maintenance_date) VALUES ('Dumbbell Set 5-50lbs','Weights',2,'Excellent',%s)", (active,))
        cursor.execute("INSERT INTO EQUIPMENT (name, category, quantity, condition_status, next_maintenance_date) VALUES ('Squat Rack','Weights',4,'Good',%s)", (expiring_soon,))

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
                password=os.getenv("DB_PASSWORD", "")
            )
            cursor = conn.cursor()
            cursor.execute("DROP DATABASE IF EXISTS gym_management")
            conn.commit()
            cursor.close()
            conn.close()
        except:
            pass
    init_db()
