import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    // Determine folder based on route
    const isVehicle = req.baseUrl.includes('/veichels') || req.originalUrl.includes('/veichels');
    const folder = isVehicle ? 'vehicles' : 'products';

    console.log(`Uploading ${file.fieldname} to folder: ${folder}, mimetype: ${file.mimetype}`);

    return {
      folder,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'mp4', 'mov', 'avi', 'pdf'],
      transformation: [{ width: 800, height: 800, crop: 'limit' }],
    };
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log(`File filter - Field: ${file.fieldname}, Originalname: ${file.originalname}, Mimetype: ${file.mimetype}`);

    // Allow images, videos, and PDFs (for documents)
    const allowedMimes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
      'video/mp4', 'video/mov', 'video/avi',
      'application/pdf'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      console.error(`Rejected file: ${file.originalname} with mimetype: ${file.mimetype}`);
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  }
});

export default upload;
