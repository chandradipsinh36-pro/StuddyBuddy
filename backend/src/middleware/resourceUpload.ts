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

export function saveBase64ToFile(dataUrl: string, prefix = 'cert'): string {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) return dataUrl;
  try {
    const commaIdx = dataUrl.indexOf(',');
    if (commaIdx === -1) return dataUrl;
    const header = dataUrl.slice(0, commaIdx);
    const base64Content = dataUrl.slice(commaIdx + 1);
    const buffer = Buffer.from(base64Content, 'base64');

    let ext = 'png';
    if (header.includes('pdf')) ext = 'pdf';
    else if (header.includes('jpeg') || header.includes('jpg')) ext = 'jpg';
    else if (header.includes('webp')) ext = 'webp';

    const dir = getResourcesDirectory();
    const fileName = `${prefix}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}.${ext}`;
    const filePath = path.join(dir, fileName);
    fs.writeFileSync(filePath, buffer);
    return `/resources/${fileName}`;
  } catch (err) {
    console.error('Failed to save base64 to file:', err);
    return dataUrl;
  }
}
