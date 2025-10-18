/**
 * Memory Bank Service
 *
 * Manages AI agent persistent context including defaults, templates, and user preferences
 */

import defaultsData from "../../memoryBank/defaults.json";
import cardTemplate from "../../memoryBank/templates/card.json";
import buttonTemplate from "../../memoryBank/templates/button.json";
import loginFormTemplate from "../../memoryBank/templates/login_form.json";
import navbar4Template from "../../memoryBank/templates/navbar_4.json";
import cardLayoutTemplate from "../../memoryBank/templates/card_layout.json";
import smileyTemplate from "../../memoryBank/templates/smiley_face.json";

export interface MemoryBankDefaults {
  canvas: {
    defaultWidth: number;
    defaultHeight: number;
    backgroundColor: string;
    minDimension: number;
    maxDimension: number;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    neutral: string;
    palette: string[];
  };
  shapes: {
    rectangle: {
      defaultWidth: number;
      defaultHeight: number;
      defaultColor: string;
    };
    circle: {
      defaultRadius: number;
      defaultColor: string;
    };
    text: {
      defaultFontSize: number;
      defaultFontFamily: string;
      defaultColor: string;
      defaultWidth: number;
      defaultHeight: number;
    };
  };
  spacing: {
    defaultMargin: number;
    gridSize: number;
    snapTolerance: number;
  };
  duplicateOffset: {
    x: number;
    y: number;
  };
  aiPreferences: {
    defaultPosition: {
      x: number;
      y: number;
    };
    preferredShapeType: string;
    autoSelect: boolean;
    verboseResponses: boolean;
  };
}

export interface ShapeTemplate {
  name: string;
  description: string;
  shapes: Array<{
    type: string;
    width?: number;
    height?: number;
    color?: string;
    x?: number;
    y?: number;
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    strokeWidth?: number;
    stroke?: string;
    cornerRadius?: number;
    radius?: number;
    shadow?: {
      color: string;
      blur: number;
      offset: { x: number; y: number };
    };
  }>;
}

/**
 * Memory Bank Service
 */
class MemoryBankService {
  private defaults: MemoryBankDefaults;
  private templates: Map<string, ShapeTemplate>;

  constructor() {
    this.defaults = defaultsData as MemoryBankDefaults;
    this.templates = new Map();

    // Load templates
    this.loadTemplate("card", cardTemplate as ShapeTemplate);
    this.loadTemplate("button", buttonTemplate as ShapeTemplate);
    this.loadTemplate("login_form", loginFormTemplate as ShapeTemplate);
    this.loadTemplate("navbar_4", navbar4Template as ShapeTemplate);
    this.loadTemplate("card_layout", cardLayoutTemplate as ShapeTemplate);
    this.loadTemplate("smiley_face", smileyTemplate as ShapeTemplate);
  }

  /**
   * Get default settings
   */
  getDefaults(): MemoryBankDefaults {
    return this.defaults;
  }

  /**
   * Get a specific default value by path (e.g., "canvas.defaultWidth")
   */
  getDefault(path: string): any {
    const keys = path.split(".");
    let value: any = this.defaults;
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) return undefined;
    }
    return value;
  }

  /**
   * Load a template into memory
   */
  private loadTemplate(name: string, template: ShapeTemplate): void {
    this.templates.set(name.toLowerCase(), template);
  }

  /**
   * Get a template by name
   */
  getTemplate(name: string): ShapeTemplate | undefined {
    return this.templates.get(name.toLowerCase());
  }

  /**
   * Get all available templates
   */
  getAllTemplates(): ShapeTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get template names for AI suggestions
   */
  getTemplateNames(): string[] {
    return Array.from(this.templates.keys());
  }

  /**
   * Check if a template exists
   */
  hasTemplate(name: string): boolean {
    return this.templates.has(name.toLowerCase());
  }
}

// Singleton instance
export const memoryBank = new MemoryBankService();
