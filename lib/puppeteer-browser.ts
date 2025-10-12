import { Browser } from 'puppeteer';

/**
 * Inicia y devuelve una instancia del navegador.
 * Detecta automáticamente si está en producción (Vercel) para usar
 * chrome-aws-lambda, o en desarrollo para usar la instalación local de puppeteer.
 */
export async function getBrowser(): Promise<Browser> {
  // CAMBIO CLAVE: Usamos process.env.VERCEL, que es más fiable.
  // Vercel establece esta variable a "1" en todos sus entornos (producción, preview, etc.).
  const isVercelEnvironment = !!process.env.VERCEL;

  if (isVercelEnvironment) {
    console.log('✅ Entorno de Vercel detectado. Usando puppeteer-core.');
    // Usa la versión ligera para producción
    const puppeteer = (await import('puppeteer-core')).default;
    const chrome = (await import('chrome-aws-lambda')).default;

    return puppeteer.launch({
      args: chrome.args,
      executablePath: await chrome.executablePath,
      headless: chrome.headless,
    });
  } else {
    console.log('🔵 Entorno local detectado. Usando puppeteer completo.');
    // Usa la versión completa para desarrollo local
    const puppeteer = (await import('puppeteer')).default;

    return puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: false,
      slowMo: 120,
    });
  }
}