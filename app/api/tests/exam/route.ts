// D:\UTP-Class Guardian\ntpclasscalidad\app\api\tests\exam\route.ts

import { NextResponse } from 'next/server';
import { getBrowser } from '../../../../lib/puppeteer-browser';
import { Browser, Page } from 'puppeteer';
import path from 'path';

// --- Constantes (sin cambios) ---
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const LOGIN_URL = `${APP_URL}/`;
const DASHBOARD_URL = `${APP_URL}/dashboard`;
const COURSE_NAME = 'Calidad de Software';
const WEEK_TO_TEST = 'Semana 1';
const TEST_EXAM_ID = 'exam-week-1';
const EXAM_LINK_TEXT = 'Examen Semana 1';
const PREDETERMINED_TEXT_ANSWER = "Respuesta de prueba automatizada para la pregunta abierta.";

function getRandomOption<T>(options: T[]): T | undefined {
  if (options.length === 0) return undefined;
  const randomIndex = Math.floor(Math.random() * options.length);
  return options[randomIndex];
}

export async function GET() {
  console.log('🚀 Iniciando prueba de examen (Flujo completo con logout)...');
  let browser: Browser | null = null;
  let page: Page | null = null;
  let screenshotBuffer: any = null;

  try {
    browser = await getBrowser();
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // --- Login (sin cambios) ---
    console.log('🔑 Autenticando usuario...');
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
    if (!page.url().startsWith(DASHBOARD_URL)) throw new Error(`El inicio de sesión falló.`);
    console.log(`✅ Sesión iniciada como ${testUser.code}.`);

    // --- Navegación y resolución del examen (sin cambios) ---
    console.log(`Buscando el curso "${COURSE_NAME}"...`);
    await page.click(`xpath///a[.//h3[contains(., '${COURSE_NAME}')]]`);
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log(`Buscando la sección "${WEEK_TO_TEST}"...`);
    await page.click(`xpath///button[contains(., '${WEEK_TO_TEST}')]`);
    console.log(`Buscando el enlace del examen "${EXAM_LINK_TEXT}"...`);
    await page.click(`xpath///a[contains(@href, "/exam/${TEST_EXAM_ID}") and contains(., "${EXAM_LINK_TEXT}")]`);
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    console.log('📝 Respondiendo el examen...');
    const questions = await page.$$('div.rounded-lg.bg-white.p-6.shadow-sm div:has(h3)');
    for (const question of questions) {
        const radioOptions = await question.$$('input[type="radio"]');
        if (radioOptions.length > 0) {
            const randomOption = getRandomOption(radioOptions);
            if (randomOption) await randomOption.click();
            continue;
        }
        const checkboxOptions = await question.$$('input[type="checkbox"]');
        if (checkboxOptions.length > 0) {
            const randomCheckbox = getRandomOption(checkboxOptions);
            if (randomCheckbox) await randomCheckbox.click();
            continue;
        }
        const textArea = await question.$('textarea');
        if (textArea) {
            await textArea.type(PREDETERMINED_TEXT_ANSWER);
            const fileInput = await question.$('input[type="file"]');
            if (fileInput) {
                const filePath = path.resolve(process.cwd(), 'public/error-exam-test.png');
                await fileInput.uploadFile(filePath);
            }
        }
    }
    
    // --- Envío y Verificación ---
    await page.click(`xpath///button[contains(., 'Enviar examen')]`);
    await page.waitForSelector(`xpath///h2[contains(., 'Examen en revisión')]`, { timeout: 15000 });
    console.log('✅ ¡Examen enviado! Pantalla de confirmación encontrada.');
    
    // ⭐ CAMBIO 1: La captura se toma aquí, en el momento del éxito principal.
    console.log('📸 Tomando captura de pantalla de la confirmación...');
    screenshotBuffer = await page.screenshot({ type: 'png' });
    
    if (!screenshotBuffer) {
        throw new Error("Se llegó a la confirmación, pero no se pudo tomar la captura.");
    }

    // ⭐ CAMBIO 2: El bot continúa desde la página de confirmación para cerrar sesión.
    console.log('🔒 Continuando para cerrar sesión...');
    
    // Paso 1: Volver a la página del curso.
    const returnToCourseLink = await page.waitForSelector(`xpath///a[contains(., 'Volver al curso')]`);
    if (!returnToCourseLink) throw new Error("No se encontró el enlace para 'Volver al curso'");
    await returnToCourseLink.click();
    
    // Paso 2: Esperar a que la página del curso cargue completamente.
    // Buscamos un elemento que sabemos que debe estar allí, como el título de las semanas.
    await page.waitForSelector(`xpath///h2[contains(., 'Total de semanas')]`, { timeout: 15000 });
    console.log('... Regresó a la página del curso.');

    // Paso 3: Abrir el menú de perfil y cerrar sesión (con la pausa de seguridad).
    await page.click('button[aria-haspopup="menu"]');
    await new Promise(r => setTimeout(r, 500)); // Pausa para la animación
    const logoutButton = await page.waitForSelector(`xpath///button[contains(., 'Cerrar sesión')]`, { visible: true });
    if (!logoutButton) throw new Error('El botón de logout no apareció en el menú.');
    await logoutButton.click();
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('✅ Cierre de sesión exitoso.');

    // La prueba finaliza y devuelve la captura tomada ANTES del cierre de sesión.
    console.log('🎉 ¡Prueba de ciclo completo finalizada con éxito!');
    const imageBlob = new Blob([screenshotBuffer], { type: 'png' });
    return new NextResponse(imageBlob, {
        status: 200,
        headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-cache' },
    });

  } catch (error) {
    console.error('❌ Error en la prueba de resolución de examen:', error);
    if (page) {
        const isVercel = !!process.env.VERCEL;
        const errorPath = isVercel ? '/tmp/error_exam_screenshot.png' : 'public/error_exam_screenshot.png';
        await page.screenshot({ path: errorPath });
        console.log(`📸 Captura de error guardada en: ${errorPath}`);
    }
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}