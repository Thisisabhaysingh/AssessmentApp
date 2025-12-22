import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import PDFDocument from 'pdfkit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Generate a PDF certificate
 * @param {Object} options - Certificate options
 * @param {Object} options.user - User details
 * @param {Object} options.course - Course details
 * @param {Object} options.template - Template details
 * @param {string} options.certificateNumber - Certificate number
 * @param {Date} options.issueDate - Issue date
 * @param {Date} [options.expiryDate] - Expiry date (optional)
 * @returns {Promise<string>} - Path to the generated PDF
 */
const generateCertificatePdf = async ({ user, course, template, certificateNumber, issueDate, expiryDate }) => {
  try {
    const certificateData = {
      user: {
        name: user.name,
        email: user.email
      },
      course: course ? {
        name: course.name,
        code: course.code
      } : null,
      certificateNumber,
      issueDate: issueDate.toISOString(),
      expiryDate: expiryDate ? expiryDate.toISOString() : null,
      template: {
        name: template.name,
        templateFile: template.templateFile
      },
      generatedAt: new Date().toISOString()
    };

    // Create certificate content based on template
    let certificateContent = '';
    const fileExtension = path.extname(template.templateFile) || '.txt';

    if (template.templateFile && fs.existsSync(path.join(process.cwd(), template.templateFile))) {
      // Read template file
      const templateContent = fs.readFileSync(path.join(process.cwd(), template.templateFile), 'utf8');

      // Replace placeholders
      certificateContent = templateContent
        .replace(/\[RECIPIENT_NAME\]/g, user.name)
        .replace(/\[COURSE_NAME\]/g, course ? course.name : 'General Training')
        .replace(/\[CERTIFICATE_NUMBER\]/g, certificateNumber)
        .replace(/\[ISSUE_DATE\]/g, issueDate.toLocaleDateString())
        .replace(/\[ORGANIZATION_NAME\]/g, 'Automation Assessment System');
    } else {
      // Fallback certificate content
      certificateContent = `CERTIFICATE OF COMPLETION

This is to certify that

${user.name}

has successfully completed the course

${course ? course.name : 'Training Program'}

Certificate Number: ${certificateNumber}
Issue Date: ${issueDate.toLocaleDateString()}

Automation Assessment System
Quality Assurance Department`;
    }

    // Generate PDF certificate
    const fileName = `certificate-${certificateNumber}-${Date.now()}.pdf`;
    const filePath = path.join('uploads', 'certificates', fileName);
    const fullPath = path.join(process.cwd(), filePath);

    // Ensure directory exists
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: `Certificate - ${certificateNumber}`,
        Author: 'Automation Assessment System'
      }
    });

    // Pipe to file
    const stream = fs.createWriteStream(fullPath);
    doc.pipe(stream);

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

    // Recipient name
    doc.fontSize(28)
       .fillColor('#2c3e50')
       .text(user.name.toUpperCase(), 0, 200, {
         align: 'center',
         width: pageWidth,
         characterSpacing: 2
       });

    // Course completion text
    doc.fontSize(18)
       .fillColor('#7f8c8d')
       .text('has successfully completed the course', 0, 260, { align: 'center', width: pageWidth });

    // Course name
    if (course) {
      doc.fontSize(22)
         .fillColor('#34495e')
         .text(course.name, 0, 300, {
           align: 'center',
           width: pageWidth,
           bold: true
         });
    } else {
      doc.fontSize(22)
         .fillColor('#34495e')
         .text('Training Program', 0, 300, {
           align: 'center',
           width: pageWidth,
           bold: true
         });
    }

    // Certificate details in boxes
    const boxWidth = (pageWidth - 100) / 2;
    const boxHeight = 60;
    const boxY = 380;

    // Certificate number box
    doc.rect(50, boxY, boxWidth, boxHeight)
       .fillColor('#f8f9fa')
       .strokeColor('#2c3e50')
       .lineWidth(1)
       .fillAndStroke();

    doc.fontSize(12)
       .fillColor('#7f8c8d')
       .text('CERTIFICATE NUMBER', 50, boxY + 10, { width: boxWidth, align: 'center' });

    doc.fontSize(16)
       .fillColor('#2c3e50')
       .text(certificateNumber, 50, boxY + 30, { width: boxWidth, align: 'center' });

    // Issue date box
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
       .text(issueDate.toLocaleDateString(), 50 + boxWidth, boxY + 30, { width: boxWidth, align: 'center' });

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

    // Finalize PDF
    doc.end();

    // Wait for the file to be written
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    return filePath;
  } catch (error) {
    console.error('Error generating certificate:', error);
    throw new Error('Failed to generate certificate');
  }
};

export {
  generateCertificatePdf
};

// PDF generation is now implemented using PDFKit
// Certificates are generated as proper PDF files with professional styling
