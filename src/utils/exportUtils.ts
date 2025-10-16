import { Shape } from '../types/shape';

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
  format: 'png' | 'svg';
  quality?: number; // For PNG (0-1)
  scale?: number; // Export scale multiplier
  padding?: number; // Padding around shapes
  backgroundColor?: string; // Background color for PNG
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
export const calculateShapesBounds = (shapes: Shape[], padding: number = 20): ExportBounds => {
  if (shapes.length === 0) {
    return { x: 0, y: 0, width: 800, height: 600 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  shapes.forEach(shape => {
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
    width: (maxX - minX) + (padding * 2),
    height: (maxY - minY) + (padding * 2),
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
  shapes.forEach(shape => {
    const x = shape.x - bounds.x;
    const y = shape.y - bounds.y;
    
    if (shape.type === 'rectangle') {
      svgContent += `<rect x="${x}" y="${y}" width="${shape.width}" height="${shape.height}" fill="${shape.color}" stroke="none"/>`;
    } else if (shape.type === 'circle') {
      const centerX = x + shape.width / 2;
      const centerY = y + shape.height / 2;
      const radius = Math.min(shape.width, shape.height) / 2;
      svgContent += `<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="${shape.color}" stroke="none"/>`;
    }
  });
  
  svgContent += '</svg>';
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
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
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
  shapes.forEach(shape => {
    const x = shape.x - bounds.x;
    const y = shape.y - bounds.y;
    
    ctx.fillStyle = shape.color;
    
    if (shape.type === 'rectangle') {
      ctx.fillRect(x, y, shape.width, shape.height);
    } else if (shape.type === 'circle') {
      const centerX = x + shape.width / 2;
      const centerY = y + shape.height / 2;
      const radius = Math.min(shape.width, shape.height) / 2;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fill();
    }
  });
  
  return canvas;
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
  
  if (options.format === 'svg') {
    const svgContent = createSVGFromShapes(shapes, bounds, options);
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    downloadBlob(blob, `${filename}.svg`);
  } else if (options.format === 'png') {
    const canvas = createCanvasFromShapes(shapes, bounds, options);
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          downloadBlob(blob, `${filename}.png`);
        }
        resolve();
      }, 'image/png', options.quality || 0.9);
    });
  }
};

/**
 * Download blob as file
 */
const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
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
  const filename = canvasName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
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
  const selectedShapes = allShapes.filter(shape => selectedShapeIds.includes(shape.id));
  if (selectedShapes.length === 0) {
    throw new Error('No shapes selected for export');
  }
  
  const filename = `${canvasName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_selection`;
  await exportShapes(selectedShapes, filename, options);
};
