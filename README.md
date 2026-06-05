# Automation Assessment System

## 📋 Overview

A comprehensive assessment management system designed for training and certification workflows. The system supports multiple user roles including Admins, Managers, and Trainers with role-based access control and user status management.

## 🏗️ Architecture

### **Technology Stack**
**Frontend:**
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Recharts for data visualization
- Lucide Icons

**Backend:**
- Node.js + Express
- MySQL with Sequelize ORM
- JWT authentication (httpOnly cookies)
- bcrypt password hashing
- CORS, helmet, express-validator

### **System Components**
- **User Management**: Multi-role user system with status control (active/inactive)
- **Assessment Management**: Create, schedule, and track assessments
- **Feedback System**: Collaborative feedback from multiple managers
- **Certificate Management**: Generate and manage certificates
- **Performance Analytics**: Track user and system performance

## 👥 User Roles & Permissions

### **🔑 Admin Role**
- **Dashboard**: System overview with statistics (total users, active workforce)
- **User Management**: Create, edit, deactivate users with status toggle
- **Assessment Scheduling**: Create and assign assessments to trainers
- **Certificate Management**: Issue and revoke certificates
- **System Configuration**: Manage courses and system settings

### **👔 Manager Role**
- **Assessment Review**: Review and provide feedback on assigned assessments
- **Performance Tracking**: Monitor team performance metrics
- **Feedback Management**: Collaborative feedback system with multiple manager input
- **Certificate Issuance**: Issue certificates to trainees
- **Assessment History**: View completed assessments and feedback

### **🎓 Trainer Role**
- **Assessment Completion**: Complete assigned assessments
- **Profile Management**: Update personal information and view history
- **History Tracking**: View assessment completion history
- **Certificate Viewing**: View earned certificates
- **Performance Dashboard**: Track personal progress

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- MySQL database
- Git

### **Installation**
```bash
# Clone repository
git clone <repository-url>
cd Automation_Assessment

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
node backend/run-migration.js

# Start development servers
npm run dev
```

### **Environment Variables**
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=automation_assessment
DB_USER=root
DB_PASSWORD=password

# JWT Configuration
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=4000
NODE_ENV=development
```

## 📁 Project Structure

```
Automation_Assessment/
├── backend/
│   ├── src/
│   │   ├── controllers/     # API route handlers
│   │   │   ├── adminController.js
│   │   │   ├── authController.js
│   │   │   ├── managerController.js
│   │   │   └── trainerController.js
│   │   ├── models/         # Database models
│   │   │   ├── User.js
│   │   │   ├── Assessment.js
│   │   │   ├── Feedback.js
│   │   │   └── Certificate.js
│   │   ├── middleware/     # Authentication & validation
│   │   │   └── authMiddleware.js
│   │   ├── routes/         # API route definitions
│   │   ├── config/         # Database configuration
│   │   └── server.js       # Server entry point
│   ├── migrations/          # Database migration scripts
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── admin/          # Admin pages and dashboard
│   │   │   ├── page.tsx    # Admin dashboard
│   │   │   ├── users/       # User management
│   │   │   ├── scheduler/   # Assessment scheduling
│   │   │   └── certificates/ # Certificate management
│   │   ├── manager/        # Manager pages
│   │   │   ├── page.tsx    # Manager dashboard
│   │   │   ├── feedback/    # Feedback management
│   │   │   ├── performance/ # Performance tracking
│   │   │   └── certificates/ # Certificate issuance
│   │   ├── trainer/        # Trainer pages
│   │   │   ├── page.tsx    # Trainer dashboard
│   │   │   ├── profile/     # Profile management
│   │   │   └── history/    # Assessment history
│   │   └── layout.tsx      # Root layout
│   ├── components/          # Reusable components
│   │   ├── StatCard.tsx
│   │   ├── Modal.tsx
│   │   └── Toast.tsx
│   ├── lib/              # Utilities and API client
│   │   └── api.ts        # API client configuration
│   └── globals.css       # Global styles
├── docs/                 # Documentation
└── README.md
```

## 🔧 Development Workflow

### **1. Setup Development Environment**
- Install dependencies with `npm install`
- Configure database connection in `.env`
- Run database migrations to setup schema
- Start development servers with `npm run dev`

### **2. Feature Development**
- Create feature branch from main
- Implement backend changes in controllers/models
- Update frontend components and pages
- Test functionality across all user roles

### **3. Testing & Quality**
- Test user authentication and role-based access
- Verify assessment workflow functionality
- Check user status management (active/inactive)
- Validate feedback system with multiple managers

### **4. Code Quality**
- Follow TypeScript best practices
- Use Tailwind CSS for consistent styling
- Implement proper error handling
- Add input validation and sanitization

## 📊 Key Features

### **👤 User Management System**
- **Multi-role Authentication**: Admin, Manager, Trainer roles
- **User Status Control**: Active/Inactive user management
- **Last Login Tracking**: Monitor user activity
- **Role-Based Access**: Secure permission system
- **User Profile Management**: Update user information

### **📝 Assessment Management**
- **Assessment Creation**: Create and schedule assessments
- **Trainer Assignment**: Assign assessments to trainers
- **Multi-Manager Feedback**: Collaborative feedback system
- **Status Tracking**: Scheduled, In Progress, Completed
- **Performance Analytics**: Track completion rates and scores

### **🏆 Certificate Management**
- **Automated Generation**: Create certificates from completed assessments
- **Template System**: Customizable certificate templates
- **Certificate Validation**: Verify certificate authenticity
- **Issuance Tracking**: Monitor certificate distribution

### **📈 Analytics & Reporting**
- **Dashboard Statistics**: Real-time system metrics
- **User Performance**: Individual and team performance
- **Assessment Analytics**: Completion rates and trends
- **Feedback Analysis**: Manager feedback insights

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Permission-based route protection
- **User Status Validation**: Prevent inactive user access
- **Input Validation**: Comprehensive input sanitization
- **Password Security**: bcrypt hashing for password storage
- **CORS Protection**: Cross-origin request security
- **Helmet Integration**: Security headers configuration

## 🔄 API Documentation

### **Authentication Endpoints**
- `POST /api/auth/login` - User login with JWT token
- `GET /api/auth/me` - Get current authenticated user
- `POST /api/auth/logout` - User logout and token invalidation

### **Admin Endpoints**
- `GET /api/admin/users` - Get all users with status
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/:id` - Update user (including status)
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/overview` - Get dashboard statistics
- `GET /api/admin/assessments` - Get all assessments
- `POST /api/admin/assessments` - Create assessment

### **Manager Endpoints**
- `GET /api/manager/assessments` - Get assigned assessments
- `POST /api/manager/feedback` - Submit feedback
- `GET /api/manager/performance` - Get team performance

### **Trainer Endpoints**
- `GET /api/trainer/assessments` - Get assigned assessments
- `GET /api/trainer/history` - Get assessment history
- `GET /api/trainer/profile` - Get profile information

## 🧪 Testing Strategy

### **Manual Testing Checklist**
- **Authentication**: Test login/logout for all roles
- **Role Access**: Verify role-based route protection
- **User Management**: Test user creation, editing, status toggle
- **Assessment Workflow**: Test creation, assignment, completion
- **Feedback System**: Test multi-manager feedback functionality
- **Dashboard Statistics**: Verify accurate user counts and metrics

### **Cross-Browser Testing**
- Chrome, Firefox, Safari, Edge
- Mobile responsive testing
- Tablet and desktop views

## 🚀 Deployment Guide

### **Development Environment**
```bash
# Start both frontend and backend
npm run dev
```

### **Production Build**
```bash
# Build frontend for production
npm run build

# Start production server
npm start
```

### **Environment Setup**
- Production database configuration
- Environment variables setup
- SSL certificate configuration
- Reverse proxy setup (nginx/Apache)

## 📞 Maintenance & Support

### **Database Maintenance**
- Regular backups of user and assessment data
- Performance monitoring and optimization
- User activity logging and audit trails

### **System Monitoring**
- Application performance monitoring
- Error tracking and alerting
- User activity analytics
- System health checks

## 🔄 Recent Updates

### **User Status Management**
- Added `status` field to User model
- Implemented active/inactive user toggle
- Updated authentication to prevent inactive user login
- Enhanced user management interface

### **Dashboard Improvements**
- Fixed active user count on admin dashboard
- Corrected user management statistics
- Improved role-based filtering
- Enhanced user interface components

### **Feedback System Enhancement**
- Multi-manager feedback support
- Improved feedback ordering and display
- Enhanced feedback submission workflow
- Better error handling and validation

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing Guidelines

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### **Code Standards**
- Follow TypeScript conventions
- Use Tailwind CSS for styling
- Implement proper error handling
- Add comments for complex logic
- Test across all user roles

## Project Structure

```
automation-assessment-web-app/
├── frontend/              # Next.js 15 frontend
│   ├── app/              # App Router pages
│   │   ├── trainer/      # Trainer dashboard & pages
│   │   ├── manager/      # Manager dashboard & pages
│   │   ├── admin/        # Admin dashboard & pages
│   │   └── login/        # Login page
│   ├── components/       # Reusable UI components
│   ├── lib/              # Utilities & API client
│   └── types/            # TypeScript types
├── backend/              # Express API
│   └── src/
│       ├── config/       # Database & environment config
│       ├── models/       # Sequelize models
│       ├── controllers/  # Route controllers
│       ├── routes/       # API routes
│       ├── middleware/   # Auth & role middleware
│       └── utils/        # Helper functions
└── package.json          # Workspace root
```

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- MySQL 8.0+

### 1. Install Dependencies

From the monorepo root:
```bash
npm install
```

This installs dependencies for both frontend and backend workspaces.

### 2. Configure Backend

Create `backend/.env` from the example:
```bash
cp backend/.env.example backend/.env
```

Update the following in `backend/.env`:
```env
PORT=4000
JWT_SECRET=your_secure_secret_key_here
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=automation_assessment
```

### 3. Create MySQL Database

```sql
CREATE DATABASE automation_assessment;
```

The backend will auto-create tables on first run via Sequelize sync.

### 4. Run Development Servers

**Option A: Run both servers together**
```bash
npm run dev
```

**Option B: Run separately**
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

- Backend API: http://localhost:4000
- Frontend UI: http://localhost:3000

### 5. Login with Demo Users

The backend automatically seeds three demo users on first run:

| Role    | Email                  | Password     |
|---------|------------------------|--------------|
| Admin   | admin@example.com      | password123  |
| Manager | manager@example.com    | password123  |
| Trainer | trainer@example.com    | password123  |

Visit http://localhost:3000/login to sign in.

## Features

### Trainer Dashboard
- View assigned assessments
- Track performance over time
- Assessment history with feedback
- Profile management

### Manager Dashboard
- View all trainers and their assessments
- Submit feedback for completed assessments
- Performance reports with charts
- Export reports (Excel/PDF - UI ready)

### Admin Dashboard
- User management (create/edit/delete users)
- Course management
- System settings and health monitoring
- Assessment scheduler
- Overview analytics

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/register` - Register new user (admin only)
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Trainer Routes (Protected)
- `GET /api/trainer/assessments` - Get assigned assessments
- `GET /api/trainer/history` - Get assessment history
- `GET /api/trainer/performance` - Get performance data

### Manager Routes (Protected)
- `GET /api/manager/trainers` - List all trainers
- `POST /api/manager/feedback` - Submit feedback
- `GET /api/manager/reports` - Get reports

### Admin Routes (Protected)
- `POST /api/admin/create-trainer` - Create new trainer
- `POST /api/admin/assign-course` - Assign course to trainer
- `GET /api/admin/overview` - System overview

## Security

- JWT tokens stored in httpOnly cookies (not localStorage)
- CORS configured for frontend origin
- Helmet.js for security headers
- bcrypt password hashing (10 rounds)
- Role-based access control middleware
- Input validation with express-validator

## UI Features

- **Fixed Sidebar Navigation** - Role-specific menu items
- **Scrollable Dashboard Content** - Main content area scrolls independently
- **Responsive Design** - Mobile, tablet, and desktop layouts
- **Modern UI Components** - Cards, tables, charts, badges, modals
- **Data Visualization** - Line charts, bar charts, pie charts (Recharts)
- **Toast Notifications** - Ready for success/error messages
- **Dark Mode Toggle** - UI element present (implementation pending)

## Development Notes

- Frontend uses Next.js 15 App Router with TypeScript
- API calls use `credentials: 'include'` for cookie-based auth
- Mock data is used in frontend for initial development
- Database models support full CRUD operations
- Sequelize auto-syncs schema on server start

## Production Deployment

1. Build both apps:
   ```bash
   npm run build
   ```

2. Set production environment variables:
   - `NODE_ENV=production`
   - `COOKIE_SECURE=true`
   - `COOKIE_SAME_SITE=strict`
   - Update `CORS_ORIGIN` to production frontend URL

3. Run production servers:
   ```bash
   npm start
   ```

## Future Enhancements

- Email notifications for assessments and feedback
- Advanced analytics and reporting
- File upload for assessment materials
- Real-time notifications with WebSockets
- Audit logs for admin actions
- Multi-factor authentication
- Password reset functionality
- Bulk user import/export

## License

MIT
