import { NextResponse } from 'next/server';
import { getBrowser } from '../../../../lib/puppeteer-browser';
import { Browser, Page } from 'puppeteer';

// --- Constantes de URLs para la prueba ---
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const LOGIN_URL = `${APP_URL}/`;
const DASHBOARD_URL = `${APP_URL}/dashboard`;

export async function GET() {
  console.log('🚀 Iniciando prueba de recorrido de cursos y semanas...');
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    browser = await getBrowser();
    page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 900 });

    // --- 1. INICIO DE SESIÓN ---
    console.log('🔑 Intentando iniciar sesión...');
    const usersJson = process.env.TEST_USERS_JSON;
    if (!usersJson) throw new Error('La variable de entorno TEST_USERS_JSON no está definida.');
    const users = JSON.parse(usersJson);
    if (users.length === 0) throw new Error('No se encontraron usuarios de prueba.');
    const testUser = users[Math.floor(Math.random() * users.length)];

    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });
    await page.type('#username', testUser.code);
    await page.type('#password', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    if (!page.url().startsWith(DASHBOARD_URL)) {
      throw new Error(`El inicio de sesión falló. URL actual: ${page.url()}`);
    }
    console.log('✅ Sesión iniciada. Accediendo al dashboard de cursos...');

    // --- 2. Contar los cursos para saber cuántas veces iterar ---
    const courseCardSelector = 'a[href*="/dashboard/courses/"]';
    await page.waitForSelector(courseCardSelector, { timeout: 15000 });
    const numCourses = (await page.$$(courseCardSelector)).length;

    if (numCourses === 0) {
      throw new Error("No se encontraron cursos en el dashboard.");
    }
    console.log(`🔎 Se encontraron ${numCourses} cursos. Empezando recorrido...`);

    // --- 3. Bucle principal - Iterar sobre cada curso ---
    for (let i = 0; i < numCourses; i++) {
      console.log(`\n➡️  [Curso ${i + 1} de ${numCourses}] Buscando y entrando al curso...`);

      await page.waitForSelector(courseCardSelector);
      const courseCards = await page.$$(courseCardSelector);
      
      if (courseCards[i]) {
        await courseCards[i].click();
      } else {
        throw new Error(`No se pudo encontrar el curso número ${i + 1} en el dashboard.`);
      }
      
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      const courseName = await page.$eval('h1', el => el.textContent?.trim() || 'Curso sin nombre');
      console.log(`📘 Dentro del curso: "${courseName}"`);

      // --- 4. Bucle secundario - Desplegar cada semana ---
      const weekButtonXPath = "//button[contains(., 'Semana')]";
      
      try {
        await page.waitForSelector(`xpath/${weekButtonXPath}`, { timeout: 5000 });
        // CORRECCIÓN: Usamos page.$$ con el prefijo xpath/ en lugar de page.$x
        const weekButtons = await page.$$(`xpath/${weekButtonXPath}`);
        const numWeeks = weekButtons.length;
        
        if (numWeeks > 0) {
            console.log(`🗓️  Se encontraron ${numWeeks} semanas. Verificando una por una...`);

            for (let j = 0; j < numWeeks; j++) {
              // CORRECCIÓN: Usamos page.$$ con el prefijo xpath/ en lugar de page.$x
              const currentWeekButtons = await page.$$(`xpath/${weekButtonXPath}`);
              const button = currentWeekButtons[j];
              const weekText = await button.evaluate(el => el.textContent?.trim() || `Semana ${j + 1}`);
              
              await button.evaluate(b => (b as HTMLElement).scrollIntoView({ block: 'center' }));
              await new Promise(r => setTimeout(r, 200));
              await button.click();

              const contentPanelXPath = `(${weekButtonXPath})[${j + 1}]/following-sibling::div//a`;
              await page.waitForSelector(`xpath/${contentPanelXPath}`, { timeout: 5000 });
              console.log(`   ✅ Acordeón "${weekText}" desplegado.`);
              
              await button.click(); // Cierra el acordeón para el siguiente
            }
        } else {
            console.log('⚠️  Este curso no parece tener semanas desplegables.');
        }

      } catch (e) {
        console.log('⚠️  Este curso no tiene semanas o no se cargaron a tiempo.');
      }
      
      // --- 5. Volver al dashboard ---
      console.log('... Volviendo al listado de cursos.');
      const backButtonXPath = "//a[contains(., 'Volver a cursos')]";
      const backButton = await page.waitForSelector(`xpath/${backButtonXPath}`);
      
      if (backButton) {
        await backButton.click();
      } else {
        throw new Error("No se encontró el botón 'Volver a cursos' para regresar al dashboard.");
      }
      
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
    }

    // --- 6. CERRAR SESIÓN ---
    console.log('\n🏁 Recorrido de todos los cursos completado. Cerrando sesión...');
    const menuTriggerSelector = 'button[aria-haspopup="menu"]';
    await page.click(menuTriggerSelector);
    
    const logoutXPathSelector = "//button[contains(., 'Cerrar sesión')]";
    const logoutButton = await page.waitForSelector(`xpath/${logoutXPathSelector}`, { visible: true, timeout: 10000 });
    if (!logoutButton) throw new Error('El botón de logout no apareció en el menú.');

    await logoutButton.click();
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('✅ Cierre de sesión exitoso.');

    return NextResponse.json({ 
      success: true, 
      message: 'Prueba de recorrido de cursos completada con éxito.' 
    });

  } catch (error) {
    console.error('❌ Error en la prueba de recorrido de cursos:', error);
    if (page) {
      // Guardar en /tmp para compatibilidad con Vercel
      await page.screenshot({ path: '/tmp/error-courses-test.png' });
      console.log('📸 Captura de pantalla del error guardada en /tmp.');
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  } finally {
    if (browser) await browser.close();
  }
}

