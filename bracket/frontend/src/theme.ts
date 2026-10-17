import { createTheme } from '@mantine/core';

// Paleta: tonalidades de rojo (acción / marca), negro y grises (base), blanco (texto).
const red = [
  '#fff0f0',
  '#ffdcdc',
  '#ffb8b8',
  '#ff8e8e',
  '#fb6262',
  '#ef4044',
  '#d92027',
  '#b8161e',
  '#98121a',
  '#780e15',
] as const;

// Reemplaza la escala `dark` de Mantine por negros / grises neutros.
const dark = [
  '#ececee',
  '#c8c8cd',
  '#a1a1a8',
  '#75757d',
  '#3b3b41',
  '#2a2a2f',
  '#1e1e22',
  '#151518',
  '#0f0f11',
  '#08080a',
] as const;

export const theme = createTheme({
  primaryColor: 'brand',
  primaryShade: { light: 6, dark: 6 },
  colors: {
    brand: red,
    dark,
  },
  defaultRadius: 'md',
  fontFamily: "Inter, 'Segoe UI', system-ui, -apple-system, Roboto, Arial, sans-serif",
  headings: {
    fontFamily: "'Barlow Condensed', Inter, 'Segoe UI', system-ui, Arial, sans-serif",
    fontWeight: '800',
  },
  components: {
    Button: { defaultProps: { fw: 600 } },
    Badge: { defaultProps: { fw: 700 } },
  },
});
