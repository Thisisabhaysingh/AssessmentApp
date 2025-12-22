import express from 'express';
import { authenticate, permit } from '../middleware/authMiddleware.js';
import {
  issueCertificate,
  getAllCertificates,
  getCertificateById,
  downloadCertificate,
  revokeCertificate,
  deleteCertificate,
  bulkDeleteCertificates,
  uploadExternalCertificate
} from '../controllers/certificateController.js';

import {
  createTemplate,
  getAllTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  setDefaultTemplate
} from '../controllers/certificateTemplateController.js';

import { upload } from '../utils/fileUpload.js';
import multer from 'multer';
import { User } from '../config/db.js';

const router = express.Router();

// ========================
// Certificate Templates (Admin only)
// ========================
router.post('/templates', 
  authenticate, 
  permit('admin'),
  upload.fields([
    { name: 'templateFile', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  createTemplate
);

router.get('/templates', 
  authenticate, 
  permit('admin', 'manager', 'trainer'),
  getAllTemplates
);

router.get('/templates/:id', 
  authenticate, 
  permit('admin', 'manager', 'trainer'),
  getTemplateById
);

router.put('/templates/:id', 
  authenticate, 
  permit('admin'),
  upload.fields([
    { name: 'templateFile', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  updateTemplate
);

router.delete('/templates/:id', 
  authenticate, 
  permit('admin'),
  deleteTemplate
);

router.post('/templates/:id/set-default', 
  authenticate, 
  permit('admin'),
  setDefaultTemplate
);

// ========================
// Certificates
// ========================

// Get my certificates (for trainers)
router.get('/me/certificates', 
  authenticate, 
  permit('trainer'),
  (req, res, next) => {
    req.query.userId = req.user.id;
    next();
  },
  getAllCertificates
);

router.post('/', 
  authenticate, 
  permit('admin', 'manager'),
  issueCertificate
);

router.get('/', 
  authenticate, 
  permit('admin', 'manager', 'trainer'),
  getAllCertificates
);

// ========================
// Trainer Upload (Fixed)
// ========================
// router.post(
//   '/trainer/upload',
//   authenticate,
//   permit('trainer'),
//   async (req, res, next) => {
//     try {
//       console.log(`👤 Trainer upload request for user: ${req.user?.name} (${req.user?.role})`);
//       const user = await User.findByPk(req.user.id);
//       if (!user) return res.status(404).json({ success: false, message: 'User not found' });

//       req.body.userId = user.id;
//       next();
//     } catch (err) {
//       console.error('❌ Error verifying trainer:', err);
//       return res.status(500).json({ success: false, message: 'Failed to verify user' });
//     }
//   },
//   upload.single('certificate'),
//   async (req, res) => {
//     try {
//       if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

//       console.log(`📤 Uploading file: ${req.file.originalname} for user ID: ${req.body.userId}`);
//       const certificate = await uploadExternalCertificate(req.body.userId, req.file);

//       return res.status(201).json({
//         success: true,
//         message: 'Certificate uploaded successfully',
//         certificate
//       });
//     } catch (error) {
//       console.error('❌ Error uploading certificate:', error);
//       return res.status(500).json({
//         success: false,
//         message: 'Failed to upload certificate',
//         error: error.message
//       });
//     }
//   }
// );

router.post(
  '/trainer/upload',
  authenticate,
  permit('trainer'),
  upload.single('certificate'), // multer first
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ success: false, message: 'No file uploaded' });

      const userId = req.user?.id;
      if (!userId)
        return res.status(401).json({ success: false, message: 'User not found' });

      console.log(`📤 Uploading file: ${req.file.originalname} for user ID: ${userId}`);

      const certificate = await uploadExternalCertificate(userId, req.file);

      return res.status(201).json({
        success: true,
        message: 'Certificate uploaded successfully',
        data: { certificate },
      });
    } catch (error) {
      console.error('❌ Error uploading certificate:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload certificate',
        error: error.message,
      });
    }
  }
);


// ========================
// Other Certificate Routes
// ========================
router.get('/:id', 
  authenticate, 
  permit('admin', 'manager', 'trainer'),
  getCertificateById
);

router.get('/:id/download', 
  authenticate, 
  permit('admin', 'manager', 'trainer'),
  downloadCertificate
);

router.post('/:id/revoke', 
  authenticate, 
  permit('admin', 'manager'),
  revokeCertificate
);

// Delete single certificate
router.delete('/:id', 
  authenticate, 
  permit('admin', 'manager'),
  deleteCertificate
);

// Bulk delete certificates
router.post('/bulk/delete', 
  authenticate, 
  permit('admin', 'manager'),
  bulkDeleteCertificates
);
router.use((error, req, res, next) => {
  console.error('❌ Route error handler triggered:', error);

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File too large. Maximum size is 10MB.' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ success: false, message: 'Too many files uploaded.' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ success: false, message: 'Unexpected file field.' });
    }
    return res.status(400).json({ success: false, message: `Upload error: ${error.message}` });
  }

  if (error.message) return res.status(400).json({ success: false, message: error.message });

  return res.status(500).json({ success: false, message: 'Unknown upload error' });
});

export default router;
