import React, { useState, useEffect, useRef } from 'react';
import './ColorPicker.css';

/**
 * Color Picker Component - Advanced color selection with palettes and recent colors
 * 
 * Features:
 * - Color wheel/picker for custom colors
 * - Recent colors history (last 10 colors used)
 * - Saved color palettes
 * - Preset color swatches
 * - Hex input for precise color values
 */

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  isOpen: boolean;
  onClose: () => void;
  anchorEl?: HTMLElement | null;
}

// Default color palette
const DEFAULT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2',
  '#A3E4D7', '#F9E79F', '#D5A6BD', '#AED6F1', '#A9DFBF'
];

// Load recent colors from localStorage
const loadRecentColors = (): string[] => {
  try {
    const stored = localStorage.getItem('horizon-recent-colors');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save recent colors to localStorage
const saveRecentColors = (colors: string[]) => {
  try {
    localStorage.setItem('horizon-recent-colors', JSON.stringify(colors));
  } catch {
    // Ignore localStorage errors
  }
};

// Load saved palettes from localStorage
const loadSavedPalettes = (): string[][] => {
  try {
    const stored = localStorage.getItem('horizon-saved-palettes');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save palettes to localStorage
const savePalettes = (palettes: string[][]) => {
  try {
    localStorage.setItem('horizon-saved-palettes', JSON.stringify(palettes));
  } catch {
    // Ignore localStorage errors
  }
};

export const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  onColorChange,
  isOpen,
  onClose,
  anchorEl
}) => {
  const [hexInput, setHexInput] = useState(selectedColor);
  const [recentColors, setRecentColors] = useState<string[]>(loadRecentColors);
  const [savedPalettes, setSavedPalettes] = useState<string[][]>(loadSavedPalettes);
  const [currentPalette, setCurrentPalette] = useState<string[]>([]);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Update hex input when selected color changes
  useEffect(() => {
    setHexInput(selectedColor);
  }, [selectedColor]);

  // Handle clicks outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Add color to recent colors
  const addToRecentColors = (color: string) => {
    const newRecentColors = [color, ...recentColors.filter(c => c !== color)].slice(0, 10);
    setRecentColors(newRecentColors);
    saveRecentColors(newRecentColors);
  };

  // Handle color selection
  const handleColorSelect = (color: string) => {
    onColorChange(color);
    addToRecentColors(color);
  };

  // Handle hex input change
  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHexInput(value);
    
    // Validate hex color
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      handleColorSelect(value);
    }
  };

  // Add current palette to saved palettes
  const savePalette = () => {
    if (currentPalette.length > 0) {
      const newPalettes = [...savedPalettes, currentPalette];
      setSavedPalettes(newPalettes);
      savePalettes(newPalettes);
      setCurrentPalette([]);
    }
  };

  // Add color to current palette
  const addToPalette = (color: string) => {
    if (!currentPalette.includes(color) && currentPalette.length < 8) {
      setCurrentPalette([...currentPalette, color]);
    }
  };

  // Remove palette
  const removePalette = (index: number) => {
    const newPalettes = savedPalettes.filter((_, i) => i !== index);
    setSavedPalettes(newPalettes);
    savePalettes(newPalettes);
  };

  if (!isOpen) return null;

  return (
    <div className="color-picker-overlay">
      <div 
        ref={pickerRef}
        className="color-picker"
        style={{
          position: 'absolute',
          top: anchorEl ? anchorEl.getBoundingClientRect().bottom + 8 : '50%',
          left: anchorEl ? anchorEl.getBoundingClientRect().left : '50%',
          transform: anchorEl ? 'none' : 'translate(-50%, -50%)'
        }}
      >
        <div className="color-picker-header">
          <h3>Color Picker</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        {/* Hex Input */}
        <div className="hex-input-section">
          <label htmlFor="hex-input">Hex Color:</label>
          <input
            id="hex-input"
            type="text"
            value={hexInput}
            onChange={handleHexInputChange}
            placeholder="#000000"
            className="hex-input"
          />
        </div>

        {/* Default Colors */}
        <div className="color-section">
          <h4>Default Colors</h4>
          <div className="color-grid">
            {DEFAULT_COLORS.map((color, index) => (
              <button
                key={index}
                className={`color-swatch ${selectedColor === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => handleColorSelect(color)}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Recent Colors */}
        {recentColors.length > 0 && (
          <div className="color-section">
            <h4>Recent Colors</h4>
            <div className="color-grid">
              {recentColors.map((color, index) => (
                <button
                  key={index}
                  className={`color-swatch ${selectedColor === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorSelect(color)}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}

        {/* Current Palette Builder */}
        <div className="color-section">
          <div className="palette-header">
            <h4>Build Palette</h4>
            {currentPalette.length > 0 && (
              <button className="save-palette-btn" onClick={savePalette}>
                Save Palette
              </button>
            )}
          </div>
          <div className="current-palette">
            {currentPalette.map((color, index) => (
              <div
                key={index}
                className="palette-color"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
            {Array.from({ length: 8 - currentPalette.length }).map((_, index) => (
              <div key={`empty-${index}`} className="palette-color empty" />
            ))}
          </div>
          <p className="palette-hint">
            Click any color above to add to palette (max 8 colors)
          </p>
        </div>

        {/* Saved Palettes */}
        {savedPalettes.length > 0 && (
          <div className="color-section">
            <h4>Saved Palettes</h4>
            {savedPalettes.map((palette, paletteIndex) => (
              <div key={paletteIndex} className="saved-palette">
                <div className="palette-colors">
                  {palette.map((color, colorIndex) => (
                    <button
                      key={colorIndex}
                      className={`color-swatch small ${selectedColor === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => handleColorSelect(color)}
                      title={color}
                    />
                  ))}
                </div>
                <button
                  className="remove-palette-btn"
                  onClick={() => removePalette(paletteIndex)}
                  title="Remove palette"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add to Palette Button */}
        <div className="color-actions">
          <button
            className="add-to-palette-btn"
            onClick={() => addToPalette(selectedColor)}
            disabled={currentPalette.includes(selectedColor) || currentPalette.length >= 8}
          >
            Add Current Color to Palette
          </button>
        </div>
      </div>
    </div>
  );
};
