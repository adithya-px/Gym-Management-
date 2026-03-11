# Neon Iron Gym Management System (Frontend)

This directory contains the React (Vite) frontend for the Gym Management System.

## How to Run the Project

You need to run **both** the backend and the frontend servers for the app to work.

### 1. Run the Backend (Flask)
The backend provides the API and connects to the MySQL database.
Open a terminal in the root directory (`c:\Code\gym_management`):
```bash
# 1. Activate the virtual environment
.\venv\Scripts\activate

# 2. (Optional) Initialize/Reset the database if not done yet
python setup_db.py

# 3. Start the Flask server
python app.py
```
*The backend will run on `http://127.0.0.1:5000`.*

### 2. Run the Frontend (React/Vite)
The frontend provides the user interface.
Open a **new** terminal and navigate to the `frontend` folder (`c:\Code\gym_management\frontend`):
```bash
# 1. Install dependencies (only needed the first time)
npm install

# 2. Start the development server
npm run dev
```
*The frontend will start. Look at the terminal output for the URL (e.g., `http://localhost:5173` or `5174` etc.) and open it in your browser.*

---

### Demo Accounts
Once both are running, you can log in at the `/login` page with:
- **Admin**: `admin` / `admin123`
- **Member**: `mike@test.com` / `password123`
- **Coach**: `john@neoniron.com` / `coach123`
