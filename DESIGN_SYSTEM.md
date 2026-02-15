# Design System - Vapour Lounge

Complete design system based on research findings from Shopee, Lazada, Amazon, and modern e-commerce best practices.

**Theme:** Bold & Vibrant (Reference: Research 01 - Behance Analysis)

---

## 🎨 Color Palette

### Primary Colors (Purple to Pink Gradient)

```css
--primary-50: #faf5ff;
--primary-100: #f3e8ff;
--primary-200: #e9d5ff;
--primary-300: #d8b4fe;
--primary-400: #c084fc;
--primary-500: #a855f7;
--primary-600: #9333ea; /* Main Purple */
--primary-700: #7e22ce;
--primary-800: #6b21a8;
--primary-900: #581c87;

--accent-50: #fdf2f8;
--accent-100: #fce7f3;
--accent-200: #fbcfe8;
--accent-300: #f9a8d4;
--accent-400: #f472b6;
--accent-500: #ec4899; /* Main Pink */
--accent-600: #db2777;
--accent-700: #be185d;
--accent-800: #9d174d;
--accent-900: #831843;
```

### Secondary Colors (Orange for CTAs & Urgency)

```css
--secondary-50: #fff7ed;
--secondary-100: #ffedd5;
--secondary-200: #fed7aa;
--secondary-300: #fdba74;
--secondary-400: #fb923c;
--secondary-500: #f97316; /* Main Orange */
--secondary-600: #ea580c;
--secondary-700: #c2410c;
--secondary-800: #9a3412;
--secondary-900: #7c2d12;
```

### Neutral Colors

```css
--neutral-50: #fafafa;
--neutral-100: #f5f5f5;
--neutral-200: #e5e5e5;
--neutral-300: #d4d4d4;
--neutral-400: #a3a3a3;
--neutral-500: #737373;
--neutral-600: #525252;
--neutral-700: #404040;
--neutral-800: #262626;
--neutral-900: #171717;
--neutral-950: #0a0a0a;
```

### Dark Theme Background

```css
--dark-bg-primary: #0f172a; /* Navy Blue */
--dark-bg-secondary: #1e293b;
--dark-bg-tertiary: #334155;
--dark-text-primary: #f1f5f9;
--dark-text-secondary: #cbd5e1;
```

### Semantic Colors

```css
/* Success */
--success-50: #f0fdf4;
--success-500: #22c55e;
--success-700: #15803d;

/* Warning */
--warning-50: #fffbeb;
--warning-500: #f59e0b;
--warning-700: #b45309;

/* Error */
--error-50: #fef2f2;
--error-500: #ef4444;
--error-700: #b91c1c;

/* Info */
--info-50: #eff6ff;
--info-500: #3b82f6;
--info-700: #1d4ed8;
```

### Usage Guidelines

| Color               | Usage                                                         |
| ------------------- | ------------------------------------------------------------- |
| **Purple Gradient** | Primary CTAs, active states, links, progress bars             |
| **Pink**            | Secondary CTAs, hover states, highlights                      |
| **Orange**          | Sale badges, urgency indicators ("Only 3 left!"), flash sales |
| **Green**           | Success messages, "In Stock", approved status                 |
| **Red**             | Errors, "Out of Stock", delete actions, discount badges       |
| **Yellow**          | Star ratings, warnings                                        |
| **Gray**            | Text hierarchy, borders, backgrounds                          |

---

## 🔤 Typography

### Font Families

```css
/* Headings - Space Grotesk (Google Fonts) */
--font-heading: "Space Grotesk", system-ui, sans-serif;

/* Body - Inter (Google Fonts) */
--font-body: "Inter", system-ui, sans-serif;

/* Monospace - For codes, SKUs */
--font-mono: "JetBrains Mono", "Courier New", monospace;
```

**Import:**

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap"
  rel="stylesheet"
/>
```

### Type Scale

**Reference:** Research 02 - Mobile typography (minimum 16px body text)

| Name           | Size (Desktop) | Size (Mobile) | Line Height | Weight | Use Case         |
| -------------- | -------------- | ------------- | ----------- | ------ | ---------------- |
| **Display**    | 64px           | 40px          | 1.1         | 700    | Hero headings    |
| **H1**         | 48px           | 32px          | 1.2         | 700    | Page titles      |
| **H2**         | 36px           | 28px          | 1.3         | 600    | Section headings |
| **H3**         | 28px           | 24px          | 1.4         | 600    | Card titles      |
| **H4**         | 24px           | 20px          | 1.4         | 600    | Subsections      |
| **H5**         | 20px           | 18px          | 1.5         | 600    | Small headings   |
| **Body Large** | 18px           | 18px          | 1.6         | 400    | Lead paragraphs  |
| **Body**       | 16px           | 16px          | 1.6         | 400    | Default text     |
| **Body Small** | 14px           | 14px          | 1.5         | 400    | Secondary text   |
| **Caption**    | 12px           | 12px          | 1.4         | 500    | Labels, metadata |

### Tailwind Configuration

```javascript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      fontFamily: {
        heading: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      fontSize: {
        display: ["64px", { lineHeight: "1.1", fontWeight: "700" }],
        h1: ["48px", { lineHeight: "1.2", fontWeight: "700" }],
        h2: ["36px", { lineHeight: "1.3", fontWeight: "600" }],
        h3: ["28px", { lineHeight: "1.4", fontWeight: "600" }],
        h4: ["24px", { lineHeight: "1.4", fontWeight: "600" }],
        h5: ["20px", { lineHeight: "1.5", fontWeight: "600" }],
      },
    },
  },
};
```

---

## 📏 Spacing & Layout

### Spacing Scale (8px Base Grid)

**Reference:** Research 02 - Consistent spacing system

```css
--spacing-0: 0px;
--spacing-1: 4px; /* 0.5 × 8 */
--spacing-2: 8px; /* 1 × 8 */
--spacing-3: 12px; /* 1.5 × 8 */
--spacing-4: 16px; /* 2 × 8 */
--spacing-5: 20px; /* 2.5 × 8 */
--spacing-6: 24px; /* 3 × 8 */
--spacing-8: 32px; /* 4 × 8 */
--spacing-10: 40px; /* 5 × 8 */
--spacing-12: 48px; /* 6 × 8 */
--spacing-16: 64px; /* 8 × 8 */
--spacing-20: 80px; /* 10 × 8 */
--spacing-24: 96px; /* 12 × 8 */
```

### Breakpoints

**Reference:** Research 02 - Mobile Responsiveness

```css
/* Mobile First Approach */
--screen-sm: 640px; /* Large phones */
--screen-md: 768px; /* Tablets */
--screen-lg: 1024px; /* Small laptops */
--screen-xl: 1280px; /* Desktops */
--screen-2xl: 1536px; /* Large desktops */
```

**Device Categories:**

- **Mobile:** 320px - 639px
- **Tablet:** 640px - 1023px
- **Desktop:** 1024px+

### Container Widths

```css
.container {
  width: 100%;
  padding-left: 1rem; /* 16px */
  padding-right: 1rem; /* 16px */
  margin-left: auto;
  margin-right: auto;
}

@media (min-width: 640px) {
  .container {
    max-width: 640px;
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}
@media (min-width: 768px) {
  .container {
    max-width: 768px;
  }
}
@media (min-width: 1024px) {
  .container {
    max-width: 1024px;
    padding-left: 2rem;
    padding-right: 2rem;
  }
}
@media (min-width: 1280px) {
  .container {
    max-width: 1280px;
  }
}
@media (min-width: 1536px) {
  .container {
    max-width: 1536px;
  }
}
```

### Grid Systems

**Product Grid:**

- Mobile: 2 columns (gap 12px)
- Tablet: 3 columns (gap 16px)
- Desktop: 4-5 columns (gap 20px)

```css
.product-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, 1fr); /* Mobile */
}

@media (min-width: 768px) {
  .product-grid {
    gap: 16px;
    grid-template-columns: repeat(3, 1fr); /* Tablet */
  }
}

@media (min-width: 1024px) {
  .product-grid {
    gap: 20px;
    grid-template-columns: repeat(4, 1fr); /* Desktop */
  }
}

@media (min-width: 1280px) {
  .product-grid {
    grid-template-columns: repeat(5, 1fr); /* Large Desktop */
  }
}
```

---

## 🎭 Shadows & Elevation

### Shadow Levels

```css
/* Elevation system - Material Design inspired */
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04);
--shadow-2xl: 0 25px 50px rgba(0, 0, 0, 0.25);

/* Colored shadows for primary actions */
--shadow-primary: 0 10px 20px rgba(147, 51, 234, 0.3);
--shadow-secondary: 0 10px 20px rgba(249, 115, 22, 0.3);
```

### Usage

| Level         | Usage                             |
| ------------- | --------------------------------- |
| **xs**        | Subtle borders, form inputs       |
| **sm**        | Cards, buttons                    |
| **md**        | Dropdowns, popovers               |
| **lg**        | Modals, drawers                   |
| **xl**        | Sticky headers, floating elements |
| **2xl**       | Hero sections, featured content   |
| **Primary**   | Primary CTA hover state           |
| **Secondary** | Sale/urgent buttons hover state   |

---

## 🔘 Border Radius

```css
--radius-none: 0px;
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-2xl: 24px;
--radius-full: 9999px;
```

### Usage

| Radius   | Usage                           |
| -------- | ------------------------------- |
| **sm**   | Inputs, badges, small buttons   |
| **md**   | Cards, buttons, chips           |
| **lg**   | Modals, drawers, images         |
| **xl**   | Featured cards, hero sections   |
| **full** | Pills, avatar, circular buttons |

---

## 🎬 Animations & Transitions

### Timing Functions

```css
--ease-linear: cubic-bezier(0, 0, 1, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--ease-smooth: cubic-bezier(0.45, 0, 0.55, 1);
```

### Duration Scale

```css
--duration-fast: 150ms;
--duration-normal: 300ms;
--duration-slow: 500ms;
--duration-slower: 700ms;
```

### Common Transitions

```css
/* Hover transitions */
.transition-colors {
  transition:
    color 150ms ease-out,
    background-color 150ms ease-out,
    border-color 150ms ease-out;
}

.transition-transform {
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.transition-shadow {
  transition: box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.transition-all {
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Micro-interactions

**Reference:** Research 01 - Modern e-commerce interactions

#### Button Hover

```css
.btn-primary {
  transition: all 300ms var(--ease-smooth);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-primary);
}

.btn-primary:active {
  transform: translateY(0);
}
```

#### Card Hover

```css
.product-card {
  transition: all 300ms var(--ease-out);
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.product-card img {
  transition: transform 300ms var(--ease-out);
}

.product-card:hover img {
  transform: scale(1.05);
}
```

#### Loading Spinner

```css
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.spinner {
  animation: spin 1s linear infinite;
}
```

#### Pulse (for badges, notifications)

```css
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

#### Slide In (for modals, drawers)

```css
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.slide-in-right {
  animation: slideInRight 300ms var(--ease-out);
}
```

---

## 🖼️ Images & Media

### Aspect Ratios

```css
/* Product images */
--aspect-square: 1 / 1; /* Product cards, thumbnails */
--aspect-video: 16 / 9; /* Hero banners, featured */
--aspect-portrait: 3 / 4; /* Product detail (mobile) */
--aspect-landscape: 4 / 3; /* Gallery images */
```

### Image Optimization

```typescript
// Next.js Image component defaults
const imageDefaults = {
  quality: 80, // Balance quality/performance
  placeholder: "blur", // Smooth loading
  sizes: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
};
```

**Image Sizes:**

- **Thumbnail:** 100x100px
- **Product Card:** 400x400px
- **Product Detail:** 800x800px
- **Hero Banner:** 1920x800px

---

## 📱 Mobile-Specific Patterns

**Reference:** Research 02 - Mobile Responsiveness

### Touch Targets

Minimum touch target size: **44x44px** (WCAG AAA)

```css
.touch-target {
  min-width: 44px;
  min-height: 44px;
  padding: 12px;
}
```

### Header Heights

```css
/* Mobile */
--header-height-mobile: 56px;

/* Tablet */
--header-height-tablet: 64px;

/* Desktop */
--header-height-desktop: 72px;
```

### Bottom Navigation (Mobile)

```css
.bottom-nav {
  height: 64px;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
}

/* Add safe area for iOS notch */
.bottom-nav {
  padding-bottom: env(safe-area-inset-bottom);
}
```

### Sticky Elements

**Mobile:**

- Sticky header with search
- Sticky "Add to Cart" button on PDP
- Sticky checkout summary

```css
.sticky-cta {
  position: sticky;
  bottom: 0;
  padding: 16px;
  background: white;
  border-top: 1px solid var(--neutral-200);
  box-shadow: var(--shadow-lg);
}
```

---

## 🎨 Glassmorphism Effects

**Reference:** Research 01 - Dribbble Trends

```css
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.glass-dark {
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

**Use Cases:**

- Modal overlays
- Floating cart preview
- Category badges on hero images
- Loading overlays

---

## 🌙 Dark Mode

### Color Adaptations

```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: var(--dark-bg-primary);
    --bg-secondary: var(--dark-bg-secondary);
    --text-primary: var(--dark-text-primary);
    --text-secondary: var(--dark-text-secondary);
  }

  /* Invert shadows */
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.5);

  /* Adjust borders */
  --border-color: rgba(255, 255, 255, 0.1);
}
```

### Toggle Implementation

```typescript
// lib/hooks/useDarkMode.ts
import { useEffect, useState } from "react";

export const useDarkMode = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const theme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    setIsDark(theme === "dark" || (!theme && prefersDark));
  }, []);

  const toggleDark = () => {
    setIsDark((prev) => {
      const newValue = !prev;
      localStorage.setItem("theme", newValue ? "dark" : "light");
      document.documentElement.classList.toggle("dark", newValue);
      return newValue;
    });
  };

  return { isDark, toggleDark };
};
```

---

## ♿ Accessibility

### Focus States

```css
/* Default focus ring */
*:focus-visible {
  outline: 2px solid var(--primary-600);
  outline-offset: 2px;
}

/* Button focus */
.btn:focus-visible {
  outline: 2px solid var(--primary-600);
  outline-offset: 4px;
}
```

### Skip Links

```html
<a href="#main-content" class="skip-link"> Skip to main content </a>
```

```css
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--primary-600);
  color: white;
  padding: 8px 16px;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

### ARIA Labels

Always include on icon-only buttons:

```jsx
<button aria-label="Add to cart">
  <ShoppingCart />
</button>
```

---

## 📐 Component Patterns

### Button Hierarchy

**Primary CTA:**

```css
.btn-primary {
  background: linear-gradient(135deg, var(--primary-600), var(--accent-500));
  color: white;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: all 300ms var(--ease-smooth);
}

.btn-primary:hover {
  box-shadow: var(--shadow-primary);
  transform: translateY(-2px);
}
```

**Secondary CTA:**

```css
.btn-secondary {
  background: white;
  color: var(--primary-600);
  border: 2px solid var(--primary-600);
  font-weight: 600;
  padding: 12px 24px;
  border-radius: var(--radius-md);
}

.btn-secondary:hover {
  background: var(--primary-50);
}
```

**Tertiary (Ghost):**

```css
.btn-ghost {
  background: transparent;
  color: var(--neutral-700);
  padding: 12px 24px;
}

.btn-ghost:hover {
  background: var(--neutral-100);
}
```

### Input Fields

```css
.input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--neutral-300);
  border-radius: var(--radius-md);
  font-size: 16px; /* Prevent mobile zoom */
  transition: border-color 150ms ease-out;
}

.input:focus {
  outline: none;
  border-color: var(--primary-600);
  box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.1);
}

.input::placeholder {
  color: var(--neutral-400);
}

.input:disabled {
  background: var(--neutral-100);
  cursor: not-allowed;
}
```

### Cards

```css
.card {
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--neutral-200);
  padding: 24px;
  box-shadow: var(--shadow-sm);
  transition: all 300ms var(--ease-out);
}

.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
```

---

## 📊 Data Visualization

### Chart Colors

```javascript
const chartColors = {
  primary: ["#9333ea", "#a855f7", "#c084fc", "#d8b4fe"],
  revenue: "#22c55e",
  expenses: "#ef4444",
  profit: "#3b82f6",
  categories: [
    "#9333ea", // Purple
    "#ec4899", // Pink
    "#f97316", // Orange
    "#22c55e", // Green
    "#3b82f6", // Blue
    "#eab308", // Yellow
  ],
};
```

### Progress Bars

```css
.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--neutral-200);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-600), var(--accent-500));
  transition: width 300ms ease-out;
}
```

---

## 🚀 Performance Optimization

### Image Loading

```jsx
// Lazy load below fold
<Image
  src={product.image}
  alt={product.name}
  loading="lazy"
  placeholder="blur"
/>

// Eager load above fold
<Image
  src={hero.image}
  alt="Hero"
  priority
/>
```

### Font Loading

```css
/* Prevent FOIT (Flash of Invisible Text) */
@font-face {
  font-family: "Inter";
  font-display: swap;
  src: url(...);
}
```

### Skeleton Loaders

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--neutral-200) 25%,
    var(--neutral-300) 50%,
    var(--neutral-200) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-md);
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
```

---

## 📦 Tailwind Configuration

**Complete config for Vapour Lounge:**

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
      },
      screens: {
        "2xl": "1536px",
      },
    },
    extend: {
      colors: {
        primary: {
          50: "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          300: "#d8b4fe",
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
          700: "#7e22ce",
          800: "#6b21a8",
          900: "#581c87",
        },
        accent: {
          50: "#fdf2f8",
          100: "#fce7f3",
          200: "#fbcfe8",
          300: "#f9a8d4",
          400: "#f472b6",
          500: "#ec4899",
          600: "#db2777",
          700: "#be185d",
          800: "#9d174d",
          900: "#831843",
        },
        secondary: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
        },
      },
      fontFamily: {
        heading: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        primary: "0 10px 20px rgba(147, 51, 234, 0.3)",
        secondary: "0 10px 20px rgba(249, 115, 22, 0.3)",
      },
      animation: {
        spin: "spin 1s linear infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        bounce: "bounce 1s infinite",
        "slide-in-right": "slideInRight 300ms ease-out",
        shimmer: "shimmer 1.5s infinite",
      },
      keyframes: {
        slideInRight: {
          from: { transform: "translateX(100%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
  ],
};

export default config;
```

---

## ✅ Design Checklist

Before shipping components:

- [ ] Works on mobile, tablet, desktop
- [ ] Touch targets ≥ 44x44px
- [ ] Color contrast ≥ 4.5:1 (WCAG AA)
- [ ] Focus states visible
- [ ] ARIA labels on icons
- [ ] Loading states defined
- [ ] Error states handled
- [ ] Dark mode supported (optional)
- [ ] Animations smooth (60fps)
- [ ] Images optimized

---

**References:**

- [UI Implementation Plan](UI_IMPLEMENTATION_PLAN.md)
- [Component Library](COMPONENT_LIBRARY.md)
- [Research 01 - Design Inspirations](research/01-design-inspirations.md)
- [Research 02 - Mobile Responsiveness](research/02-mobile-responsiveness.md)

**Framework:** Tailwind CSS 3.4+
**UI Library:** shadcn/ui
**Icons:** Lucide React
**Fonts:** Google Fonts (Inter + Space Grotesk)
