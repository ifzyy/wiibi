import sharp from "sharp";
import path from "path";
import fs from "fs/promises";

const BASE_DIR = path.join(process.cwd(), "public/uploads");

const getBaseUrl = () =>
  process.env.NODE_ENV === "production"
    ? process.env.APP_URL || "https://wiibienergy.com"
    : `http://localhost:${process.env.PORT || 5000}`;

const safeUnlink = async (filePath) => {
  try { await fs.unlink(filePath); } catch {}
};

export const localProvider = {
  name: "local",

  async saveFile(buffer, { entityType, fieldname = "image", originalname = "image.jpg" }) {
    const entityDir = path.join(BASE_DIR, entityType);
    await fs.mkdir(entityDir, { recursive: true });

    const suffix    = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename  = `optimized-${fieldname}-${suffix}.jpg`;
    const outputPath = path.join(entityDir, filename);

    try {
      const info = await sharp(buffer)
        .rotate()
        .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 85, mozjpeg: true })
        .toFile(outputPath);

      const rel = path.relative(path.join(process.cwd(), "public"), outputPath);
      return {
        url:         `${getBaseUrl()}/${rel.replace(/\\/g, "/")}`,
        filename,
        width:       info.width,
        height:      info.height,
        storagePath: outputPath,
      };
    } catch {
      // Sharp failed — write raw buffer as fallback
      const ext          = path.extname(originalname) || ".jpg";
      const rawFilename  = `raw-${fieldname}-${suffix}${ext}`;
      const rawPath      = path.join(entityDir, rawFilename);
      await fs.writeFile(rawPath, buffer);
      const rel = path.relative(path.join(process.cwd(), "public"), rawPath);
      return {
        url:         `${getBaseUrl()}/${rel.replace(/\\/g, "/")}`,
        filename:    rawFilename,
        width:       null,
        height:      null,
        storagePath: rawPath,
      };
    }
  },

  async deleteFile(storagePath) {
    if (!storagePath || !storagePath.startsWith(BASE_DIR)) return;
    await safeUnlink(storagePath);
  },
};
