import { Readable } from 'stream';
import cloudinary from '../config/cloudinary';
import { env } from '../config/env';
import { BadRequestError } from './AppError';

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  format?: string;
  resource_type: string;
  bytes?: number;
}

export async function uploadBufferToCloudinary(
  buffer: Buffer,
  originalFilename: string,
  folder = 'studybuddy/resources'
): Promise<CloudinaryUploadResult> {
  if (!env.CLOUDINARY_API_KEY || env.CLOUDINARY_API_KEY === 'YOUR_CLOUDINARY_API_KEY_HERE') {
    throw new BadRequestError('Cloudinary API Key is missing. Please set your CLOUDINARY_API_KEY in backend/.env');
  }

  const ext = originalFilename.includes('.') ? originalFilename.split('.').pop() : '';
  const cleanName = originalFilename
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .slice(0, 40);
  const publicId = `${Date.now()}_${cleanName}`;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'auto',
        access_mode: 'public',
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error('Cloudinary upload returned empty result'));
        }
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
          format: result.format || ext,
          resource_type: result.resource_type,
          bytes: result.bytes,
        });
      }
    );

    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    stream.pipe(uploadStream);
  });
}

export async function uploadBase64ToCloudinary(
  base64Data: string,
  folder = 'studybuddy/documents'
): Promise<CloudinaryUploadResult> {
  if (!env.CLOUDINARY_API_KEY || env.CLOUDINARY_API_KEY === 'YOUR_CLOUDINARY_API_KEY_HERE') {
    throw new BadRequestError('Cloudinary API Key is missing. Please set your CLOUDINARY_API_KEY in backend/.env');
  }

  const result = await cloudinary.uploader.upload(base64Data, {
    folder,
    resource_type: 'auto',
    access_mode: 'public',
  });

  return {
    secure_url: result.secure_url,
    public_id: result.public_id,
    format: result.format,
    resource_type: result.resource_type,
    bytes: result.bytes,
  };
}

export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto'
): Promise<any> {
  if (!publicId) return;
  try {
    return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.error(`[Cloudinary] Failed to delete public_id ${publicId}:`, err);
  }
}

/**
 * Generates an authorized signed direct download URL for a Cloudinary asset,
 * bypassing ACL/delivery restrictions for raw and PDF files.
 */
export function getCloudinaryDownloadUrl(cloudinaryUrl: string, filename?: string): string | null {
  try {
    if (!cloudinaryUrl || !cloudinaryUrl.includes('res.cloudinary.com')) return null;

    // Pattern to match /upload/(optional v12345/)(folder/publicId).(format)
    const match = cloudinaryUrl.match(/\/upload\/(?:(?:s--[^/]+--\/)?)(?:v\d+\/)?(.+?)\.([a-zA-Z0-9]+)(?:\?.*)?$/);
    if (!match) return null;

    const publicId = match[1];
    const format = match[2];

    return cloudinary.utils.private_download_url(publicId, format, {
      resource_type: 'image',
      type: 'upload',
      attachment: filename ? true : true,
    });
  } catch (err) {
    console.error('[Cloudinary] Error generating signed download URL:', err);
    return null;
  }
}
