import multer from "multer";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "../services/upload.service.js";

// Memory storage — avoids req.body race condition that diskStorage has.
// Files arrive as buffer objects; the upload service handles all I/O.
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Only images are allowed (got ${file.mimetype})`), false);
    }
  },
  limits: { fileSize: MAX_FILE_SIZE },
});

export default upload;
