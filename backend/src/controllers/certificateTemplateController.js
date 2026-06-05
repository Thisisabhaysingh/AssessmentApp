import { Op } from 'sequelize';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { CertificateTemplate } from '../config/db.js';
import { ok, created, bad, notFound } from '../utils/responseHelper.js';
import { uploadFile, deleteFile } from '../utils/fileUpload.js';

// Preview template
export const previewTemplate = async (req, res) => {
  try {
    console.log('🔍 Preview template called with ID:', req.params.id);
    
    const { id } = req.params;
    
    const template = await CertificateTemplate.findByPk(id);
    console.log('🔍 Found template:', template ? template.name : 'Not found');
    
    if (!template) {
      console.log('❌ Template not found');
      return notFound(res, 'Template not found');
    }

    // Read the template file
    const templatePath = path.join(process.cwd(), template.templateFile);
    console.log('🔍 Template path:', templatePath);
    console.log('🔍 File exists:', fs.existsSync(templatePath));
    
    if (!fs.existsSync(templatePath)) {
      console.log('❌ Template file not found');
      return notFound(res, 'Template file not found');
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
    let contentType = 'text/html';
    
    if (ext === '.pdf') {
      contentType = 'application/pdf';
    } else if (ext === '.txt') {
      contentType = 'text/plain';
    } else if (ext === '.doc' || ext === '.docx') {
      contentType = 'application/msword';
    }

    console.log('🔍 Content type:', contentType);
    console.log('🔍 File extension:', ext);

    // Set appropriate headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="preview-${template.name}${ext}"`);
    
    console.log('🔍 Sending preview response...');

    // Send the preview content
    if (ext === '.pdf') {
      // For PDF files, read and send as binary
      const pdfContent = fs.readFileSync(templatePath);
      res.send(pdfContent);
    } else {
      // For text-based files, send the processed content
      res.send(templateContent);
    }

    console.log('✅ Preview sent successfully');
  } catch (error) {
    console.error('❌ Error previewing template:', error);
    return bad(res, 'Failed to preview template');
  }
};

// Create a new certificate template
export const createTemplate = async (req, res) => {
  try {
    const { name, description, isDefault, fields } = req.body;
    const templateFile = req.files?.templateFile?.[0];
    const thumbnail = req.files?.thumbnail?.[0];

    if (!templateFile) {
      return bad(res, 'Template file is required');
    }

    // Check if template name already exists
    const existingTemplate = await CertificateTemplate.findOne({
      where: { name: name.trim() }
    });

    if (existingTemplate) {
      return bad(res, 'A template with this name already exists. Please choose a different name.');
    }

    // If setting as default, unset current default
    if (isDefault) {
      await CertificateTemplate.update(
        { isDefault: false },
        { where: { isDefault: true } }
      );
    }

    // Upload files
    const [templatePath, thumbnailPath] = await Promise.all([
      uploadFile(templateFile, 'certificate-templates'),
      thumbnail ? uploadFile(thumbnail, 'certificate-thumbnails') : Promise.resolve(null)
    ]);

    // Create template
    const template = await CertificateTemplate.create({
      name: name.trim(),
      description,
      templateFile: templatePath.path,
      thumbnail: thumbnailPath?.path || null,
      isDefault: !!isDefault,
      fields: fields ? JSON.parse(fields) : null
    });

    return created(res, { template }, 'Certificate template created successfully');
  } catch (error) {
    console.error('Error creating certificate template:', error);
    
    // Handle specific database errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      return bad(res, 'A template with this name already exists. Please choose a different name.');
    }
    
    // Handle file upload errors
    if (error.message.includes('Invalid file type')) {
      return bad(res, error.message);
    }
    
    return bad(res, 'Failed to create certificate template');
  }
};

// Get all templates
export const getAllTemplates = async (req, res) => {
  try {
    const { isActive } = req.query;
    const where = {};
    
    if (isActive !== undefined) {
      where.status = isActive === 'true' ? 'active' : 'inactive';
    }

    const templates = await CertificateTemplate.findAll({
      where,
      order: [['isDefault', 'DESC'], ['name', 'ASC']]
    });

    return ok(res, { templates });
  } catch (error) {
    console.error('Error fetching certificate templates:', error);
    return bad(res, 'Failed to fetch certificate templates');
  }
};

// Get template by ID
export const getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await CertificateTemplate.findByPk(id);

    if (!template) {
      return notFound(res, 'Certificate template not found');
    }

    return ok(res, { template });
  } catch (error) {
    console.error('Error fetching certificate template:', error);
    return bad(res, 'Failed to fetch certificate template');
  }
};

// Update template
export const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isDefault, status, fields } = req.body;
    const templateFile = req.files?.templateFile?.[0];
    const thumbnail = req.files?.thumbnail?.[0];

    const template = await CertificateTemplate.findByPk(id);
    if (!template) {
      return notFound(res, 'Certificate template not found');
    }

    // If setting as default, unset current default
    if (isDefault && !template.isDefault) {
      await CertificateTemplate.update(
        { isDefault: false },
        { where: { isDefault: true } }
      );
    }

    // Upload new files if provided
    const [templatePath, thumbnailPath] = await Promise.all([
      templateFile ? uploadFile(templateFile, 'certificate-templates') : Promise.resolve(null),
      thumbnail ? uploadFile(thumbnail, 'certificate-thumbnails') : Promise.resolve(null)
    ]);

    // Delete old files if new ones are uploaded
    const updateData = {
      name: name || template.name,
      description: description !== undefined ? description : template.description,
      isDefault: isDefault !== undefined ? isDefault : template.isDefault,
      status: status || template.status,
      fields: fields ? JSON.parse(fields) : template.fields
    };

    if (templatePath) {
      // Delete old template file
      if (template.templateFile) {
        await deleteFile(template.templateFile);
      }
      updateData.templateFile = templatePath.path;
    }

    if (thumbnailPath) {
      // Delete old thumbnail
      if (template.thumbnail) {
        await deleteFile(template.thumbnail);
      }
      updateData.thumbnail = thumbnailPath.path;
    }

    await template.update(updateData);

    return ok(res, { template }, 'Certificate template updated successfully');
  } catch (error) {
    console.error('Error updating certificate template:', error);
    return bad(res, 'Failed to update certificate template');
  }
};

// Delete template
export const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    
    const template = await CertificateTemplate.findByPk(id);
    if (!template) {
      return notFound(res, 'Certificate template not found');
    }

    if (template.isDefault) {
      return bad(res, 'Cannot delete default template');
    }

    // Check if template is in use
    const inUse = await Certificate.count({ where: { templateId: id } });
    if (inUse > 0) {
      return bad(res, 'Cannot delete template that is in use');
    }

    // Delete files
    await Promise.all([
      template.templateFile ? deleteFile(template.templateFile) : Promise.resolve(),
      template.thumbnail ? deleteFile(template.thumbnail) : Promise.resolve()
    ]);

    // Delete template
    await template.destroy();

    return ok(res, {}, 'Certificate template deleted successfully');
  } catch (error) {
    console.error('Error deleting certificate template:', error);
    return bad(res, 'Failed to delete certificate template');
  }
};

// Set default template
export const setDefaultTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await CertificateTemplate.findByPk(id);
    if (!template) {
      return notFound(res, 'Certificate template not found');
    }

    if (template.isDefault) {
      return ok(res, { template }, 'Template is already set as default');
    }

    // Start transaction
    const transaction = await CertificateTemplate.sequelize.transaction();

    try {
      // Unset current default
      await CertificateTemplate.update(
        { isDefault: false },
        { where: { isDefault: true }, transaction }
      );

      // Set new default
      await template.update({ isDefault: true }, { transaction });

      await transaction.commit();
      return ok(res, { template }, 'Default template updated successfully');
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error setting default template:', error);
    return bad(res, 'Failed to set default template');
  }
};
