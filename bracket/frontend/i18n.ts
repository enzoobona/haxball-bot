import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

// Español: idioma por defecto. Va incluido directamente en el bundle para que los textos estén
// disponibles desde el primer render y sirvan de respaldo para las claves que falten en otros idiomas.
import es from './public/locales/es/common.json';

const FALLBACK_LNG = 'es';
const NAMESPACE = 'common';

// Los demás idiomas también los empaqueta Vite en el build (un archivo JS por idioma, que se
// descarga solo cuando hace falta). Así las traducciones no dependen de que el servidor
// (Render, Caddy, etc.) sirva `/locales/*/common.json` ni de reglas de reescritura de la SPA,
// que era lo que fallaba en producción.
const lazyLocales = import.meta.glob(
  ['./public/locales/*/common.json', '!./public/locales/es/common.json'],
  { import: 'default' },
);

const supportedLngs = [
  FALLBACK_LNG,
  ...Object.keys(lazyLocales).map((path) => path.split('/').at(-2) as string),
];

const bundledBackend = {
  type: 'backend' as const,
  init() {},
  read(language: string, namespace: string, callback: (error: unknown, data?: unknown) => void) {
    const loader = lazyLocales[`./public/locales/${language}/${namespace}.json`];
    if (loader == null) {
      callback(null, {});
      return;
    }
    loader()
      .then((data) => callback(null, data))
      .catch((error) => callback(error, false));
  },
};

i18n
  .use(bundledBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: FALLBACK_LNG,
    supportedLngs,
    // `es-AR` -> `es`, `pt-BR` -> `pt`: no se piden archivos de variantes regionales.
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    ns: [NAMESPACE],
    defaultNS: NAMESPACE,

    resources: { [FALLBACK_LNG]: { [NAMESPACE]: es } },
    partialBundledLanguages: true,

    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      lookupQuerystring: 'lng',
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false,
    },

    // No hay <Suspense> en main.tsx; sin esto un idioma que todavía se está cargando
    // suspendería el árbol entero. Con el español ya incluido no hay textos vacíos.
    react: { useSuspense: false },
  });

export default i18n;