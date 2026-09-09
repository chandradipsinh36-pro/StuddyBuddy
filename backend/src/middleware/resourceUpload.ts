import multer from 'multer';
import path from 'path';
import fs from 'fs';

export function getResourcesDirectory(): string {
  // Check relative to this source file (StudyBuddy/backend/src/middleware -> StudyBuddy/resources)
  const relativeToSrc = path.resolve(__dirname, '../../../resources');
  if (fs.existsSync(relativeToSrc)) return relativeToSrc;

  // Check relative to cwd (if cwd is StudyBuddy/backend -> ../resources)
  const relativeToCwdParent = path.resolve(process.cwd(), '../resources');
  if (fs.existsSync(relativeToCwdParent)) return relativeToCwdParent;

  // Check relative to cwd (if cwd is StudyBuddy -> resources)
  const relativeToCwd = path.resolve(process.cwd(), 'resources');
  if (fs.existsSync(relativeToCwd)) return relativeToCwd;

  // Fallback: create directory
  fs.mkdirSync(relativeToCwdParent, { recursive: true });
  return relativeToCwdParent;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = getResourcesDirectory();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_\-\s]/g, '')
      .trim()
      .replace(/\s+/g, '_');
    const uniqueName = `${Date.now()}-${baseName || 'file'}${ext}`;
    cb(null, uniqueName);
  },
});

export const resourceUpload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});
