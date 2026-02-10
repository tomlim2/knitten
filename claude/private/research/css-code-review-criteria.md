# CSS Code Review Criteria and Rules

**Version:** 1.0.0
**Generated:** 2026-02-10
**Queries searched:** 28+
**Sources consulted:** 50+

---

## Table of Contents

1. [Accessibility (Critical)](#1-accessibility-critical)
2. [Performance (Error)](#2-performance-error)
3. [Animation Performance](#3-animation-performance)
4. [Specificity and Cascade Management](#4-specificity-and-cascade-management)
5. [Naming Conventions and Architecture](#5-naming-conventions-and-architecture)
6. [Code Smells and Anti-Patterns](#6-code-smells-and-anti-patterns)
7. [Responsive Design](#7-responsive-design)
8. [CSS Custom Properties](#8-css-custom-properties)
9. [Modern CSS Features](#9-modern-css-features)
10. [CSS Nesting](#10-css-nesting)
11. [Dark Mode and Theming](#11-dark-mode-and-theming)
12. [Font Loading and Typography](#12-font-loading-and-typography)
13. [Critical CSS and Loading](#13-critical-css-and-loading)
14. [CSS-in-JS Review Criteria](#14-css-in-js-review-criteria)
15. [Tailwind / Utility-First CSS](#15-tailwind--utility-first-css)
16. [Z-Index Management](#16-z-index-management)
17. [Selector Performance](#17-selector-performance)
18. [Internationalization](#18-internationalization)
19. [Print Stylesheets](#19-print-stylesheets)
20. [Stylelint Automatable Rules](#20-stylelint-automatable-rules)
21. [Company Style Guide Summaries](#21-company-style-guide-summaries)

---

## 1. Accessibility (Critical)

### 1.1 Never Remove Focus Outlines Without Replacement

- **Rule:** Never use `:focus { outline: none; }` or `outline: 0` without providing an alternative visible focus indicator.
- **Evidence:** Removing outlines violates WCAG 2.4.7 (Focus Visible, Level A). Keyboard-only users cannot determine which element is focused, making the page unusable for them.
- **Fix:** Use `:focus-visible` to show indicators only for keyboard navigation, or style the outline rather than removing it.
- **Recommended pattern:**
  ```css
  :focus-visible {
    outline: 3px solid black;
    box-shadow: 0 0 0 6px white;
  }
  ```
- **Automatable:** Yes (Stylelint plugin or custom rule can flag `outline: none` / `outline: 0`)
- **Severity:** Critical (accessibility)
- **Sources:**
  - [The A11Y Project: Never Remove CSS Outlines](https://www.a11yproject.com/posts/never-remove-css-outlines/)
  - [OutlineNone.com](https://www.outlinenone.com/)
  - [Sara Soueidan: Focus Indicators Guide](https://www.sarasoueidan.com/blog/focus-indicators/)

### 1.2 Focus Indicator Contrast and Size Requirements

- **Rule:** Focus indicators must have a minimum contrast ratio of 3:1 against adjacent colors (WCAG 1.4.11 Non-Text Contrast, Level AA). The indicator area must be at least as large as a 2 CSS pixel thick perimeter of the unfocused component (WCAG 2.4.13 Focus Appearance, Level AAA).
- **Evidence:** Default browser outlines are exempt from WCAG 2.1 AA contrast requirements, but once you override those styles, you are responsible for ensuring 3:1 minimum contrast.
- **Automatable:** Partially (tools can flag overridden focus styles; contrast ratio requires visual inspection or automated testing tools)
- **Severity:** Critical (accessibility)
- **Sources:**
  - [W3C: Understanding SC 2.4.13 Focus Appearance](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html)
  - [W3C: Understanding SC 1.4.11 Non-text Contrast](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html)

### 1.3 Color Contrast Ratios

- **Rule:** Text must meet minimum contrast ratios against its background:
  - **Level AA:** 4.5:1 for normal text, 3:1 for large text (18pt+ or 14pt+ bold)
  - **Level AAA:** 7:1 for normal text, 4.5:1 for large text
  - **UI Components:** 3:1 minimum contrast for all interactive elements and graphics
- **Evidence:** The 4.5:1 ratio compensates for loss in contrast sensitivity experienced by users with approximately 20/40 vision.
- **Automatable:** Yes (axe-core, Lighthouse, browser DevTools)
- **Severity:** Critical (accessibility / legal compliance)
- **Sources:**
  - [WebAIM: Contrast and Color Accessibility](https://webaim.org/articles/contrast/)
  - [W3C: Understanding SC 1.4.3 Contrast Minimum](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)

### 1.4 Respect prefers-reduced-motion

- **Rule:** All non-essential animations must be disabled or reduced when `prefers-reduced-motion: reduce` is active. Provide a `@media (prefers-reduced-motion: reduce)` query for every animation.
- **Evidence:** Animations can trigger vestibular disorders, epilepsy, migraines, and discomfort for users with ADHD. Every major browser supports this media query.
- **Recommended pattern:**
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```
- **Automatable:** Partially (can lint for presence of prefers-reduced-motion queries; cannot verify coverage)
- **Severity:** Critical (accessibility)
- **Sources:**
  - [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
  - [W3C: C39 Technique](https://www.w3.org/WAI/WCAG21/Techniques/css/C39)

### 1.5 overflow:hidden Content Accessibility

- **Rule:** Avoid `overflow: hidden` on containers where content may be cut off, especially at higher zoom levels. Scrollable containers must be keyboard-accessible.
- **Evidence:** Content hidden with overflow is utterly inaccessible. Users with larger default font sizes may have text pushed outside boxes and completely hidden. Scroll containers are not keyboard-focusable in most browsers (Firefox and Chrome 132+ are exceptions).
- **Fix:** Add `tabindex="0"`, an appropriate ARIA role, and an accessible name to scrollable containers.
- **Automatable:** Partially (can flag `overflow: hidden`; context needed to determine if it is problematic)
- **Severity:** Critical (accessibility)
- **Sources:**
  - [MDN: overflow](https://developer.mozilla.org/en-US/docs/Web/CSS/overflow)
  - [W3C ACT Rule: Zoomed text node clipping](https://www.w3.org/WAI/standards-guidelines/act/rules/59br37/proposed/)

### 1.6 text-overflow: ellipsis Accessibility Concerns

- **Rule:** Treat `text-overflow: ellipsis` as a design smell. Truncated text creates accessibility failures for sighted screen reader users, speech recognition users, and low-vision users.
- **Evidence:** Screen readers read the full untruncated text (it is still in the DOM), creating a mismatch with visual content. Speech recognition users cannot activate controls with truncated visible labels. Truncation is an instant failure of WCAG 1.4.10 (Reflow).
- **Fix:** Use disclosure patterns (expand/collapse) or allow text wrapping with hyphens instead of truncation.
- **Automatable:** Partially (can flag `text-overflow: ellipsis`; needs human judgment)
- **Severity:** Critical (accessibility)
- **Sources:**
  - [Eric Eggert: text-overflow: ellipsis considered harmful](https://yatil.net/blog/text-overflow-ellipsis-harmful)
  - [Ben Nadel: Reconsidering text-overflow: ellipsis](https://www.bennadel.com/blog/3624-reconsidering-text-overflow-ellipsis-as-a-design-smell-and-accessibility-concern.htm)

---

## 2. Performance (Error)

### 2.1 Inline Critical CSS, Defer the Rest

- **Rule:** Inline above-the-fold critical CSS in the HTML `<head>`. Defer non-critical CSS with `media` attributes or async loading.
- **Evidence:** CSS is render-blocking -- the browser blocks page rendering until the CSSOM is complete. Inlining critical CSS eliminates the need for the browser to wait for external stylesheet files, reducing First Contentful Paint (FCP) and Largest Contentful Paint (LCP).
- **Automatable:** Partially (build tools like Critical, Penthouse, or webpack plugins automate extraction; review verifies implementation)
- **Severity:** Error (performance)
- **Sources:**
  - [Google: Optimize CSS Delivery](https://developers.google.com/speed/docs/insights/OptimizeCSSDelivery)
  - [MDN: Critical Rendering Path](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Critical_rendering_path)
  - [web.dev: Understanding the Critical Path](https://web.dev/learn/performance/understanding-the-critical-path)

### 2.2 Remove Unused CSS

- **Rule:** Eliminate unused CSS rules from production stylesheets. Unused CSS can account for up to 90% of a stylesheet in some cases.
- **Evidence:** Unused CSS increases file size, download time, and parse time without providing any benefit. Tools like PurgeCSS and UnCSS can automate detection.
- **Automatable:** Yes (PurgeCSS, UnCSS, Chrome DevTools Coverage)
- **Severity:** Error (performance)
- **Sources:**
  - [PurgeCSS](https://purgecss.com)
  - [CSS-Tricks: How Do You Remove Unused CSS](https://css-tricks.com/how-do-you-remove-unused-css-from-a-site/)

### 2.3 Minify and Compress CSS

- **Rule:** All production CSS files must be minified (whitespace removed) and served with gzip/brotli compression.
- **Evidence:** Minification and compression considerably reduce loading times. This is a baseline expectation for any production site.
- **Automatable:** Yes (build tools: cssnano, clean-css, PostCSS)
- **Severity:** Error (performance)
- **Sources:**
  - [MDN: CSS Performance Optimization](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Performance/CSS)

### 2.4 Use content-visibility for Off-Screen Content

- **Rule:** Apply `content-visibility: auto` with `contain-intrinsic-size` to large off-screen content blocks (long lists, feed items, comment threads).
- **Evidence:** Rendering times can drop from 232ms to 30ms (7x improvement). Benchmarks show ~45% improvement in Chrome and Firefox. The browser skips layout and painting for off-screen elements.
- **Automatable:** No (requires architectural understanding of which elements benefit)
- **Severity:** Suggestion (performance optimization)
- **Sources:**
  - [web.dev: content-visibility](https://web.dev/articles/content-visibility)
  - [DebugBear: content-visibility](https://www.debugbear.com/blog/content-visibility-api)

### 2.5 Use CSS Containment for Layout Isolation

- **Rule:** Use the `contain` property to isolate components from the rest of the page layout.
- **Evidence:** With `contain: content`, the browser can skip recalculating layout/style for contained elements when other parts of the page change. Baseline CSS feature since 2023.
- **Automatable:** No (requires human judgment)
- **Severity:** Suggestion (performance)
- **Sources:**
  - [MDN: CSS Performance Optimization](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Performance/CSS)

### 2.6 Set min-height to Prevent CLS

- **Rule:** Add CSS `min-height` to elements that change size during load (ads, embeds, dynamic content, images without explicit dimensions).
- **Evidence:** Cumulative Layout Shift (CLS) measures unexpected layout shifts. Adding min-height prevents content from jumping when elements load. CLS threshold for "good" is under 0.1.
- **Automatable:** Partially (Lighthouse flags CLS issues; root cause needs human analysis)
- **Severity:** Error (performance / UX)
- **Sources:**
  - [web.dev: Core Web Vitals](https://web.dev/articles/vitals)
  - [web.dev: Top CWV Improvements](https://web.dev/articles/top-cwv)

---

## 3. Animation Performance

### 3.1 Only Animate transform, opacity, and filter

- **Rule:** Never animate properties that trigger layout recalculation (width, height, top, left, margin, padding, border, box-shadow, flex). Only animate `transform`, `opacity`, and `filter`.
- **Evidence:** Layout-triggering animations cause reflows on every frame, making 60fps impossible. Transform and opacity are handled by the GPU compositor thread without touching the main thread.
- **Properties that trigger layout (avoid animating):**
  - `width`, `height`, `border`, `padding`, `margin`
  - `top`, `bottom`, `left`, `right`
  - `align-content`, `align-items`, `flex`
  - `box-shadow`, `font-size`
- **Automatable:** Yes (Stylelint plugin can flag `transition`/`animation` on layout properties)
- **Severity:** Error (performance)
- **Sources:**
  - [Smashing Magazine: CSS GPU Animation](https://www.smashingmagazine.com/2016/12/gpu-animation-doing-it-right/)
  - [MDN: CSS Performance Optimization](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Performance/CSS)

### 3.2 Use will-change Sparingly

- **Rule:** Only apply `will-change` to elements with known, measured performance problems. Never blanket-apply it.
- **Evidence:** Each `will-change: transform` promotes an element to its own GPU composite layer, consuming significant memory. A carousel of 10 images at 800x600 consumes ~19MB of additional GPU memory with `will-change`. Overuse floods the GPU with layers, hurting performance more than helping.
- **Automatable:** Partially (can flag widespread `will-change` usage)
- **Severity:** Error (performance)
- **Sources:**
  - [Smashing Magazine: CSS GPU Animation](https://www.smashingmagazine.com/2016/12/gpu-animation-doing-it-right/)
  - [Lexo: CSS GPU Acceleration Guide](https://www.lexo.ch/blog/2025/01/boost-css-performance-with-will-change-and-transform-translate3d-why-gpu-acceleration-matters/)

---

## 4. Specificity and Cascade Management

### 4.1 Never Use !important Reactively

- **Rule:** `!important` should never be used to override specificity problems. The only legitimate uses are: (1) overriding inline styles from third-party code, (2) utility classes that must always win (e.g., `.hidden { display: none !important; }`).
- **Evidence:** `!important` can only be overridden by another `!important`, creating escalating specificity wars. It breaks the natural cascade and makes debugging extremely difficult. Use cascade layers or increase selector specificity instead.
- **Automatable:** Yes (Stylelint: `declaration-no-important`)
- **Severity:** Error (maintainability)
- **Sources:**
  - [UX Engineer: Avoid !important](https://uxengineer.com/blog/css-specificity-avoid-important-css)
  - [MDN: Specificity and !important](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity)
  - [CSS Wizardry: Code Smells in CSS](https://csswizardry.com/2012/11/code-smells-in-css/)

### 4.2 Avoid ID Selectors for Styling

- **Rule:** Never use ID selectors (`#element`) for CSS styling. Use class selectors instead.
- **Evidence:** IDs are 255x more specific than classes and cannot be reused. They create specificity problems that cascade through the entire stylesheet. Google, Airbnb, and every major style guide prohibits them.
- **Automatable:** Yes (Stylelint: `selector-max-id`)
- **Severity:** Error (maintainability)
- **Sources:**
  - [Google HTML/CSS Style Guide](https://google.github.io/styleguide/htmlcssguide.html)
  - [Airbnb CSS Style Guide](https://github.com/airbnb/css)
  - [CSS Wizardry: Code Smells in CSS](https://csswizardry.com/2012/11/code-smells-in-css/)

### 4.3 Use Cascade Layers for Third-Party CSS

- **Rule:** Import third-party CSS into cascade layers using `@layer` to control override order without needing `!important`.
- **Evidence:** Cascade layers provide a structured way to organize CSS so that styles in later-defined layers override earlier ones, regardless of specificity. This eliminates the need for `!important` when overriding vendor/framework styles.
- **Example:**
  ```css
  @layer reset, base, components, utilities;
  @import url("vendor.css") layer(reset);
  ```
- **Automatable:** No (architectural decision)
- **Severity:** Suggestion (maintainability)
- **Sources:**
  - [MDN: Cascade Layers](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascade/Specificity)
  - [Medium: Modern CSS Trends 2025](https://medium.com/@mernstackdevbykevin/modern-css-trends-2025-container-queries-subgrid-cascade-layers-real-use-cases-tips-733af70eb5fb)

### 4.4 No Descending Specificity

- **Rule:** Selectors of lower specificity should not come after overriding selectors of higher specificity within the same context.
- **Evidence:** When a higher-specificity selector precedes the one it overrides, it violates source order expectations and creates confusing cascade behavior. Stylesheets are most legible when overriding selectors always come after the selectors they override.
- **Automatable:** Yes (Stylelint: `no-descending-specificity`)
- **Severity:** Error (maintainability / bugs)
- **Sources:**
  - [Stylelint: no-descending-specificity](https://stylelint.io/user-guide/rules/no-descending-specificity/)

### 4.5 Avoid Qualified Selectors

- **Rule:** Do not prefix class selectors with element types (e.g., use `.nav` not `ul.nav`, use `.button` not `a.button`).
- **Evidence:** Qualified selectors reduce reusability (cannot apply `.nav` to an `<ol>`), increase specificity unnecessarily, and decrease performance. The style should describe the component, not the HTML element.
- **Automatable:** Yes (Stylelint: `selector-no-qualifying-type`)
- **Severity:** Suggestion (maintainability)
- **Sources:**
  - [CSS Wizardry: Code Smells in CSS](https://csswizardry.com/2012/11/code-smells-in-css/)

---

## 5. Naming Conventions and Architecture

### 5.1 Use a Consistent Naming Convention

- **Rule:** Adopt and enforce one naming convention across the entire codebase: BEM, OOCSS, SMACSS, or a well-documented custom convention.
- **Evidence:** Naming conventions enhance readability, maintainability, collaboration, and scalability. BEM is the most widely adopted, supported by Airbnb, Google (variant), and most large codebases.
- **BEM pattern:** `.block__element--modifier`
  - `.ListingCard` = block
  - `.ListingCard__title` = element
  - `.ListingCard--featured` = modifier
- **Automatable:** Partially (Stylelint: `selector-class-pattern` with regex)
- **Severity:** Suggestion (maintainability)
- **Sources:**
  - [Airbnb CSS Style Guide](https://github.com/airbnb/css)
  - [Sparkbox: BEM by Example](https://sparkbox.com/foundry/bem_by_example)
  - [BEM.info: Naming Convention](https://en.bem.info/methodology/naming-convention/)

### 5.2 Separate JS Hooks from CSS Classes

- **Rule:** Use `.js-` prefixed classes for JavaScript binding. Never bind JS behavior and CSS styles to the same class.
- **Evidence:** When CSS and JS share classes, developers fear refactoring CSS because it might break functionality, and vice versa. Separate concerns allow independent maintenance.
- **Automatable:** Partially (can lint for `.js-` prefix in stylesheets)
- **Severity:** Suggestion (maintainability)
- **Sources:**
  - [Airbnb CSS Style Guide](https://github.com/airbnb/css)

### 5.3 Use Meaningful, Specific Class Names

- **Rule:** Class names should reflect the purpose of the element, not its appearance. Avoid vague names like `.card`, `.user`, or `.left`.
- **Evidence:** Loose class names risk accidental redefinition across the codebase and obscure the component's purpose. Use specific names like `.credit-card-image` or `.user-profile-avatar`.
- **Automatable:** No (requires human judgment)
- **Severity:** Suggestion (maintainability)
- **Sources:**
  - [Google HTML/CSS Style Guide](https://google.github.io/styleguide/htmlcssguide.html)
  - [CSS Wizardry: Code Smells in CSS](https://csswizardry.com/2012/11/code-smells-in-css/)

---

## 6. Code Smells and Anti-Patterns

### 6.1 No Magic Numbers

- **Rule:** Every numeric value should be self-evident or derived from a variable/calculation. Hardcoded values like `top: 37px` or `margin-left: -3px` are magic numbers.
- **Evidence:** Magic numbers break when the surrounding context changes (font size, container width, etc.) and are incomprehensible to the next developer. Self-evident values include: 0, 1px, 1em, 50%, 100%.
- **Automatable:** No (requires human understanding of intent)
- **Severity:** Suggestion (maintainability)
- **Sources:**
  - [CSS-Tricks: Magic Numbers in CSS](https://css-tricks.com/magic-numbers-in-css/)
  - [CSS Wizardry: Code Smells in CSS](https://csswizardry.com/2012/11/code-smells-in-css/)

### 6.2 No Undoing Styles

- **Rule:** Any CSS that unsets styles (except in a reset) is a code smell. Rules like `border-bottom: none`, `padding: 0`, or `margin: 0` that counteract prior rules indicate poor architecture.
- **Evidence:** If you find yourself undoing styles, the original rule was too broadly applied. Build styles additively -- apply styles only where needed rather than applying broadly and removing.
- **Automatable:** No (requires understanding of intent)
- **Severity:** Suggestion (architecture)
- **Sources:**
  - [CSS Wizardry: Code Smells in CSS](https://csswizardry.com/2012/11/code-smells-in-css/)

### 6.3 No Brute-Forcing

- **Rule:** Heavy-handed declarations like `z-index: 99999`, `margin-left: -3px`, or `!important` indicate the developer is fighting the layout rather than understanding it.
- **Evidence:** Brute-force fixes mask the real problem (incorrect box model understanding, stacking context issues, etc.) and create fragile code that breaks when context changes.
- **Automatable:** Partially (can flag very high z-index values, negative margins)
- **Severity:** Suggestion (architecture)
- **Sources:**
  - [CSS Wizardry: Code Smells in CSS](https://csswizardry.com/2012/11/code-smells-in-css/)

### 6.4 Avoid Dangerous Selectors

- **Rule:** Never style bare element selectors like `header {}`, `ul {}`, `div {}`, `a {}` in component stylesheets. These reach unintended elements across the page.
- **Evidence:** A bare `header {}` selector will style every `<header>` element on the page, not just the site header. Use specific class names like `.site-header {}`.
- **Automatable:** Partially (Stylelint: `selector-max-type`)
- **Severity:** Error (bugs / unintended side effects)
- **Sources:**
  - [CSS Wizardry: Code Smells in CSS](https://csswizardry.com/2012/11/code-smells-in-css/)

### 6.5 Use Relative Units Over Hardcoded Absolutes

- **Rule:** Prefer relative units (`em`, `rem`, `%`, `vw/vh`, `ch`) over fixed units (`px`) for typography, spacing, and layout.
- **Evidence:** Hardcoded values like `line-height: 32px` do not scale when the base font size changes. Relative values like `line-height: 1.5` scale automatically and support user preferences.
- **Automatable:** Partially (Stylelint plugins can flag px usage in certain contexts)
- **Severity:** Suggestion (flexibility / accessibility)
- **Sources:**
  - [CSS Wizardry: Code Smells in CSS](https://csswizardry.com/2012/11/code-smells-in-css/)

---

## 7. Responsive Design

### 7.1 Mobile-First Media Queries

- **Rule:** Use `min-width` queries (mobile-first) rather than `max-width` queries (desktop-first) to layer enhancements progressively.
- **Evidence:** Mobile-first results in smaller initial CSS payloads and better performance on mobile devices. It ensures the base experience works on the most constrained devices first.
- **Automatable:** Partially (can lint for query direction consistency)
- **Severity:** Suggestion (architecture)
- **Sources:**
  - [BrowserStack: Responsive Design Breakpoints 2025](https://www.browserstack.com/guide/responsive-design-breakpoints)

### 7.2 Content-Driven Breakpoints, Not Device-Driven

- **Rule:** Set breakpoints where your content breaks, not at specific device widths (e.g., 768px for "iPad").
- **Evidence:** Device dimensions change constantly. Content-driven breakpoints are future-proof because they respond to when the layout actually needs to change, not arbitrary device measurements.
- **Automatable:** No (requires design judgment)
- **Severity:** Suggestion (architecture)
- **Sources:**
  - [BrowserStack: Complete Guide to Media Queries 2026](https://www.browserstack.com/guide/what-are-css-and-media-query-breakpoints)
  - [LogRocket: CSS Breakpoints for Responsive Design](https://blog.logrocket.com/css-breakpoints-responsive-design/)

### 7.3 Limit Breakpoint Count

- **Rule:** Minimize the number of breakpoints. Focus on major design shifts rather than fine-tuning for every device.
- **Evidence:** Too many breakpoints make CSS complex and hard to maintain. Combine media queries where possible.
- **Automatable:** Partially (can count media queries)
- **Severity:** Suggestion (maintainability)
- **Sources:**
  - [BrowserStack: Complete Guide to Media Queries 2026](https://www.browserstack.com/guide/what-are-css-and-media-query-breakpoints)

### 7.4 Use Grid for Layout, Flexbox for Alignment

- **Rule:** Use CSS Grid for two-dimensional page-level layouts. Use Flexbox for one-dimensional component-level alignment.
- **Evidence:** Grid handles rows AND columns simultaneously (page structures, dashboards). Flexbox handles either rows OR columns (nav bars, card content alignment). Combining both -- Grid for structure, Flexbox inside grid cells -- is the recommended pattern.
- **Automatable:** No (requires architectural understanding)
- **Severity:** Suggestion (architecture)
- **Sources:**
  - [LogRocket: CSS Flexbox vs CSS Grid](https://blog.logrocket.com/css-flexbox-vs-css-grid/)
  - [MDN: Relationship of grid to other layout methods](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Relationship_with_other_layout_methods)

---

## 8. CSS Custom Properties

### 8.1 Use Consistent Naming Convention

- **Rule:** Custom properties must use kebab-case (e.g., `--primary-font-size`). Names are case-sensitive: `--my-color` and `--My-color` are different.
- **Evidence:** Inconsistent naming creates confusion and bugs. kebab-case aligns with CSS convention and is the most readable format.
- **Automatable:** Yes (Stylelint: `custom-property-pattern`)
- **Severity:** Suggestion (maintainability)
- **Sources:**
  - [MDN: Using CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascading_variables/Using_custom_properties)

### 8.2 Scope Variables Appropriately

- **Rule:** Use a 70/30 global-to-local ratio. Global variables (design tokens) go on `:root`. Component-specific variables go on the component selector.
- **Evidence:** Setting variables only at `:root` clutters the global scope. Setting them too locally reduces reusability. Balancing scope enhances flexibility while avoiding clutter.
- **Automatable:** No (requires architectural judgment)
- **Severity:** Suggestion (architecture)
- **Sources:**
  - [CSS-Tricks: Complete Guide to Custom Properties](https://css-tricks.com/a-complete-guide-to-custom-properties/)
  - [Smashing Magazine: Strategy Guide to CSS Custom Properties](https://www.smashingmagazine.com/2018/05/css-custom-properties-strategy-guide/)

### 8.3 Always Provide Fallback Values

- **Rule:** Use `var(--property, fallback)` with a fallback value for graceful degradation.
- **Evidence:** If a custom property is undefined or inherited incorrectly, the fallback prevents layout breakage. Essential for component libraries consumed by different applications.
- **Automatable:** Partially (can lint for missing fallback values)
- **Severity:** Suggestion (robustness)
- **Sources:**
  - [MDN: Using CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascading_variables/Using_custom_properties)

### 8.4 Use @property for Type Safety

- **Rule:** Register custom properties with `@property` to define type, initial value, and inheritance behavior.
- **Evidence:** `@property` provides type checking at the browser level. If an invalid type is set, it falls back to the initial value rather than breaking silently.
- **Automatable:** No (design-time decision)
- **Severity:** Suggestion (robustness)
- **Sources:**
  - [MDN: @property](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/--)

---

## 9. Modern CSS Features

### 9.1 Container Queries Over Viewport Queries for Components

- **Rule:** Use container queries (`@container`) for component-level responsive behavior instead of viewport-based media queries.
- **Evidence:** Container queries allow elements to adapt based on their parent container's dimensions, not the viewport. This makes components truly reusable across different layout contexts. Supported in all major browsers as of 2024.
- **Automatable:** No (architectural decision)
- **Severity:** Suggestion (architecture)
- **Sources:**
  - [Medium: Modern CSS Trends 2025](https://medium.com/@mernstackdevbykevin/modern-css-trends-2025-container-queries-subgrid-cascade-layers-real-use-cases-tips-733af70eb5fb)

### 9.2 Use :has() Carefully for Performance

- **Rule:** The `:has()` selector is powerful but can be expensive. Use it deliberately and test performance on large DOMs.
- **Evidence:** `:has()` is the most-used and most-loved new CSS feature per the State of CSS 2025 survey. However, MDN specifically notes performance considerations. On large DOM trees, complex `:has()` selectors can slow style recalculation.
- **Automatable:** Partially (can flag `:has()` usage for review)
- **Severity:** Suggestion (performance awareness)
- **Sources:**
  - [State of CSS 2025](https://2025.stateofcss.com/en-US/features/)
  - [MDN: :has() performance considerations](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:has)

### 9.3 Use Subgrid for Nested Grid Alignment

- **Rule:** Use `subgrid` when child elements need to align with the parent grid's tracks, instead of duplicating grid definitions.
- **Evidence:** Subgrid eliminates the need to manually replicate grid track definitions in nested elements. It is the second most-loved CSS feature per State of CSS 2025. Supported in all major browsers.
- **Automatable:** No (design decision)
- **Severity:** Suggestion (architecture)
- **Sources:**
  - [State of CSS 2025](https://2025.stateofcss.com/en-US/features/)

---

## 10. CSS Nesting

### 10.1 Maximum 2-3 Levels of Nesting Depth

- **Rule:** Limit nesting to 2 levels (3 in exceptional cases). This applies to both native CSS nesting and Sass.
- **Evidence:** Deep nesting increases specificity, reduces readability, and creates tightly-coupled styles. Airbnb mandates max 3 levels. Native CSS nesting wraps ancestors in `:is()`, creating unexpected specificity behavior.
- **Automatable:** Yes (Stylelint: `selector-max-compound-selectors`, `max-nesting-depth`)
- **Severity:** Error (maintainability)
- **Sources:**
  - [Airbnb CSS Style Guide](https://github.com/airbnb/css)
  - [Piccalilli: CSS Nesting Use with Caution](https://piccalil.li/blog/css-nesting-use-with-caution/)

### 10.2 Understand Native CSS Nesting :is() Wrapping

- **Rule:** In native CSS nesting, the `&` selector wraps its ancestor in `:is()`, which affects specificity calculation differently from Sass. Review nested CSS with this in mind.
- **Evidence:** This behavior surprises developers coming from Sass. The `:is()` pseudo-class takes the specificity of its most specific argument, which can lead to unintended specificity escalation.
- **Automatable:** No (requires understanding of specificity model)
- **Severity:** Suggestion (correctness)
- **Sources:**
  - [Piccalilli: CSS Nesting Use with Caution](https://piccalil.li/blog/css-nesting-use-with-caution/)
  - [MDN: CSS Nesting](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Nesting)

### 10.3 Reserve Nesting for Pseudo-States and Media Queries

- **Rule:** Use nesting primarily for pseudo-classes (`:hover`, `:focus`, `:active`), pseudo-elements (`::before`, `::after`), media queries, and ARIA attributes. Avoid nesting descendant selectors.
- **Evidence:** Nesting pseudo-states and media queries inside the parent selector improves readability by co-locating related styles. Nesting descendant selectors mirrors HTML structure too closely, creating over-specific and fragile CSS.
- **Automatable:** No (requires judgment)
- **Severity:** Suggestion (architecture)
- **Sources:**
  - [618media: Simplifying CSS with Nesting Rules](https://618media.com/en/blog/simplifying-css-with-nesting-rules/)
  - [Ronald Svilcins: CSS Nesting Done Right](https://ronaldsvilcins.com/2025/01/22/css-nesting-done-right/)

---

## 11. Dark Mode and Theming

### 11.1 Respect System Theme Preferences

- **Rule:** Implement `prefers-color-scheme` media query to automatically match the user's system theme setting.
- **Evidence:** Users expect websites to respect their OS-level theme preference. This is the baseline for dark mode support.
- **Automatable:** Partially (can verify presence of prefers-color-scheme queries)
- **Severity:** Suggestion (UX)
- **Sources:**
  - [MDN: prefers-color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)

### 11.2 Use CSS Custom Properties for Theme Tokens

- **Rule:** Define all theme-dependent colors, shadows, and borders as CSS custom properties. Reassign them per theme variant.
- **Evidence:** Custom properties enable theme switching without duplicating entire stylesheets. This is the most flexible and maintainable approach for multi-theme support. Works with `data-theme` attributes for user toggles.
- **Automatable:** Partially (can flag hardcoded color values outside of custom properties)
- **Severity:** Suggestion (architecture)
- **Sources:**
  - [Medium: Theming with CSS in 2025](https://mamutlove.com/en/blog/theming-with-css-in-2025/)
  - [CSS-Tricks: Dark Mode on the Web](https://css-tricks.com/a-complete-guide-to-dark-mode-on-the-web/)

### 11.3 Use light-dark() Function (Modern)

- **Rule:** The new `light-dark()` CSS function accepts two color values -- first for light, second for dark scheme -- eliminating the need for separate media query blocks.
- **Evidence:** Simplifies theme declarations by reducing boilerplate. Requires `color-scheme: light dark` on the root element. Supported in all major browsers as of 2025.
- **Example:**
  ```css
  :root { color-scheme: light dark; }
  body { background: light-dark(#fff, #1a1a1a); }
  ```
- **Automatable:** No (design decision)
- **Severity:** Suggestion (simplification)
- **Sources:**
  - [Medium: Dark Mode with light-dark() Function](https://medium.com/front-end-weekly/forget-javascript-achieve-dark-mode-effortlessly-with-brand-new-css-function-light-dark-2024-94981c61756b)

### 11.4 Ensure Dark Mode Contrast Compliance

- **Rule:** Dark mode must meet the same WCAG contrast ratios as light mode. Test all color combinations independently.
- **Evidence:** Dark mode designs commonly fail contrast checks because designers optimize for aesthetics over accessibility. Dark backgrounds with low-contrast gray text is the most common failure.
- **Automatable:** Partially (axe-core can test both modes if toggled)
- **Severity:** Critical (accessibility)
- **Sources:**
  - [Medium: Dark Mode Best Practices 2025](https://medium.com/@jackbrownkarmaa/dark-mode-in-web-design-best-practices-in-2025-445d8d6463a3)

---

## 12. Font Loading and Typography

### 12.1 Use font-display: swap for Body Text

- **Rule:** Set `font-display: swap` for critical body/navigation fonts to ensure text is visible immediately with a fallback font.
- **Evidence:** Without `font-display`, browsers block text rendering for up to 3 seconds (FOIT - Flash of Invisible Text). `swap` shows fallback text immediately and swaps to the web font when loaded, improving FCP and LCP.
- **Automatable:** Yes (can lint @font-face declarations for font-display)
- **Severity:** Error (performance)
- **Sources:**
  - [Chrome Developers: Font Display](https://developer.chrome.com/blog/font-display)
  - [web.dev: Font Best Practices](https://web.dev/articles/font-best-practices)

### 12.2 Use font-display: optional for Decorative Fonts

- **Rule:** Non-critical and decorative fonts should use `font-display: optional` to prevent layout shifts.
- **Evidence:** `optional` gives a ~100ms block period with no swap period. If the font does not load in time, the fallback is used permanently, preventing any layout shift. Best for fonts that are "nice to have" but not critical.
- **Automatable:** No (requires understanding of font role)
- **Severity:** Suggestion (performance)
- **Sources:**
  - [web.dev: Font Best Practices](https://web.dev/articles/font-best-practices)

### 12.3 Use WOFF2 Exclusively

- **Rule:** Serve web fonts only in WOFF2 format. Remove WOFF, TTF, and other fallbacks.
- **Evidence:** WOFF2 uses Brotli compression, delivering 30% better file sizes than WOFF. Browser support is universal (97%+). Maintaining multiple formats adds complexity without benefit.
- **Automatable:** Yes (can lint @font-face src for non-WOFF2 formats)
- **Severity:** Suggestion (performance)
- **Sources:**
  - [web.dev: Font Best Practices](https://web.dev/articles/font-best-practices)

### 12.4 Use size-adjust to Reduce Font Swap CLS

- **Rule:** Apply `size-adjust` in `@font-face` rules to match fallback font metrics, minimizing layout shift when the web font loads.
- **Evidence:** Font swapping is a well-known cause of CLS. `size-adjust` adjusts the fallback font's size to closely match the web font, reducing or eliminating visible layout shift on swap.
- **Automatable:** No (requires metric comparison)
- **Severity:** Suggestion (performance)
- **Sources:**
  - [DebugBear: Web Font Layout Shift](https://www.debugbear.com/blog/web-font-layout-shift)

### 12.5 Never Use @import for Fonts

- **Rule:** Declare `@font-face` in a stylesheet the browser sees early (ideally inlined in `<head>` with preload). Never use `@import` for font loading.
- **Evidence:** `@import` is render-blocking and sequential. It forces the browser to discover fonts later in the loading waterfall, significantly delaying FCP.
- **Automatable:** Yes (Stylelint can flag `@import` usage)
- **Severity:** Error (performance)
- **Sources:**
  - [Jono Alderson: You're Loading Fonts Wrong](https://www.jonoalderson.com/performance/youre-loading-fonts-wrong/)

### 12.6 Avoid Icon Fonts

- **Rule:** Replace icon fonts with SVG icons. Icon fonts cause layout shifts and accessibility issues.
- **Evidence:** When icon fonts fail to load, fallback fonts display meaningless characters. SVGs are accessible, cacheable, and do not cause layout shift.
- **Automatable:** Partially (can flag icon font declarations)
- **Severity:** Suggestion (accessibility / performance)
- **Sources:**
  - [web.dev: Font Best Practices](https://web.dev/articles/font-best-practices)

---

## 13. Critical CSS and Loading

### 13.1 Split CSS by Media Query

- **Rule:** Use `media` attributes on `<link>` elements so the browser only render-blocks on CSS needed for the current context.
- **Evidence:** The browser downloads all stylesheets regardless but only render-blocks on those matching the current media. Print CSS with `media="print"` and mobile CSS with `media="screen and (max-width: 480px)"` will not block desktop rendering.
- **Example:**
  ```html
  <link rel="stylesheet" href="print.css" media="print" />
  <link rel="stylesheet" href="mobile.css" media="screen and (max-width: 480px)" />
  ```
- **Automatable:** Partially (build tools can automate splitting)
- **Severity:** Error (performance)
- **Sources:**
  - [MDN: CSS Performance Optimization](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Performance/CSS)

### 13.2 Preload Critical Fonts and Stylesheets

- **Rule:** Use `<link rel="preload">` for above-the-fold fonts and critical CSS files.
- **Evidence:** Preloading moves resource discovery earlier in the loading waterfall, reducing LCP. But use sparingly -- preloading too many resources cancels out the benefit.
- **Automatable:** Partially (Lighthouse flags missing preloads)
- **Severity:** Suggestion (performance)
- **Sources:**
  - [MDN: CSS Performance Optimization](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Performance/CSS)

---

## 14. CSS-in-JS Review Criteria

### 14.1 Prefer Zero-Runtime CSS-in-JS

- **Rule:** If using CSS-in-JS, prefer zero-runtime solutions (Panda CSS, vanilla-extract, Linaria, CSS Modules) over runtime libraries (styled-components, Emotion).
- **Evidence:** Runtime CSS-in-JS generates styles in JavaScript on every render, adding CPU overhead. Zero-runtime solutions extract styles at build time, producing static CSS files with no runtime cost. This is especially important for SSR (Server-Side Rendering) performance.
- **Automatable:** No (architectural decision)
- **Severity:** Error (performance, for high-traffic applications)
- **Sources:**
  - [LogRocket: Zero-Runtime CSS-in-JS Libraries](https://blog.logrocket.com/comparing-top-zero-runtime-css-js-libraries/)
  - [Markaicode: CSS-in-JS Crisis 2025](https://markaicode.com/css-in-js-crisis-server-rendering-solutions-react-22/)

### 14.2 Co-locate Styles with Components (CSS-in-JS)

- **Rule:** When using CSS-in-JS, keep style definitions in the same file or adjacent to the component they style.
- **Evidence:** Mixing styled-components with external CSS files makes styles impossible to trace. Keeping styles co-located with components improves discoverability during code review and debugging.
- **Automatable:** Partially (file structure lint rules)
- **Severity:** Suggestion (maintainability)
- **Sources:**
  - [CSS-Tricks: Thorough Analysis of CSS-in-JS](https://css-tricks.com/a-thorough-analysis-of-css-in-js/)
  - [GetStream: Styled Components vs CSS Stylesheets](https://getstream.io/blog/styled-components-vs-css-stylesheets/)

---

## 15. Tailwind / Utility-First CSS

### 15.1 Enforce Consistent Class Ordering

- **Rule:** Use Prettier plugin (`prettier-plugin-tailwindcss`) to automatically sort utility classes in a consistent order.
- **Evidence:** Without ordering, long utility class strings become unreadable. The recommended order is: positioning/visibility, box model, borders, backgrounds, typography, then visual adjustments.
- **Automatable:** Yes (prettier-plugin-tailwindcss, eslint-plugin-tailwindcss)
- **Severity:** Suggestion (readability)
- **Sources:**
  - [FrontendTools: Tailwind Best Practices 2025-2026](https://www.frontendtools.tech/blog/tailwind-css-best-practices-design-system-patterns)

### 15.2 Extract Repeated Patterns into Components

- **Rule:** When the same set of utility classes appears 3+ times, extract into a component or use `@apply` for shared patterns.
- **Evidence:** Duplicating long utility class strings violates DRY and makes global changes impossible. Components provide a single source of truth for repeated patterns.
- **Automatable:** Partially (eslint-plugin-tailwindcss can detect duplicates)
- **Severity:** Suggestion (maintainability)
- **Sources:**
  - [Benjamin Crozat: Tailwind CSS Best Practices 2025](https://benjamincrozat.com/tailwind-css)

### 15.3 Centralize Theme in tailwind.config.js

- **Rule:** Define all colors, spacing, fonts, and shadows in `tailwind.config.js`. Never use arbitrary values (`[37px]`) for design token values.
- **Evidence:** Arbitrary values bypass the design system and create inconsistency. The config file is the single source of truth for all design tokens.
- **Automatable:** Partially (eslint-plugin-tailwindcss: no-arbitrary-value)
- **Severity:** Suggestion (design consistency)
- **Sources:**
  - [FrontendTools: Tailwind Best Practices 2025-2026](https://www.frontendtools.tech/blog/tailwind-css-best-practices-design-system-patterns)

---

## 16. Z-Index Management

### 16.1 Use Named Constants, Not Magic Numbers

- **Rule:** Define all z-index values as named constants/variables in a centralized location. Use arithmetic expressions to express relationships.
- **Evidence:** When the highest z-index needed is only 5, using values like 9999 or 99999 indicates a lack of understanding. Named constants make relationships explicit and eliminate z-index wars.
- **Example:**
  ```css
  :root {
    --z-base: 0;
    --z-dropdown: 1;
    --z-overlay: 2;
    --z-modal: 3;
    --z-toast: 4;
  }
  ```
- **Automatable:** Partially (can flag z-index values above a threshold, e.g., > 10)
- **Severity:** Error (maintainability)
- **Sources:**
  - [Smashing Magazine: Managing CSS Z-Index in Large Projects](https://www.smashingmagazine.com/2021/02/css-z-index-large-projects/)

### 16.2 Understand Stacking Context Boundaries

- **Rule:** Document which elements create new stacking contexts. Properties like `position: relative/absolute` + `z-index`, `transform`, `opacity < 1`, `will-change`, `position: fixed/sticky`, `isolation: isolate`, and `filter` all create new stacking contexts.
- **Evidence:** An element with `z-index: 1000` in one stacking context will NOT appear above an element with `z-index: 10` in a different stacking context. Most z-index bugs are actually stacking context misunderstandings.
- **Automatable:** No (requires understanding of DOM and CSS interactions)
- **Severity:** Error (correctness)
- **Sources:**
  - [Josh W Comeau: What The Heck, z-index??](https://www.joshwcomeau.com/css/stacking-contexts/)
  - [web.dev: Z-Index and Stacking Contexts](https://web.dev/learn/css/z-index)

---

## 17. Selector Performance

### 17.1 Selector Performance Rarely Matters (But Measure)

- **Rule:** Selector performance is rarely a significant bottleneck. The average difference between fast and slow selectors is ~35ms. However, on pages with large, frequently-changing DOMs (5000+ elements), selectors DO matter.
- **Evidence:** Microsoft Edge team found that on a 5000-element photo gallery, optimizing selectors reduced style recalculation from 900ms to 300ms. For most sites, this is irrelevant. Measure before optimizing.
- **Automatable:** Yes (Edge DevTools Selector Stats feature)
- **Severity:** Suggestion (only for large DOMs)
- **Sources:**
  - [Microsoft Edge Blog: Truth About CSS Selector Performance](https://blogs.windows.com/msedgedev/2023/01/17/the-truth-about-css-selector-performance/)

### 17.2 Avoid Attribute Substring Matching in Hot Paths

- **Rule:** On pages with large DOMs, avoid `[class*=""]`, `[class^=""]`, and `[class$=""]` selectors. Use class selectors instead.
- **Evidence:** Microsoft Edge team specifically identified `[class*=""]` as a major performance offender in their case study. Simple class selectors are the fastest to match.
- **Automatable:** Partially (can flag attribute substring selectors)
- **Severity:** Suggestion (performance on large DOMs)
- **Sources:**
  - [Microsoft Edge Blog: Truth About CSS Selector Performance](https://blogs.windows.com/msedgedev/2023/01/17/the-truth-about-css-selector-performance/)

---

## 18. Internationalization

### 18.1 Use Logical Properties Instead of Physical Properties

- **Rule:** Use CSS logical properties (`margin-inline-start`, `padding-block-end`, `inline-size`) instead of physical properties (`margin-left`, `padding-bottom`, `width`) for any site that may support RTL languages.
- **Evidence:** Logical properties automatically adapt to the writing direction. When `dir="rtl"`, `inline-start` correctly maps to the right side. Physical properties require separate RTL overrides. Browser support is 95%+ globally.
- **Mapping:**
  - `margin-left` -> `margin-inline-start`
  - `padding-right` -> `padding-inline-end`
  - `width` -> `inline-size`
  - `height` -> `block-size`
  - `top` -> `inset-block-start`
- **Automatable:** Yes (Stylelint plugins can flag physical properties where logical equivalents exist)
- **Severity:** Suggestion (internationalization readiness) / Error (if RTL support is required)
- **Sources:**
  - [Sparkbox: Internationalization with CSS](https://sparkbox.com/foundry/internationalization_css_html)
  - [web.dev: Internationalization](https://web.dev/learn/design/internationalization)
  - [Medium: Mastering RTL and LTR with Logical Properties](https://medium.com/@dimuthupinsara/mastering-rtl-ltr-layouts-with-css-logical-properties-4bc0fccd2014)

---

## 19. Print Stylesheets

### 19.1 Provide Print Styles

- **Rule:** Include `@media print` styles or a separate `media="print"` stylesheet. Hide navigation, sidebars, ads, and other non-essential UI. Linearize layouts.
- **Evidence:** Without print styles, users get broken multi-column layouts, wasted pages, and invisible content on paper. Print stylesheets are also important for "save as PDF" functionality.
- **Key print rules:**
  ```css
  @media print {
    nav, .sidebar, .ads, footer { display: none; }
    body { font-family: serif; color: #000; background: #fff; }
    a[href]::after { content: " (" attr(href) ")"; }
  }
  ```
- **Automatable:** Partially (can verify print media query exists)
- **Severity:** Suggestion (UX)
- **Sources:**
  - [Smashing Magazine: Print Stylesheets in 2018](https://www.smashingmagazine.com/2018/05/print-stylesheets-in-2018/)
  - [MDN: CSS Printing](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Printing)

---

## 20. Stylelint Automatable Rules

### Key Rules from stylelint-config-recommended (Avoid Errors)

These rules are all automatable via Stylelint:

| Rule | Purpose | Severity |
|------|---------|----------|
| `no-descending-specificity` | Disallow lower specificity after higher specificity override | Error |
| `no-duplicate-selectors` | Disallow duplicate selectors | Error |
| `no-duplicate-at-import-rules` | Disallow duplicate @import | Error |
| `block-no-empty` | Disallow empty blocks | Suggestion |
| `color-no-invalid-hex` | Disallow invalid hex colors | Error |
| `declaration-block-no-duplicate-properties` | Disallow duplicate properties in a block | Error |
| `declaration-block-no-shorthand-property-overrides` | Disallow shorthand overriding longhand | Error |
| `font-family-no-duplicate-names` | Disallow duplicate font family names | Error |
| `font-family-no-missing-generic-family-keyword` | Require generic font family | Suggestion |
| `function-calc-no-unspaced-operator` | Require spaces in calc() | Error |
| `keyframe-block-no-duplicate-selectors` | Disallow duplicate keyframe selectors | Error |
| `media-feature-name-no-unknown` | Disallow unknown media features | Error |
| `no-invalid-double-slash-comments` | Disallow // comments in CSS | Error |
| `property-no-unknown` | Disallow unknown properties | Error |
| `selector-pseudo-class-no-unknown` | Disallow unknown pseudo-classes | Error |
| `selector-pseudo-element-no-unknown` | Disallow unknown pseudo-elements | Error |
| `selector-type-no-unknown` | Disallow unknown type selectors | Error |
| `string-no-newline` | Disallow newlines in strings | Error |
| `unit-no-unknown` | Disallow unknown units | Error |

### Additional Rules from stylelint-config-standard (Conventions)

| Rule | Purpose | Severity |
|------|---------|----------|
| `declaration-no-important` | Disallow !important | Error |
| `selector-max-id` | Limit ID selectors to 0 | Error |
| `max-nesting-depth` | Limit nesting depth | Suggestion |
| `selector-class-pattern` | Enforce class naming pattern | Suggestion |
| `custom-property-pattern` | Enforce custom property naming | Suggestion |
| `length-zero-no-unit` | Disallow units for zero values | Suggestion |
| `shorthand-property-no-redundant-values` | Disallow redundant shorthand values | Suggestion |
| `number-max-precision` | Limit decimal precision | Suggestion |
| `alpha-value-notation` | Enforce percentage or number for alpha | Suggestion |
| `color-function-notation` | Enforce modern color function notation | Suggestion |

- **Sources:**
  - [Stylelint Rules Reference](https://stylelint.io/user-guide/rules/)
  - [stylelint-config-recommended](https://github.com/stylelint/stylelint-config-recommended)
  - [stylelint-config-standard](https://github.com/stylelint/stylelint-config-standard)

---

## 21. Company Style Guide Summaries

### Google HTML/CSS Style Guide

| Rule | Detail | Automatable |
|------|--------|-------------|
| Use valid CSS | W3C validator compliant | Yes |
| Meaningful class names | Reflect element purpose, not appearance | No |
| Hyphen-delimited class names | Separate words with hyphens | Yes |
| Avoid type selectors with classes | `.nav` not `ul.nav` | Yes |
| Avoid ID selectors | Use class selectors instead | Yes |
| Use shorthand properties | Even for single values | Partially |
| Omit units after 0 | `margin: 0` not `margin: 0px` | Yes |
| Include leading 0 | `0.8em` not `.8em` | Yes |
| Use 3-char hex where possible | `#000` not `#000000` | Yes |
| Avoid !important | Use specificity instead | Yes |
| Alphabetical declarations | Property declaration order | Yes |
| Semicolon after every declaration | Even the last one | Yes |
| Single quotes in CSS | For attribute selectors and values | Yes |

- **Source:** [Google HTML/CSS Style Guide](https://google.github.io/styleguide/htmlcssguide.html)

### Airbnb CSS/Sass Style Guide

| Rule | Detail | Automatable |
|------|--------|-------------|
| 2-space indentation | Soft tabs | Yes |
| Never use ID selectors | Zero tolerance | Yes |
| BEM naming (PascalCase variant) | `.ListingCard__title--featured` | Yes (regex) |
| `.js-` prefix for JS hooks | Never share CSS and JS classes | Partially |
| `border: 0` not `border: none` | Consistency | Yes |
| Max 3 levels nesting | Indicates fragile CSS | Yes |
| No @extend | Use mixins instead | Yes |
| OOCSS + BEM methodology | Explicit CSS-HTML relationships | No |
| Dash-cased variable names | `$my-variable` not `$myVariable` | Yes |
| Property order: standard, @include, nested | Consistent declaration ordering | Partially |

- **Source:** [Airbnb CSS/Sass Style Guide](https://github.com/airbnb/css)

### Vendor Prefix Management

| Rule | Detail | Automatable |
|------|--------|-------------|
| Never add vendor prefixes manually | Let Autoprefixer handle all prefixing | Yes |
| Keep Autoprefixer and browserslist updated | Remove outdated prefixes automatically | Yes |
| Few prefixes needed in 2025 | Most CSS properties are unprefixed now | Yes |

- **Sources:**
  - [Autoprefixer](https://github.com/postcss/autoprefixer)
  - [Robin Weser: Vendor Prefixes in 2024](https://weser.io/blog/vendor-prefixes-in-2024)

---

## Summary: Review Priority Matrix

### Always Check (Every PR)

| # | Check | Automatable | Severity |
|---|-------|-------------|----------|
| 1 | Focus outlines not removed without replacement | Yes | Critical |
| 2 | Color contrast meets WCAG AA (4.5:1 / 3:1) | Yes | Critical |
| 3 | prefers-reduced-motion respected for animations | Partially | Critical |
| 4 | No reactive !important usage | Yes | Error |
| 5 | No ID selectors for styling | Yes | Error |
| 6 | Nesting depth <= 3 levels | Yes | Error |
| 7 | Only animate transform/opacity/filter | Partially | Error |
| 8 | font-display set on @font-face | Yes | Error |
| 9 | No @import for fonts/CSS | Yes | Error |
| 10 | z-index uses named variables, not magic numbers | Partially | Error |

### Check When Relevant

| # | Check | Context | Severity |
|---|-------|---------|----------|
| 11 | Container queries for component responsiveness | Component library | Suggestion |
| 12 | Logical properties for internationalization | Multi-language sites | Error |
| 13 | CSS custom properties for theming | Themed applications | Suggestion |
| 14 | Critical CSS inlined | Performance-critical pages | Error |
| 15 | Print stylesheet provided | Content-heavy pages | Suggestion |
| 16 | Tailwind class ordering and extraction | Tailwind projects | Suggestion |
| 17 | content-visibility for long pages | Pages with 50+ items | Suggestion |
| 18 | Dark mode contrast compliance | Themed applications | Critical |
| 19 | Zero-runtime CSS-in-JS preferred | React/SSR applications | Error |
| 20 | Selector performance on large DOMs | 5000+ element pages | Suggestion |

---

## Sources Index

### Company Style Guides
- [Google HTML/CSS Style Guide](https://google.github.io/styleguide/htmlcssguide.html)
- [Airbnb CSS/Sass Style Guide](https://github.com/airbnb/css)

### Checklists and Reviews
- [CSS-Tricks: What a CSS Code Review Might Look Like](https://css-tricks.com/what-a-css-code-review-might-look-like/)
- [Axioned Handbook: CSS Code Review Checklist](https://handbook.axioned.com/learning/css/code-review-checklist/)
- [Front-end Code Review Checklist (GitHub Gist)](https://gist.github.com/bigsergey/aef64f68c22b3107ccbc439025ebba12)
- [The CSS Code Review Guide](https://github.com/kdsingharneja/the-css-code-review-guide)

### Anti-Patterns and Code Smells
- [CSS Wizardry: Code Smells in CSS](https://csswizardry.com/2012/11/code-smells-in-css/)
- [CSS-Tricks: Magic Numbers in CSS](https://css-tricks.com/magic-numbers-in-css/)
- [Medium: 10 CSS Mistakes That Still Haunt Devs in 2025](https://medium.com/codeelevation/i-broke-my-ui-37-times-heres-10-css-mistakes-that-still-haunt-frontend-devs-in-2025-353a47a666da)

### Accessibility
- [Sara Soueidan: Focus Indicators Guide](https://www.sarasoueidan.com/blog/focus-indicators/)
- [The A11Y Project: Never Remove CSS Outlines](https://www.a11yproject.com/posts/never-remove-css-outlines/)
- [WebAIM: Contrast and Color Accessibility](https://webaim.org/articles/contrast/)
- [W3C: WCAG 2.2 Focus Appearance](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html)
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [Eric Eggert: text-overflow: ellipsis harmful](https://yatil.net/blog/text-overflow-ellipsis-harmful)

### Performance
- [MDN: CSS Performance Optimization](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Performance/CSS)
- [web.dev: Core Web Vitals](https://web.dev/articles/vitals)
- [web.dev: Font Best Practices](https://web.dev/articles/font-best-practices)
- [web.dev: content-visibility](https://web.dev/articles/content-visibility)
- [Microsoft Edge Blog: CSS Selector Performance](https://blogs.windows.com/msedgedev/2023/01/17/the-truth-about-css-selector-performance/)
- [Smashing Magazine: CSS GPU Animation](https://www.smashingmagazine.com/2016/12/gpu-animation-doing-it-right/)
- [Google: Optimize CSS Delivery](https://developers.google.com/speed/docs/insights/OptimizeCSSDelivery)

### Architecture and Naming
- [Sparkbox: BEM by Example](https://sparkbox.com/foundry/bem_by_example)
- [BEM.info: Naming Convention](https://en.bem.info/methodology/naming-convention/)
- [Smashing Magazine: Z-Index in Large Projects](https://www.smashingmagazine.com/2021/02/css-z-index-large-projects/)

### Modern CSS
- [State of CSS 2025](https://2025.stateofcss.com/en-US/features/)
- [Medium: Modern CSS Trends 2025](https://medium.com/@mernstackdevbykevin/modern-css-trends-2025-container-queries-subgrid-cascade-layers-real-use-cases-tips-733af70eb5fb)
- [Nick Paolini: Modern CSS Toolkit 2026](https://www.nickpaolini.com/blog/modern-css-toolkit-2026)
- [Piccalilli: CSS Nesting Use with Caution](https://piccalil.li/blog/css-nesting-use-with-caution/)

### Dark Mode and Theming
- [CSS-Tricks: Dark Mode on the Web](https://css-tricks.com/a-complete-guide-to-dark-mode-on-the-web/)
- [Medium: Theming with CSS in 2025](https://mamutlove.com/en/blog/theming-with-css-in-2025/)

### Responsive Design
- [BrowserStack: Responsive Design Breakpoints 2025](https://www.browserstack.com/guide/responsive-design-breakpoints)
- [LogRocket: CSS Breakpoints](https://blog.logrocket.com/css-breakpoints-responsive-design/)

### CSS-in-JS
- [LogRocket: Zero-Runtime CSS-in-JS Libraries](https://blog.logrocket.com/comparing-top-zero-runtime-css-js-libraries/)
- [CSS-Tricks: Thorough Analysis of CSS-in-JS](https://css-tricks.com/a-thorough-analysis-of-css-in-js/)

### Tailwind
- [FrontendTools: Tailwind Best Practices 2025-2026](https://www.frontendtools.tech/blog/tailwind-css-best-practices-design-system-patterns)
- [Benjamin Crozat: Tailwind CSS Best Practices 2025](https://benjamincrozat.com/tailwind-css)

### Linting
- [Stylelint Rules Reference](https://stylelint.io/user-guide/rules/)
- [stylelint-config-recommended](https://github.com/stylelint/stylelint-config-recommended)
- [stylelint-config-standard](https://github.com/stylelint/stylelint-config-standard)
- [Autoprefixer](https://github.com/postcss/autoprefixer)

### Internationalization
- [Sparkbox: Internationalization with CSS](https://sparkbox.com/foundry/internationalization_css_html)
- [web.dev: Internationalization](https://web.dev/learn/design/internationalization)

### Print
- [Smashing Magazine: Print Stylesheets in 2018](https://www.smashingmagazine.com/2018/05/print-stylesheets-in-2018/)
