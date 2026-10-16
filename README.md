# 📚 Athena - Modern Library Management System (MERN Stack)

A complete, responsive, full-stack **Library Management System** built using the **MERN Stack** (MongoDB, Express.js, React.js with Vite, and Node.js) and styled with **Tailwind CSS** and **Lucide React**.

Designed and engineered as a presentation-ready college final-year project with secure JWT authentication, role-based access control, automated due-date & overdue fine tracking, real-time inventory management, analytics dashboards, and CSV report exports.

---

## 🌟 Key Features

### 1. 🔐 Authentication & Role-Based Access Control
- **JWT & bcrypt:** Secure user registration, password hashing, and token-based private route protection.
- **Role-Aware Workflows:**
  - **Admin / Librarian:** Comprehensive dashboard with circulation trends, full book inventory control, member management, issuing/returning books, overdue monitoring, and reports.
  - **Student / Member:** Personal student portal showing currently borrowed books, countdown to due dates, overdue notices, borrowing history, and repository catalog search.
- **1-Click Demo Login:** Switch instantly between Admin, Librarian, and Student accounts on the login page.

### 2. 📊 Operations & Analytics Dashboard
- **Metric Cards:** Total Titles, Total Volumes, Available Copies, Active Checkouts, Overdue Books, and Registered Members.
- **Circulation Volume Trends:** Dynamic visual monthly comparison bar chart for book issues vs. returns.
- **Discipline Distribution:** Category proportion bars showing inventory spread across Computer Science, AI, Physics, Mathematics, etc.
- **Recent Circulation Activity:** Live feed of recent loan checkouts and returns with status badges.

### 3. 📖 Book Catalog & Inventory Management
- **Metadata:** Title, ISBN, Author, Category, Publisher, Publication Year, Description, Shelf Location, Total Copies, Available Copies, Cover Image.
- **Live Search & Filters:** Search by title, author, or ISBN; filter by category and in-stock availability; sort by title, year, or copies.
- **Grid View & Table View:** Toggle seamlessly between responsive cover cards and detailed tabular views.
- **Add / Edit Modal:** Full validation preventing duplicate ISBNs and preventing reducing total copies below active issues.
- **Book Details Modal:** Complete book summary, location, and quick "Issue This Book" trigger.

### 4. 👥 Student & Member Management
- Member profiles with Student ID, Full Name, Email, Department, Phone, and Membership Status (Active, Inactive, Suspended).
- Real-time active loan counter per student.
- Comprehensive member borrowing audit history modal.
- Automatic member linking upon student registration.

### 5. 🔄 Circulation Desk: Issue & Return
- **Issue Book:**
  - 3-step checkout: select active student, select in-stock book, choose loan duration.
  - Loan duration presets: 7 Days, 14 Days (Standard), 21 Days, 30 Days (Semester), or custom date picker.
  - Automatic atomic decrement of available book copies.
  - Prevents issuing unavailable books (0 stock) and prevents duplicate active loans of the same title to the same student.
- **Return Book:**
  - Fast search by student name, ID, or book title.
  - Automated overdue calculation: calculates days overdue and fines at **$1.00 / day**.
  - Automatic atomic replenishment of book shelf stock upon return.

### 6. ⚠️ Overdue Tracking & Fine Calculation
- Live overdue loans monitoring desk.
- Displays days overdue with flashing alerts and accumulated penalties.
- One-click **"Notice"** email button with prefilled student notice email.
- Direct **"Process Return"** shortcut.

### 7. 📈 Reports & Data Export (CSV)
- Summary operational cards.
- **Most Borrowed Titles Leaderboard** highlighting top-circulated books.
- Instant CSV downloads for:
  - `report_books.csv` (Complete repository catalog)
  - `report_issued.csv` (Active loans with student contact details)
  - `report_overdue.csv` (Delinquent loans and fines)
  - `report_history.csv` (Complete circulation audit trail)
  - `report_members.csv` (Registered member roster)

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 6, Tailwind CSS, Lucide React, Axios, React Router v6 |
| **Backend** | Node.js, Express.js, JSON Web Tokens (JWT), bcryptjs, Morgan, CORS |
| **Database** | MongoDB Server 9.0+, Mongoose ORM |
| **Architecture** | RESTful APIs, MVC Controller Pattern, Centralized Error Handling |

---

## 👤 Sample Demonstration Credentials

| Role | Email | Password | Name |
|---|---|---|---|
| **Admin** | `admin@library.com` | `admin123` | Dr. Eleanor Vance |
| **Librarian** | `librarian@library.com` | `lib123` | Robert Davis |
| **Student** | `student@library.com` | `student123` | Alex Rivera (ID: STU-2024-001) |
| **Student** | `sarah@library.com` | `student123` | Sarah Chen (ID: STU-2024-002) |

*(You can also click any of the 1-click demo buttons on the login screen!)*

---

## 🚀 Installation & Local Setup

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher)
- **MongoDB** (Local Community Server running on `mongodb://127.0.0.1:27017` or MongoDB Atlas URI)

### 2. Clone or Navigate to Project
```bash
cd library-management-system
```

### 3. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Verify or configure .env
# (A default .env is already included pointing to local MongoDB)
# MONGODB_URI=mongodb://127.0.0.1:27017/library_management_system
# PORT=5000
# JWT_SECRET=super_secret_library_jwt_key_2026_xyz987

# Populate database with realistic academic seed data
npm run seed

# Start backend server
npm start
```
*Backend will run on `http://localhost:5000`.*

### 4. Frontend Setup
In a new terminal:
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
*Frontend will run on `http://localhost:3000`.*

---

## 📡 Backend REST API Reference

### Authentication
- `POST /api/auth/register` - Register a student member
- `POST /api/auth/login` - Authenticate user & return JWT
- `GET /api/auth/me` - Get authenticated profile
- `PUT /api/auth/profile` - Update name, phone, department, avatar
- `PUT /api/auth/change-password` - Update account password

### Books
- `GET /api/books` - Search & filter books (query params: `q`, `category`, `available`, `sort`, `page`, `limit`)
- `GET /api/books/:id` - Get book details & active checkout count
- `GET /api/books/meta/categories` - Get distinct category list
- `POST /api/books` - Add new book (Admin/Librarian)
- `PUT /api/books/:id` - Update book details (Admin/Librarian)
- `DELETE /api/books/:id` - Delete book (Admin/Librarian)

### Members
- `GET /api/members` - List members with search & pagination (Admin/Librarian)
- `GET /api/members/:id` - Get member details & active loans
- `GET /api/members/:id/history` - Get member loan history
- `POST /api/members` - Register new member (Admin/Librarian)
- `PUT /api/members/:id` - Edit member details (Admin/Librarian)
- `DELETE /api/members/:id` - Remove member (Admin/Librarian)

### Circulation
- `POST /api/transactions/issue` - Issue book to student
- `PUT /api/transactions/:id/return` - Return book & compute overdue fines
- `GET /api/transactions` - List transactions (scoped for student vs admin)
- `GET /api/transactions/overdue` - List overdue loans with fine estimates
- `GET /api/transactions/member/:memberId` - Get loans for specific member

### Dashboard & Analytics
- `GET /api/dashboard/stats` - Role-aware statistics & monthly trend data
- `GET /api/reports/summary` - Aggregate catalog and circulation metrics
- `GET /api/reports/export?type=books|issued|overdue|history|members` - Stream CSV reports

---

## 🗄️ Database Schemas (Mongoose)

### `User`
```javascript
{
  name: String,
  email: { type: String, unique: true },
  password: { type: String, select: false },
  role: { type: String, enum: ['admin', 'librarian', 'student'] },
  studentId: String,
  department: String,
  phone: String,
  avatar: String,
  timestamps: true
}
```

### `Book`
```javascript
{
  title: String,
  isbn: { type: String, unique: true },
  author: String,
  category: String,
  publisher: String,
  publicationYear: Number,
  description: String,
  coverImage: String,
  totalCopies: Number,
  availableCopies: Number,
  location: String,
  timestamps: true
}
```

### `Member`
```javascript
{
  studentId: { type: String, unique: true },
  name: String,
  email: { type: String, unique: true },
  department: String,
  phone: String,
  status: { type: String, enum: ['active', 'inactive', 'suspended'] },
  user: { type: ObjectId, ref: 'User' },
  timestamps: true
}
```

### `Transaction`
```javascript
{
  book: { type: ObjectId, ref: 'Book' },
  member: { type: ObjectId, ref: 'Member' },
  issuedBy: { type: ObjectId, ref: 'User' },
  issueDate: Date,
  dueDate: Date,
  returnDate: Date,
  status: { type: String, enum: ['issued', 'returned', 'overdue'] },
  fineAmount: Number,
  remarks: String,
  timestamps: true
}
```

---

## 📂 Project Directory Structure

```text
library-management-system/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB Mongoose connection
│   ├── controllers/
│   │   ├── authController.js     # User registration, login, profile
│   │   ├── bookController.js     # Book catalog CRUD, search, filter
│   │   ├── memberController.js   # Student member records management
│   │   ├── transactionController.js # Issue, return, overdue tracking
│   │   ├── dashboardController.js   # Operations statistics & monthly trends
│   │   └── reportController.js   # Summary metrics & CSV export engine
│   ├── middleware/
│   │   ├── auth.js               # JWT verification & role authorization
│   │   └── errorHandler.js       # Centralized error responses
│   ├── models/
│   │   ├── Book.js
│   │   ├── Member.js
│   │   ├── Transaction.js
│   │   └── User.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── bookRoutes.js
│   │   ├── memberRoutes.js
│   │   ├── transactionRoutes.js
│   │   ├── dashboardRoutes.js
│   │   └── reportRoutes.js
│   ├── seeds/
│   │   └── seedData.js           # Realistic academic database seeder
│   ├── .env                      # Environment config
│   ├── .env.example
│   ├── package.json
│   └── server.js                 # Express application root
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Badge.jsx
│   │   │   │   ├── ConfirmDialog.jsx
│   │   │   │   ├── EmptyState.jsx
│   │   │   │   ├── LoadingSpinner.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   ├── Pagination.jsx
│   │   │   │   └── StatCard.jsx
│   │   │   └── layout/
│   │   │       ├── MainLayout.jsx
│   │   │       ├── Navbar.jsx
│   │   │       └── Sidebar.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ToastContext.jsx
│   │   ├── pages/
│   │   │   ├── BookCatalog.jsx
│   │   │   ├── BookDetailsModal.jsx
│   │   │   ├── BookFormModal.jsx
│   │   │   ├── BorrowingHistory.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── IssueBook.jsx
│   │   │   ├── IssuedBooks.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── NotFound.jsx
│   │   │   ├── OverdueBooks.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Reports.jsx
│   │   │   ├── ReturnBook.jsx
│   │   │   └── StudentManagement.jsx
│   │   ├── routes/
│   │   │   └── AppRoutes.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── .env.example
├── package.json                  # Root orchestration scripts
└── README.md
```

---

## 🎓 College Review & Demo Walkthrough

When presenting this project for an evaluation:
1. **Show Login:** Showcase the modern split UI and use the **1-Click Demo Credentials** to switch between **Admin**, **Librarian**, and **Student**.
2. **Explore Dashboard:** Highlight the real-time statistics cards, circulation volume trends bar chart, and category proportion bars.
3. **Show Catalog:** Search for a book like `Clean Code` or `Algorithms`, filter by category, switch between Grid and Table views, open Book Details, and click Edit.
4. **Demonstrate Circulation:**
   - Go to **Issue Book**, pick an active student and an available book, select 14 days, and confirm issue.
   - Go to **Issued Books** to show the book listed with active days remaining.
   - Go to **Return Book**, search the book, view the overdue status/fine calculation, and confirm return (demonstrating atomic stock restoration!).
5. **Show Overdue Desk:** Show delinquent loans past due date, estimated fines calculated at $1/day, and click **Notice** to trigger email notifications.
6. **Show Reports & CSV Export:** Download CSV reports and view the Most Borrowed Books leaderboard.
7. **Show Student Portal:** Log in as `student@library.com` to demonstrate role-based access control where sensitive operations are hidden and the student sees their personalized active loans and borrowing history.
