/**
 * Image validation utilities for upload verification
 */

// Allowed image types with their magic bytes and file extensions
export const ALLOWED_IMAGE_TYPES = {
  "image/jpeg": { extensions: [".jpg", ".jpeg"], magicBytes: [0xff, 0xd8, 0xff] },
  "image/png": { extensions: [".png"], magicBytes: [0x89, 0x50, 0x4e, 0x47] },
  "image/gif": { extensions: [".gif"], magicBytes: [0x47, 0x49, 0x46] },
  "image/webp": { extensions: [".webp"], magicBytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF header
} as const;

export type AllowedMimeType = keyof typeof ALLOWED_IMAGE_TYPES;

// Validation limits
export const IMAGE_LIMITS = {
  maxFileSizeBytes: 10 * 1024 * 1024, // 10MB
  maxFileSizeMB: 10,
  maxWidth: 4096,
  maxHeight: 4096,
  minWidth: 100,
  minHeight: 100,
  maxImages: 10,
};

export interface ImageValidationError {
  type: "file_type" | "file_size" | "dimensions" | "corrupted";
  message: string;
}

export interface ImageValidationResult {
  valid: boolean;
  error?: ImageValidationError;
  dimensions?: { width: number; height: number };
  fileSize: number;
  mimeType: string;
}

/**
 * Check if file has valid image magic bytes
 */
async function checkMagicBytes(file: File): Promise<AllowedMimeType | null> {
  const buffer = await file.slice(0, 12).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  for (const [mimeType, config] of Object.entries(ALLOWED_IMAGE_TYPES)) {
    const magicBytes = config.magicBytes;
    let matches = true;

    // Special case for WebP - check for RIFF....WEBP
    if (mimeType === "image/webp") {
      // Check RIFF header and WEBP signature at offset 8
      if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
        if (bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
          return mimeType as AllowedMimeType;
        }
      }
      continue;
    }

    // Check magic bytes for other formats
    for (let i = 0; i < magicBytes.length; i++) {
      if (bytes[i] !== magicBytes[i]) {
        matches = false;
        break;
      }
    }

    if (matches) {
      return mimeType as AllowedMimeType;
    }
  }

  return null;
}

/**
 * Get image dimensions from a File
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

/**
 * Validate a single image file
 */
export async function validateImage(file: File): Promise<ImageValidationResult> {
  // Check file size
  if (file.size > IMAGE_LIMITS.maxFileSizeBytes) {
    return {
      valid: false,
      error: {
        type: "file_size",
        message: `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum of ${IMAGE_LIMITS.maxFileSizeMB}MB`,
      },
      fileSize: file.size,
      mimeType: file.type,
    };
  }

  // Check file type using magic bytes (more secure than relying on extension/mime)
  const detectedType = await checkMagicBytes(file);
  if (!detectedType) {
    return {
      valid: false,
      error: {
        type: "file_type",
        message: "Invalid file type. Only JPG, PNG, GIF, and WebP images are allowed",
      },
      fileSize: file.size,
      mimeType: file.type,
    };
  }

  // Check dimensions
  try {
    const dimensions = await getImageDimensions(file);

    if (dimensions.width > IMAGE_LIMITS.maxWidth || dimensions.height > IMAGE_LIMITS.maxHeight) {
      return {
        valid: false,
        error: {
          type: "dimensions",
          message: `Image dimensions (${dimensions.width}x${dimensions.height}) exceed maximum of ${IMAGE_LIMITS.maxWidth}x${IMAGE_LIMITS.maxHeight}`,
        },
        fileSize: file.size,
        mimeType: detectedType,
        dimensions,
      };
    }

    if (dimensions.width < IMAGE_LIMITS.minWidth || dimensions.height < IMAGE_LIMITS.minHeight) {
      return {
        valid: false,
        error: {
          type: "dimensions",
          message: `Image dimensions (${dimensions.width}x${dimensions.height}) are below minimum of ${IMAGE_LIMITS.minWidth}x${IMAGE_LIMITS.minHeight}`,
        },
        fileSize: file.size,
        mimeType: detectedType,
        dimensions,
      };
    }

    return {
      valid: true,
      fileSize: file.size,
      mimeType: detectedType,
      dimensions,
    };
  } catch {
    return {
      valid: false,
      error: {
        type: "corrupted",
        message: "Image file appears to be corrupted or unreadable",
      },
      fileSize: file.size,
      mimeType: file.type,
    };
  }
}

/**
 * Validate multiple image files
 */
export async function validateImages(
  files: File[]
): Promise<{ valid: boolean; results: ImageValidationResult[]; errors: string[] }> {
  const results: ImageValidationResult[] = [];
  const errors: string[] = [];

  // Check total count
  if (files.length > IMAGE_LIMITS.maxImages) {
    errors.push(`Maximum ${IMAGE_LIMITS.maxImages} images allowed`);
  }

  // Validate each file
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const result = await validateImage(file);
    results.push(result);

    if (!result.valid && result.error) {
      errors.push(`${file.name}: ${result.error.message}`);
    }
  }

  return {
    valid: errors.length === 0,
    results,
    errors,
  };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
