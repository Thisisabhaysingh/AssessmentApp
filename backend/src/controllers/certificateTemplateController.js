import { Op } from 'sequelize';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { CertificateTemplate } from '../config/db.js';
import { ok, created, bad, notFound } from '../utils/responseHelper.js';
import { uploadFile, deleteFile } from '../utils/fileUpload.js';

// Create a new certificate template
export const createTemplate = async (req, res) => {
  try {
    const { name, description, isDefault, fields } = req.body;
    const templateFile = req.files?.templateFile?.[0];
    const thumbnail = req.files?.thumbnail?.[0];

    if (!templateFile) {
      return bad(res, 'Template file is required');
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
      name,
      description,
      templateFile: templatePath.path,
      thumbnail: thumbnailPath?.path || null,
      isDefault: !!isDefault,
      fields: fields ? JSON.parse(fields) : null
    });

    return created(res, { template }, 'Certificate template created successfully');
  } catch (error) {
    console.error('Error creating certificate template:', error);
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
