import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const uploadDir = path.join(process.cwd(), 'public/uploads/products');

// Ensure directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// File filter (only images)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only images allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// Image processing middleware (resize & optimize)
export const processImage = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const outputPath = path.join(uploadDir, `optimized-${req.file.filename}`);

    await sharp(req.file.path)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(outputPath);

    // Delete original (save space)
    fs.unlinkSync(req.file.path);

    // Attach optimized URL to req
    req.file.optimizedUrl = `/uploads/products/optimized-${req.file.filename}`;

    next();
  } catch (err) {
    console.error('Image processing error:', err);
    next(err);
  }
};

export default upload;