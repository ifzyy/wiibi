import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";

const baseUploadDir = path.join(process.cwd(), "public/uploads");

const safeUnlink = async (filePath, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await fs.unlink(filePath);
      return;
    } catch (err) {
      if (err.code === "EPERM" || err.code === "EBUSY") {
        await new Promise((r) => setTimeout(r, 120));
      } else if (err.code === "ENOENT") {
        return;
      } else {
        throw err;
      }
    }
  }
};

// ✅ FIX: Use memoryStorage — avoids req.body race condition in diskStorage destination()
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed"), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const processImage = async (req, res, next) => {
  // Normalize files from any field name / single-file shape
  let files = [];
  if (req.files?.galleryImages) {
    files = req.files.galleryImages;
  } else if (Array.isArray(req.files)) {
    files = req.files;
  } else if (req.file) {
    files = [req.file];
  }

  if (!files.length) return next();

  // ✅ Now req.body IS populated (multer memoryStorage finishes before next() runs)
  const entityType = req.body.entityType || "general";
  const entityDir = path.join(baseUploadDir, entityType);

  try {
    await fs.mkdir(entityDir, { recursive: true });

    for (const file of files) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const outputFilename = `optimized-${file.fieldname}-${uniqueSuffix}.jpg`;
      const outputPath = path.join(entityDir, outputFilename);

      // Process from buffer (memoryStorage gives us file.buffer)
      await sharp(file.buffer)
        .rotate()
        .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 85, mozjpeg: true })
        .toFile(outputPath);

      const relativePath = path.relative(
        path.join(process.cwd(), "public"),
        outputPath
      );
      file.processedUrl = `/${relativePath.replace(/\\/g, "/")}`;
      
      // Populate fields uploadFiles controller expects
      file.filename = outputFilename;
      file.destination = entityDir;
    }

    next();
  } catch (err) {
    console.error("Processing error:", err);
    // Fallback: write original buffer to disk unprocessed
    for (const file of files) {
      if (!file.processedUrl && file.buffer) {
        try {
          const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
          const outputFilename = `raw-${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`;
          const outputPath = path.join(entityDir, outputFilename);
          await fs.writeFile(outputPath, file.buffer);
          const relativePath = path.relative(path.join(process.cwd(), "public"), outputPath);
          file.processedUrl = `/${relativePath.replace(/\\/g, "/")}`;
          file.filename = outputFilename;
        } catch (writeErr) {
          console.error("Fallback write error:", writeErr);
        }
      }
    }
    next();
  }
};

export default upload;