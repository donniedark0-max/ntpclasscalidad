import { Browser } from 'puppeteer';

/**
 * Inicia y devuelve una instancia del navegador.
 * Detecta automáticamente si está en producción (Vercel) para usar
 * chrome-aws-lambda, o en desarrollo para usar la instalación local de puppeteer.
 */
export async function getBrowser(): Promise<Browser> {
  // Cuando el código se ejecuta en Vercel, esta variable de entorno existe.
  const isProduction = !!process.env.VERCEL_URL;

  if (isProduction) {
    // Usa la versión ligera para producción
    const puppeteer = (await import('puppeteer-core')).default;
    const chrome = (await import('chrome-aws-lambda')).default;

    return puppeteer.launch({
      args: chrome.args,
      executablePath: await chrome.executablePath,
      headless: chrome.headless,
    });
  } else {
    // Usa la versión completa para desarrollo local
    const puppeteer = (await import('puppeteer')).default;

    return puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: false,
      slowMo: 120, // Puedes ajustar la velocidad para ver mejor las pruebas
    });
  }
}