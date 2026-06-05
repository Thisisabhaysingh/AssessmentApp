import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import PDFDocument from 'pdfkit';
import mammoth from 'mammoth';

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
    console.log('🎯 Generating certificate with template:', template);
    console.log('📄 Template file path:', template.templateFile);
    console.log('👤 User data available:', user);
    console.log('📚 Course data available:', course);
    
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
    const fullTemplatePath = path.join(process.cwd(), template.templateFile);
    
    console.log('🔍 Full template path:', fullTemplatePath);
    console.log('📁 Template file exists:', fs.existsSync(fullTemplatePath));

    if (template.templateFile && fs.existsSync(fullTemplatePath)) {
      // Read template file
      console.log('📖 Reading template file...');
      let templateContent = '';
      
      if (fileExtension === '.docx') {
        console.log('📄 Processing DOCX file with mammoth...');
        const result = await mammoth.extractRawText({path: fullTemplatePath});
        templateContent = result.value;
        console.log('📝 DOCX content preview:', templateContent.substring(0, 100) + '...');
      } else {
        // Read as plain text for other file types
        templateContent = fs.readFileSync(fullTemplatePath, 'utf8');
        console.log('📝 Text content preview:', templateContent.substring(0, 100) + '...');
      }

      // Replace placeholders (support both formats)
      console.log('🔄 Replacing placeholders...');
      certificateContent = templateContent
        .replace(/\[RECIPIENT_NAME\]/g, user.name)
        .replace(/\[COURSE_NAME\]/g, course ? course.name : 'General Training')
        .replace(/\[CERTIFICATE_NUMBER\]/g, certificateNumber)
        .replace(/\[ISSUE_DATE\]/g, issueDate.toLocaleDateString())
        .replace(/\[ORGANIZATION_NAME\]/g, 'Automation Assessment System')
        // Support double curly braces format
        .replace(/\{\{recipientName\}\}/g, user.name)
        .replace(/\{\{courseName\}\}/g, course ? course.name : 'General Training')
        .replace(/\{\{certificateNumber\}\}/g, certificateNumber)
        .replace(/\{\{issueDate\}\}/g, issueDate.toLocaleDateString())
        .replace(/\{\{organizationName\}\}/g, 'Automation Assessment System')
        // Additional placeholders from DOCX template
        .replace(/\{\{trainerId\}\}/g, user.id?.toString() || '')
        .replace(/\{\{email\}\}/g, user.email || '')
        .replace(/\{\{phone\}\}/g, user.phone || '')
        .replace(/\{\{trainerId\}\}/g, user.id?.toString() || '');
      
      console.log('✅ Placeholder replacement complete');
      console.log('📝 Final content preview:', certificateContent.substring(0, 200) + '...');
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

    // Generate PDF certificate using template content
    const fileName = `certificate-${certificateNumber}-${Date.now()}.pdf`;
    const filePath = path.join('uploads', 'certificates', fileName);
    const fullPath = path.join(process.cwd(), filePath);

    // Ensure directory exists
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });

    console.log('� Generating PDF with template content...');

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

    // Add the processed template content to PDF
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#000')
       .text(certificateContent, 50, 50, { 
         width: doc.page.width - 100,
         align: 'left'
       });

    // Finalize PDF
    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    });
  } catch (error) {
    console.error('Error generating certificate PDF:', error);
    throw error;
  }
};

export {
  generateCertificatePdf
};

// PDF generation is now implemented using PDFKit
// Certificates are generated as proper PDF files with professional styling
