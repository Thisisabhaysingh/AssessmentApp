import { Op } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import PDFDocument from 'pdfkit';
import { ok, bad, notFound, serverError, created } from '../utils/responseHelper.js';
import { v4 as uuidv4 } from 'uuid';
import { Certificate, CertificateTemplate, User, Course } from '../config/db.js';
import { uploadFile, deleteFile } from '../utils/fileUpload.js';
import { generateCertificatePdf } from '../services/certificateService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Convert HTML certificate to PDF
  export const generateCertificateNumber = () => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};


const convertHtmlToPdf = async (htmlPath, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      console.log(`📄 Converting HTML to PDF: ${htmlPath} -> ${outputPath}`);

      // Read HTML content
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      console.log(`📄 HTML content length: ${htmlContent.length} characters`);

      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log(`📁 Created directory: ${outputDir}`);
      }

      // Create PDF from HTML content
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: 'Certificate',
          Author: 'Automation Assessment System'
        }
      });

      const writeStream = fs.createWriteStream(outputPath);
      doc.pipe(writeStream);

      // Certificate styling
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      // Background border
      doc.rect(20, 20, pageWidth - 40, pageHeight - 40)
         .lineWidth(8)
         .strokeColor('#2c3e50')
         .stroke();

      // Inner border
      doc.rect(35, 35, pageWidth - 70, pageHeight - 70)
         .lineWidth(2)
         .strokeColor('#34495e')
         .stroke();

      // Header
      doc.fontSize(32)
         .fillColor('#2c3e50')
         .text('CERTIFICATE OF COMPLETION', 0, 100, { align: 'center', width: pageWidth });

      // Subtitle
      doc.fontSize(18)
         .fillColor('#7f8c8d')
         .text('This is to certify that', 0, 160, { align: 'center', width: pageWidth });

      // Extract recipient name from filename or HTML content
      let recipientName = 'Certificate Recipient';

      // Try to extract from filename first
      const filenameMatch = path.basename(htmlPath).match(/certificate-([^-]+)-/);
      if (filenameMatch) {
        recipientName = filenameMatch[1].replace(/[-_]/g, ' ').toUpperCase();
      } else {
        // Try to extract from HTML content
        const nameMatch = htmlContent.match(/<div class="recipient">([^<]+)<\/div>/i) ||
                         htmlContent.match(/recipient[^>]*>([^<]+)</i) ||
                         htmlContent.match(/([A-Z][a-z]+ [A-Z][a-z]+)/);
        if (nameMatch) {
          recipientName = nameMatch[1].trim().toUpperCase();
        }
      }

      // Recipient name
      doc.fontSize(28)
         .fillColor('#2c3e50')
         .text(recipientName, 0, 200, {
           align: 'center',
           width: pageWidth,
           characterSpacing: 2
         });

      // Course completion text
      doc.fontSize(18)
         .fillColor('#7f8c8d')
         .text('has successfully completed the course', 0, 260, { align: 'center', width: pageWidth });

      // Course name - extract from HTML or use default
      let courseName = 'Training Program';
      const courseMatch = htmlContent.match(/<div class="course">([^<]+)<\/div>/i) ||
                         htmlContent.match(/course[^>]*>([^<]+)</i) ||
                         htmlContent.match(/([A-Za-z\s]+Training)/i);
      if (courseMatch) {
        courseName = courseMatch[1].trim();
      }

      doc.fontSize(22)
         .fillColor('#34495e')
         .text(courseName, 0, 300, {
           align: 'center',
           width: pageWidth,
           bold: true
         });

      // Certificate details in boxes
      const boxWidth = (pageWidth - 100) / 2;
      const boxHeight = 60;
      const boxY = 380;

      // Certificate number
      doc.rect(50, boxY, boxWidth, boxHeight)
         .fillColor('#f8f9fa')
         .strokeColor('#2c3e50')
         .lineWidth(1)
         .fillAndStroke();

      doc.fontSize(12)
         .fillColor('#7f8c8d')
         .text('CERTIFICATE NUMBER', 50, boxY + 10, { width: boxWidth, align: 'center' });

      // Extract certificate number from filename
      const certNumberMatch = path.basename(htmlPath).match(/CERT-([A-Z0-9-]+)/) ||
                             path.basename(htmlPath).match(/certificate-([A-Z0-9-]+)/);
      const certNumber = certNumberMatch ? certNumberMatch[1] : 'N/A';

      doc.fontSize(16)
         .fillColor('#2c3e50')
         .text(certNumber, 50, boxY + 30, { width: boxWidth, align: 'center' });

      // Issue date
      doc.rect(50 + boxWidth, boxY, boxWidth, boxHeight)
         .fillColor('#f8f9fa')
         .strokeColor('#2c3e50')
         .lineWidth(1)
         .fillAndStroke();

      doc.fontSize(12)
         .fillColor('#7f8c8d')
         .text('ISSUE DATE', 50 + boxWidth, boxY + 10, { width: boxWidth, align: 'center' });

      doc.fontSize(16)
         .fillColor('#2c3e50')
         .text(new Date().toLocaleDateString(), 50 + boxWidth, boxY + 30, { width: boxWidth, align: 'center' });

      // Footer
      doc.moveTo(50, pageHeight - 100)
         .lineTo(pageWidth - 50, pageHeight - 100)
         .strokeColor('#2c3e50')
         .lineWidth(2)
         .stroke();

      doc.fontSize(20)
         .fillColor('#2c3e50')
         .text('Automation Assessment System', 0, pageHeight - 80, { align: 'center', width: pageWidth });

      doc.fontSize(16)
         .fillColor('#7f8c8d')
         .text('Quality Assurance Department', 0, pageHeight - 60, { align: 'center', width: pageWidth });

      doc.end();

      writeStream.on('finish', () => {
        console.log(`✅ HTML to PDF conversion completed: ${outputPath}`);
        // Verify the PDF was created and has content
        if (fs.existsSync(outputPath)) {
          const stats = fs.statSync(outputPath);
          console.log(`✅ PDF file created successfully: ${stats.size} bytes`);

          // Verify PDF has content (should be > 1000 bytes for a certificate)
          if (stats.size < 1000) {
            console.error(`❌ PDF file too small (${stats.size} bytes), may be corrupted`);
            reject(new Error('PDF file created but appears to be corrupted'));
          } else {
            console.log(`✅ PDF file size is valid: ${stats.size} bytes`);
            resolve(outputPath);
          }
        } else {
          console.error(`❌ PDF file was not created: ${outputPath}`);
          reject(new Error('PDF file was not created'));
        }
      });

      writeStream.on('error', (error) => {
        console.error(`❌ Error creating PDF from HTML:`, error);
        reject(error);
      });
    } catch (error) {
      console.error(`❌ Error in convertHtmlToPdf:`, error);
      reject(error);
    }
  });
};

// Issue a new certificate
export const issueCertificate = async (req, res) => {
  try {
    const { userId, courseId, templateId, expiryDate, metadata } = req.body;
    console.log('Certificate issue request:', { userId, courseId, templateId, expiryDate, metadata });
    
    // Find the template
    const template = await CertificateTemplate.findByPk(templateId);
    console.log('Template found:', template);
    if (!template) {
      return bad(res, 'Certificate template not found', 404);
    }

    // Find user and course
    const [user, course] = await Promise.all([
      User.findByPk(userId),
      courseId ? Course.findByPk(courseId) : Promise.resolve(null)
    ]);

    if (!user) {
      return bad(res, 'User not found', 404);
    }

    if (courseId && !course) {
      return bad(res, 'Course not found', 404);
    }

    // Generate certificate
    const certificateNumber = generateCertificateNumber();
    const certificateData = {
      userId,
      courseId: courseId || null,
      templateId,
      certificateNumber,
      issueDate: new Date(),
      expiryDate: expiryDate || null,
      isAutoGenerated: false,
      metadata: metadata || {}
    };

    // Generate PDF
    console.log('🎨 Generating PDF with template:', template);
    console.log('📄 Template details:', {
      id: template.id,
      name: template.name,
      templateFile: template.templateFile
    });
    
    const pdfPath = await generateCertificatePdf({
      user,
      course,
      template,
      certificateNumber,
      issueDate: certificateData.issueDate,
      expiryDate: certificateData.expiryDate
    });
    
    console.log('✅ PDF generated at:', pdfPath);

    // Save file path
    certificateData.filePath = pdfPath;

    // Create certificate record
    const certificate = await Certificate.create(certificateData);

    return created(res, { certificate }, 'Certificate issued successfully');
  } catch (error) {
    console.error('Error issuing certificate:', error);
    return bad(res, 'Failed to issue certificate');
  }
};

// Get all certificates (with filters)
export const getAllCertificates = async (req, res) => {
  try {
    const { userId, courseId, status } = req.query;
    const where = {};

    if (userId) where.userId = userId;
    if (courseId) where.courseId = courseId;
    if (status) where.status = status;

    console.log(`🔍 Fetching certificates with filters:`, { userId, courseId, status });

    const certificates = await Certificate.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: Course, as: 'course', attributes: ['id', 'name', 'code'] },
        { model: CertificateTemplate, as: 'template', attributes: ['id', 'name', 'thumbnail'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    console.log(`📋 Found ${certificates.length} certificates`);
    if (certificates.length > 0) {
      console.log(`📋 First certificate:`, {
        id: certificates[0].id,
        certificateNumber: certificates[0].certificateNumber,
        user: certificates[0].user?.name,
        course: certificates[0].course?.name,
        status: certificates[0].status
      });
    }

    return ok(res, { certificates });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    console.error('Error details:', error.message, error.stack);
    return serverError(res, error.message || 'Failed to fetch certificates');
  }
};

// Get certificate by ID
export const getCertificateById = async (req, res) => {
  try {
    const { id } = req.params;
    const certificate = await Certificate.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: Course, as: 'course', attributes: ['id', 'name', 'code'] },
        { model: CertificateTemplate, as: 'template', attributes: ['id', 'name', 'thumbnail'] }
      ]
    });

    if (!certificate) {
      return notFound(res, 'Certificate not found');
    }

    return ok(res, { certificate });
  } catch (error) {
    console.error('Error fetching certificate:', error);
    return bad(res, 'Failed to fetch certificate');
  }
};

// Download certificate
export const downloadCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📥 Download request for certificate ID: ${id}`);

    const certificate = await Certificate.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'name'],
          required: false
        }
      ]
    });
    
    console.log(`📄 Certificate found:`, {
      id: certificate?.id,
      certificateNumber: certificate?.certificateNumber,
      filePath: certificate?.filePath,
      status: certificate?.status
    });

    if (!certificate) {
      console.log(`❌ Certificate not found: ${id}`);
      return notFound(res, 'Certificate not found');
    }

    let filePath = certificate.filePath;

    // If no file exists, generate it on-demand
    if (!filePath) {
      console.log(`🎨 Certificate ${id} has no file, generating on-demand...`);
      
      try {
        const certificateData = {
          userId: certificate.userId,
          courseId: certificate.courseId,
          templateId: certificate.templateId,
          certificateNumber: certificate.certificateNumber,
          issueDate: certificate.issueDate,
          metadata: certificate.metadata
        };

        // Get template for certificate generation
        const template = await CertificateTemplate.findByPk(certificate.templateId);
        
        // Generate PDF with correct parameters
        const certificatePdf = await generateCertificatePdf({
          user: certificate.user,
          course: certificate.course,
          template: template,
          certificateNumber: certificate.certificateNumber,
          issueDate: certificate.issueDate,
          expiryDate: certificate.expiryDate
        });
        
        if (certificatePdf && certificatePdf.filePath) {
          // Update certificate with file path
          await certificate.update({
            filePath: certificatePdf.filePath
          });
          
          filePath = certificatePdf.filePath;
          console.log(`✅ PDF generated on-demand for certificate ${certificate.id}: ${filePath}`);
        } else {
          console.log(`⚠️ PDF generation failed for certificate ${certificate.id}, creating placeholder`);
          
          // Create a simple placeholder PDF if generation fails
          const placeholderPath = await createPlaceholderPDF(certificate);
          if (placeholderPath) {
            await certificate.update({
              filePath: placeholderPath
            });
            filePath = placeholderPath;
          }
        }
      } catch (pdfError) {
        console.error(`❌ Error generating PDF for certificate ${certificate.id}:`, pdfError);
        
        // Create placeholder as fallback
        const placeholderPath = await createPlaceholderPDF(certificate);
        if (placeholderPath) {
          await certificate.update({
            filePath: placeholderPath
          });
          filePath = placeholderPath;
        } else {
          return notFound(res, 'Certificate file not found and could not be generated');
        }
      }
    }

    const fullFilePath = path.join(__dirname, '..', '..', filePath);
    console.log(`📁 Looking for file at: ${fullFilePath}`);

    if (!fs.existsSync(fullFilePath)) {
      console.log(`❌ File does not exist: ${fullFilePath}`);
      return notFound(res, 'Certificate file not found on server');
    }

    const fileExtension = path.extname(filePath).toLowerCase();
    const originalMimeType = certificate.metadata?.mimeType || '';

    console.log(`📄 File extension: ${fileExtension}`);
    console.log(`📄 Original MIME type: ${originalMimeType}`);

    // Determine proper content type and filename
    let contentType;
    let fileName;
    let actualFilePath = filePath;

    if (fileExtension === '.pdf' || originalMimeType === 'application/pdf') {
      // PDF files - serve as-is
      contentType = 'application/pdf';
      fileName = `certificate-${certificate.certificateNumber}.pdf`;
      actualFilePath = filePath; // Serve the original PDF file
      console.log(`📄 Serving original PDF file: ${fileName}`);
    } else if (fileExtension === '.html' || originalMimeType === 'text/html') {
      // HTML files - convert to PDF for consistent viewing experience
      console.log(`📄 Converting HTML to PDF: ${fileExtension}`);
      console.log(`📄 Original file path: ${filePath}`);
      console.log(`📄 File exists: ${fs.existsSync(filePath)}`);

      try {
        // Create temporary PDF file path
        const pdfFileName = `certificate-${certificate.certificateNumber}-${Date.now()}.pdf`;
        const tempPdfPath = path.join('uploads', 'certificates', pdfFileName);
        const fullPdfPath = path.join(__dirname, '..', '..', tempPdfPath);

        console.log(`📄 Target PDF path: ${fullPdfPath}`);

        // Convert HTML to PDF
        await convertHtmlToPdf(filePath, fullPdfPath);

        // Verify the PDF was created
        if (!fs.existsSync(fullPdfPath)) {
          throw new Error('PDF conversion failed - file not created');
        }

        const pdfStats = fs.statSync(fullPdfPath);
        console.log(`📄 PDF created successfully: ${pdfStats.size} bytes`);

        // Serve the generated PDF
        contentType = 'application/pdf';
        fileName = `certificate-${certificate.certificateNumber}.pdf`;
        actualFilePath = fullPdfPath;

        console.log(`📄 Generated PDF from HTML: ${fileName}`);
        console.log(`📄 Serving PDF file: ${actualFilePath}`);

        // Set up cleanup to delete the temporary PDF after download completes
        res.on('close', () => {
          // Wait for download to complete, then cleanup
          setTimeout(() => {
            fs.unlink(fullPdfPath, (err) => {
              if (err) {
                console.error('Error deleting temporary PDF:', err);
              } else {
                console.log('✅ Temporary PDF cleaned up');
              }
            });
          }, 5000); // Wait 5 seconds
        });

      } catch (error) {
        console.error(`❌ Error converting HTML to PDF:`, error);
        console.error(`❌ Error stack:`, error.stack);
        // Fallback: serve the HTML as-is
        contentType = 'text/html';
        fileName = `certificate-${certificate.certificateNumber}.html`;
        actualFilePath = filePath; // Make sure we're serving the original HTML file
        console.log(`📄 Serving original HTML file (fallback): ${fileName}, type: ${contentType}`);
        console.log(`📄 Fallback file path: ${actualFilePath}`);
      }
    } else if (['.jpg', '.jpeg', '.png', '.gif', '.svg'].includes(fileExtension) ||
               originalMimeType.startsWith('image/')) {
      // Image files - convert to PDF for consistent viewing experience
      console.log(`🖼️ Converting image to PDF: ${fileExtension}`);

      try {
        // Create temporary PDF file path
        const pdfFileName = `certificate-${certificate.certificateNumber}-${Date.now()}.pdf`;
        const tempPdfPath = path.join('uploads', 'certificates', pdfFileName);
        const fullPdfPath = path.join(__dirname, '..', '..', tempPdfPath);

        // Convert image to PDF
        await convertImageToPdf(filePath, fullPdfPath);

        // Serve the generated PDF
        contentType = 'application/pdf';
        fileName = `certificate-${certificate.certificateNumber}.pdf`;
        actualFilePath = fullPdfPath;

        console.log(`🖼️ Generated PDF from image: ${fileName}`);

        // Set up cleanup to delete the temporary PDF after download completes
        res.on('close', () => {
          // Wait for download to complete, then cleanup
          setTimeout(() => {
            fs.unlink(fullPdfPath, (err) => {
              if (err) {
                console.error('Error deleting temporary PDF:', err);
              } else {
                console.log('✅ Temporary PDF cleaned up');
              }
            });
          }, 5000); // Wait 5 seconds
        });

      } catch (error) {
        console.error(`❌ Error converting image to PDF:`, error);
        // Fallback: serve the image as-is
        if (fileExtension === '.jpg' || fileExtension === '.jpeg' || originalMimeType === 'image/jpeg') {
          contentType = 'image/jpeg';
        } else if (fileExtension === '.png' || originalMimeType === 'image/png') {
          contentType = 'image/png';
        } else if (fileExtension === '.gif' || originalMimeType === 'image/gif') {
          contentType = 'image/gif';
        } else if (fileExtension === '.svg' || originalMimeType === 'image/svg+xml') {
          contentType = 'image/svg+xml';
        } else {
          contentType = 'application/octet-stream';
        }

        fileName = `certificate-${certificate.certificateNumber}${fileExtension}`;
        actualFilePath = filePath; // Make sure we're serving the original image file
        console.log(`🖼️ Serving original image file (fallback): ${fileName}, type: ${contentType}`);
      }
    } else {
      // Unknown file type - serve as binary
      contentType = 'application/octet-stream';
      fileName = `certificate-${certificate.certificateNumber}${fileExtension}`;
      actualFilePath = filePath; // Serve the original file
      console.log(`❓ Unknown file type: ${fileExtension}, serving as binary`);
    }

    console.log(`📤 Sending file: ${fileName}, type: ${contentType}`);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    console.log(`📤 Final download - File path: ${actualFilePath}`);
    console.log(`📤 Final download - File exists: ${fs.existsSync(actualFilePath)}`);
    console.log(`📤 Final download - Content type: ${contentType}`);
    console.log(`📤 Final download - Filename: ${fileName}`);

    // Double-check the file exists right before download
    if (!fs.existsSync(actualFilePath)) {
      console.error(`❌ File not found for download: ${actualFilePath}`);
      return bad(res, 'Certificate file not found');
    }

    const fileStats = fs.statSync(actualFilePath);
    console.log(`📤 File stats: ${fileStats.size} bytes, modified: ${fileStats.mtime}`);

    res.download(actualFilePath, fileName, (err) => {
      if (err) {
        console.error('❌ Error downloading file:', err);
        console.error('❌ Error details:', err.message, err.stack);
        return bad(res, 'Error downloading certificate');
      }
      console.log(`✅ File downloaded successfully: ${fileName}`);
    });
  } catch (error) {
    console.error('❌ Error in download certificate:', error);
    return bad(res, 'Failed to download certificate');
  }
};

// Revoke certificate
export const revokeCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const certificate = await Certificate.findByPk(id);
    if (!certificate) {
      return notFound(res, 'Certificate not found');
    }

    if (certificate.status === 'revoked') {
      return bad(res, 'Certificate is already revoked');
    }

    await certificate.update({
      status: 'revoked',
      metadata: {
        ...certificate.metadata,
        revokedAt: new Date(),
        revokedBy: req.user.id,
        revokeReason: reason
      }
    });

    return ok(res, {}, 'Certificate revoked successfully');
  } catch (error) {
    console.error('Error revoking certificate:', error);
    return bad(res, 'Failed to revoke certificate');
  }
};

// Delete certificate
export const deleteCertificate = async (req, res) => {
  try {
    const { id } = req.params;

    const certificate = await Certificate.findByPk(id);
    if (!certificate) {
      return notFound(res, 'Certificate not found');
    }

    // Delete the file from storage
    if (certificate.filePath) {
      try {
        await deleteFile(certificate.filePath);
        console.log(`🗑️ Certificate file deleted: ${certificate.filePath}`);
      } catch (fileError) {
        console.error(`❌ Error deleting certificate file:`, fileError);
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete certificate from database
    await certificate.destroy();

    console.log(`✅ Certificate deleted: ID ${id}, Number: ${certificate.certificateNumber}`);
    return ok(res, {}, 'Certificate deleted successfully');
  } catch (error) {
    console.error('Error deleting certificate:', error);
    return bad(res, 'Failed to delete certificate');
  }
};

// Bulk delete certificates
export const bulkDeleteCertificates = async (req, res) => {
  try {
    const { certificateIds } = req.body;

    if (!certificateIds || !Array.isArray(certificateIds) || certificateIds.length === 0) {
      return bad(res, 'Certificate IDs are required');
    }

    console.log(`🗑️ Bulk deleting certificates:`, certificateIds);

    const certificates = await Certificate.findAll({
      where: {
        id: certificateIds
      }
    });

    if (certificates.length === 0) {
      return bad(res, 'No certificates found');
    }

    // Delete files from storage
    const deletedFiles = [];
    const failedFiles = [];

    for (const certificate of certificates) {
      if (certificate.filePath) {
        try {
          await deleteFile(certificate.filePath);
          deletedFiles.push(certificate.filePath);
        } catch (fileError) {
          console.error(`❌ Error deleting certificate file ${certificate.filePath}:`, fileError);
          failedFiles.push(certificate.filePath);
        }
      }
    }

    // Delete certificates from database
    await Certificate.destroy({
      where: {
        id: certificateIds
      }
    });

    console.log(`✅ Bulk deleted ${certificates.length} certificates`);
    console.log(`📁 Deleted files: ${deletedFiles.length}, Failed: ${failedFiles.length}`);

    return ok(res, {
      deletedCount: certificates.length,
      deletedFiles: deletedFiles.length,
      failedFiles: failedFiles.length
    }, `${certificates.length} certificates deleted successfully`);
  } catch (error) {
    console.error('Error in bulk delete certificates:', error);
    return bad(res, 'Failed to delete certificates');
  }
};

// Upload external certificate
// 

// export const uploadExternalCertificate = async (userId, file) => {
//   console.log(`🎯 Upload controller reached for user ID: ${userId}`);
//   console.log(`📁 File info:`, {
//     originalname: file.originalname,
//     mimetype: file.mimetype,
//     size: file.size
//   });

//   if (!file) throw new Error('No file provided for upload');

//   // Verify user exists
//   const user = await User.findByPk(userId);
//   if (!user) throw new Error('User not found');

//   console.log(`👤 User verified: ${user.name} (ID: ${user.id})`);

//   // Upload file to storage
//   const uploadResult = await uploadFile(file, 'certificates'); // Returns { path, filename, etc. }
//   console.log(`✅ File uploaded successfully:`, uploadResult);

//   // Create certificate record in DB
//   const certificate = await Certificate.create({
//     userId,
//     certificateNumber: `EXT-${generateCertificateNumber()}`,
//     issueDate: new Date(),
//     status: 'active',
//     isAutoGenerated: false,
//     filePath: uploadResult.path,
//     metadata: {
//       isExternal: true,
//       originalName: file.originalname,
//       mimeType: file.mimetype
//     }
//   });

//   console.log(`🎉 Certificate created: ID ${certificate.id}, Number: ${certificate.certificateNumber}`);

//   return certificate;
// };

export const uploadExternalCertificate = async (userId, file) => {
  console.log(`🎯 Upload controller reached for user ID: ${userId}`);
  console.log(`📁 File info:`, {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });

  if (!file) throw new Error('No file provided for upload');

  // Verify user exists
  const user = await User.findByPk(userId);
  if (!user) throw new Error('User not found');

  console.log(`👤 User verified: ${user.name} (ID: ${user.id})`);

  // Upload file to storage
  const uploadResult = await uploadFile(file, 'certificates'); // Returns { path, filename, etc. }
  console.log(`✅ File uploaded successfully:`, uploadResult);
  

  // Create certificate record in DB
  const certificate = await Certificate.create({
    userId,
    certificateNumber: `EXT-${generateCertificateNumber()}`,
    issueDate: new Date(),
    status: 'active',
    isAutoGenerated: false,
    filePath: uploadResult.path,
    metadata: {
      isExternal: true,
      originalName: file.originalname,
      mimeType: file.mimetype
    }
  });

  console.log(`🎉 Certificate created: ID ${certificate.id}, Number: ${certificate.certificateNumber}`);

  return certificate;
};

// Create placeholder PDF when certificate generation fails
const createPlaceholderPDF = async (certificate) => {
  try {
    // Use existing imports (ES modules don't support require)
    
    // Create certificates directory if it doesn't exist
    const certificatesDir = path.join(__dirname, '..', '..', 'certificates');
    if (!fs.existsSync(certificatesDir)) {
      fs.mkdirSync(certificatesDir, { recursive: true });
    }
    
    // Generate filename
    const filename = `certificate-${certificate.id}-${Date.now()}.pdf`;
    const filePath = path.join('certificates', filename);
    const fullPath = path.join(__dirname, '..', '..', filePath);
    
    // Create a simple PDF
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(fullPath));
    
    // Add certificate content
    doc.fontSize(20)
       .text('Certificate of Completion', { align: 'center' })
       .moveDown();
    
    doc.fontSize(16)
       .text(`Certificate Number: ${certificate.certificateNumber}`, { align: 'center' })
       .moveDown();
    
    doc.fontSize(14)
       .text(`This is to certify that`, { align: 'center' })
       .moveDown();
    
    doc.fontSize(18)
       .text(certificate.user?.name || 'Trainer', { align: 'center' })
       .moveDown();
    
    doc.fontSize(14)
       .text('has successfully completed the requirements', { align: 'center' })
       .moveDown();
    
    if (certificate.course) {
      doc.fontSize(16)
         .text(certificate.course.name, { align: 'center' })
         .moveDown();
    }
    
    doc.fontSize(14)
       .text(`Issued on: ${new Date(certificate.issueDate).toLocaleDateString()}`, { align: 'center' });
    
    doc.end();
    
    console.log(`📄 Placeholder PDF created: ${filePath}`);
    return filePath;
    
  } catch (error) {
    console.error('❌ Error creating placeholder PDF:', error);
    return null;
  }
};

