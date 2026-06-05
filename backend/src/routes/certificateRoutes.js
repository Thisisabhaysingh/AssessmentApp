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
  setDefaultTemplate,
  previewTemplate
} from '../controllers/certificateTemplateController.js';

import { upload } from '../utils/fileUpload.js';
import multer from 'multer';
import { User } from '../config/db.js';

const router = express.Router();

console.log('🔧 Registering certificate routes...');
console.log('✅ Certificate routes file loaded successfully');

// PREVIEW ROUTE - Must be FIRST to avoid conflicts
router.get('/template-preview/:id', async (req, res) => {
  try {
    console.log('🔍 PREVIEW ROUTE HIT! ID:', req.params.id);
    
    // Import here to avoid circular dependency
    const { CertificateTemplate } = await import('../config/db.js');
    const fs = await import('fs');
    const path = await import('path');
    
    // Get the template from database
    const template = await CertificateTemplate.findByPk(req.params.id);
    if (!template) {
      console.log('❌ Template not found');
      return res.status(404).json({ error: 'Template not found' });
    }
    
    console.log('🔍 Found template:', template.name);
    console.log('🔍 Template file:', template.templateFile);
    
    // Read the actual template file
    const templatePath = path.join(process.cwd(), template.templateFile);
    console.log('🔍 Full path:', templatePath);
    
    if (!fs.existsSync(templatePath)) {
      console.log('❌ Template file not found at:', templatePath);
      return res.status(404).json({ error: 'Template file not found' });
    }
    
    let templateContent = fs.readFileSync(templatePath, 'utf8');
    console.log('🔍 Template content length:', templateContent.length);
    
    // Replace placeholders with sample data
    const sampleData = {
      recipientName: 'John Doe',
      courseName: 'Sample Course',
      issueDate: new Date().toLocaleDateString(),
      certificateNumber: 'CERT-2024-001',
      organizationName: 'Sample Organization',
      trainerLevel: 'L2',
      totalScore: '95',
      maxScore: '100',
      percentage: '95%',
      grade: 'A',
      totalAssessments: '20',
      passingAssessments: '19',
      achievement: 'Excellence in Training',
      signatoryName: 'Jane Smith',
      signatoryTitle: 'Training Manager',
      completionDate: new Date().toLocaleDateString(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString()
    };
    
    // Replace common placeholders
    Object.keys(sampleData).forEach(key => {
      const placeholder = `{{${key}}}`;
      templateContent = templateContent.replace(new RegExp(placeholder, 'g'), sampleData[key]);
    });
    
    // Determine content type based on file extension
    const ext = path.extname(template.templateFile).toLowerCase();
    console.log('🔍 File extension:', ext);
    
    if (ext === '.pdf') {
      // For PDF files, send as binary
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="preview-${template.name}.pdf"`);
      const pdfContent = fs.readFileSync(templatePath);
      res.send(pdfContent);
    } else if (ext === '.doc' || ext === '.docx') {
      // For Word files, use mammoth to extract actual content
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `inline; filename="preview-${template.name}.html"`);
      
      try {
        // Import mammoth to extract Word document content
        const mammoth = await import('mammoth');
        
        // Read the Word document
        const wordBuffer = fs.readFileSync(templatePath);
        
        // Convert Word to HTML
        const result = await mammoth.convertToHtml({ buffer: wordBuffer });
        let wordContent = result.value;
        
        // Replace placeholders with sample data
        Object.keys(sampleData).forEach(key => {
          const placeholder = `{{${key}}}`;
          wordContent = wordContent.replace(new RegExp(placeholder, 'g'), sampleData[key]);
        });
        
        // Wrap in a nice HTML structure
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${template.name} Preview</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    padding: 20px; 
                    background: #f5f5f5; 
                    margin: 0;
                }
                .preview-container { 
                    max-width: 900px; 
                    margin: 0 auto; 
                    background: white; 
                    padding: 20px; 
                    border: 1px solid #ddd;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .preview-header { 
                    background: #007bff; 
                    color: white; 
                    padding: 15px; 
                    margin: -20px -20px 20px -20px; 
                    text-align: center;
                }
                .word-content {
                    /* Preserve original Word document styling as much as possible */
                    line-height: 1.6;
                }
                .word-content h1 { font-size: 24px; color: #333; }
                .word-content h2 { font-size: 20px; color: #444; }
                .word-content p { margin: 10px 0; }
                .word-content table { border-collapse: collapse; width: 100%; }
                .word-content td, .word-content th { border: 1px solid #ddd; padding: 8px; }
                .footer { 
                    margin-top: 30px; 
                    padding-top: 20px; 
                    border-top: 1px solid #eee; 
                    font-size: 12px; 
                    color: #666; 
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <div class="preview-container">
                <div class="preview-header">
                    <h2>📄 Preview: ${template.name}</h2>
                    <p>Your actual Word document template with sample data</p>
                </div>
                
                <div class="word-content">
                    ${wordContent}
                </div>
                
                <div class="footer">
                    <p><strong>Note:</strong> This is your actual Word document template with placeholder data replaced.</p>
                    <p>Original file: ${template.templateFile}</p>
                </div>
            </div>
        </body>
        </html>`;
        
        res.send(htmlContent);
        
      } catch (error) {
        console.error('Error processing Word document with mammoth:', error);
        // Fallback to simple preview
        const fallbackContent = `
        <!DOCTYPE html>
        <html>
        <head><title>${template.name} Preview</title></head>
        <body>
            <h2>Preview: ${template.name}</h2>
            <p><strong>Template File:</strong> ${template.templateFile}</p>
            <p><strong>Type:</strong> Word Document (.${ext})</p>
            <p><em>Unable to process Word document. Please ensure it's a valid .docx file.</em></p>
        </body>
        </html>`;
        res.send(fallbackContent);
      }
    } else {
      // For text/HTML files, send as HTML
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `inline; filename="preview-${template.name}.html"`);
      res.send(templateContent);
    }
    
    console.log('✅ Preview sent successfully');
    
  } catch (error) {
    console.error('❌ Preview error:', error);
    res.status(500).json({ error: 'Failed to preview template' });
  }
});

console.log('✅ Preview route registered at TOP: GET /template-preview/:id');

// TEST ROUTE - This should always work
router.get('/test-simple', (req, res) => {
  console.log('🎯 SIMPLE TEST ROUTE HIT!');
  res.json({ message: 'Simple test works!', timestamp: new Date().toISOString() });
});

// Simple test route - should always work
router.get('/ping', (req, res) => {
  console.log('🏓 Ping route hit!');
  res.json({ message: 'pong', timestamp: new Date().toISOString() });
});

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

router.get('/test', (req, res) => {
  console.log('🔍 Test route hit!');
  res.json({ message: 'Test route working!' });
});

router.get('/templates', 
  authenticate, 
  permit('admin', 'manager', 'trainer'),
  getAllTemplates
);

// SIMPLE PREVIEW ROUTE - This should work
router.get('/template-preview/:id', async (req, res) => {
  try {
    console.log('🔍 PREVIEW ROUTE HIT! ID:', req.params.id);
    
    // Simple static HTML for testing
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Certificate Preview</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
            .certificate { border: 3px solid #gold; padding: 30px; max-width: 600px; margin: 0 auto; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
            .name { font-size: 18px; margin: 10px 0; }
            .course { font-style: italic; margin: 10px 0; }
            .date { margin-top: 30px; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="certificate">
            <div class="title">CERTIFICATE OF COMPLETION</div>
            <div class="name">This is to certify that</div>
            <div class="name"><strong>John Doe</strong></div>
            <div class="course">has successfully completed the course</div>
            <div class="course"><strong>Sample Course</strong></div>
            <div class="date">Issued on: ${new Date().toLocaleDateString()}</div>
            <div class="date">Certificate: CERT-2024-001</div>
        </div>
    </body>
    </html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(htmlContent);
    
  } catch (error) {
    console.error('❌ Preview error:', error);
    res.status(500).json({ error: 'Failed to preview template' });
  }
});

console.log('✅ Simple Preview route registered: GET /template-preview/:id');

// Change the regular template route to be more specific
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
