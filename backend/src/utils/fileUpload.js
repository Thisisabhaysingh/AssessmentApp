import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import {mkdirp} from 'mkdirp';

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    
    // Create directory if it doesn't exist
    mkdirp.sync(uploadDir);
    
    // Create subdirectory based on file type
    let subDir = 'temp';
    if (file.fieldname === 'templateFile') {
      subDir = 'certificate-templates';
    } else if (file.fieldname === 'thumbnail') {
      subDir = 'certificate-thumbnails';
    } else if (file.fieldname === 'certificate') {
      subDir = 'certificates';
    }
    
    const dir = path.join(uploadDir, subDir);
    mkdirp.sync(dir);
    
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  console.log(`📁 File filter check:`, {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });

  // Check file types based on field name
  let allowedTypes = [];
  
  if (file.fieldname === 'templateFile') {
    // Certificate templates can be documents, PDF, or images
    allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'text/plain',
      'text/html',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/gif',
      'image/svg+xml'
    ];
  } else if (file.fieldname === 'thumbnail') {
    // Thumbnails are images only
    allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/gif',
      'image/svg+xml'
    ];
  } else {
    // Default: PDF and images
    allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/gif',
      'image/svg+xml'
    ];
  }

  if (allowedTypes.includes(file.mimetype)) {
    console.log(`✅ File type allowed: ${file.mimetype}`);
    cb(null, true);
  } else {
    console.log(`❌ File type rejected: ${file.mimetype}`);
    const fileType = file.fieldname === 'templateFile' ? 
      'PDF, Word documents, HTML, text files, and images are allowed for templates.' :
      'Only images are allowed for thumbnails.';
    cb(new Error(`Invalid file type. ${fileType}`), false);
  }
};

// Initialize upload
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Max 5 files
  }
});

console.log(`🔧 Multer initialized with limits:`, upload.limits);
console.log(`🔧 Multer storage:`, upload.storage);

/**
 * Upload a file
 * @param {Object} file - Multer file object
 * @param {string} subDir - Subdirectory to save the file
 * @returns {Promise<Object>} - Upload result with path and URL
 */
const uploadFile = async (file, subDir = 'temp') => {
  try {
    console.log(`💾 Processing file:`, {
      fieldname: file.fieldname,
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      path: file.path
    });

    if (!file) {
      throw new Error('No file provided');
    }

    // Generate a unique filename
    const ext = path.extname(file.originalname).toLowerCase();
    const fileName = `${uuidv4()}${ext}`;
    const uploadDir = path.join('uploads', subDir);
    const filePath = path.join(uploadDir, fileName);
    const fullPath = path.join(process.cwd(), filePath);

    console.log(`📁 Target path: ${fullPath}`);

    // Ensure directory exists
    await mkdirp(path.dirname(fullPath));
    console.log(`📁 Directory created/verified: ${path.dirname(fullPath)}`);

    // Move file to destination
    console.log(`📁 Moving file from ${file.path} to ${fullPath}`);
    await fs.promises.rename(file.path, fullPath);
    console.log(`✅ File moved successfully: ${fileName}`);

    return {
      originalName: file.originalname,
      fileName,
      path: filePath,
      mimeType: file.mimetype,
      size: file.size
    };
  } catch (error) {
    console.error(`❌ Error in uploadFile:`, error);
    // Clean up if there's an error
    if (file && file.path) {
      await deleteFile(file.path).catch(console.error);
    }
    throw error;
  }
};

/**
 * Delete a file
 * @param {string} filePath - Path to the file
 * @returns {Promise<boolean>} - True if file was deleted, false if it didn't exist
 */
const deleteFile = async (filePath) => {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    
    // Check if file exists
    try {
      await fs.promises.access(fullPath, fs.constants.F_OK);
    } catch (err) {
      return false; // File doesn't exist
    }
    
    // Delete file
    await fs.promises.unlink(fullPath);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

/**
 * Handle file upload with validation
 * @param {Object} req - Express request object
 * @param {string} fieldName - Field name for the file
 * @param {string} subDir - Subdirectory to save the file
 * @returns {Promise<Object>} - Upload result
 */
const handleFileUpload = (req, fieldName, subDir = 'temp') => {
  return new Promise((resolve, reject) => {
    const uploadSingle = upload.single(fieldName);
    
    uploadSingle(req, {}, (err) => {
      if (err) {
        return reject(err);
      }
      
      if (!req.file) {
        return reject(new Error('No file uploaded'));
      }
      
      // Move file to the correct directory
      uploadFile(req.file, subDir)
        .then(result => resolve(result))
        .catch(error => reject(error));
    });
  });
};

export {
  upload,
  uploadFile,
  deleteFile,
  handleFileUpload
};
