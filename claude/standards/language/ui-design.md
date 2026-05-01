# UI/UX Design Principles

Apple Human Interface Guidelines baseline for all UI design and review work.

---

## When to Read

- Before designing or building any UI (web, app, tool)
- During UX/UI review (`/review-audit-ux`)
- When evaluating design decisions or Figma-to-code output

---

## 1. Visual Hierarchy & Layout

- **Clear information hierarchy** — Primary content dominates, secondary content recedes. Use size, weight, color, and spacing to guide the eye
- **Platform-native patterns** — Follow established navigation patterns (tab bars, sidebars, navigation stacks) rather than custom inventions
- **Consistent spatial rhythm** — Use a spacing system (8pt grid). Alignment and grouping convey relationships between elements
- **Content density matches context** — Dense layouts for power-user tools, spacious layouts for consumer-facing content

---

## 2. Screen States

Every screen must account for all possible states:

| State | What to show |
|-------|-------------|
| **Empty** | Illustration or message + primary action ("Add your first item") |
| **Loading** | Skeleton screen or shimmer, never a blank void |
| **Populated** | The designed content with real-world data lengths |
| **Error** | What went wrong + why + action to recover (retry, go back, contact) |
| **Partial** | Graceful degradation when some data loads but other parts fail |

---

## 3. Micro-interactions & Feedback

- **Every action gets feedback** — Taps, toggles, swipes, and submissions have visual/haptic confirmation
- **Transition duration 150–300ms** — Fast enough to feel responsive, slow enough to be perceived
- **Motion conveys meaning** — Navigation transitions communicate spatial relationships (push/pop, present/dismiss)
- **Respect `prefers-reduced-motion`** — Non-essential animations disabled for users who opt out

---

## 4. Accessibility

- **VoiceOver / screen reader first** — All interactive elements have meaningful accessibility labels. Custom views implement full accessibility traits
- **Dynamic Type support** — Text scales with user's preferred size. Layouts adapt without truncation or overflow
- **Contrast minimums** — 4.5:1 for body text, 3:1 for large text and UI components (WCAG AA)
- **Color is never the only indicator** — Always pair color with icon, text, or pattern
- **Focus management** — Logical tab order, visible focus rings, modal focus trapping

---

## 5. Gestures & Navigation

- **Standard gestures respected** — Swipe-back, pull-to-refresh, long-press context menus follow platform conventions
- **Depth through motion** — Layers, sheets, and popovers convey z-axis relationships
- **Keyboard and pointer support** — Full keyboard navigation for desktop. Pointer hover states on trackpad-capable devices
- **Predictable navigation** — User always knows where they are, how they got there, and how to go back

---

## 6. Responsive & Adaptive

- **Adaptive, not just responsive** — UI adapts to size classes, not just breakpoints. Sidebar shows/hides, layouts restructure, not just scale
- **Safe areas respected** — Content never obscured by notch, home indicator, or status bar
- **Touch targets minimum 44x44px** — All interactive elements meet minimum touch target on mobile
- **Orientation changes handled** — Layout remains usable in both portrait and landscape

---

## 7. Forms & Data Entry

- **Minimal required fields** — Only ask for what's absolutely needed
- **Correct input types** — `email`, `tel`, `number`, `url` trigger the right mobile keyboard
- **Inline validation** — Errors appear next to the field, not in a distant banner. Explain how to fix
- **Preserve user input** — Never clear fields on validation error
- **Progress indication** — Multi-step forms show how many steps remain

---

## 8. Components & Consistency

- **Buttons** — Clear visual hierarchy: primary (filled), secondary (outlined), tertiary (text-only). Destructive actions in red
- **Cards** — Consistent corner radius, shadow depth, padding. Tappable cards have hover/press states
- **Data visualization** — Labeled axes, accessible color palettes, alt text for charts. Tooltips on interactive data points
- **Icons** — Consistent size, weight, and style family throughout. Don't mix outlined and filled without purpose

---

## Sources

1. [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
2. [WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/)
3. [Nielsen Norman Group: 10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)
4. [Material Design 3](https://m3.material.io/)
5. [Inclusive Components](https://inclusive-components.design/)
