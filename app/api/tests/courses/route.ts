// D:\UTP-Class Guardian\ntpclasscalidad\app\api\tests\courses\route.ts

import { NextResponse } from 'next/server';
import { getBrowser } from '../../../../lib/puppeteer-browser';
import { Browser, Page } from 'puppeteer';

// --- Constantes de URLs ---
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const LOGIN_URL = `${APP_URL}/`;
const DASHBOARD_URL = `${APP_URL}/dashboard`;

export async function GET() {
  console.log('🚀 Iniciando prueba de recorrido de cursos (Enfoque Vercel)...');
  let browser: Browser | null = null;
  let page: Page | null = null;
  
  // ✅ SOLUCIÓN: Declaramos la variable como Uint8Array.
  // Este es el tipo de dato de bytes universal y compatible con Blob.
  let screenshotBuffer: any = null;

  try {
    browser = await getBrowser();
    page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 900 });

    // --- PASO 1: Iniciar Sesión ---
    const usersJson = process.env.TEST_USERS_JSON;
    if (!usersJson) throw new Error('TEST_USERS_JSON no está definido.');
    const users = JSON.parse(usersJson);
    if (users.length === 0) throw new Error('No hay usuarios de prueba.');
    const testUser = users[Math.floor(Math.random() * users.length)];

    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });
    await page.type('#username', testUser.code);
    await page.type('#password', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    if (!page.url().startsWith(DASHBOARD_URL)) {
      throw new Error(`El inicio de sesión falló. URL actual: ${page.url()}`);
    }
    console.log(`✅ Sesión iniciada como ${testUser.code}.`);

    // --- PASO 2: Contar los cursos ---
    const courseCardSelector = 'a[href*="/dashboard/courses/"]';
    await page.waitForSelector(courseCardSelector, { timeout: 15000 });
    const numCourses = (await page.$$(courseCardSelector)).length;
    if (numCourses === 0) throw new Error("No se encontraron cursos.");
    console.log(`🔎 Se encontraron ${numCourses} cursos.`);

    // --- Bucle principal ---
    for (let i = 0; i < numCourses; i++) {
      console.log(`\n➡️  [Curso ${i + 1} de ${numCourses}] Entrando al curso...`);
      await page.waitForSelector(courseCardSelector);
      const courseCards = await page.$$(courseCardSelector);
      if (!courseCards[i]) throw new Error(`No se pudo encontrar la tarjeta del curso ${i + 1}.`);
      
      await courseCards[i].click();
      await page.waitForNavigation({ waitUntil: 'networkidle2' });

      // --- Bucle secundario (semanas) ---
      try {
        await page.waitForSelector(`xpath///button[contains(., 'Semana')]`, { timeout: 5000 });
        const weekButtons = await page.$$(`xpath///button[contains(., 'Semana')]`);
        const numWeeks = weekButtons.length;
        
        if (numWeeks > 0) {
            for (let j = 0; j < numWeeks; j++) {
                const currentWeekButtons = await page.$$(`xpath///button[contains(., 'Semana')]`);
                const button = currentWeekButtons[j];
                await button.evaluate(b => b.scrollIntoView({ block: 'center' }));
                await new Promise(r => setTimeout(r, 300));
                await button.click();
                
                if (i === numCourses - 1 && j === numWeeks - 1) {
                    console.log('📸 Tomando captura de pantalla...');
                    await new Promise(r => setTimeout(r, 500));
                    // La asignación funciona porque un Buffer es un tipo de Uint8Array
                    screenshotBuffer = await page.screenshot({ type: 'png' });
                    console.log('✅ Captura guardada.');
                } else {
                    await button.click();
                }
            }
        }
      } catch (e) {
        console.log('⚠️  Este curso no tiene semanas o no se encontraron a tiempo.');
      }
      
      if (i < numCourses - 1) {
          await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle2' });
      }
    }

    if (!screenshotBuffer) {
        throw new Error("No se pudo tomar la captura de pantalla.");
    }
    
    console.log('\n🏁 Recorrido completado.');
    
    // --- PASO FINAL: Cerrar Sesión ---
    const menuTriggerSelector = 'button[aria-haspopup="menu"]';
    await page.click(menuTriggerSelector);
    const logoutXPathSelector = "//button[contains(., 'Cerrar sesión')]";
    const logoutButton = await page.waitForSelector(`xpath/${logoutXPathSelector}`, { visible: true });
    if (!logoutButton) throw new Error('El botón de logout no apareció.');
    await logoutButton.click();
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('✅ Cierre de sesión exitoso.');
    
    // Ahora la creación del Blob es directa y sin errores de tipo.
    const imageBlob = new Blob([screenshotBuffer], { type: 'image/png' });

    return new NextResponse(imageBlob, {
        status: 200,
        headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-cache' },
    });

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
    if (page) {
      await page.screenshot({ path: '/tmp/error_courses_screenshot.png' });
      console.log('📸 Captura de error guardada en /tmp.');
    }
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}