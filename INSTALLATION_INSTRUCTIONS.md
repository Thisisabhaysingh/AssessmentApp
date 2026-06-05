# Installation Instructions - Certificate System

## ✅ What's Been Fixed

1. **Created Card component** (`frontend/components/ui/card.tsx`)
2. **Converted all backend files to ES modules**:
   - `certificateRoutes.js` ✅
   - `certificateController.js` ✅  
   - `certificateTemplateController.js` ✅
   - `fileUpload.js` ✅
   - `certificateService.js` ✅

3. **Added Sidebar menu** for Certificates (all roles) ✅

## 🔧 Installation Steps

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

This will install the new dependencies:
- canvas
- mkdirp
- uuid
- nodemailer

### 2. Install Frontend Dependencies
```bash
cd frontend  
npm install
```

This will install the new dependencies:
- @hookform/resolvers
- axios
- clsx
- date-fns
- react-hook-form
- sonner
- zod

### 3. Start the Application
```bash
# From the root directory
npm run dev
```

The application will start:
- **Backend**: http://localhost:4000
- **Frontend**: http://localhost:3000

## 🎯 What to Expect

Once you run `npm install` in both directories and start the app:

### For All Users:
- You'll see the "Certificates" menu in the sidebar (with Award icon 🏆)

### For Trainers:
- Menu: "My Certificates"
- Can view and download their own certificates
- Can upload external certificates

### For Managers:
- Menu: "Certificates"
- Can view all certificates
- Can filter and search
- Can issue new certificates

### For Admins:
- Menu: "Certificates"
- Full certificate management
- Can manage templates
- Bulk operations support
- Full CRUD for certificates

## ⚠️ Important Notes

1. **Database will auto-sync** when the backend starts
2. **Uploads folder** will be created automatically
3. **Card component** has been added to fix frontend errors
4. **All backend routes** are now using ES modules (import/export)

## 🐛 If You See Errors

### Backend Errors:
- Make sure you ran `npm install` in the backend folder
- Check that all `.js` files are using ES modules syntax

### Frontend Errors:
- Make sure you ran `npm install` in the frontend folder
- The "Cannot find module" errors will disappear after installing dependencies

## 📦 New Dependencies Summary

### Backend:
- `canvas@^2.11.2` - For PDF generation
- `mkdirp@^3.0.1` - For directory creation
- `uuid@^9.0.1` - For unique IDs
- `nodemailer@^6.9.10` - For email notifications

### Frontend:
- `@hookform/resolvers@^3.3.4` - Form validation
- `clsx@^2.1.0` - Utility for class names
- `date-fns@^3.3.1` - Date formatting
- `react-hook-form@^7.50.1` - Form management
- `sonner@^1.4.0` - Toast notifications
- `zod@^3.22.4` - Schema validation

## ✨ Ready to Go!

After installing dependencies, the certificate management system is fully functional and ready to use!

Test it by:
1. Login as admin (admin@example.com / password123)
2. Go to "Certificates" in the sidebar
3. Explore the certificate management features

Enjoy! 🎉
