import React, { useState } from 'react';
import './CanvasBackground.css';

/**
 * Canvas Background Component - Allow users to select canvas background color
 * 
 * Features:
 * - Predefined background colors
 * - Custom color picker
 * - Preview of selected background
 * - Floating panel design
 */

interface CanvasBackgroundProps {
  backgroundColor: string;
  onBackgroundChange: (color: string) => void;
  isOpen: boolean;
  onClose: () => void;
  anchorEl?: HTMLElement | null;
}

const BACKGROUND_PRESETS = [
  { name: 'White', color: '#ffffff' },
  { name: 'Light Gray', color: '#f8f9fa' },
  { name: 'Dark Gray', color: '#343a40' },
  { name: 'Black', color: '#000000' },
  { name: 'Cream', color: '#fdf6e3' },
  { name: 'Light Blue', color: '#e3f2fd' },
  { name: 'Light Green', color: '#e8f5e8' },
  { name: 'Light Pink', color: '#fce4ec' },
  { name: 'Light Yellow', color: '#fffde7' },
  { name: 'Light Purple', color: '#f3e5f5' },
];

export const CanvasBackground: React.FC<CanvasBackgroundProps> = ({
  backgroundColor,
  onBackgroundChange,
  isOpen,
  onClose,
  anchorEl,
}) => {
  const [customColor, setCustomColor] = useState(backgroundColor);

  const handlePresetClick = (color: string) => {
    onBackgroundChange(color);
    setCustomColor(color);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    onBackgroundChange(color);
  };

  if (!isOpen) return null;

  return (
    <div className="canvas-background-overlay">
      <div
        className="canvas-background-picker"
        style={{
          position: 'absolute',
          top: anchorEl ? anchorEl.getBoundingClientRect().bottom + 8 : '50%',
          left: anchorEl ? anchorEl.getBoundingClientRect().left : '50%',
          transform: anchorEl ? 'none' : 'translate(-50%, -50%)',
        }}
      >
        <div className="background-header">
          <h3>Canvas Background</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="background-section">
          <h4>Presets</h4>
          <div className="background-grid">
            {BACKGROUND_PRESETS.map((preset) => (
              <button
                key={preset.color}
                className={`background-swatch ${backgroundColor === preset.color ? 'selected' : ''}`}
                style={{ backgroundColor: preset.color }}
                onClick={() => handlePresetClick(preset.color)}
                title={preset.name}
              >
                {backgroundColor === preset.color && (
                  <div className="selected-indicator">✓</div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="background-section">
          <h4>Custom Color</h4>
          <div className="custom-color-section">
            <input
              type="color"
              value={customColor}
              onChange={handleCustomColorChange}
              className="color-input"
            />
            <input
              type="text"
              value={customColor}
              onChange={(e) => {
                setCustomColor(e.target.value);
                if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                  onBackgroundChange(e.target.value);
                }
              }}
              placeholder="#ffffff"
              className="hex-input"
            />
          </div>
        </div>

        <div className="background-preview">
          <div className="preview-label">Preview:</div>
          <div
            className="preview-canvas"
            style={{ backgroundColor }}
          >
            <div className="preview-shape" />
          </div>
        </div>
      </div>
    </div>
  );
};
