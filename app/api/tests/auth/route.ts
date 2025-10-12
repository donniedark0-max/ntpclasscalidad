import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { login, logout } from '@/lib/puppeteer-helpers'; 

export async function GET() {
  let browser = null;

  try {
    browser = await puppeteer.launch({
      headless: false,
      slowMo: 100,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // 1. Iniciar sesión con un usuario aleatorio
    await login(page);

    // 2. Cerrar sesión
    await logout(page);

    // 3. Verificar que se volvió a la página de login
    const LOGIN_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const finalUrl = page.url();
    if (!finalUrl.includes(LOGIN_URL) || finalUrl.includes('/dashboard')) {
      throw new Error(`Cierre de sesión fallido. Se esperaba volver a la página de login pero se terminó en ${finalUrl}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Prueba de autenticación (Login y Logout) completada con éxito.'
    });

  } catch (error) {
    console.error('❌ Error en la prueba de autenticación:', error);

    
    if (browser) {
      try {
        const pages = await browser.pages();
        if (pages.length > 0) {
          await pages[0].screenshot({ path: 'public/error-auth-test.png' });
          console.log('Captura de pantalla del error guardada en public/error-auth-test.png');
        }
      } catch (screenshotError) {
        console.error('No se pudo tomar la captura de pantalla:', screenshotError);
      }
    }
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}