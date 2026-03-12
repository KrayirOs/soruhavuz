function toImageElement(fileOrBlob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(fileOrBlob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image could not be loaded."));
    };
    img.src = url;
  });
}

async function decodeImage(fileOrBlob) {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(fileOrBlob);
    } catch (_) {
      // Fallback to HTMLImageElement below
    }
  }
  return toImageElement(fileOrBlob);
}

function getBitmapSize(bitmap) {
  if ("width" in bitmap && "height" in bitmap) {
    return { width: bitmap.width, height: bitmap.height };
  }
  return { width: bitmap.naturalWidth, height: bitmap.naturalHeight };
}

function drawBitmap(ctx, bitmap, width, height) {
  ctx.drawImage(bitmap, 0, 0, width, height);
}

function closeBitmap(bitmap) {
  if (bitmap && typeof bitmap.close === "function") {
    bitmap.close();
  }
}

export async function compressImage(file, options = {}) {
  if (!(file instanceof Blob)) {
    throw new Error("compressImage expects a File or Blob.");
  }

  const maxWidth = Number(options.maxWidth || 1280);
  const quality = Number(options.quality || 0.7);
  const mimeType = options.mimeType || "image/jpeg";

  const bitmap = await decodeImage(file);

  try {
    const original = getBitmapSize(bitmap);
    const ratio = original.width > maxWidth ? maxWidth / original.width : 1;
    const targetWidth = Math.max(1, Math.round(original.width * ratio));
    const targetHeight = Math.max(1, Math.round(original.height * ratio));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) {
      throw new Error("Canvas context is not available.");
    }

    drawBitmap(ctx, bitmap, targetWidth, targetHeight);

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((result) => {
        if (!result) {
          reject(new Error("Image compression failed."));
          return;
        }
        resolve(result);
      }, mimeType, quality);
    });

    return {
      blob,
      meta: {
        originalSize: file.size,
        compressedSize: blob.size,
        originalWidth: original.width,
        originalHeight: original.height,
        width: targetWidth,
        height: targetHeight,
        mimeType: blob.type || mimeType,
        quality
      }
    };
  } finally {
    closeBitmap(bitmap);
  }
}
