import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadBase64ToCloudinary } from '../utils/cloudinary';

export function getResourcesDirectory(): string {
  const relativeToSrc = path.resolve(__dirname, '../../../resources');
  if (fs.existsSync(relativeToSrc)) return relativeToSrc;

  const relativeToCwdParent = path.resolve(process.cwd(), '../resources');
  if (fs.existsSync(relativeToCwdParent)) return relativeToCwdParent;

  const relativeToCwd = path.resolve(process.cwd(), 'resources');
  if (fs.existsSync(relativeToCwd)) return relativeToCwd;

  fs.mkdirSync(relativeToCwdParent, { recursive: true });
  return relativeToCwdParent;
}

// In-memory storage for direct streaming/uploading to Cloudinary
const storage = multer.memoryStorage();

export const resourceUpload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

export async function saveBase64ToCloudinary(dataUrl: string, folder = 'studybuddy/documents'): Promise<string> {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) return dataUrl;
  try {
    const res = await uploadBase64ToCloudinary(dataUrl, folder);
    return res.secure_url;
  } catch (err) {
    console.error('[Storage] Failed to upload base64 to Cloudinary:', err);
    return dataUrl;
  }
}

// Backward-compatible alias that now uploads to Cloudinary instead of disk
export async function saveBase64ToFile(dataUrl: string, _prefix = 'cert'): Promise<string> {
  return saveBase64ToCloudinary(dataUrl, 'studybuddy/documents');
}
