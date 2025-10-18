# HØRIZON AI Agent - User Guide

## 🤖 Introduction

The HØRIZON AI Agent is a natural language interface that lets you manipulate shapes, text, and canvas elements using plain English commands. No need to memorize complex keyboard shortcuts or UI interactions—just tell the AI what you want!

---

## 🚀 Getting Started

### Accessing the AI Agent

1. Open any canvas project in HØRIZON
2. Look for the **"AI"** tab in the left sidebar
3. Click on the AI tab to open the chat interface
4. Type your command in the text box at the bottom
5. Press Enter or click the send button

### Your First Commands

Try these simple commands to get started:

```
"create a red circle"
"add a blue rectangle at 300, 400"
"make it twice as big"
"duplicate this shape"
"delete the circle"
```

---

## 📝 Command Reference

### Creating Shapes

#### Basic Shape Creation

```
"create a rectangle"
"add a circle"
"make a square"
"create a triangle"
```

#### With Position

```
"create a red circle at 200, 300"
"add a blue rectangle at the center"
"make a square at 500, 600"
```

#### With Size

```
"create a 200x100 rectangle"
"add a circle with radius 50"
```

#### Creating Text

```
"create text that says Hello World"
"add text 'Welcome' at 100, 200"
"make a label that says Click Here"
"create white text that says 'TITLE'"
```

### Modifying Shapes

#### Resizing

```
"make it twice as big"
"resize to 200x200"
"make it 3 times bigger"
"double the size"
"scale it 4x"
```

#### Changing Colors

```
"make it blue"
"change color to red"
"change the color to #FF5733"
"make it green"
```

#### Moving Shapes

```
"move it to 400, 500"
"move the circle to the center"
```

#### Rotating

```
"rotate 45 degrees"
"rotate 90 degrees"
"rotate -30 degrees" (counter-clockwise)
"turn it 180 degrees"
```

### Duplicating & Deleting

#### Duplication

```
"duplicate this shape"
"duplicate it"
"copy this"
"duplicate with offset 100"
```

#### Deletion

```
"delete this shape"
"delete the red circle"
"delete the selected shape"
"remove it"
```

### Selection

#### Selecting Shapes

```
"select the circle"
"select all rectangles"
"select the red shapes"
"highlight the square"
```

#### Deselecting

```
"deselect all"
"clear selection"
```

### Multi-Shape Operations

#### Alignment (requires 2+ selected shapes)

```
"align them to the left"
"align to the right"
"align to center"
"align to the top"
"align to middle"
"align to bottom"
```

#### Distribution (requires 3+ selected shapes)

```
"distribute horizontally"
"distribute vertically"
"space them evenly"
"spread them out horizontally"
```

### Templates

#### Using Templates

```
"create a card template"
"add a button"
"make a card at 300, 400"
"create a button at 200, 100"
```

Available templates:

- **Card**: White rounded rectangle with title and description text
- **Button**: Styled button with "Click Me" text

---

## 💡 Smart Features

### Context Awareness

The AI understands contextual references:

**"this", "the", "it"** refer to SELECTED shapes:

```
User: (selects a circle)
User: "make it blue"
AI: ✅ Changes the selected circle to blue

User: "duplicate this"
AI: ✅ Duplicates the selected circle
```

### Color Intelligence

Use color names or hex codes:

```
"make it red"        → #FF0000
"change to blue"     → #0000FF
"make it #FF5733"    → #FF5733
"change to orange"   → #FFA500
```

Supported colors: red, blue, green, yellow, orange, purple, pink, black, white, gray, grey, brown, cyan, magenta

### Automatic Ambiguity Detection

If your command is ambiguous, the AI will ask for clarification:

```
User: "delete the circle"
Canvas: Has 3 circles
AI: "Which circle? There are 3 circles on the canvas.
     Please select one first or be more specific (e.g., 'the red circle')."
```

### Helpful Suggestions

The AI provides suggestions for unclear commands:

```
User: "draw a something"
AI: "Did you mean 'create a shape'?
     Try: 'create a rectangle', 'create a circle', or 'create text that says...'"

User: "make bigger"
AI: "Please specify how much bigger or smaller.
     Try: 'make it twice as big' or 'resize to 200x200'"
```

---

## 🔒 Collaboration Features

### Locked Shapes

When another user is editing a shape, the AI respects their lock:

```
User A: (selects and edits a red circle)
User B: "delete the red circle"
AI: ❌ "Cannot delete circle - locked by User A"
```

### Multi-User Awareness

The AI is aware of all users in the project:

```
User: "delete all selected shapes"
Canvas: 5 shapes selected, 2 locked by other users
AI: ❌ "Cannot delete 2 shapes - locked by Alice, Bob"
```

---

## ⚡ Performance Tips

### Fast Commands (Instant Response)

These commands use the local intent router and execute instantly:

- Simple shape creation ("create a rectangle")
- Basic modifications ("make it blue", "rotate 45")
- Selection operations ("select all circles")
- Duplication ("duplicate this")
- Deletion ("delete the selected shape")

### Complex Commands (2-3 seconds)

These commands use OpenAI and take a bit longer:

- Ambiguous references without selection
- Complex multi-step operations
- Natural language variations

**Tip**: Select shapes first for faster results!

---

## 🚫 Rate Limits

To ensure fair usage, the AI is limited to:

- **50 commands per hour** per user

If you hit the limit:

```
AI: "Rate limit exceeded. Please wait before sending more commands. (50 commands per hour)"
```

The limit resets after 1 hour from your first command.

---

## 🐛 Troubleshooting

### "No shapes selected"

**Problem**: You used "this", "it", or "the shape" but nothing is selected.

**Solution**: Select a shape first using the move tool, or be more specific:

```
Instead of: "make it blue"
Try: "make the red circle blue"
```

### "Which circle?"

**Problem**: Multiple shapes of the same type exist.

**Solution**: Select the shape first, or be more specific:

```
Instead of: "delete the circle"
Try: "delete the red circle" or select it first, then "delete this"
```

### "Cannot delete - locked by [User]"

**Problem**: Another user is currently editing that shape.

**Solution**: Wait for them to finish, or work on a different shape.

### "Rate limit exceeded"

**Problem**: You've used 50+ commands in the last hour.

**Solution**: Wait a few minutes and try again. The limit resets rolling hourly.

### Command Not Working?

Try these steps:

1. **Be more specific**: "create a rectangle" instead of "make something"
2. **Select first**: Select shapes before using "this" or "it"
3. **Check the canvas**: Make sure shapes exist before trying to modify them
4. **Simplify**: Break complex requests into multiple simple commands

---

## 📚 Advanced Usage

### Chaining Operations

You can describe multiple operations, and the AI will execute them:

```
"create a red circle, duplicate it, and move it 100px right"
```

However, for best results, issue separate commands:

```
1. "create a red circle"
2. "duplicate it"
3. "move it to 200, 200"
```

### Relative Positioning

Create shapes relative to selected shapes:

```
User: (selects a rectangle)
User: "create a circle below this"
AI: ✅ Creates circle below the rectangle with proper spacing
```

### Scaling Factors

Use natural language for scaling:

```
"make it twice as big"     → 2x scale
"make it 3 times bigger"   → 3x scale
"double the size"          → 2x scale
"scale it 4x"              → 4x scale
```

---

## 🎨 Best Practices

### 1. Select Before Modifying

```
✅ Good: Select circle → "make it blue"
❌ Slow: "make the red circle blue" (AI has to find it)
```

### 2. Use Specific Colors

```
✅ Good: "create a red rectangle"
⚠️ Okay: "create a rectangle" (defaults to red)
```

### 3. Specify Positions

```
✅ Good: "create a circle at 300, 400"
⚠️ Okay: "create a circle" (defaults to 400, 600)
```

### 4. Break Down Complex Tasks

```
✅ Good:
   1. "create a card template"
   2. "duplicate it"
   3. "move it to 500, 300"

❌ Slower: "create a card template, duplicate it, and move the copy to 500, 300"
```

### 5. Use Templates for UI Elements

```
✅ Good: "create a card template"
❌ Slower: "create a white rectangle with rounded corners..."
```

---

## 🎯 Example Workflows

### Creating a Simple UI Layout

```
1. "create a card template at 200, 200"
2. "create a button at 250, 400"
3. "create text that says 'Welcome to HØRIZON' at 220, 150"
4. "make the text blue"
```

### Duplicating and Arranging Shapes

```
1. "create a red circle"
2. "duplicate it"
3. (select both circles)
4. "distribute horizontally"
5. "duplicate them"
6. (select all 4)
7. "align to center"
```

### Building a Grid

```
1. "create a square at 200, 200"
2. "duplicate it"
3. "duplicate it"
4. (select all 3)
5. "distribute horizontally"
6. (select all 3 again)
7. "duplicate them"
8. (select all 6)
9. "align to top"
```

---

## ❓ FAQ

### Q: Does the AI remember my previous commands?

**A**: The AI remembers commands within the same project session (until page refresh), but doesn't save chat history to the database to save quota.

### Q: Can the AI undo mistakes?

**A**: Not yet! Use the manual Undo function (Ctrl/Cmd+Z) to undo AI-created changes.

### Q: What happens if I make a typo?

**A**: The AI is quite good at understanding typos and will often figure out what you meant. If it's unclear, it will ask for clarification or provide suggestions.

### Q: Can I use the AI while others are editing?

**A**: Yes! The AI respects collaborative locks and will let you know if a shape is being edited by someone else.

### Q: How do I report an AI bug?

**A**: Please contact support with:

- The exact command you used
- What you expected to happen
- What actually happened
- A screenshot if possible

### Q: Will more templates be added?

**A**: Yes! We're constantly adding new templates. Check the templates folder for updates.

---

## 🔮 Coming Soon

Features planned for future releases:

- Undo/redo via AI commands
- Shape grouping/ungrouping
- Custom template creation
- Copy/paste between projects
- Canvas navigation ("zoom to fit", "center view")
- Bulk operations ("make all circles blue")
- Style copying ("make this look like that")

---

## 📞 Need Help?

If you're stuck or have questions:

1. Try the examples in this guide
2. Check the Troubleshooting section
3. Use simpler, more direct commands
4. Contact support with specific examples

---

**Happy Creating with HØRIZON AI! 🎨**

_Last Updated: October 18, 2025_
