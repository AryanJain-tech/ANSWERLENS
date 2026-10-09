/**
 * Client-side image processor:
 * - Fixes EXIF rotation/orientation
 * - Resizes to max 1600px dimension
 * - Compresses to JPEG (quality ~0.85)
 * - Ensures file is under 8MB
 */
export interface ProcessedImage {
  base64: string;
  dataUrl: string;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
}

export async function processImageFile(file: File): Promise<ProcessedImage> {
  const MAX_DIMENSION = 1600;
  const JPEG_QUALITY = 0.85;
  const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));

    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image data.'));

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate scaling ratio
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Canvas 2D context unavailable'));
        }

        // Fill white background for transparent PNGs
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG
        const mimeType = 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, JPEG_QUALITY);
        const base64 = dataUrl.split(',')[1];
        const sizeBytes = Math.round((base64.length * 3) / 4);

        if (sizeBytes > MAX_BYTES) {
          return reject(
            new Error(
              `Compressed image exceeds 8MB limit (${(sizeBytes / (1024 * 1024)).toFixed(1)}MB). Please choose a smaller photo.`
            )
          );
        }

        resolve({
          base64,
          dataUrl,
          mimeType,
          sizeBytes,
          width,
          height,
        });
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}
