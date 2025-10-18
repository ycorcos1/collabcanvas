# Memory Bank Documentation

## Overview

The Memory Bank is a persistent context system for the HØRIZON AI Agent. It stores default settings, templates, and project context to ensure consistent behavior and enable rapid prototyping with pre-built components.

---

## File Structure

```
memoryBank/
├── README.md           # This file
├── defaults.json       # Default settings and preferences
├── context.md          # Project context documentation
└── templates/
    ├── card.json       # Card UI component template
    └── button.json     # Button UI component template
```

---

## defaults.json

Contains default settings and preferences used by the AI Agent.

### Structure

```json
{
  "canvas": {
    "defaultWidth": 800,
    "defaultHeight": 1200,
    "backgroundColor": "#ffffff",
    "minDimension": 500,
    "maxDimension": 5000
  },
  "colors": {
    "primary": "#FF6B6B",
    "secondary": "#4ECDC4",
    "accent": "#FFE66D",
    "neutral": "#95E1D3",
    "palette": ["#FF0000", "#00FF00", ...]
  },
  "shapes": {
    "rectangle": {
      "defaultWidth": 100,
      "defaultHeight": 100,
      "defaultColor": "#FF0000"
    },
    "circle": {
      "defaultRadius": 50,
      "defaultColor": "#FF0000"
    },
    "text": {
      "defaultFontSize": 18,
      "defaultFontFamily": "Arial",
      "defaultColor": "#000000",
      "defaultWidth": 200,
      "defaultHeight": 40
    }
  },
  "spacing": {
    "defaultMargin": 20,
    "gridSize": 10,
    "snapTolerance": 5
  },
  "duplicateOffset": {
    "x": 50,
    "y": 50
  },
  "aiPreferences": {
    "defaultPosition": {
      "x": 400,
      "y": 600
    },
    "preferredShapeType": "rectangle",
    "autoSelect": true,
    "verboseResponses": false
  }
}
```

### Sections

#### Canvas Settings

- **defaultWidth**: Default canvas width (800px)
- **defaultHeight**: Default canvas height (1200px)
- **backgroundColor**: Default background color
- **minDimension**: Minimum canvas dimension (500px)
- **maxDimension**: Maximum canvas dimension (5000px)

#### Color Palette

- **primary**: Primary brand color
- **secondary**: Secondary brand color
- **accent**: Accent color for highlights
- **neutral**: Neutral color for backgrounds
- **palette**: Array of 12 commonly used colors

#### Shape Defaults

Defines default properties for each shape type:

- **Rectangle**: 100x100px, red (#FF0000)
- **Circle**: 50px radius, red (#FF0000)
- **Text**: 18px Arial, black (#000000), 200x40px

#### Spacing

- **defaultMargin**: Default margin between shapes (20px)
- **gridSize**: Grid snap size (10px)
- **snapTolerance**: Snap tolerance (5px)

#### Duplicate Offset

Default offset when duplicating shapes:

- **x**: 50px right
- **y**: 50px down

#### AI Preferences

- **defaultPosition**: Default position for new shapes (400, 600)
- **preferredShapeType**: Default shape type ("rectangle")
- **autoSelect**: Auto-select created shapes (true)
- **verboseResponses**: Use verbose responses (false)

---

## Templates

Templates are pre-built shape compositions that users can create with a single command.

### Template Structure

Each template is a JSON file with the following structure:

```json
{
  "name": "Template Name",
  "description": "Brief description of the template",
  "shapes": [
    {
      "type": "rect",
      "x": 0,
      "y": 0,
      "width": 200,
      "height": 120,
      "color": "#FFFFFF",
      "strokeWidth": 1,
      "stroke": "#E0E0E0",
      "cornerRadius": 8
    },
    {
      "type": "text",
      "text": "Template Text",
      "fontSize": 16,
      "fontFamily": "Arial",
      "color": "#000000",
      "x": 10,
      "y": 10,
      "width": 180,
      "height": 20
    }
  ]
}
```

### Available Templates

#### card.json

A UI card component with:

- White rounded rectangle (200x120px)
- Title text (16px, black)
- Description text (12px, gray)

**Usage**:

```
"create a card template"
"add a card at 300, 400"
```

#### button.json

A button component with:

- Colored rounded rectangle (120x40px, teal)
- Button text (14px, white, "Click Me")

**Usage**:

```
"create a button"
"add a button at 200, 100"
```

### Creating New Templates

1. Create a new JSON file in `memoryBank/templates/`
2. Follow the template structure above
3. Add the template to `src/services/memoryBank.ts`:

```typescript
import myTemplate from '../../memoryBank/templates/myTemplate.json';

constructor() {
  // ...
  this.loadTemplate('myTemplate', myTemplate as ShapeTemplate);
}
```

4. Update the tool's enum in `src/services/aiTools.ts`:

```typescript
enum: ["card", "button", "myTemplate"]
```

### Template Properties

#### Common Properties

- `type`: Shape type ("rect", "ellipse", "text", etc.)
- `x`, `y`: Position relative to template origin
- `width`, `height`: Dimensions in pixels
- `color`: Fill color (hex code)

#### Optional Properties

- `strokeWidth`: Border width
- `stroke`: Border color
- `cornerRadius`: Rounded corners (rectangles)
- `radius`: Circle radius
- `text`: Text content (text shapes)
- `fontSize`: Font size (text shapes)
- `fontFamily`: Font family (text shapes)
- `shadow`: Shadow configuration

---

## context.md

Project context documentation that provides the AI with information about:

- Project overview
- User preferences
- Recent commands
- Common patterns
- Canvas state
- Collaboration context
- Known issues
- Tips for the AI

This file is currently static but could be extended to auto-update with usage patterns.

---

## Usage in Code

### Accessing Defaults

```typescript
import { memoryBank } from "./services/memoryBank";

// Get all defaults
const defaults = memoryBank.getDefaults();

// Get specific default by path
const canvasWidth = memoryBank.getDefault("canvas.defaultWidth"); // 800
const primaryColor = memoryBank.getDefault("colors.primary"); // "#FF6B6B"
```

### Accessing Templates

```typescript
import { memoryBank } from "./services/memoryBank";

// Get a template by name
const cardTemplate = memoryBank.getTemplate("card");

// Get all templates
const allTemplates = memoryBank.getAllTemplates();

// Get template names
const templateNames = memoryBank.getTemplateNames(); // ['card', 'button']

// Check if template exists
const exists = memoryBank.hasTemplate("card"); // true
```

---

## Extending the Memory Bank

### Adding New Defaults

1. Edit `memoryBank/defaults.json`
2. Add new properties to the relevant section
3. Update TypeScript types in `src/services/memoryBank.ts` if needed

### Adding New Templates

1. Create a new JSON file in `memoryBank/templates/`
2. Define the shapes array
3. Register in `MemoryBankService` constructor
4. Add to AI tool's enum
5. Document in AI Agent Guide

### Adding Context

1. Edit `memoryBank/context.md`
2. Add relevant information for the AI
3. Consider adding auto-update logic if needed

---

## Best Practices

### Defaults

- Keep defaults sensible and widely applicable
- Use hex colors for consistency
- Maintain reasonable dimension limits
- Document any changes

### Templates

- Keep templates simple and reusable
- Use relative positioning (x, y from origin)
- Include descriptive names and descriptions
- Test templates with AI commands
- Provide usage examples in documentation

### Context

- Keep context.md concise and relevant
- Update with common issues/patterns
- Include tips that help the AI make better decisions
- Don't include sensitive information

---

## Integration with AI Agent

The Memory Bank is automatically loaded when the AI Agent initializes:

1. **On App Start**: `memoryBank` service loads all defaults and templates
2. **Tool Registration**: Templates are registered as available in the AI tools
3. **System Prompt**: AI is informed about available templates
4. **Command Execution**: Defaults are used when properties aren't specified

### Example Flow

```
User: "create a card template"
  ↓
AI Agent: Recognizes template command
  ↓
memoryBank.getTemplate('card')
  ↓
Returns card shape composition
  ↓
Creates all shapes at specified position
  ↓
User sees complete card on canvas
```

---

## Maintenance

### Regular Tasks

- Review and update defaults based on usage patterns
- Add new templates for common UI components
- Update context.md with new patterns/issues
- Clean up unused or outdated templates

### When to Update

- New design system colors → Update `colors` section
- Common canvas sizes → Update `canvas` section
- New UI patterns → Create new templates
- AI behavior issues → Update `context.md`

---

## Troubleshooting

### Template Not Found

**Problem**: AI says "Template 'X' not found"

**Solution**:

1. Check template exists in `memoryBank/templates/`
2. Verify template is registered in `memoryBank.ts`
3. Check template name matches enum in `aiTools.ts`
4. Restart dev server to reload templates

### Wrong Defaults Applied

**Problem**: Shapes created with unexpected defaults

**Solution**:

1. Check `defaults.json` has correct values
2. Verify types match (`number` vs `string`)
3. Ensure defaults are properly accessed in code
4. Check for typos in property paths

### Template Rendering Issues

**Problem**: Template shapes don't look right

**Solution**:

1. Validate JSON structure
2. Check all required properties are present
3. Verify color values are valid hex codes
4. Test with direct tool call (bypass AI)

---

## Version History

- **v1.0** (Oct 2025): Initial memory bank structure
  - defaults.json with canvas, colors, shapes sections
  - card.json and button.json templates
  - context.md documentation

---

For more information about using the AI Agent, see [AI_AGENT_GUIDE.md](../docs/AI_AGENT_GUIDE.md)

_Last Updated: October 18, 2025_

