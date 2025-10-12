import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { login, logout } from '@/lib/puppeteer-helpers';

export async function GET() {
  console.log('🚀 Iniciando prueba de recorrido de cursos y semanas (Simulación de UI)...');
  let browser = null;

  try {
    browser = await puppeteer.launch({
      headless: false,
      slowMo: 120,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 900 });

    // --- PASO 1: Iniciar Sesión e ir al Dashboard ---
    await login(page);
    console.log('✅ Sesión iniciada. Accediendo al dashboard de cursos...');

    // --- PASO 2: Contar los cursos para saber cuántas veces iterar ---
    const courseCardSelector = 'a[href*="/dashboard/courses/"]';
    await page.waitForSelector(courseCardSelector);
    const numCourses = (await page.$$(courseCardSelector)).length;

    if (numCourses === 0) {
      throw new Error("No se encontraron cursos en el dashboard.");
    }

    console.log(`🔎 Se encontraron ${numCourses} cursos. Empezando recorrido por interfaz...`);

    // --- PASO 3: Bucle principal - Iterar sobre cada curso ---
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

      // --- PASO 4: Bucle secundario - Desplegar cada semana ---
      const weekButtonSelector = "xpath///button[contains(., 'Semana')]";
      
      // Usamos un try/catch para que la prueba no falle si un curso no tiene semanas
      try {
        await page.waitForSelector(weekButtonSelector, { timeout: 5000 }); // Espera 5s
        const numWeeks = (await page.$$(weekButtonSelector)).length;
        console.log(`🗓️  Se encontraron ${numWeeks} semanas. Verificando una por una...`);

        for (let j = 0; j < numWeeks; j++) {
          const weekButtons = await page.$$(weekButtonSelector);
          const button = weekButtons[j];
          const weekText = await button.evaluate(el => el.textContent?.trim() || `Semana ${j + 1}`);
          
          await button.evaluate(b => b.scrollIntoView({ block: 'center' }));
          await new Promise(r => setTimeout(r, 200));
          await button.click();

          const contentPanelSelector = `(//button[contains(., 'Semana')])[${j + 1}]/following-sibling::div//a`;
          await page.waitForSelector(`xpath/${contentPanelSelector}`, { timeout: 5000 });
          console.log(`   ✅ Acordeón "${weekText}" desplegado.`);
          
          await button.click();
        }
      } catch (e) {
        console.log('⚠️  Este curso no tiene semanas o no se encontraron a tiempo.');
      }
      
      // --- PASO 5: Volver al dashboard ---
      console.log('... Volviendo al listado de cursos.');
      const backButtonSelector = "xpath///a[contains(., 'Volver a cursos')]";
      const backButton = await page.waitForSelector(backButtonSelector);
      
     
      if (backButton) {
        await backButton.click();
      } else {
        
        throw new Error("No se encontró el botón 'Volver a cursos' para regresar al dashboard.");
      }
      
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
    }

    // --- PASO FINAL: Cerrar Sesión ---
    console.log('\n🏁 Recorrido de todos los cursos completado.');
    await logout(page);

    return NextResponse.json({ 
      success: true, 
      message: 'Prueba de recorrido de cursos por interfaz completada con éxito.' 
    });

  } catch (error) {
    console.error('❌ Error en la prueba de recorrido de cursos:', error);
    if (browser) {
      const page = (await browser.pages())[0];
      if (page) {
        await page.screenshot({ path: 'public/error-courses-test.png' });
        console.log('📸 Se ha guardado una captura de pantalla del error.');
      }
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  } finally {
    if (browser) await browser.close();
  }
}