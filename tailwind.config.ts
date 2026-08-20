import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "on-secondary-container": "#684000",
        "tertiary-fixed-dim": "#bec6e0",
        "amber-point": "#f59e0b",
        "surface-dim": "#d8dadc",
        "on-secondary": "#ffffff",
        "secondary-container": "#fea619",
        "on-surface": "#191c1e",
        "secondary-fixed-dim": "#ffb95f",
        "primary": "#00236f",
        "secondary": "#855300",
        "surface-container-lowest": "#ffffff",
        "on-background": "#191c1e",
        "inverse-surface": "#2d3133",
        "primary-fixed-dim": "#b6c4ff",
        "on-secondary-fixed": "#2a1700",
        "surface-container-low": "#f2f4f6",
        "border-subtle": "#e2e8f0",
        "tertiary": "#222a3e",
        "on-primary-fixed": "#00164e",
        "outline": "#757682",
        "surface": "#f7f9fb",
        "tertiary-container": "#384055",
        "trust-blue": "#3b82f6",
        "on-primary": "#ffffff",
        "inverse-primary": "#b6c4ff",
        "error-container": "#ffdad6",
        "surface-container": "#eceef0",
        "on-tertiary-fixed-variant": "#3f465c",
        "outline-variant": "#c5c5d3",
        "tertiary-fixed": "#dae2fd",
        "surface-clean": "#ffffff",
        "on-tertiary-fixed": "#131b2e",
        "secondary-fixed": "#ffddb8",
        "on-surface-variant": "#444651",
        "surface-tint": "#4059aa",
        "on-tertiary-container": "#a4acc5",
        "inverse-on-surface": "#eff1f3",
        "on-secondary-fixed-variant": "#653e00",
        "error": "#ba1a1a",
        "deep-navy": "#1e3a8a",
        "surface-container-high": "#e6e8ea",
        "on-error": "#ffffff",
        "primary-container": "#1e3a8a",
        "primary-fixed": "#dce1ff",
        "on-primary-container": "#90a8ff",
        "background": "#f7f9fb",
        "surface-bright": "#f7f9fb",
        "on-primary-fixed-variant": "#264191",
        "on-error-container": "#93000a",
        "surface-variant": "#e0e3e5",
        "on-tertiary": "#ffffff",
        "surface-container-highest": "#e0e3e5"
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px"
      },
      spacing: {
        "stack-sm": "0.5rem",
        "stack-md": "1rem",
        "stack-lg": "2rem",
        "gutter": "1.5rem",
        "section-gap": "6rem",
        "grid-margin-mobile": "1.25rem",
        "grid-margin-desktop": "4rem"
      },
      fontFamily: {
        "body-lg": ["var(--font-noto)"],
        "headline-md": ["var(--font-noto)"],
        "headline-lg": ["var(--font-noto)"],
        "display-lg": ["var(--font-noto)"],
        "body-md": ["var(--font-noto)"],
        "label-caps": ["var(--font-inter)"],
        "status-label": ["var(--font-noto)"],
        "display-lg-mobile": ["var(--font-noto)"]
      },
      fontSize: {
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "headline-md": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "headline-lg": ["32px", { lineHeight: "44px", fontWeight: "700" }],
        "display-lg": ["48px", { lineHeight: "60px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "label-caps": ["12px", { lineHeight: "16px", letterSpacing: "0.08em", fontWeight: "600" }],
        "status-label": ["14px", { lineHeight: "20px", fontWeight: "500" }],
        "display-lg-mobile": ["32px", { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "700" }]
      }
    }
  }
} satisfies Config;
