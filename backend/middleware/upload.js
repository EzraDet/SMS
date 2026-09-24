import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');

// Ensure folders exist
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
ensureDir(path.join(UPLOAD_ROOT, 'students'));
ensureDir(path.join(UPLOAD_ROOT, 'teachers'));

// Storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.uploadType === 'teacher' ? 'teachers' : 'students';
    const dest = path.join(UPLOAD_ROOT, type);
    ensureDir(dest);
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const id = req.params.id || req.body.id || 'temp';
    const unique = `${id}-${Date.now()}${ext}`;
    cb(null, unique);
  },
});

// File filter — images only
function fileFilter(req, file, cb) {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpg, png, webp, gif)'), false);
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB
});

/**
 * Middleware to set upload type from URL param.
 * Usage: router.post('/:id/photo', setUploadType('student'), upload.single('photo'), ...)
 */
export function setUploadType(type) {
  return (req, res, next) => {
    req.uploadType = type;
    next();
  };
}