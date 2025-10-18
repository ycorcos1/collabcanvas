import html2canvas from "html2canvas";

/**
 * Generate a thumbnail from a canvas element
 * @param canvasElement - The canvas element to capture
 * @param width - Thumbnail width (default: 280px)
 * @param height - Thumbnail height (default: 160px)
 * @returns Promise<string> - Base64 data URL of the thumbnail
 */
export async function generateCanvasThumbnail(
  canvasElement: HTMLCanvasElement | HTMLElement,
  width: number = 280,
  height: number = 160
): Promise<string> {
  try {
    // Use html2canvas to capture the canvas
    const canvas = await html2canvas(canvasElement, {
      width: canvasElement.clientWidth || 800,
      height: canvasElement.clientHeight || 600,
      scale: 0.5, // Reduce quality for smaller file size
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
    });

    // Create a new canvas for the thumbnail
    const thumbnailCanvas = document.createElement("canvas");
    thumbnailCanvas.width = width;
    thumbnailCanvas.height = height;

    const ctx = thumbnailCanvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not get canvas context");
    }

    // Fill with white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Calculate scaling to fit the canvas content
    const scaleX = width / canvas.width;
    const scaleY = height / canvas.height;
    const scale = Math.min(scaleX, scaleY);

    // Calculate centered position
    const scaledWidth = canvas.width * scale;
    const scaledHeight = canvas.height * scale;
    const x = (width - scaledWidth) / 2;
    const y = (height - scaledHeight) / 2;

    // Draw the scaled canvas content
    ctx.drawImage(canvas, x, y, scaledWidth, scaledHeight);

    // Convert to base64 data URL with compression
    return thumbnailCanvas.toDataURL("image/jpeg", 0.8);
  } catch (error) {
    console.error("Error generating thumbnail:", error);
    // Return a fallback empty canvas thumbnail
    const fallbackCanvas = document.createElement("canvas");
    fallbackCanvas.width = width;
    fallbackCanvas.height = height;
    const ctx = fallbackCanvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#f3f4f6";
      ctx.fillRect(0, 0, width, height);
    }
    return fallbackCanvas.toDataURL("image/jpeg", 0.8);
  }
}

/**
 * Generate a thumbnail from Konva stage
 * @param stage - The Konva stage to capture
 * @param width - Thumbnail width (default: 280px)
 * @param height - Thumbnail height (default: 160px)
 * @returns Promise<string> - Base64 data URL of the thumbnail
 */
export async function generateKonvaThumbnail(
  stage: any, // Konva.Stage
  width: number = 280,
  height: number = 160
): Promise<string> {
  try {
    if (!stage) {
      throw new Error("Stage is not available");
    }

    // Get the stage data URL
    const dataURL = stage.toDataURL({
      mimeType: "image/jpeg",
      quality: 0.8,
      pixelRatio: 0.5, // Reduce quality for smaller file size
    });

    // Create an image from the data URL
    const img = new Image();
    img.crossOrigin = "anonymous";

    return new Promise((resolve, reject) => {
      img.onload = () => {
        // Create thumbnail canvas
        const thumbnailCanvas = document.createElement("canvas");
        thumbnailCanvas.width = width;
        thumbnailCanvas.height = height;

        const ctx = thumbnailCanvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        // Fill with white background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);

        // Calculate scaling to fit the image
        const scaleX = width / img.width;
        const scaleY = height / img.height;
        const scale = Math.min(scaleX, scaleY);

        // Calculate centered position
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const x = (width - scaledWidth) / 2;
        const y = (height - scaledHeight) / 2;

        // Draw the scaled image
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

        // Convert to base64 data URL
        resolve(thumbnailCanvas.toDataURL("image/jpeg", 0.8));
      };

      img.onerror = () => {
        reject(new Error("Failed to load stage image"));
      };

      img.src = dataURL;
    });
  } catch (error) {
    console.error("Error generating Konva thumbnail:", error);
    // Return a fallback empty canvas thumbnail
    const fallbackCanvas = document.createElement("canvas");
    fallbackCanvas.width = width;
    fallbackCanvas.height = height;
    const ctx = fallbackCanvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#f3f4f6";
      ctx.fillRect(0, 0, width, height);
    }
    return fallbackCanvas.toDataURL("image/jpeg", 0.8);
  }
}

