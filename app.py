from flask import Flask, jsonify, request, send_from_directory
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

app = Flask(__name__, static_folder='frontend/dist', static_url_path='')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'neon-iron-secret-key-123')
# Allow CORS for React frontend
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Database connection function
def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host=os.getenv("DB_HOST", "localhost"),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", ""),
            database=os.getenv("DB_NAME", "gym_management"),
            port=int(os.getenv("DB_PORT", "3306"))
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
            if member.get('status') and member['status'] != 'active':
                return jsonify({"error": f"Account is {member['status']}. Please wait for admin approval."}), 403
                
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
            if instructor.get('status') and instructor['status'] != 'active':
                return jsonify({"error": f"Account is {instructor['status']}. Please wait for admin approval."}), 403
                
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
# REGISTRATION & ONBOARDING Endpoints
# ==========================================
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    role = data.get('role')
    email = data.get('email')
    password = data.get('password')
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    phone = data.get('phone', '')

    if not all([role, email, password, first_name, last_name]):
        return jsonify({"error": "Missing required fields"}), 400

    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        c = conn.cursor()
        if role == 'member':
            c.execute("INSERT INTO MEMBER (first_name, last_name, email, phone, password, status, join_date) VALUES (%s,%s,%s,%s,%s,'pending',CURDATE())",
                      (first_name, last_name, email, phone, password))
        elif role == 'instructor':
            c.execute("INSERT INTO INSTRUCTOR (first_name, last_name, email, phone, password, status) VALUES (%s,%s,%s,%s,%s,'pending')",
                      (first_name, last_name, email, phone, password))
        else:
            return jsonify({"error": "Invalid role"}), 400
        conn.commit()
        return jsonify({"message": "Registration successful, pending admin approval"}), 201
    except Error as e:
        if 'Duplicate' in str(e):
            return jsonify({"error": "Email already exists"}), 409
        return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/auth/change-password', methods=['PUT'])
def change_password():
    data = request.json
    user_id = data.get('user_id')
    role = data.get('role')
    old_password = data.get('old_password')
    new_password = data.get('new_password')

    if not all([user_id, role, old_password, new_password]):
        return jsonify({"error": "Missing required fields"}), 400

    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        c = conn.cursor(dictionary=True)
        table = "ADMIN" if role == 'admin' else "MEMBER" if role == 'member' else "INSTRUCTOR"
        id_col = f"{table.lower()}_id"
        
        c.execute(f"SELECT password FROM {table} WHERE {id_col} = %s", (user_id,))
        user = c.fetchone()
        
        if not user or user['password'] != old_password:
            return jsonify({"error": "Incorrect old password"}), 401

        c.execute(f"UPDATE {table} SET password = %s WHERE {id_col} = %s", (new_password, user_id))
        conn.commit()
        return jsonify({"message": "Password updated successfully"})
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/admin/pending-users', methods=['GET'])
def get_pending_users():
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        c = conn.cursor(dictionary=True)
        c.execute("SELECT member_id as id, first_name, last_name, email, phone, 'member' as role, join_date as date_added FROM MEMBER WHERE status = 'pending'")
        members = c.fetchall()
        for m in members:
            if m['date_added']: m['date_added'] = m['date_added'].strftime('%Y-%m-%d')
            
        c.execute("SELECT instructor_id as id, first_name, last_name, email, phone, 'instructor' as role, NULL as date_added FROM INSTRUCTOR WHERE status = 'pending'")
        instructors = c.fetchall()
        
        return jsonify(members + instructors)
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/admin/approve-user/<role>/<int:user_id>', methods=['PUT'])
def approve_user(role, user_id):
    data = request.json
    status = data.get('status', 'active') 
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        c = conn.cursor()
        table = "MEMBER" if role == 'member' else "INSTRUCTOR"
        id_col = f"{table.lower()}_id"
        c.execute(f"UPDATE {table} SET status = %s WHERE {id_col} = %s", (status, user_id))
        conn.commit()
        return jsonify({"message": f"User marked as {status}"})
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

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

        # Active Diet Plans
        cursor.execute("SELECT COUNT(*) as count FROM DIET_PLAN")
        diet_plans_count = cursor.fetchone()['count']

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
            "activeDietPlans": diet_plans_count,
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
        
        # This month visits
        cursor.execute("SELECT COUNT(*) as total FROM ATTENDANCE WHERE member_id = %s AND MONTH(visit_date) = MONTH(CURDATE()) AND YEAR(visit_date) = YEAR(CURDATE())", (member_id,))
        this_month_visits = cursor.fetchone()['total']

        # Previous month visits
        cursor.execute("SELECT COUNT(*) as total FROM ATTENDANCE WHERE member_id = %s AND MONTH(visit_date) = MONTH(CURDATE() - INTERVAL 1 MONTH) AND YEAR(visit_date) = YEAR(CURDATE() - INTERVAL 1 MONTH)", (member_id,))
        prev_month_visits = cursor.fetchone()['total']

        visits_delta = this_month_visits - prev_month_visits

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
            "validUntil": valid_until,
            "thisMonthVisits": this_month_visits,
            "prevMonthVisits": prev_month_visits,
            "visitsDelta": visits_delta
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
        from datetime import timedelta as td
        from datetime import datetime
        today_date = datetime.today().date()

        # --- 4-week attendance calendar ---
        # We build a 4-week (28-day) grid aligned to Monday-Sunday rows
        # Go back 27 days from today to get 28 days total
        start_28 = today_date - td(days=27)
        # Align to the Monday on or before start_28
        start_monday = start_28 - td(days=start_28.weekday())  # weekday(): Mon=0
        # End on the Sunday on or after today
        end_sunday = today_date + td(days=(6 - today_date.weekday()) % 7)
        total_days = (end_sunday - start_monday).days + 1

        # Fetch attendance in range
        cursor.execute("""
            SELECT visit_date as date FROM ATTENDANCE
            WHERE member_id = %s AND visit_date >= %s AND visit_date <= %s
            GROUP BY visit_date
        """, (member_id, start_monday.strftime('%Y-%m-%d'), end_sunday.strftime('%Y-%m-%d')))
        attended_rows = cursor.fetchall()
        attended_set = set()
        for r in attended_rows:
            if r['date']:
                attended_set.add(r['date'] if isinstance(r['date'], str) else r['date'].strftime('%Y-%m-%d') if hasattr(r['date'], 'strftime') else str(r['date']))

        weeks = []
        day_cursor = start_monday
        while day_cursor <= end_sunday:
            week = []
            for _ in range(7):
                ds = day_cursor.strftime('%Y-%m-%d')
                if day_cursor > today_date:
                    status = 'out'
                elif day_cursor < start_28:
                    status = 'out'
                elif day_cursor.weekday() == 6:  # Sunday = rest day
                    status = 'rest'
                elif ds in attended_set:
                    status = 'present'
                else:
                    status = 'absent'
                week.append({"date": ds, "status": status})
                day_cursor += td(days=1)
            weeks.append(week)

        attendance_calendar = {"weeks": weeks}

        # --- Attendance streak (current + best) ---
        cursor.execute("""
            SELECT DISTINCT visit_date as date FROM ATTENDANCE
            WHERE member_id = %s ORDER BY visit_date DESC
        """, (member_id,))
        all_dates_rows = cursor.fetchall()
        visited_dates = set()
        for r in all_dates_rows:
            d = r['date']
            if hasattr(d, 'strftime'):
                visited_dates.add(d)
            else:
                visited_dates.add(datetime.strptime(str(d), '%Y-%m-%d').date())

        # Current streak: count consecutive days ending today (skip Sundays)
        current_streak = 0
        d = today_date
        while True:
            if d.weekday() == 6:  # skip Sunday
                d -= td(days=1)
                continue
            if d in visited_dates:
                current_streak += 1
                d -= td(days=1)
            else:
                break

        # Best streak: walk all sorted dates
        sorted_dates = sorted(visited_dates)
        best_streak = 0
        streak = 0
        prev = None
        for d in sorted_dates:
            if prev is None:
                streak = 1
            else:
                gap = (d - prev).days
                # Allow gap of 1 day (consecutive) or 2 days (skipping Sunday)
                if gap == 1 or (gap == 2 and (prev + td(days=1)).weekday() == 6):
                    streak += 1
                else:
                    streak = 1
            best_streak = max(best_streak, streak)
            prev = d

        attendance_streak = {"current": current_streak, "best": best_streak}

        # --- Month summary (present/absent/rest this month) ---
        first_of_month = today_date.replace(day=1)
        present_this_month = 0
        absent_this_month = 0
        rest_this_month = 0
        d = first_of_month
        while d <= today_date:
            ds = d.strftime('%Y-%m-%d')
            if d.weekday() == 6:
                rest_this_month += 1
            elif ds in {x.strftime('%Y-%m-%d') if hasattr(x, 'strftime') else str(x) for x in visited_dates}:
                present_this_month += 1
            else:
                absent_this_month += 1
            d += td(days=1)

        attendance_month_summary = {
            "present": present_this_month,
            "absent": absent_this_month,
            "rest": rest_this_month
        }

        # --- Stacked 6-month chart ---
        import calendar
        labels_6mo = []
        present_6mo = []
        absent_6mo = []
        rest_6mo = []
        for i in range(5, -1, -1):
            # Go back i months
            month = today_date.month - i
            year = today_date.year
            while month <= 0:
                month += 12
                year -= 1
            month_name = calendar.month_abbr[month]
            labels_6mo.append(f"{month_name}")
            days_in_month = calendar.monthrange(year, month)[1]
            # For current month, only count up to today
            if year == today_date.year and month == today_date.month:
                last_day = today_date.day
            else:
                last_day = days_in_month

            p_count = 0
            a_count = 0
            r_count = 0
            for day_num in range(1, last_day + 1):
                try:
                    check_date = datetime(year, month, day_num).date()
                except ValueError:
                    continue
                if check_date.weekday() == 6:
                    r_count += 1
                elif check_date in visited_dates:
                    p_count += 1
                else:
                    a_count += 1
            present_6mo.append(p_count)
            absent_6mo.append(a_count)
            rest_6mo.append(r_count)

        attendance_stacked_6mo = {
            "labels": labels_6mo,
            "present": present_6mo,
            "absent": absent_6mo,
            "rest": rest_6mo
        }

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
            "attendance_calendar": attendance_calendar,
            "attendance_streak": attendance_streak,
            "attendance_month_summary": attendance_month_summary,
            "attendance_stacked_6mo": attendance_stacked_6mo,
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
        cursor.execute("DELETE FROM DIET_PLAN WHERE member_id = %s", (member_id,))
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
        c.execute("DELETE FROM DIET_PLAN WHERE instructor_id = %s", (id,))
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
            "INSERT INTO PAYMENT (member_id, plan_id, amount, payment_date, valid_from, valid_until, payment_mode, invoice_number) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
            (data.get('member_id'), data.get('plan_id'), data.get('amount'), data.get('payment_date'), data.get('valid_from'), data.get('valid_until'), data.get('payment_mode'), data.get('invoice_number'))
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
            "UPDATE PAYMENT SET member_id=%s, plan_id=%s, amount=%s, payment_date=%s, valid_from=%s, valid_until=%s, payment_mode=%s, invoice_number=%s WHERE payment_id=%s",
            (data.get('member_id'), data.get('plan_id'), data.get('amount'), data.get('payment_date'), data.get('valid_from'), data.get('valid_until'), data.get('payment_mode'), data.get('invoice_number'), id)
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

# --- BILLING CYCLES ---

@app.route('/api/billing-cycles', methods=['GET'])
def get_all_billing_cycles():
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        c = conn.cursor(dictionary=True)
        query = """
            SELECT b.*, 
                   CONCAT(m.first_name, ' ', m.last_name) as member_name,
                   p.plan_name
            FROM BILLING_CYCLE b
            JOIN MEMBER m ON b.member_id = m.member_id
            JOIN PLAN p ON b.plan_id = p.plan_id
            ORDER BY b.due_date DESC
        """
        c.execute(query)
        result = c.fetchall()
        for row in result:
            if row.get('due_date'): row['due_date'] = row['due_date'].strftime('%Y-%m-%d')
            if row.get('paid_date'): row['paid_date'] = row['paid_date'].strftime('%Y-%m-%d')
        return jsonify(result)
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/billing-cycles/<int:member_id>', methods=['GET'])
def get_member_billing_cycles(member_id):
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        c = conn.cursor(dictionary=True)
        query = """
            SELECT b.*, p.plan_name
            FROM BILLING_CYCLE b
            JOIN PLAN p ON b.plan_id = p.plan_id
            WHERE b.member_id = %s
            ORDER BY b.due_date DESC
        """
        c.execute(query, (member_id,))
        result = c.fetchall()
        for row in result:
            if row.get('due_date'): row['due_date'] = row['due_date'].strftime('%Y-%m-%d')
            if row.get('paid_date'): row['paid_date'] = row['paid_date'].strftime('%Y-%m-%d')
        return jsonify(result)
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/billing-cycles', methods=['POST'])
def create_billing_cycle():
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        data = request.json
        c = conn.cursor()
        c.execute(
            "INSERT INTO BILLING_CYCLE (member_id, plan_id, due_date, amount, status) VALUES (%s,%s,%s,%s,%s)",
            (data.get('member_id'), data.get('plan_id'), data.get('due_date'), data.get('amount'), data.get('status', 'pending'))
        )
        conn.commit()
        return jsonify({"message": "Created", "id": c.lastrowid}), 201
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/billing-cycles/<int:id>/pay', methods=['PUT'])
def pay_billing_cycle(id):
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        data = request.json
        payment_mode = data.get('payment_mode', 'Credit Card')
        c = conn.cursor(dictionary=True)
        
        # Get cycle details first
        c.execute("SELECT * FROM BILLING_CYCLE WHERE cycle_id = %s", (id,))
        cycle = c.fetchone()
        if not cycle:
            return jsonify({"error": "Not found"}), 404
        
        if cycle['status'] == 'paid':
            return jsonify({"error": "Already paid"}), 400

        # Mark cycle as paid
        import datetime
        today = datetime.date.today().strftime('%Y-%m-%d')
        c.execute(
            "UPDATE BILLING_CYCLE SET status = 'paid', paid_date = %s WHERE cycle_id = %s",
            (today, id)
        )
        
        # Generate Invoice Number
        inv_year = datetime.date.today().year
        c.execute("SELECT COUNT(*) as count FROM PAYMENT WHERE member_id = %s AND YEAR(payment_date) = %s", (cycle['member_id'], inv_year))
        seq = c.fetchone()['count'] + 1
        invoice_number = f"INV-{inv_year}-{cycle['member_id']}-{seq:03d}"
        
        # Calculate validity based on plan duration
        c.execute("SELECT duration FROM PLAN WHERE plan_id = %s", (cycle['plan_id'],))
        plan = c.fetchone()
        duration_str = plan['duration'] if plan else '1 Month'
        
        num_val = int(duration_str.split(' ')[0])
        unit = duration_str.split(' ')[-1].lower()
        if 'month' in unit:
            from dateutil.relativedelta import relativedelta
            valid_until = datetime.date.today() + relativedelta(months=num_val)
        elif 'day' in unit:
            valid_until = datetime.date.today() + datetime.timedelta(days=num_val)
        elif 'year' in unit:
            from dateutil.relativedelta import relativedelta
            valid_until = datetime.date.today() + relativedelta(years=num_val)
        else:
            from dateutil.relativedelta import relativedelta
            valid_until = datetime.date.today() + relativedelta(months=1)

        # Create Payment record
        c.execute(
            "INSERT INTO PAYMENT (member_id, plan_id, amount, payment_date, valid_from, valid_until, payment_mode, invoice_number) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
            (cycle['member_id'], cycle['plan_id'], cycle['amount'], today, today, valid_until.strftime('%Y-%m-%d'), payment_mode, invoice_number)
        )
        
        conn.commit()
        return jsonify({"message": "Paid", "invoice_number": invoice_number})
    except Error as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/billing-cycles/overdue', methods=['GET'])
def get_overdue_cycles():
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        c = conn.cursor(dictionary=True)
        query = """
            SELECT b.*, 
                   CONCAT(m.first_name, ' ', m.last_name) as member_name,
                   p.plan_name
            FROM BILLING_CYCLE b
            JOIN MEMBER m ON b.member_id = m.member_id
            JOIN PLAN p ON b.plan_id = p.plan_id
            WHERE b.status = 'pending' AND b.due_date < CURDATE()
            ORDER BY b.due_date ASC
        """
        c.execute(query)
        result = c.fetchall()
        for row in result:
            if row.get('due_date'): row['due_date'] = row['due_date'].strftime('%Y-%m-%d')
            if row.get('paid_date'): row['paid_date'] = row['paid_date'].strftime('%Y-%m-%d')
        return jsonify(result)
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

# ==========================================
# EQUIPMENT TICKET Endpoints
# ==========================================
# Repair ticket workflow: members/instructors report broken equipment,
# admin reviews, assigns status (open -> in_progress -> resolved -> closed).
# Delivery: in-app notifications only. No email/SMS.

@app.route('/api/equipment/<int:equipment_id>/tickets', methods=['GET'])
def get_equipment_tickets(equipment_id):
    """Get all tickets for a specific piece of equipment"""
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        c = conn.cursor(dictionary=True)
        c.execute("""
            SELECT t.*, e.name as equipment_name
            FROM EQUIPMENT_TICKET t
            JOIN EQUIPMENT e ON t.equipment_id = e.equipment_id
            WHERE t.equipment_id = %s
            ORDER BY t.created_at DESC
        """, (equipment_id,))
        result = c.fetchall()
        for row in result:
            if row.get('created_at'): row['created_at'] = row['created_at'].strftime('%Y-%m-%d %H:%M')
            if row.get('resolved_at'): row['resolved_at'] = row['resolved_at'].strftime('%Y-%m-%d %H:%M')
        return jsonify(result)
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/equipment/<int:equipment_id>/tickets', methods=['POST'])
def create_equipment_ticket(equipment_id):
    """Any user can report a broken machine"""
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        data = request.json
        description = data.get('description')
        if not description:
            return jsonify({"error": "Description is required"}), 400
        c = conn.cursor()
        c.execute(
            """INSERT INTO EQUIPMENT_TICKET
               (equipment_id, reported_by_id, reported_by_role, description, priority)
               VALUES (%s,%s,%s,%s,%s)""",
            (equipment_id, data.get('reported_by_id'), data.get('reported_by_role'),
             description, data.get('priority', 'medium'))
        )
        ticket_id = c.lastrowid

        # Also notify admin about the new ticket
        c.execute("SELECT name FROM EQUIPMENT WHERE equipment_id = %s", (equipment_id,))
        eq = c.fetchone()
        eq_name = eq[0] if eq else f"Equipment #{equipment_id}"
        c.execute(
            """INSERT INTO NOTIFICATION (recipient_id, recipient_role, type, title, message)
               VALUES (1, 'admin', 'new_ticket', 'New Repair Ticket', %s)""",
            (f'Ticket #{ticket_id} reported for "{eq_name}": {description[:100]}',)
        )

        conn.commit()
        return jsonify({"message": "Ticket created", "id": ticket_id}), 201
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/equipment/tickets', methods=['GET'])
def get_all_equipment_tickets():
    """Admin: list all tickets with equipment names, filterable by status"""
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        c = conn.cursor(dictionary=True)
        status_filter = request.args.get('status')
        query = """
            SELECT t.*, e.name as equipment_name, e.category as equipment_category
            FROM EQUIPMENT_TICKET t
            JOIN EQUIPMENT e ON t.equipment_id = e.equipment_id
        """
        params = []
        if status_filter:
            query += " WHERE t.status = %s"
            params.append(status_filter)
        query += " ORDER BY FIELD(t.priority, 'high','medium','low'), t.created_at DESC"
        c.execute(query, params)
        result = c.fetchall()
        for row in result:
            if row.get('created_at'): row['created_at'] = row['created_at'].strftime('%Y-%m-%d %H:%M')
            if row.get('resolved_at'): row['resolved_at'] = row['resolved_at'].strftime('%Y-%m-%d %H:%M')
        return jsonify(result)
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/equipment/tickets/<int:ticket_id>', methods=['PUT'])
def update_equipment_ticket(ticket_id):
    """Admin: update ticket status with validated transitions and resolution notes"""
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        data = request.json
        new_status = data.get('status')
        resolution_notes = data.get('resolution_notes', '')

        # Validate status transitions
        valid_transitions = {
            'open': ['in_progress', 'resolved', 'closed'],
            'in_progress': ['resolved', 'closed'],
            'resolved': ['closed'],
            'closed': []
        }

        c = conn.cursor(dictionary=True)
        c.execute("SELECT * FROM EQUIPMENT_TICKET WHERE ticket_id = %s", (ticket_id,))
        ticket = c.fetchone()
        if not ticket:
            return jsonify({"error": "Ticket not found"}), 404

        current_status = ticket['status']
        if new_status and new_status not in valid_transitions.get(current_status, []):
            return jsonify({"error": f"Cannot transition from '{current_status}' to '{new_status}'"}), 400

        if new_status in ('resolved', 'closed') and not ticket.get('resolved_at'):
            c.execute(
                "UPDATE EQUIPMENT_TICKET SET status = %s, resolution_notes = %s, resolved_at = NOW() WHERE ticket_id = %s",
                (new_status, resolution_notes, ticket_id)
            )
        else:
            c.execute(
                "UPDATE EQUIPMENT_TICKET SET status = %s, resolution_notes = %s WHERE ticket_id = %s",
                (new_status, resolution_notes, ticket_id)
            )
        conn.commit()
        return jsonify({"message": f"Ticket updated to '{new_status}'"})
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

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

# ==========================================
# DIET PLAN Endpoints
# ==========================================

@app.route('/api/diet-plans', methods=['GET'])
def get_all_diet_plans():
    """Admin: list all diet plans with member/instructor names"""
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        c = conn.cursor(dictionary=True)
        c.execute("""
            SELECT dp.*,
                   CONCAT(m.first_name, ' ', m.last_name) as member_name,
                   CONCAT(i.first_name, ' ', i.last_name) as instructor_name
            FROM DIET_PLAN dp
            JOIN MEMBER m ON dp.member_id = m.member_id
            JOIN INSTRUCTOR i ON dp.instructor_id = i.instructor_id
            ORDER BY dp.updated_at DESC
        """)
        result = c.fetchall()
        for row in result:
            if row.get('created_at'): row['created_at'] = row['created_at'].strftime('%Y-%m-%d %H:%M')
            if row.get('updated_at'): row['updated_at'] = row['updated_at'].strftime('%Y-%m-%d %H:%M')
        return jsonify(result)
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/instructor/<int:instructor_id>/diet-plans', methods=['GET'])
def get_instructor_diet_plans(instructor_id):
    """Coach: get diet plans created by this instructor"""
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        c = conn.cursor(dictionary=True)
        c.execute("""
            SELECT dp.*,
                   CONCAT(m.first_name, ' ', m.last_name) as member_name
            FROM DIET_PLAN dp
            JOIN MEMBER m ON dp.member_id = m.member_id
            WHERE dp.instructor_id = %s
        """, (instructor_id,))
        result = c.fetchall()
        for row in result:
            if row.get('created_at'): row['created_at'] = row['created_at'].strftime('%Y-%m-%d %H:%M')
            if row.get('updated_at'): row['updated_at'] = row['updated_at'].strftime('%Y-%m-%d %H:%M')
        return jsonify(result)
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/instructor/<int:instructor_id>/diet-plan', methods=['POST'])
def create_diet_plan(instructor_id):
    """Coach: create a diet plan for a member"""
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        data = request.json
        protein_g = data.get('protein_g')
        carbs_g = data.get('carbs_g')
        kcal_goal = data.get('kcal_goal')
        member_id = data.get('member_id')
        if not all([protein_g, carbs_g, kcal_goal, member_id]):
            return jsonify({"error": "protein_g, carbs_g, kcal_goal and member_id are required"}), 400
        c = conn.cursor()
        c.execute(
            """INSERT INTO DIET_PLAN (member_id, instructor_id, protein_g, carbs_g, kcal_goal, breakfast, lunch, dinner, snacks, notes)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (member_id, instructor_id, protein_g, carbs_g, kcal_goal,
             data.get('breakfast'), data.get('lunch'), data.get('dinner'),
             data.get('snacks'), data.get('notes'))
        )
        conn.commit()
        return jsonify({"message": "Diet plan created", "id": c.lastrowid}), 201
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/diet-plan/<int:id>', methods=['PUT'])
def update_diet_plan(id):
    """Coach: update a diet plan"""
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        data = request.json
        protein_g = data.get('protein_g')
        carbs_g = data.get('carbs_g')
        kcal_goal = data.get('kcal_goal')
        if not all([protein_g, carbs_g, kcal_goal]):
            return jsonify({"error": "protein_g, carbs_g, and kcal_goal are required"}), 400
        c = conn.cursor()
        c.execute(
            """UPDATE DIET_PLAN SET protein_g=%s, carbs_g=%s, kcal_goal=%s,
               breakfast=%s, lunch=%s, dinner=%s, snacks=%s, notes=%s
               WHERE diet_plan_id=%s""",
            (protein_g, carbs_g, kcal_goal,
             data.get('breakfast'), data.get('lunch'), data.get('dinner'),
             data.get('snacks'), data.get('notes'), id)
        )
        conn.commit()
        return jsonify({"message": "Diet plan updated"})
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/diet-plan/<int:id>', methods=['DELETE'])
def delete_diet_plan(id):
    """Coach: delete a diet plan"""
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        c = conn.cursor()
        c.execute("DELETE FROM DIET_PLAN WHERE diet_plan_id = %s", (id,))
        conn.commit()
        return jsonify({"message": "Diet plan deleted"})
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/member/<int:member_id>/diet-plan', methods=['GET'])
def get_member_diet_plan(member_id):
    """Member: get assigned diet plan"""
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        c = conn.cursor(dictionary=True)
        c.execute("""
            SELECT dp.*,
                   CONCAT(i.first_name, ' ', i.last_name) as instructor_name
            FROM DIET_PLAN dp
            JOIN INSTRUCTOR i ON dp.instructor_id = i.instructor_id
            WHERE dp.member_id = %s
            ORDER BY dp.updated_at DESC LIMIT 1
        """, (member_id,))
        plan = c.fetchone()
        if plan:
            if plan.get('created_at'): plan['created_at'] = plan['created_at'].strftime('%Y-%m-%d %H:%M')
            if plan.get('updated_at'): plan['updated_at'] = plan['updated_at'].strftime('%Y-%m-%d %H:%M')
        return jsonify(plan)
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

# --- WORKOUT LOGS ---

@app.route('/api/exercises', methods=['GET'])
def get_exercises():
    return fetch_all("EXERCISE")

@app.route('/api/workout-logs/<int:member_id>', methods=['GET'])
def get_member_workout_logs(member_id):
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        c = conn.cursor(dictionary=True)
        # Get logs
        c.execute("""
            SELECT l.* 
            FROM WORKOUT_LOG l
            WHERE l.member_id = %s
            ORDER BY l.log_date DESC
        """, (member_id,))
        logs = c.fetchall()
        
        # Format dates and attach entries
        for log in logs:
            if log.get('log_date'): log['log_date'] = log['log_date'].strftime('%Y-%m-%d')
            c.execute("""
                SELECT e.*, ex.name as exercise_name, ex.muscle_group
                FROM LOG_ENTRY e
                JOIN EXERCISE ex ON e.exercise_id = ex.exercise_id
                WHERE e.log_id = %s
                ORDER BY e.entry_id ASC
            """, (log['log_id'],))
            log['entries'] = c.fetchall()
            
        return jsonify(logs)
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/instructor/<int:instructor_id>/student/<int:member_id>/workout-logs', methods=['GET'])
def get_student_workout_logs(instructor_id, member_id):
    # Same as get_member_workout_logs
    return get_member_workout_logs(member_id)

@app.route('/api/workout-logs', methods=['POST'])
def create_workout_log():
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        data = request.json
        c = conn.cursor()
        c.execute(
            "INSERT INTO WORKOUT_LOG (member_id, log_date, title, notes) VALUES (%s,%s,%s,%s)",
            (data.get('member_id'), data.get('log_date'), data.get('title'), data.get('notes'))
        )
        conn.commit()
        return jsonify({"message": "Created", "id": c.lastrowid}), 201
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/workout-logs/<int:log_id>/entries', methods=['POST'])
def add_workout_log_entry(log_id):
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        data = request.json
        c = conn.cursor()
        c.execute(
            "INSERT INTO LOG_ENTRY (log_id, exercise_id, set_no, reps, weight_kg) VALUES (%s,%s,%s,%s,%s)",
            (log_id, data.get('exercise_id'), data.get('set_no'), data.get('reps'), data.get('weight_kg'))
        )
        conn.commit()
        return jsonify({"message": "Added", "id": c.lastrowid}), 201
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/workout-logs/<int:member_id>/personal-bests', methods=['GET'])
def get_personal_bests(member_id):
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        c = conn.cursor(dictionary=True)
        c.execute("SELECT * FROM PERSONAL_BESTS WHERE member_id = %s", (member_id,))
        return jsonify(c.fetchall())
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()
        
@app.route('/api/workout-logs/<int:member_id>/progress/<int:exercise_id>', methods=['GET'])
def get_exercise_progress(member_id, exercise_id):
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        c = conn.cursor(dictionary=True)
        query = """
            SELECT w.log_date, MAX(l.weight_kg) as max_weight, MAX(l.reps) as max_reps
            FROM LOG_ENTRY l
            JOIN WORKOUT_LOG w ON l.log_id = w.log_id
            WHERE w.member_id = %s AND l.exercise_id = %s
            GROUP BY w.log_date
            ORDER BY w.log_date ASC
        """
        c.execute(query, (member_id, exercise_id))
        result = c.fetchall()
        for row in result:
            if row.get('log_date'): row['log_date'] = row['log_date'].strftime('%Y-%m-%d')
        return jsonify(result)
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

# ==========================================
# GYM CLASS & BOOKING Endpoints
# ==========================================
# Access: Admin/Instructors create & manage classes. Members browse & book.

@app.route('/api/classes', methods=['GET'])
def get_all_classes():
    """List all active classes with instructor names and booking counts"""
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        c = conn.cursor(dictionary=True)
        c.execute("""
            SELECT gc.*, CONCAT(i.first_name, ' ', i.last_name) as instructor_name,
                   (SELECT COUNT(*) FROM CLASS_BOOKING cb WHERE cb.class_id = gc.class_id AND cb.status = 'confirmed' AND cb.booked_date >= CURDATE()) as current_bookings
            FROM GYM_CLASS gc
            JOIN INSTRUCTOR i ON gc.instructor_id = i.instructor_id
            WHERE gc.is_active = 1
            ORDER BY FIELD(gc.day_of_week, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'), gc.start_time
        """)
        result = c.fetchall()
        for row in result:
            if row.get('start_time'): row['start_time'] = str(row['start_time'])[:5]
            if row.get('end_time'): row['end_time'] = str(row['end_time'])[:5]
            if row.get('created_at'): row['created_at'] = row['created_at'].strftime('%Y-%m-%d %H:%M')
        return jsonify(result)
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/classes', methods=['POST'])
def create_class():
    """Admin or Instructor creates a new class"""
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        data = request.json
        c = conn.cursor()
        c.execute(
            """INSERT INTO GYM_CLASS (title, description, instructor_id, day_of_week, start_time, end_time, max_capacity, category)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""",
            (data.get('title'), data.get('description'), data.get('instructor_id'),
             data.get('day_of_week'), data.get('start_time'), data.get('end_time'),
             data.get('max_capacity', 20), data.get('category'))
        )
        conn.commit()
        return jsonify({"message": "Class created", "id": c.lastrowid}), 201
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/classes/<int:class_id>', methods=['PUT'])
def update_class(class_id):
    """Admin or owning Instructor updates a class"""
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        data = request.json
        c = conn.cursor()
        c.execute(
            """UPDATE GYM_CLASS SET title=%s, description=%s, day_of_week=%s, start_time=%s,
               end_time=%s, max_capacity=%s, category=%s, is_active=%s WHERE class_id=%s""",
            (data.get('title'), data.get('description'), data.get('day_of_week'),
             data.get('start_time'), data.get('end_time'), data.get('max_capacity'),
             data.get('category'), data.get('is_active', True), class_id)
        )
        conn.commit()
        return jsonify({"message": "Class updated"})
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/classes/<int:class_id>', methods=['DELETE'])
def delete_class(class_id):
    """Admin soft-deletes a class"""
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        c = conn.cursor()
        c.execute("UPDATE GYM_CLASS SET is_active = 0 WHERE class_id = %s", (class_id,))
        conn.commit()
        return jsonify({"message": "Class deactivated"})
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/classes/<int:class_id>/book', methods=['POST'])
def book_class(class_id):
    """Member books a spot in a class for a specific date"""
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        data = request.json
        member_id = data.get('member_id')
        booked_date = data.get('booked_date')

        c = conn.cursor(dictionary=True)
        # Check capacity
        c.execute("SELECT max_capacity FROM GYM_CLASS WHERE class_id = %s", (class_id,))
        cls = c.fetchone()
        if not cls:
            return jsonify({"error": "Class not found"}), 404

        c.execute("SELECT COUNT(*) as cnt FROM CLASS_BOOKING WHERE class_id = %s AND booked_date = %s AND status = 'confirmed'", (class_id, booked_date))
        count = c.fetchone()['cnt']
        if count >= cls['max_capacity']:
            return jsonify({"error": "Class is full"}), 400

        c.execute(
            "INSERT INTO CLASS_BOOKING (class_id, member_id, booked_date) VALUES (%s, %s, %s)",
            (class_id, member_id, booked_date)
        )
        conn.commit()
        return jsonify({"message": "Booking confirmed", "id": c.lastrowid}), 201
    except Error as e:
        if 'Duplicate entry' in str(e):
            return jsonify({"error": "Already booked for this date"}), 400
        return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/bookings/<int:booking_id>/cancel', methods=['PUT'])
def cancel_booking(booking_id):
    """Member cancels a booking"""
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        c = conn.cursor()
        c.execute("UPDATE CLASS_BOOKING SET status = 'cancelled' WHERE booking_id = %s", (booking_id,))
        conn.commit()
        return jsonify({"message": "Booking cancelled"})
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/member/<int:member_id>/bookings', methods=['GET'])
def get_member_bookings(member_id):
    """Get all bookings for a member"""
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        c = conn.cursor(dictionary=True)
        c.execute("""
            SELECT cb.*, gc.title, gc.day_of_week, gc.start_time, gc.end_time, gc.category,
                   CONCAT(i.first_name, ' ', i.last_name) as instructor_name
            FROM CLASS_BOOKING cb
            JOIN GYM_CLASS gc ON cb.class_id = gc.class_id
            JOIN INSTRUCTOR i ON gc.instructor_id = i.instructor_id
            WHERE cb.member_id = %s AND cb.booked_date >= CURDATE()
            ORDER BY cb.booked_date, gc.start_time
        """, (member_id,))
        result = c.fetchall()
        for row in result:
            if row.get('start_time'): row['start_time'] = str(row['start_time'])[:5]
            if row.get('end_time'): row['end_time'] = str(row['end_time'])[:5]
            if row.get('booked_date'): row['booked_date'] = row['booked_date'].strftime('%Y-%m-%d')
            if row.get('created_at'): row['created_at'] = row['created_at'].strftime('%Y-%m-%d %H:%M')
        return jsonify(result)
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/instructor/<int:instructor_id>/classes', methods=['GET'])
def get_instructor_classes(instructor_id):
    """Get classes managed by an instructor with booking counts"""
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        c = conn.cursor(dictionary=True)
        c.execute("""
            SELECT gc.*,
                   (SELECT COUNT(*) FROM CLASS_BOOKING cb WHERE cb.class_id = gc.class_id AND cb.status = 'confirmed' AND cb.booked_date >= CURDATE()) as current_bookings
            FROM GYM_CLASS gc
            WHERE gc.instructor_id = %s AND gc.is_active = 1
            ORDER BY FIELD(gc.day_of_week, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'), gc.start_time
        """, (instructor_id,))
        result = c.fetchall()
        for row in result:
            if row.get('start_time'): row['start_time'] = str(row['start_time'])[:5]
            if row.get('end_time'): row['end_time'] = str(row['end_time'])[:5]
            if row.get('created_at'): row['created_at'] = row['created_at'].strftime('%Y-%m-%d %H:%M')
        return jsonify(result)
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/classes/<int:class_id>/bookings', methods=['GET'])
def get_class_bookings(class_id):
    """Instructor/Admin: see who's booked for a class"""
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        c = conn.cursor(dictionary=True)
        booked_date = request.args.get('date')
        query = """
            SELECT cb.*, CONCAT(m.first_name, ' ', m.last_name) as member_name, m.email
            FROM CLASS_BOOKING cb
            JOIN MEMBER m ON cb.member_id = m.member_id
            WHERE cb.class_id = %s AND cb.status = 'confirmed'
        """
        params = [class_id]
        if booked_date:
            query += " AND cb.booked_date = %s"
            params.append(booked_date)
        query += " ORDER BY cb.booked_date, m.first_name"
        c.execute(query, params)
        result = c.fetchall()
        for row in result:
            if row.get('booked_date'): row['booked_date'] = row['booked_date'].strftime('%Y-%m-%d')
            if row.get('created_at'): row['created_at'] = row['created_at'].strftime('%Y-%m-%d %H:%M')
        return jsonify(result)
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

# ==========================================
# BODY METRIC Endpoints
# ==========================================

@app.route('/api/member/<int:member_id>/body-metrics', methods=['GET'])
def get_body_metrics(member_id):
    """Get all body metrics for a member, ordered by date"""
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        c = conn.cursor(dictionary=True)
        c.execute("""
            SELECT * FROM BODY_METRIC
            WHERE member_id = %s ORDER BY recorded_date ASC
        """, (member_id,))
        result = c.fetchall()
        for row in result:
            if row.get('recorded_date'): row['recorded_date'] = row['recorded_date'].strftime('%Y-%m-%d')
            if row.get('weight_kg'): row['weight_kg'] = float(row['weight_kg'])
            if row.get('body_fat_pct'): row['body_fat_pct'] = float(row['body_fat_pct'])
            if row.get('created_at'): row['created_at'] = row['created_at'].strftime('%Y-%m-%d %H:%M')
        return jsonify(result)
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/member/<int:member_id>/body-metrics', methods=['POST'])
def add_body_metric(member_id):
    """Member logs a new body metric"""
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        data = request.json
        c = conn.cursor()
        c.execute(
            """INSERT INTO BODY_METRIC (member_id, recorded_date, weight_kg, body_fat_pct, notes)
               VALUES (%s, %s, %s, %s, %s)""",
            (member_id, data.get('recorded_date'), data.get('weight_kg'),
             data.get('body_fat_pct'), data.get('notes'))
        )
        conn.commit()
        return jsonify({"message": "Metric recorded", "id": c.lastrowid}), 201
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/body-metrics/<int:metric_id>', methods=['DELETE'])
def delete_body_metric(metric_id):
    """Delete a body metric entry"""
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        c = conn.cursor()
        c.execute("DELETE FROM BODY_METRIC WHERE metric_id = %s", (metric_id,))
        conn.commit()
        return jsonify({"message": "Metric deleted"})
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

# --- NOTIFICATIONS ---

@app.route('/api/notifications/<string:role>/<int:user_id>', methods=['GET'])
def get_notifications(role, user_id):
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        c = conn.cursor(dictionary=True)
        c.execute("""
            SELECT * FROM NOTIFICATION 
            WHERE recipient_role = %s AND recipient_id = %s
            ORDER BY created_at DESC
        """, (role, user_id))
        result = c.fetchall()
        for row in result:
            if row.get('created_at'): row['created_at'] = row['created_at'].strftime('%Y-%m-%d %H:%M')
            if row.get('resolved_at'): row['resolved_at'] = row['resolved_at'].strftime('%Y-%m-%d %H:%M')
        return jsonify(result)
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/notifications/<string:role>/<int:user_id>/unread-count', methods=['GET'])
def get_unread_count(role, user_id):
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        c = conn.cursor(dictionary=True)
        c.execute("""
            SELECT COUNT(*) as count FROM NOTIFICATION 
            WHERE recipient_role = %s AND recipient_id = %s AND is_read = 0
        """, (role, user_id))
        return jsonify(c.fetchone())
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/notifications/<int:notif_id>/read', methods=['PUT'])
def mark_notification_read(notif_id):
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        c = conn.cursor()
        c.execute("UPDATE NOTIFICATION SET is_read = 1 WHERE notification_id = %s", (notif_id,))
        conn.commit()
        return jsonify({"message": "Marked read"})
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/notifications/read-all/<string:role>/<int:user_id>', methods=['PUT'])
def mark_all_notifications_read(role, user_id):
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        c = conn.cursor()
        c.execute("UPDATE NOTIFICATION SET is_read = 1 WHERE recipient_role = %s AND recipient_id = %s", (role, user_id))
        conn.commit()
        return jsonify({"message": "All marked read"})
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/notifications/<int:notif_id>/resolve', methods=['PUT'])
def resolve_notification(notif_id):
    """Mark an alert as resolved (distinct from just 'read')"""
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        c = conn.cursor()
        c.execute("UPDATE NOTIFICATION SET is_read = 1, resolved_at = NOW() WHERE notification_id = %s", (notif_id,))
        conn.commit()
        return jsonify({"message": "Alert resolved"})
    except Error as e: return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

@app.route('/api/notifications/generate', methods=['POST'])
def generate_alerts():
    conn = get_db_connection()
    if not conn: return jsonify({"error": "DB error"}), 500
    try:
        c = conn.cursor()
        c.callproc('generate_daily_alerts')
        conn.commit()
        return jsonify({"message": "Stored procedure executed successfully"}), 200
    except Error as e: 
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        if conn.is_connected(): c.close(); conn.close()

# Serve React frontend (SPA catch-all — must be LAST route)
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV', 'development') == 'development'
    app.run(debug=debug, host='0.0.0.0', port=port)
