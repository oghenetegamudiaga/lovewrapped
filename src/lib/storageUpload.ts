import { getSignedUploadUrlApi } from './api';

export interface StorageUploadOptions {
  bucket?: 'wedding-cover-photos' | 'theme-assets' | 'experience-images';
  maxSizeBytes?: number;
  maxWidth?: number;
  quality?: number;
}

/**
 * Reusable helper function to compress and upload image binaries directly to Supabase Storage.
 * Uses signed upload URLs to bypass API request body size limits (no 413s or payload truncations).
 */
export async function uploadImageDirectToStorage(
  file: File,
  options: StorageUploadOptions = {}
): Promise<string> {
  const bucket = options.bucket || 'wedding-cover-photos';
  const maxSizeBytes = options.maxSizeBytes || 15 * 1024 * 1024; // 15MB matching Moments
  const maxWidth = options.maxWidth || 1600;
  const quality = options.quality || 0.85;

  if (file.size > maxSizeBytes) {
    throw new Error(`File size exceeds ${Math.round(maxSizeBytes / (1024 * 1024))}MB limit.`);
  }

  // 1. Client-side canvas compression
  const compressedBlob = await new Promise<Blob>((resolve, reject) => {
    const img = new window.Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, maxWidth / img.width);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context unavailable'));

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas image compression failed'));
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image file'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });

  // 2. Fetch signed upload URL for target bucket
  const cleanName = (file.name || 'image.jpg').replace(/[^a-zA-Z0-9._-]/g, '') || 'image.jpg';
  let uploadedUrl = '';

  try {
    const uploadInfo = await getSignedUploadUrlApi(cleanName, 'image/jpeg', bucket);

    if (uploadInfo.signedUrl) {
      const putRes = await fetch(uploadInfo.signedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'image/jpeg',
        },
        body: compressedBlob,
      });

      if (putRes.ok && uploadInfo.publicUrl) {
        uploadedUrl = uploadInfo.publicUrl;
      }
    }
  } catch (err: unknown) {
    console.warn('Storage direct upload failed, attempting fallback:', err);
  }

  // 3. Fallback to Data URL if offline or storage bucket unconfigured
  if (!uploadedUrl) {
    uploadedUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(compressedBlob);
    });
  }

  return uploadedUrl;
}
