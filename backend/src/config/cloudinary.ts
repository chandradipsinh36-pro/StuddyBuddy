import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME || 'dk5pi4iw',
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET || 'nIYF1QHzTyjNSvtJm8zpbGtjmxo',
  secure: true,
});

export default cloudinary;
