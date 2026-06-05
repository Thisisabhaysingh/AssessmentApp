import { Certificate, User, Course } from '../config/db.js';
import { generateCertificatePdf } from '../services/certificateService.js';
import fs from 'fs';
import path from 'path';

const generateCertificatePDFs = async () => {
  try {
    console.log('🔍 Finding certificates without PDF files...');
    
    // Get all certificates that have no filePath
    const certificatesWithoutPDF = await Certificate.findAll({
      where: {
        filePath: null
      },
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

    console.log(`📋 Found ${certificatesWithoutPDF.length} certificates without PDF files`);

    let pdfsGenerated = 0;
    let pdfsFailed = 0;

    for (const certificate of certificatesWithoutPDF) {
      try {
        console.log(`🎨 Generating PDF for certificate ${certificate.id} (${certificate.certificateNumber})...`);
        
        // Prepare certificate data for PDF generation
        const certificateData = {
          userId: certificate.userId,
          courseId: certificate.courseId,
          templateId: certificate.templateId,
          certificateNumber: certificate.certificateNumber,
          issueDate: certificate.issueDate,
          metadata: certificate.metadata
        };

        // Generate PDF
        const certificatePdf = await generateCertificatePdf(certificateData, certificate.user);
        
        if (certificatePdf && certificatePdf.filePath) {
          // Update certificate with file path
          await certificate.update({
            filePath: certificatePdf.filePath
          });
          
          console.log(`✅ PDF generated for certificate ${certificate.id}: ${certificatePdf.filePath}`);
          pdfsGenerated++;
        } else {
          console.log(`⚠️ PDF generation returned null for certificate ${certificate.id}`);
          pdfsFailed++;
        }

      } catch (error) {
        console.error(`❌ Error generating PDF for certificate ${certificate.id}:`, error);
        pdfsFailed++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`✅ PDFs generated: ${pdfsGenerated}`);
    console.log(`❌ PDFs failed: ${pdfsFailed}`);
    console.log(`📋 Total certificates processed: ${certificatesWithoutPDF.length}`);

  } catch (error) {
    console.error('❌ Error generating certificate PDFs:', error);
  } finally {
    process.exit(0);
  }
};

// Run the function
generateCertificatePDFs();
