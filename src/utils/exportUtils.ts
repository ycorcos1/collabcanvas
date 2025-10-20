import { Shape } from "../types/shape";
import jsPDF from "jspdf";

/**
 * Export Utilities - Handle canvas and shape export functionality
 *
 * Features:
 * - Export entire canvas as PNG/SVG
 * - Export selected shapes only
 * - Automatic bounds calculation
 * - High-quality export options
 */

interface ExportOptions {
  format: "png" | "svg" | "pdf";
  quality?: number; // For PNG (0-1)
  scale?: number; // Export scale multiplier
  padding?: number; // Padding around shapes
  backgroundColor?: string; // Background color for PNG/PDF
}

interface ExportBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculate bounds for a set of shapes
 */
export const calculateShapesBounds = (
  shapes: Shape[],
  padding: number = 20
): ExportBounds => {
  if (shapes.length === 0) {
    return { x: 0, y: 0, width: 800, height: 600 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  shapes.forEach((shape) => {
    const left = shape.x;
    const top = shape.y;
    const right = shape.x + shape.width;
    const bottom = shape.y + shape.height;

    minX = Math.min(minX, left);
    minY = Math.min(minY, top);
    maxX = Math.max(maxX, right);
    maxY = Math.max(maxY, bottom);
  });

  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };
};

/**
 * Create SVG string from shapes
 */
export const createSVGFromShapes = (
  shapes: Shape[],
  bounds: ExportBounds,
  options: ExportOptions
): string => {
  const { width, height } = bounds;

  let svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;

  // Add background if specified
  if (options.backgroundColor) {
    svgContent += `<rect width="100%" height="100%" fill="${options.backgroundColor}"/>`;
  }

  // Add shapes
  shapes.forEach((shape) => {
    const x = shape.x - bounds.x;
    const y = shape.y - bounds.y;

    if (shape.type === "rectangle") {
      svgContent += `<rect x="${x}" y="${y}" width="${shape.width}" height="${shape.height}" fill="${shape.color}" stroke="none"/>`;
    } else if (shape.type === "circle") {
      const centerX = x + shape.width / 2;
      const centerY = y + shape.height / 2;
      const radius = Math.min(shape.width, shape.height) / 2;
      svgContent += `<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="${shape.color}" stroke="none"/>`;
    } else if (shape.type === "triangle") {
      const centerX = x + shape.width / 2;
      const topY = y;
      const bottomY = y + shape.height;
      const leftX = x;
      const rightX = x + shape.width;
      const points = `${centerX},${topY} ${rightX},${bottomY} ${leftX},${bottomY}`;
      svgContent += `<polygon points="${points}" fill="${shape.color}" stroke="none"/>`;
    } else if (shape.type === "line" && shape.points) {
      const pathData = shape.points
        .map((val, idx) => {
          if (idx % 2 === 0) {
            return `${idx === 0 ? "M" : "L"}${val - bounds.x}`;
          }
          return `,${val - bounds.y}`;
        })
        .join(" ");
      svgContent += `<path d="${pathData}" stroke="${
        shape.color
      }" stroke-width="${shape.strokeWidth || 2}" fill="none"/>`;
    } else if (shape.type === "arrow" && shape.points) {
      // Draw line for arrow
      const pathData = shape.points
        .map((val, idx) => {
          if (idx % 2 === 0) {
            return `${idx === 0 ? "M" : "L"}${val - bounds.x}`;
          }
          return `,${val - bounds.y}`;
        })
        .join(" ");
      svgContent += `<path d="${pathData}" stroke="${
        shape.color
      }" stroke-width="${
        shape.strokeWidth || 2
      }" fill="none" marker-end="url(#arrowhead)"/>`;
    } else if (shape.type === "text" && shape.text) {
      const fontSize = shape.fontSize || 16;
      const fontFamily = shape.fontFamily || "Arial";
      const textY = y + fontSize; // Adjust Y for baseline
      svgContent += `<text x="${x}" y="${textY}" font-size="${fontSize}" font-family="${fontFamily}" fill="${shape.color}">${shape.text}</text>`;
    }
  });

  svgContent += "</svg>";
  return svgContent;
};

/**
 * Create canvas element from shapes for PNG export
 */
export const createCanvasFromShapes = (
  shapes: Shape[],
  bounds: ExportBounds,
  options: ExportOptions
): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const scale = options.scale || 1;

  canvas.width = bounds.width * scale;
  canvas.height = bounds.height * scale;

  // Scale context for high-DPI export
  ctx.scale(scale, scale);

  // Add background
  if (options.backgroundColor) {
    ctx.fillStyle = options.backgroundColor;
    ctx.fillRect(0, 0, bounds.width, bounds.height);
  }

  // Draw shapes
  shapes.forEach((shape) => {
    const x = shape.x - bounds.x;
    const y = shape.y - bounds.y;

    ctx.fillStyle = shape.color;

    if (shape.type === "rectangle") {
      ctx.fillRect(x, y, shape.width, shape.height);
    } else if (shape.type === "circle") {
      const centerX = x + shape.width / 2;
      const centerY = y + shape.height / 2;
      const radius = Math.min(shape.width, shape.height) / 2;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fill();
    } else if (shape.type === "triangle") {
      const centerX = x + shape.width / 2;
      const topY = y;
      const bottomY = y + shape.height;
      const leftX = x;
      const rightX = x + shape.width;

      ctx.beginPath();
      ctx.moveTo(centerX, topY);
      ctx.lineTo(rightX, bottomY);
      ctx.lineTo(leftX, bottomY);
      ctx.closePath();
      ctx.fill();
    } else if (shape.type === "line" && shape.points) {
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = shape.strokeWidth || 2;
      ctx.beginPath();
      for (let i = 0; i < shape.points.length; i += 2) {
        const px = shape.points[i] - bounds.x;
        const py = shape.points[i + 1] - bounds.y;
        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
    } else if (shape.type === "arrow" && shape.points) {
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = shape.strokeWidth || 2;
      ctx.beginPath();
      for (let i = 0; i < shape.points.length; i += 2) {
        const px = shape.points[i] - bounds.x;
        const py = shape.points[i + 1] - bounds.y;
        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();

      // Draw arrowhead at the end
      if (shape.points.length >= 4) {
        const lastIdx = shape.points.length - 2;
        const prevIdx = lastIdx - 2;
        const x2 = shape.points[lastIdx] - bounds.x;
        const y2 = shape.points[lastIdx + 1] - bounds.y;
        const x1 = shape.points[prevIdx] - bounds.x;
        const y1 = shape.points[prevIdx + 1] - bounds.y;

        const angle = Math.atan2(y2 - y1, x2 - x1);
        const headlen = 10;

        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(
          x2 - headlen * Math.cos(angle - Math.PI / 6),
          y2 - headlen * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(x2, y2);
        ctx.lineTo(
          x2 - headlen * Math.cos(angle + Math.PI / 6),
          y2 - headlen * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
      }
    } else if (shape.type === "text" && shape.text) {
      ctx.fillStyle = shape.color;
      ctx.font = `${shape.fontSize || 16}px ${shape.fontFamily || "Arial"}`;
      ctx.fillText(shape.text, x, y + (shape.fontSize || 16));
    }
  });

  return canvas;
};

/**
 * Create PDF from shapes
 */
export const createPDFFromShapes = (
  shapes: Shape[],
  bounds: ExportBounds,
  options: ExportOptions
): jsPDF => {
  // Convert pixels to mm (assuming 96 DPI)
  const pxToMm = 0.264583;
  const pdfWidth = bounds.width * pxToMm;
  const pdfHeight = bounds.height * pxToMm;

  // Create PDF with custom dimensions
  const pdf = new jsPDF({
    orientation: pdfWidth > pdfHeight ? "landscape" : "portrait",
    unit: "mm",
    format: [pdfWidth, pdfHeight],
  });

  // Add background
  if (options.backgroundColor && options.backgroundColor !== "#ffffff") {
    pdf.setFillColor(options.backgroundColor);
    pdf.rect(0, 0, pdfWidth, pdfHeight, "F");
  }

  // Draw shapes
  shapes.forEach((shape) => {
    const x = (shape.x - bounds.x) * pxToMm;
    const y = (shape.y - bounds.y) * pxToMm;
    const width = shape.width * pxToMm;
    const height = shape.height * pxToMm;

    pdf.setFillColor(shape.color);

    if (shape.type === "rectangle") {
      pdf.rect(x, y, width, height, "F");
    } else if (shape.type === "circle") {
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      const radius = Math.min(width, height) / 2;
      pdf.circle(centerX, centerY, radius, "F");
    }
  });

  return pdf;
};

/**
 * Export shapes as file
 */
export const exportShapes = async (
  shapes: Shape[],
  filename: string,
  options: ExportOptions
): Promise<void> => {
  const bounds = calculateShapesBounds(shapes, options.padding);

  if (options.format === "svg") {
    const svgContent = createSVGFromShapes(shapes, bounds, options);
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    downloadBlob(blob, `${filename}.svg`);
  } else if (options.format === "png") {
    const canvas = createCanvasFromShapes(shapes, bounds, options);

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            downloadBlob(blob, `${filename}.png`);
          }
          resolve();
        },
        "image/png",
        options.quality || 0.9
      );
    });
  } else if (options.format === "pdf") {
    const pdf = createPDFFromShapes(shapes, bounds, options);
    pdf.save(`${filename}.pdf`);
  }
};

/**
 * Download blob as file
 */
const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export entire canvas
 */
export const exportCanvas = async (
  shapes: Shape[],
  canvasName: string,
  options: ExportOptions
): Promise<void> => {
  const filename = canvasName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  await exportShapes(shapes, filename, options);
};

/**
 * Export selected shapes only
 */
export const exportSelectedShapes = async (
  allShapes: Shape[],
  selectedShapeIds: string[],
  canvasName: string,
  options: ExportOptions
): Promise<void> => {
  const selectedShapes = allShapes.filter((shape) =>
    selectedShapeIds.includes(shape.id)
  );
  if (selectedShapes.length === 0) {
    throw new Error("No shapes selected for export");
  }

  const filename = `${canvasName
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase()}_selection`;
  await exportShapes(selectedShapes, filename, options);
};
