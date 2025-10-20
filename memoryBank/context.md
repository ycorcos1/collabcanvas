# HØRIZON AI Agent Context

## Project Overview

HØRIZON is a collaborative canvas application with an AI-powered assistant that helps users manipulate shapes, text, and other canvas elements through natural language commands.

## Current User Preferences

- **Preferred Colors**: Uses default palette (red, blue, green, yellow, etc.)
- **Canvas Size**: 800x1200 (default)
- **Shape Preferences**: No specific preference set
- **Response Style**: Concise and action-oriented

## Recent Commands

(Auto-updated with recent AI interactions)

## Common Patterns

- Users often create shapes and then resize them
- Text is frequently added to or near shapes
- Duplication is a common workflow
- Users prefer contextual references ("this", "the shape", etc.)

## Canvas State Summary

- **Total Shapes**: 0
- **Selected Shapes**: 0
- **Active Page**: Page 1
- **Zoom Level**: 100%

## Collaboration Context

- **Real-Time Sync**: ✅ ENABLED (Firestore)
- **Active Users**: Updates in real-time
- **Locked Shapes**: Tracked per-user
- **Shared Project**: Fully collaborative
- **Auto-Save**: Manual + lifecycle events (no periodic saves)
- **Change Detection**: Only saves when changes detected

## Known Issues

- None currently

## Tips for AI

- Always check if shapes are selected before operating on "this" or "the"
- Convert color names to hex codes
- Default positions should be near canvas center (400, 600)
- Respect collaborative locks
- Ask for clarification when ambiguous

---

_Last Updated: Auto-generated on first run_
