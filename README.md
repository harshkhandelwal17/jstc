# Multi-Coaching Management System 🎓

A comprehensive, scalable management system designed for multiple coaching institutes with complete data isolation and multi-tenancy support.

## ✨ Key Features

### 🏢 Multi-Tenant Architecture
- **Complete Data Isolation**: Each coaching institute has separate data
- **Scalable Design**: Deploy for unlimited coaching centers
- **Unique Institute IDs**: Auto-generated institute identification
- **Role-Based Access**: Admin, staff, and super admin roles

### 👥 Student Management
- **Comprehensive Profiles**: Personal, academic, and parent information
- **Smart ID Generation**: Institute-specific student IDs
- **Advanced Search & Filtering**: Multi-parameter search capabilities
- **Status Management**: Active, Inactive, Suspended, Graduated states
- **Document Management**: Upload and manage student documents

### 💰 Advanced Fee Management
- **Multiple Payment Types**: Monthly, Admission, Security, Books, Exams
- **Partial Payment Support**: Track and manage incomplete payments
- **Smart Receipt Generation**: Institute-specific receipt numbers
- **Due Date Management**: Automatic calculations and overdue tracking
- **Payment Modes**: Cash, UPI, Online, Card, Cheque, NEFT, RTGS
- **Discount & Late Fee Support**: Flexible fee adjustments

### 📊 Batch Management
- **Comprehensive Scheduling**: Days, timings, and capacity management
- **Teacher Assignment**: Assign and track instructors
- **Subject Management**: Multi-subject batch support
- **Capacity Tracking**: Current strength vs. maximum capacity
- **Batch Status**: Active, Inactive, Completed states

### 📈 Analytics Dashboard
- **Real-Time Statistics**: Live data updates
- **Financial Insights**: Collection reports and pending dues
- **Student Analytics**: Enrollment trends and status distribution
- **Recent Activities**: Latest payments and registrations
- **Overdue Alerts**: Automated payment reminders

### 🔒 Enterprise Security
- **JWT Authentication**: Secure token-based login
- **Password Hashing**: bcrypt with configurable rounds
- **Rate Limiting**: API protection against abuse
- **CORS Protection**: Cross-origin request security
- **Input Validation**: Comprehensive data sanitization
- **Role-Based Access Control**: Fine-grained permissions

## 🏗️ Technology Stack

### Backend (Node.js Ecosystem)
- **Express.js** - Fast web framework
- **MongoDB** - Flexible document database
- **Mongoose** - Elegant MongoDB ODM
- **JWT** - Secure authentication tokens
- **Helmet** - Security headers
- **Rate Limiting** - API protection
- **Validator** - Data validation

### Frontend (Modern React)
- **React 19** - Latest React with concurrent features
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **Axios** - HTTP client with interceptors
- **React Toastify** - Beautiful notifications
- **Lucide React** - Modern icon library

### DevOps & Deployment
- **Docker** - Containerization
- **Docker Compose** - Multi-service orchestration
- **Nginx** - Reverse proxy and load balancing
- **Health Checks** - Service monitoring
- **Graceful Shutdowns** - Clean service termination

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas connection)
- npm or yarn package manager

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `.env` file (already configured):
   - `PORT=3001`
   - `MONGODB_URI=mongodb+srv://harsh:harsh@unifiedcampus.i5fit.mongodb.net/coaching_institute`
   - `JWT_SECRET=your-super-secret-jwt-key-change-this-in-production`
   - `FRONTEND_URL=http://localhost:5173`

4. Start the backend server:
   ```bash
   npm start
   # or for development
   npm run dev
   ```

The backend server will run on http://localhost:3001

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `.env` file (already configured):
   - `VITE_API_BASE_URL=http://localhost:3001/api`

4. Start the frontend development server:
   ```bash
   npm run dev
   ```

The frontend will run on http://localhost:5173

## Demo Credentials
- Email: `admin@institute.com`
- Password: `admin123`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new admin
- `POST /api/auth/login` - Login admin

### Students
- `GET /api/students` - Get all students (with pagination and filters)
- `GET /api/students/:id` - Get single student
- `POST /api/students` - Create new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Fees
- `POST /api/fees/payment` - Record fee payment
- `GET /api/fees/payments` - Get fee payments (with filters)
- `GET /api/fees/dues` - Get fee dues
- `GET /api/fees/history/:studentId` - Get student's fee history
- `GET /api/fees/partial-info/:studentId/:month` - Get partial payment info
- `GET /api/fees/receipt/:receiptNo` - Get fee receipt
- `POST /api/fees/generate-monthly-dues` - Generate monthly dues for all active students

### Batches
- `GET /api/batches` - Get all batches
- `POST /api/batches` - Create new batch
- `PUT /api/batches/:id` - Update batch

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## Project Structure

```
coaching_managemnt/
├── backend/
│   ├── server.js          # Main server file
│   ├── package.json       # Backend dependencies
│   ├── .env              # Environment variables
│   └── node_modules/
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── context/      # React context (Auth)
│   │   ├── App.jsx       # Main app component
│   │   └── main.jsx      # Entry point
│   ├── public/
│   ├── package.json      # Frontend dependencies
│   ├── .env             # Frontend environment variables
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── node_modules/
└── README.md
```

## Usage

1. Start both backend and frontend servers
2. Access the application at http://localhost:5173
3. Login with demo credentials or create a new admin account
4. Navigate through different sections:
   - Dashboard: Overview of institute metrics
   - Students: Manage student records
   - Fees: Handle fee collections and dues
   - Batches: Manage class schedules and batches

## Features Overview

### Student Management
- Comprehensive student profiles with personal, parent, and academic information
- Fee structure configuration per student
- Status management (Active, Inactive, Suspended)
- Search and filtering capabilities
- Bulk operations support

### Fee Management
- Multiple fee types (Monthly, Admission, Security, Book, Exam)
- Partial payment support
- Automatic due date calculations
- Receipt generation with unique receipt numbers
- Payment mode tracking (Cash, Online, UPI, etc.)
- Discount and remarks support

### Dashboard Analytics
- Real-time statistics
- Recent payment tracking
- Overdue fee alerts
- Monthly collection reports
- Quick action buttons

### Security Features
- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Input validation and sanitization
- Protected routes and middleware

## Development

### Available Scripts

Backend:
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

Frontend:
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.