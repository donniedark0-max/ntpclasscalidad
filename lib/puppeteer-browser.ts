import { Browser, LaunchOptions } from 'puppeteer';

export async function getBrowser(): Promise<Browser> {
  const isVercel = !!process.env.VERCEL;

  if (isVercel) {
    console.log('✅ Entorno de Vercel detectado. Usando @sparticuz/chromium.');
    
    const puppeteer = (await import('puppeteer-core')).default;
    const chromium = (await import('@sparticuz/chromium')).default;

    const options: LaunchOptions = {
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      // CORRECCIÓN: 'true' activa el nuevo modo headless en tu versión.
      headless: true, 
    };

    return puppeteer.launch(options);

  } else {
    console.log('🔵 Entorno local detectado. Usando puppeteer completo.');
    
    const puppeteer = (await import('puppeteer')).default;

    return puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: false,
      slowMo: 100,
    });
  }
}