# Neon Iron Gym Management System

This is a full-stack gym management system featuring a Flask (Python) backend and a React (Vite) frontend. It includes role-based access control (Admin, Member, Coach) with persistent data storage in MySQL.

## Prerequisites
- **Python 3.x**
- **Node.js** (v16+ recommended)
- **MySQL** installed and running

## 1. Database Setup
Ensure you have MySQL running locally.
1. Create a `.env` file in the root directory (`c:\Code\gym_management`) with your database credentials:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   ```
2. Run the database setup script to create the necessary tables and seed initial data:
   ```bash
   # From the project root (c:\Code\gym_management)
   python setup_db.py
   ```
   *(Note: This uses `CREATE TABLE IF NOT EXISTS`. Use `python setup_db.py --force` if you want to completely drop and recreate the database).*

## 2. Running the Backend (Flask)
The backend runs on port `5000`. It provides the REST API for the application.

1. Open a terminal in the root directory (`c:\Code\gym_management`).
2. Activate the virtual environment:
   - **Windows:** `.\venv\Scripts\activate`
   - **Mac/Linux:** `source venv/bin/activate`
3. Install dependencies (if not already installed):
   ```bash
   pip install -r requirements.txt
   ```
   *(Assuming requirements.txt exists, or just ensure `flask`, `mysql-connector-python`, `flask-cors`, `pyjwt`, etc. are installed)*
4. Start the Flask dev server:
   ```bash
   python app.py
   ```
   *The server should now be running at `http://127.0.0.1:5000`.*

## 3. Running the Frontend (React + Vite)
The frontend runs on port `5173` (or depending on availability, up to `5178`).

1. Open a **new** terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install the necessary Node dependencies (first time only):
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Look at the terminal output for the local URL (e.g., `http://localhost:5173` or similar) and open it in your browser.

## Demo Accounts
Once both servers are running, you can log in with:
- **Admin**: `admin` / `admin123`
- **Member**: `mike@test.com` / `password123`
- **Coach**: `john@neoniron.com` / `coach123`
