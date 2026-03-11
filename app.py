from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
import os
import mysql.connector
from mysql.connector import Error
import jwt
from datetime import datetime, timedelta
from functools import wraps

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'neon-iron-secret-key-123')
# Allow CORS for React frontend (default Vite port)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Database connection function
def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host=os.getenv("DB_HOST", "localhost"),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", ""),
            database=os.getenv("DB_NAME", "gym_management")
        )
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

# ==========================================
# AUTHENTICATION Endpoints
# ==========================================
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username_or_email = data.get('username')
    password = data.get('password')

    if not username_or_email or not password:
        return jsonify({"error": "Missing credentials"}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database error"}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        
        # 1. Check if user is an ADMIN
        cursor.execute("SELECT * FROM ADMIN WHERE username = %s AND password = %s", (username_or_email, password))
        admin = cursor.fetchone()
        
        if admin:
            token = jwt.encode({
                'user_id': admin['admin_id'],
                'role': 'admin',
                'username': admin['username'],
                'exp': datetime.utcnow() + timedelta(hours=24)
            }, app.config['SECRET_KEY'], algorithm='HS256')
            
            return jsonify({
                "message": "Login successful",
                "token": token,
                "user": {
                    "id": admin['admin_id'],
                    "role": "admin",
                    "name": "Administrator"
                }
            })

        # 2. Check if user is a MEMBER
        cursor.execute("SELECT * FROM MEMBER WHERE email = %s AND password = %s", (username_or_email, password))
        member = cursor.fetchone()
        
        if member:
            token = jwt.encode({
                'user_id': member['member_id'],
                'role': 'member',
                'email': member['email'],
                'exp': datetime.utcnow() + timedelta(hours=24)
            }, app.config['SECRET_KEY'], algorithm='HS256')
            
            return jsonify({
                "message": "Login successful",
                "token": token,
                "user": {
                    "id": member['member_id'],
                    "role": "member",
                    "name": f"{member['first_name']} {member['last_name']}"
                }
            })

        # 3. Check if user is an INSTRUCTOR
        cursor.execute("SELECT * FROM INSTRUCTOR WHERE email = %s AND password = %s", (username_or_email, password))
        instructor = cursor.fetchone()
        
        if instructor:
            token = jwt.encode({
                'user_id': instructor['instructor_id'],
                'role': 'instructor',
                'email': instructor['email'],
                'exp': datetime.utcnow() + timedelta(hours=24)
            }, app.config['SECRET_KEY'], algorithm='HS256')
            
            return jsonify({
                "message": "Login successful",
                "token": token,
                "user": {
                    "id": instructor['instructor_id'],
                    "role": "instructor",
                    "name": f"{instructor['first_name']} {instructor['last_name']}"
                }
            })

        return jsonify({"error": "Invalid credentials"}), 401

    except Error as e:
        print(f"Login Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

# ==========================================
# DASHBOARD Endpoints
# ==========================================
@app.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Total Members
        cursor.execute("SELECT COUNT(*) as count FROM MEMBER")
        total_members = cursor.fetchone()['count']
        
        # Instructors
        cursor.execute("SELECT COUNT(*) as count FROM INSTRUCTOR")
        instructors = cursor.fetchone()['count']
        
        # Today's Attendance
        cursor.execute("SELECT COUNT(*) as count FROM ATTENDANCE WHERE visit_date = CURDATE()")
        today_attendance = cursor.fetchone()['count']
        
        # Monthly Revenue (Current Month till date)
        cursor.execute("SELECT COALESCE(SUM(amount), 0) as total FROM PAYMENT WHERE MONTH(payment_date) = MONTH(CURDATE()) AND YEAR(payment_date) = YEAR(CURDATE()) AND payment_date <= CURDATE()")
        monthly_revenue = cursor.fetchone()['total']
        
        # Equipment Count
        cursor.execute("SELECT SUM(quantity) as count FROM EQUIPMENT")
        equipment_count = cursor.fetchone()['count'] or 0

        # Expiring Members (Next 7 Days)
        cursor.execute("""
            SELECT m.member_id as id, CONCAT(m.first_name, ' ', m.last_name) as name, 
                   p.plan_name as plan, pay.valid_until as validUntil
            FROM PAYMENT pay
            JOIN MEMBER m ON pay.member_id = m.member_id
            JOIN PLAN p ON pay.plan_id = p.plan_id
            WHERE pay.valid_until BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
               OR pay.valid_until < CURDATE()
            ORDER BY pay.valid_until ASC
        """)
        expiring_members = cursor.fetchall()

        # Format validUntil dates
        for m in expiring_members:
            if m['validUntil']:
                m['validUntil'] = m['validUntil'].strftime('%Y-%m-%d')

        stats = {
            "totalMembers": total_members,
            "activeInstructors": instructors,
            "todayAttendance": today_attendance,
            "monthlyRevenue": float(monthly_revenue),
            "equipmentCount": equipment_count,
            "expiringMembers": expiring_members
        }
        
        return jsonify(stats)
    except Error as e:
        print(f"Stats Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/dashboard/charts', methods=['GET'])
def get_dashboard_charts():
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Weekly Attendance
        cursor.execute("""
            SELECT visit_date as date, COUNT(*) as visits 
            FROM ATTENDANCE 
            WHERE visit_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY visit_date 
            ORDER BY visit_date ASC
        """)
        attendance = cursor.fetchall()
        
        # Formating the dates and handling missing days is complex in plain SQL,
        # so we'll just format dates here
        att_labels = []
        att_data = []
        for row in attendance:
            att_labels.append(row['date'].strftime('%a')) # 'Mon', 'Tue'
            att_data.append(row['visits'])
            
        # Monthly Revenue (Last 6 Months)
        cursor.execute("""
            SELECT MONTHNAME(payment_date) as month, SUM(amount) as revenue
            FROM PAYMENT
            WHERE payment_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            GROUP BY MONTH(payment_date), MONTHNAME(payment_date)
            ORDER BY MONTH(payment_date) ASC
        """)
        revenue = cursor.fetchall()
        
        rev_labels = []
        rev_data = []
        for row in revenue:
            rev_labels.append(row['month'][:3]) # 'Jan', 'Feb'
            rev_data.append(float(row['revenue']))
            
        charts = {
            "attendance": { "labels": att_labels, "data": att_data },
            "revenue": { "labels": rev_labels, "data": rev_data }
        }
        
        return jsonify(charts)
    except Error as e:
        print(f"Charts Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

# ==========================================
# MEMBER-SPECIFIC Endpoints
# ==========================================
@app.route('/api/member/<int:member_id>/stats', methods=['GET'])
def get_member_stats(member_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database error"}), 500
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Member info
        cursor.execute("SELECT member_id, first_name, last_name, phone, email, join_date FROM MEMBER WHERE member_id = %s", (member_id,))
        member = cursor.fetchone()
        if not member:
            return jsonify({"error": "Member not found"}), 404
        if member.get('join_date'):
            member['join_date'] = member['join_date'].strftime('%Y-%m-%d')
        
        # Active plan
        cursor.execute("""
            SELECT p.plan_name, mp.start_date, mp.end_date,
                   CONCAT(i.first_name, ' ', i.last_name) as instructor_name
            FROM MEMBER_PLAN mp
            JOIN PLAN p ON mp.plan_id = p.plan_id
            JOIN INSTRUCTOR i ON mp.instructor_id = i.instructor_id
            WHERE mp.member_id = %s
            ORDER BY mp.end_date DESC LIMIT 1
        """, (member_id,))
        plan = cursor.fetchone()
        if plan:
            plan['start_date'] = plan['start_date'].strftime('%Y-%m-%d') if plan.get('start_date') else None
            plan['end_date'] = plan['end_date'].strftime('%Y-%m-%d') if plan.get('end_date') else None
        
        # Total visits
        cursor.execute("SELECT COUNT(*) as total FROM ATTENDANCE WHERE member_id = %s", (member_id,))
        total_visits = cursor.fetchone()['total']
        
        # Total paid
        cursor.execute("SELECT COALESCE(SUM(amount), 0) as total FROM PAYMENT WHERE member_id = %s", (member_id,))
        total_paid = float(cursor.fetchone()['total'])
        
        # Fetch membership validity from latest payment
        cursor.execute("SELECT MAX(valid_until) as valid_until FROM PAYMENT WHERE member_id = %s", (member_id,))
        validity_row = cursor.fetchone()
        valid_until = None
        if validity_row and validity_row.get("valid_until"):
            valid_until = validity_row["valid_until"].strftime("%Y-%m-%d")

        return jsonify({
            "member": member,
            "activePlan": plan,
            "totalVisits": total_visits,
            "totalPaid": total_paid,
            "validUntil": valid_until
        })
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/member/<int:member_id>/charts', methods=['GET'])
def get_member_charts(member_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database error"}), 500
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Monthly attendance for this member
        cursor.execute("""
            SELECT CONCAT(LEFT(MONTHNAME(visit_date), 3), ' ', YEAR(visit_date)) as month, YEAR(visit_date) as y, MONTH(visit_date) as m, COUNT(*) as visits 
            FROM ATTENDANCE WHERE member_id = %s
            GROUP BY month, y, m ORDER BY y ASC, m ASC
        """, (member_id,))
        attendance = cursor.fetchall()
        att_labels = [row['month'] for row in attendance]
        att_data = [row['visits'] for row in attendance]
        
        # Payment details
        cursor.execute("""
            SELECT p.plan_name, pay.amount, pay.payment_date, pay.valid_from, pay.valid_until
            FROM PAYMENT pay JOIN PLAN p ON pay.plan_id = p.plan_id
            WHERE pay.member_id = %s ORDER BY pay.payment_date DESC
        """, (member_id,))
        payments = cursor.fetchall()
        for pay in payments:
            pay['payment_date'] = pay['payment_date'].strftime('%Y-%m-%d') if pay.get('payment_date') else None
            pay['valid_from'] = pay['valid_from'].strftime('%Y-%m-%d') if pay.get('valid_from') else None
            pay['valid_until'] = pay['valid_until'].strftime('%Y-%m-%d') if pay.get('valid_until') else None
        
        return jsonify({
            "attendance": {"labels": att_labels, "data": att_data},
            "payments": payments
        })
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/member/<int:member_id>/messages', methods=['GET'])
def get_member_messages(member_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database error"}), 500
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT m.message_id, m.content, m.sent_at,
                   CONCAT(i.first_name, ' ', i.last_name) as from_name,
                   i.specialization as from_role
            FROM MESSAGE m
            JOIN INSTRUCTOR i ON m.from_instructor_id = i.instructor_id
            WHERE m.to_member_id = %s
            ORDER BY m.sent_at DESC
        """, (member_id,))
        messages = cursor.fetchall()
        for msg in messages:
            if msg.get('sent_at'):
                msg['sent_at'] = msg['sent_at'].strftime('%Y-%m-%d %H:%M')
        return jsonify(messages)
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

# ==========================================
# INSTRUCTOR-SPECIFIC Endpoints
# ==========================================
@app.route('/api/instructor/<int:instructor_id>/students', methods=['GET'])
def get_instructor_students(instructor_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database error"}), 500
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT DISTINCT m.member_id, m.first_name, m.last_name, m.email, m.phone,
                   p.plan_name, mp.start_date, mp.end_date
            FROM MEMBER_PLAN mp
            JOIN MEMBER m ON mp.member_id = m.member_id
            JOIN PLAN p ON mp.plan_id = p.plan_id
            WHERE mp.instructor_id = %s
            ORDER BY m.first_name
        """, (instructor_id,))
        students = cursor.fetchall()
        for s in students:
            for k, v in s.items():
                if hasattr(v, 'strftime'):
                    s[k] = v.strftime('%Y-%m-%d')
        return jsonify(students)
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/instructor/<int:instructor_id>/student/<int:member_id>/attendance', methods=['GET'])
def get_student_attendance(instructor_id, member_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database error"}), 500
    try:
        cursor = conn.cursor(dictionary=True)
        # Fetch attendance records for the past 14 days
        cursor.execute("""
            SELECT visit_date as date, COUNT(*) as visits
            FROM ATTENDANCE WHERE member_id = %s
            AND visit_date >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
            GROUP BY visit_date ORDER BY visit_date ASC
        """, (member_id,))
        attendance = cursor.fetchall()
        # Build a full 14-day series; 0 for missed, 1 for attended
        from datetime import timedelta as td
        today_date = datetime.today().date()
        labels = []
        data = []
        for i in range(13, -1, -1):
            day = today_date - td(days=i)
            labels.append(day.strftime('%a %d'))
            match = next((row for row in attendance if row['date'] == day), None)
            data.append(1 if match else 0)

        cursor.execute("SELECT COUNT(*) as total FROM ATTENDANCE WHERE member_id = %s", (member_id,))
        total = cursor.fetchone()['total']

        return jsonify({"labels": labels, "data": data, "totalVisits": total})
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/instructor/<int:instructor_id>/message', methods=['POST'])
def send_message(instructor_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database error"}), 500
    try:
        data = request.json
        member_id = data.get('member_id')
        content = data.get('content')
        if not member_id or not content:
            return jsonify({"error": "Missing member_id or content"}), 400
        
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO MESSAGE (from_instructor_id, to_member_id, content) VALUES (%s, %s, %s)",
            (instructor_id, member_id, content)
        )
        conn.commit()
        return jsonify({"message": "Message sent successfully", "id": cursor.lastrowid})
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

# ==========================================
# CRUD Endpoints
# ==========================================

# Generic CRUD helper
def fetch_all(table_name):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(f"SELECT * FROM {table_name}")
        records = cursor.fetchall()
        # Convert date objects to strings
        for row in records:
            for k, v in row.items():
                if hasattr(v, 'strftime'):
                    row[k] = v.strftime('%Y-%m-%d')
        return jsonify(records)
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/members', methods=['GET'])
def get_all_members():
    return fetch_all("MEMBER")

@app.route('/api/members', methods=['POST'])
def create_member():
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database error"}), 500
    try:
        data = request.json
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO MEMBER (first_name, last_name, phone, email, password, address, date_of_birth, join_date) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
            (data.get('first_name'), data.get('last_name'), data.get('phone'), data.get('email'),
             data.get('password', 'password123'), data.get('address'), data.get('date_of_birth'), data.get('join_date'))
        )
        conn.commit()
        return jsonify({"message": "Member created", "id": cursor.lastrowid}), 201
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): cursor.close(); conn.close()

@app.route('/api/members/<int:member_id>', methods=['PUT'])
def update_member(member_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database error"}), 500
    try:
        data = request.json
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE MEMBER SET first_name=%s, last_name=%s, phone=%s, email=%s, address=%s, date_of_birth=%s WHERE member_id=%s",
            (data.get('first_name'), data.get('last_name'), data.get('phone'), data.get('email'),
             data.get('address'), data.get('date_of_birth'), member_id)
        )
        conn.commit()
        return jsonify({"message": "Member updated"})
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): cursor.close(); conn.close()

@app.route('/api/members/<int:member_id>', methods=['DELETE'])
def delete_member(member_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database error"}), 500
    try:
        cursor = conn.cursor()
        # Delete related records first
        cursor.execute("DELETE FROM MESSAGE WHERE to_member_id = %s", (member_id,))
        cursor.execute("DELETE FROM ATTENDANCE WHERE member_id = %s", (member_id,))
        cursor.execute("DELETE FROM PAYMENT WHERE member_id = %s", (member_id,))
        cursor.execute("DELETE FROM MEMBER_PLAN WHERE member_id = %s", (member_id,))
        cursor.execute("DELETE FROM MEMBER WHERE member_id = %s", (member_id,))
        conn.commit()
        return jsonify({"message": "Member deleted"})
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): cursor.close(); conn.close()

@app.route('/api/instructors', methods=['GET'])
def get_all_instructors():
    return fetch_all("INSTRUCTOR")

@app.route('/api/instructors', methods=['POST'])
def create_instructor():
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        data = request.json
        c = conn.cursor()
        c.execute(
            "INSERT INTO INSTRUCTOR (first_name, last_name, phone, email, password, specialization, experience_years) VALUES (%s,%s,%s,%s,%s,%s,%s)",
            (data.get('first_name'), data.get('last_name'), data.get('phone'), data.get('email'), data.get('password', 'coach123'), data.get('specialization'), data.get('experience_years'))
        )
        conn.commit()
        return jsonify({"message": "Created", "id": c.lastrowid}), 201
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/instructors/<int:id>', methods=['PUT'])
def update_instructor(id):
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        data = request.json
        c = conn.cursor()
        c.execute(
            "UPDATE INSTRUCTOR SET first_name=%s, last_name=%s, phone=%s, email=%s, specialization=%s, experience_years=%s WHERE instructor_id=%s",
            (data.get('first_name'), data.get('last_name'), data.get('phone'), data.get('email'), data.get('specialization'), data.get('experience_years'), id)
        )
        conn.commit()
        return jsonify({"message": "Updated"})
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/instructors/<int:id>', methods=['DELETE'])
def delete_instructor(id):
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        c = conn.cursor()
        c.execute("DELETE FROM MESSAGE WHERE from_instructor_id = %s", (id,))
        c.execute("DELETE FROM ATTENDANCE WHERE instructor_id = %s", (id,))
        c.execute("DELETE FROM MEMBER_PLAN WHERE instructor_id = %s", (id,))
        c.execute("DELETE FROM PLAN WHERE created_by_instructor_id = %s", (id,))
        c.execute("DELETE FROM INSTRUCTOR WHERE instructor_id = %s", (id,))
        conn.commit()
        return jsonify({"message": "Deleted"})
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/plans', methods=['GET'])
def get_all_plans():
    return fetch_all("PLAN")

@app.route('/api/plans', methods=['POST'])
def create_plan():
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        data = request.json
        c = conn.cursor()
        c.execute(
            "INSERT INTO PLAN (plan_name, goal, duration, created_by_instructor_id) VALUES (%s,%s,%s,%s)",
            (data.get('plan_name'), data.get('goal'), data.get('duration'), data.get('created_by_instructor_id'))
        )
        conn.commit()
        return jsonify({"message": "Created", "id": c.lastrowid}), 201
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/plans/<int:id>', methods=['PUT'])
def update_plan(id):
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        data = request.json
        c = conn.cursor()
        c.execute(
            "UPDATE PLAN SET plan_name=%s, goal=%s, duration=%s, created_by_instructor_id=%s WHERE plan_id=%s",
            (data.get('plan_name'), data.get('goal'), data.get('duration'), data.get('created_by_instructor_id'), id)
        )
        conn.commit()
        return jsonify({"message": "Updated"})
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/plans/<int:id>', methods=['DELETE'])
def delete_plan(id):
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        c = conn.cursor()
        c.execute("DELETE FROM PAYMENT WHERE plan_id = %s", (id,))
        c.execute("DELETE FROM MEMBER_PLAN WHERE plan_id = %s", (id,))
        c.execute("DELETE FROM PLAN WHERE plan_id = %s", (id,))
        conn.commit()
        return jsonify({"message": "Deleted"})
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/member-plans', methods=['GET'])
def get_all_member_plans():
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        c = conn.cursor(dictionary=True)
        query = """
            SELECT mp.*, 
                   CONCAT(m.first_name, ' ', m.last_name) as member_name, 
                   p.plan_name, 
                   CONCAT(i.first_name, ' ', i.last_name) as instructor_name
            FROM MEMBER_PLAN mp
            JOIN MEMBER m ON mp.member_id = m.member_id
            JOIN PLAN p ON mp.plan_id = p.plan_id
            LEFT JOIN INSTRUCTOR i ON mp.instructor_id = i.instructor_id
        """
        c.execute(query)
        result = c.fetchall()
        for row in result:
            if row.get('start_date'):
                row['start_date'] = row['start_date'].strftime('%Y-%m-%d')
            if row.get('end_date'):
                row['end_date'] = row['end_date'].strftime('%Y-%m-%d')
        return jsonify(result)
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/member-plans', methods=['POST'])
def create_member_plan():
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        data = request.json
        c = conn.cursor()
        c.execute(
            "INSERT INTO MEMBER_PLAN (member_id, plan_id, instructor_id, start_date, end_date) VALUES (%s,%s,%s,%s,%s)",
            (data.get('member_id'), data.get('plan_id'), data.get('instructor_id'), data.get('start_date'), data.get('end_date'))
        )
        conn.commit()
        return jsonify({"message": "Created", "id": c.lastrowid}), 201
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/member-plans/<int:id>', methods=['PUT'])
def update_member_plan(id):
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        data = request.json
        c = conn.cursor()
        c.execute(
            "UPDATE MEMBER_PLAN SET member_id=%s, plan_id=%s, instructor_id=%s, start_date=%s, end_date=%s WHERE member_plan_id=%s",
            (data.get('member_id'), data.get('plan_id'), data.get('instructor_id'), data.get('start_date'), data.get('end_date'), id)
        )
        conn.commit()
        return jsonify({"message": "Updated"})
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/member-plans/<int:id>', methods=['DELETE'])
def delete_member_plan(id):
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        c = conn.cursor()
        c.execute("DELETE FROM MEMBER_PLAN WHERE member_plan_id = %s", (id,))
        conn.commit()
        return jsonify({"message": "Deleted"})
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/payments', methods=['GET'])
def get_all_payments():
    return fetch_all("PAYMENT")

@app.route('/api/payments', methods=['POST'])
def create_payment():
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        data = request.json
        c = conn.cursor()
        c.execute(
            "INSERT INTO PAYMENT (member_id, plan_id, amount, payment_date, valid_from, valid_until, payment_mode) VALUES (%s,%s,%s,%s,%s,%s,%s)",
            (data.get('member_id'), data.get('plan_id'), data.get('amount'), data.get('payment_date'), data.get('valid_from'), data.get('valid_until'), data.get('payment_mode'))
        )
        conn.commit()
        return jsonify({"message": "Created", "id": c.lastrowid}), 201
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/payments/<int:id>', methods=['PUT'])
def update_payment(id):
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        data = request.json
        c = conn.cursor()
        c.execute(
            "UPDATE PAYMENT SET member_id=%s, plan_id=%s, amount=%s, payment_date=%s, valid_from=%s, valid_until=%s, payment_mode=%s WHERE payment_id=%s",
            (data.get('member_id'), data.get('plan_id'), data.get('amount'), data.get('payment_date'), data.get('valid_from'), data.get('valid_until'), data.get('payment_mode'), id)
        )
        conn.commit()
        return jsonify({"message": "Updated"})
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/payments/<int:id>', methods=['DELETE'])
def delete_payment(id):
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        c = conn.cursor()
        c.execute("DELETE FROM PAYMENT WHERE payment_id = %s", (id,))
        conn.commit()
        return jsonify({"message": "Deleted"})
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/equipment', methods=['GET'])
def get_all_equipment():
    return fetch_all("EQUIPMENT")

@app.route('/api/equipment', methods=['POST'])
def create_equipment():
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database error"}), 500
    try:
        data = request.json
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO EQUIPMENT (name, category, quantity, condition_status, next_maintenance_date) VALUES (%s,%s,%s,%s,%s)",
            (data.get('name'), data.get('category'), data.get('quantity'), data.get('condition_status'), data.get('next_maintenance_date'))
        )
        conn.commit()
        return jsonify({"message": "Equipment added", "id": cursor.lastrowid}), 201
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): cursor.close(); conn.close()

@app.route('/api/equipment/<int:equipment_id>', methods=['PUT'])
def update_equipment(equipment_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database error"}), 500
    try:
        data = request.json
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE EQUIPMENT SET name=%s, category=%s, quantity=%s, condition_status=%s, next_maintenance_date=%s WHERE equipment_id=%s",
            (data.get('name'), data.get('category'), data.get('quantity'), data.get('condition_status'), data.get('next_maintenance_date'), equipment_id)
        )
        conn.commit()
        return jsonify({"message": "Equipment updated"})
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): cursor.close(); conn.close()

@app.route('/api/equipment/<int:equipment_id>', methods=['DELETE'])
def delete_equipment(equipment_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database error"}), 500
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM EQUIPMENT WHERE equipment_id = %s", (equipment_id,))
        conn.commit()
        return jsonify({"message": "Equipment deleted"})
    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): cursor.close(); conn.close()

@app.route('/api/attendance', methods=['GET'])
def get_all_attendance():
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        c = conn.cursor(dictionary=True)
        query = """
            SELECT a.*, 
                   CONCAT(m.first_name, ' ', m.last_name) as member_name,
                   CONCAT(i.first_name, ' ', i.last_name) as instructor_name
            FROM ATTENDANCE a
            JOIN MEMBER m ON a.member_id = m.member_id
            LEFT JOIN INSTRUCTOR i ON a.instructor_id = i.instructor_id
            ORDER BY a.visit_date DESC, a.check_in_time DESC
        """
        c.execute(query)
        result = c.fetchall()
        for row in result:
            if row.get('visit_date'): row['visit_date'] = row['visit_date'].strftime('%Y-%m-%d')
            if row.get('check_in_time'): row['check_in_time'] = row['check_in_time'].strftime('%Y-%m-%dT%H:%M')
            if row.get('check_out_time'): row['check_out_time'] = row['check_out_time'].strftime('%Y-%m-%dT%H:%M')
        return jsonify(result)
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/attendance', methods=['POST'])
def create_attendance():
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        data = request.json
        c = conn.cursor()
        c.execute(
            "INSERT INTO ATTENDANCE (member_id, instructor_id, check_in_time, check_out_time, visit_date) VALUES (%s,%s,%s,%s,%s)",
            (data.get('member_id'), data.get('instructor_id'), data.get('check_in_time'), data.get('check_out_time'), data.get('visit_date'))
        )
        conn.commit()
        return jsonify({"message": "Created", "id": c.lastrowid}), 201
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/attendance/<int:id>', methods=['PUT'])
def update_attendance(id):
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        data = request.json
        c = conn.cursor()
        c.execute(
            "UPDATE ATTENDANCE SET member_id=%s, instructor_id=%s, check_in_time=%s, check_out_time=%s, visit_date=%s WHERE attendance_id=%s",
            (data.get('member_id'), data.get('instructor_id'), data.get('check_in_time'), data.get('check_out_time'), data.get('visit_date'), id)
        )
        conn.commit()
        return jsonify({"message": "Updated"})
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/attendance/<int:id>', methods=['DELETE'])
def delete_attendance(id):
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        c = conn.cursor()
        c.execute("DELETE FROM ATTENDANCE WHERE attendance_id = %s", (id,))
        conn.commit()
        return jsonify({"message": "Deleted"})
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()


if __name__ == '__main__':
    app.run(debug=True, port=5000)
