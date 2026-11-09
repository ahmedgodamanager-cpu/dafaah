import fs from 'fs';

let content = fs.readFileSync('src/index.css', 'utf8');

const newCSS = `@import "tailwindcss";

@theme {
  --font-sans: 'SF Pro Display', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Cairo', sans-serif;
}

@custom-variant dark (&:where(.dark, .dark *));

@layer base {
  :root {
    --bg: #f8fafc;
    --surface: #ffffff;
    --surface-hover: #f1f5f9;
    --input-bg: #ffffff;
    --border: #cbd5e1;
    --text: #0f172a;
    --text-muted: #64748b;
    --primary: #f59e0b; /* keeping amber colors from original design where possible, but user asked for purple. I will use user's colors exactly */
    --primary-hover: #d97706; 
  }

  /* User requested exact colors: */
  :root {
    --bg: #f8fafc;
    --surface: #ffffff;
    --surface-hover: #f1f5f9;
    --input-bg: #ffffff;
    --border: #cbd5e1;
    --text: #0f172a;
    --text-muted: #64748b;
    --primary: #7c3aed;
    --primary-hover: #6d28d9;
  }

  html.dark {
    --bg: #0b1020;
    --surface: #151b2e;
    --surface-hover: #1b233a;
    --input-bg: #0f1628;
    --border: #303a55;
    --text: #f1f5f9;
    --text-muted: #94a3b8;
    --primary: #a78bfa;
    --primary-hover: #c4b5fd;
  }

  html {
    color-scheme: light;
  }
  
  html.dark {
    color-scheme: dark;
  }

  body {
    background-color: var(--bg);
    color: var(--text);
    font-family: var(--font-sans);
    font-feature-settings: 'kern' 1, 'liga' 1, 'calt' 1;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    line-height: 1.6;
    overflow-x: hidden;
  }

  input,
  textarea,
  select {
    background-color: var(--input-bg);
    color: var(--text);
    border: 1px solid var(--border);
  }

  input::placeholder,
  textarea::placeholder {
    color: var(--text-muted);
  }

  input:focus,
  textarea:focus,
  select:focus {
    border-color: var(--primary);
    outline: none;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 20%, transparent);
  }

  /* Smooth transitions */
  *, *::before, *::after {
    transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
  }

  /* Specific overrides for remaining dark classes */
  html.dark .bg-slate-50, 
  html.dark .bg-slate-100 {
    background-color: var(--bg);
  }
  
  html.dark .bg-white {
    background-color: var(--surface);
  }

  /* Custom scrollbar for dark mode */
  html.dark ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  html.dark ::-webkit-scrollbar-track {
    background: var(--bg);
  }
  html.dark ::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 4px;
  }
  html.dark ::-webkit-scrollbar-thumb:hover {
    background: var(--text-muted);
  }
}

@media (prefers-reduced-motion: no-preference) {
  ::selection {
    background: #fbbf24;
    color: #1c1917;
  }
  button, a, input, select, textarea {
    -webkit-tap-highlight-color: transparent;
  }
  button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 3px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}

@media print {
  header button, 
  .print-hide,
  main button {
    display: none !important;
  }
  body {
    background-color: white !important;
    color: black !important;
  }
  .shadow-xs, .shadow-sm, .shadow-md {
    box-shadow: none !important;
  }
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
`;

fs.writeFileSync('src/index.css', newCSS);
