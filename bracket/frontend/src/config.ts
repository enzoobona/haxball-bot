// Textos y enlaces del sitio. Se pueden cambiar sin tocar el código con variables de entorno
// de Vite (por ejemplo en `frontend/.env`): VITE_SITE_NAME, VITE_SITE_TAGLINE, VITE_STREAM_URL,
// VITE_DISCORD_URL.
export const SITE_NAME: string = import.meta.env.VITE_SITE_NAME || 'Torneos de Haxball';
export const SITE_TAGLINE: string =
  import.meta.env.VITE_SITE_TAGLINE || 'Seguí los partidos, las llaves y las posiciones en vivo.';
export const STREAM_URL: string | undefined = import.meta.env.VITE_STREAM_URL || undefined;
export const DISCORD_URL: string | undefined = import.meta.env.VITE_DISCORD_URL || undefined;
