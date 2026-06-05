import { Certificate, User, Course } from '../config/db.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const testPlaceholderPDF = async () => {
  try {
    console.log('🎯 Testing placeholder PDF generation...');
    
    // Get certificate 16 (L1 certificate)
    const certificateId = 16;
    
    const certificate = await Certificate.findByPk(certificateId, {
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

    if (!certificate) {
      console.log('❌ Certificate not found');
      return;
    }

    console.log('📄 Certificate found:', {
      id: certificate.id,
      certificateNumber: certificate.certificateNumber,
      user: certificate.user?.name,
      course: certificate.course?.name,
      filePath: certificate.filePath
    });
    
    // Create certificates directory if it doesn't exist
    const certificatesDir = path.join(process.cwd(), 'certificates');
    if (!fs.existsSync(certificatesDir)) {
      fs.mkdirSync(certificatesDir, { recursive: true });
      console.log('📁 Created certificates directory');
    }
    
    // Generate filename
    const filename = `certificate-${certificate.id}-${Date.now()}.pdf`;
    const filePath = path.join('certificates', filename);
    const fullPath = path.join(process.cwd(), filePath);
    
    console.log(`🎨 Creating placeholder PDF: ${fullPath}`);
    
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
       .text('This is to certify that', { align: 'center' })
       .moveDown();
    
    doc.fontSize(18)
       .text(certificate.user?.name || 'Trainer', { align: 'center' })
       .moveDown();
    
    doc.fontSize(14)
       .text('has successfully achieved the following:', { align: 'center' })
       .moveDown();
    
    if (certificate.course) {
      doc.fontSize(16)
         .text(certificate.course.name, { align: 'center' })
         .moveDown();
    } else {
      doc.fontSize(16)
         .text('Level 1 Trainer Certification', { align: 'center' })
         .moveDown();
    }
    
    doc.fontSize(14)
       .text(`Issued on: ${new Date(certificate.issueDate).toLocaleDateString()}`, { align: 'center' });
    
    doc.end();
    
    // Wait for PDF to be created
    setTimeout(async () => {
      if (fs.existsSync(fullPath)) {
        console.log(`✅ Placeholder PDF created successfully: ${filePath}`);
        
        // Update certificate with file path
        await certificate.update({
          filePath: filePath
        });
        
        console.log(`✅ Certificate ${certificate.id} updated with file path`);
        
        // Check file size
        const stats = fs.statSync(fullPath);
        console.log(`📄 File size: ${stats.size} bytes`);
        
      } else {
        console.log(`❌ Failed to create PDF file`);
      }
      
      process.exit(0);
    }, 1000);
    
  } catch (error) {
    console.error('❌ Error creating placeholder PDF:', error);
    process.exit(1);
  }
};

// Run the function
testPlaceholderPDF();
