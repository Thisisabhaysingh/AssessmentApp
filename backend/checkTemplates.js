import { CertificateTemplate } from './src/config/db.js';

CertificateTemplate.findAll().then(templates => {
  console.log('📋 All certificate templates in database:');
  if (templates.length === 0) {
    console.log('  No templates found');
  } else {
    templates.forEach(t => {
      console.log(`  - ID: ${t.id}, Name: "${t.name}", Default: ${t.isDefault}, Status: ${t.status}`);
      console.log(`    Template File: ${t.templateFile}`);
      console.log(`    Created: ${t.createdAt}`);
    });
  }
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
