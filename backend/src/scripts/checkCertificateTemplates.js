import { CertificateTemplate } from '../config/db.js';

const checkCertificateTemplates = async () => {
  try {
    console.log('🔍 Checking available certificate templates...');
    
    const templates = await CertificateTemplate.findAll({
      attributes: ['id', 'name', 'description']
    });
    
    console.log(`📋 Found ${templates.length} certificate templates:`);
    templates.forEach((template, index) => {
      console.log(`  ${index + 1}. ID: ${template.id}, Name: ${template.name}`);
    });
    
    if (templates.length === 0) {
      console.log('❌ No certificate templates found in database');
    }
    
  } catch (error) {
    console.error('❌ Error checking certificate templates:', error);
  } finally {
    process.exit(0);
  }
};

// Run the function
checkCertificateTemplates();
