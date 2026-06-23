# Relationship Map

## Purpose

The Search & Relationships page includes an interactive SVG relationship map.

Nodes now provide useful summaries and navigation instead of being static labels.

## Behavior

Nodes support:

- Hover/focus tooltip
- Keyboard focus
- Click-through navigation
- Stable hover target with no flicker
- Subtle ring/glow effect on hover

## Routes

Node click behavior:

- Case nodes -> `/cases/:id`
- Document nodes -> `/documents/:id`
- Correspondence nodes -> `/correspondence/:id`
- Entity nodes -> `/search?focus=entity/:entityId` style focus route

## Tooltip

The styled tooltip is custom HTML positioned over the map.

The native SVG `<title>` tooltip was removed because it created a second long rectangular browser tooltip.

## Code Location

Main implementation:

- `src/App.tsx`
- `RelationshipMap()`

Related helpers:

- `compactNodeLabel()`
- `searchResultId()`
- `searchResultTitle()`

## Important Stability Notes

- Do not scale the whole SVG `<g>` on hover. That caused pointer flicker.
- Keep the invisible hit circle around each node.
- Keep tooltip `pointer-events-none` so the tooltip does not steal hover.
- If adding animation, animate opacity, stroke, or fill rather than node position or size.
