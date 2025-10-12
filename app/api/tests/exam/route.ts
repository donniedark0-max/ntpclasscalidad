// D:\UTP-Class Guardian\ntpclasscalidad\app\api\tests\exam\route.ts (o el nombre que le hayas dado)

import { NextResponse } from 'next/server';
import { getBrowser } from '../../../../lib/puppeteer-browser'; // Usamos el helper
import { Browser, Page } from 'puppeteer';
import path from 'path'; // path sigue siendo necesario para subir archivos

// --- Constantes de la prueba (no necesitan cambio) ---
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const LOGIN_URL = `${APP_URL}/`;
const DASHBOARD_URL = `${APP_URL}/dashboard`;
const COURSE_NAME = 'Calidad de Software';
const WEEK_TO_TEST = 'Semana 1';
const TEST_EXAM_ID = 'exam-week-1';
const EXAM_LINK_TEXT = 'Examen Semana 1';
const PREDETERMINED_TEXT_ANSWER = "Respuesta de prueba automatizada para la pregunta abierta.";

// Función auxiliar para seleccionar opciones
function getRandomOption<T>(options: T[]): T | undefined {
  if (options.length === 0) return undefined;
  const randomIndex = Math.floor(Math.random() * options.length);
  return options[randomIndex];
}

export async function GET() {
  console.log('🚀 Iniciando prueba de examen (Adaptado para Vercel)...');
  let browser: Browser | null = null;
  let page: Page | null = null;
  
  // Usamos la misma solución que funcionó antes
  let screenshotBuffer: any = null;

  try {
    // CAMBIO 1: Usamos getBrowser() para la compatibilidad con Vercel
    browser = await getBrowser();
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // CAMBIO 2: Lógica de Login integrada, igual a los otros tests
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

    if (!page.url().startsWith(DASHBOARD_URL)) {
      throw new Error(`El inicio de sesión falló. URL actual: ${page.url()}`);
    }
    console.log(`✅ Sesión iniciada como ${testUser.code}.`);

    // --- El flujo de navegación hasta el examen se mantiene igual ---
    console.log(`Buscando el curso "${COURSE_NAME}"...`);
    const courseCardXPath = `//a[.//h3[contains(., '${COURSE_NAME}')]]`;
    const courseCard = await page.waitForSelector(`xpath/${courseCardXPath}`);
    if (!courseCard) throw new Error(`No se encontró el curso "${COURSE_NAME}"`);
    await courseCard.click();
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    console.log(`Buscando la sección "${WEEK_TO_TEST}"...`);
    const weekXPath = `//button[contains(., '${WEEK_TO_TEST}')]`;
    const weekElement = await page.waitForSelector(`xpath/${weekXPath}`);
    if (!weekElement) throw new Error(`No se encontró la sección "${WEEK_TO_TEST}"`);
    await weekElement.click();
    
    console.log(`Buscando el enlace del examen "${EXAM_LINK_TEXT}"...`);
    const examLinkXPath = `//a[contains(@href, "/exam/${TEST_EXAM_ID}") and contains(., "${EXAM_LINK_TEXT}")]`;
    const examLink = await page.waitForSelector(`xpath/${examLinkXPath}`);
    if (!examLink) throw new Error(`No se encontró el enlace al examen "${EXAM_LINK_TEXT}"`);
    await examLink.click();
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    // --- Lógica para resolver el examen (se mantiene igual) ---
    console.log('📝 Respondiendo el examen...');
    const questions = await page.$$('div.rounded-lg.bg-white.p-6.shadow-sm div:has(h3)');
    console.log(`🔎 Se encontraron ${questions.length} preguntas.`);

    for (const question of questions) {
        const radioOptions = await question.$$('input[type="radio"]');
        if (radioOptions.length > 0) {
            const randomOption = getRandomOption(radioOptions);
            if (randomOption) await randomOption.click();
            continue;
        }
        const textArea = await question.$('textarea');
        if (textArea) {
            await textArea.type(PREDETERMINED_TEXT_ANSWER);
        }
    }
    
    // --- Envío y Verificación ---
    await page.click("button[type='submit']");
    const confirmationTextSelector = `//h2[contains(., 'Examen en revisión')]`;
    await page.waitForSelector(`xpath/${confirmationTextSelector}`, { timeout: 15000 });
    console.log('✅ ¡Examen enviado! Pantalla de confirmación encontrada.');
    
    // CAMBIO 3: Tomar la captura de pantalla en el momento del éxito
    console.log('📸 Tomando captura de pantalla de la confirmación...');
    screenshotBuffer = await page.screenshot({ type: 'png' });
    console.log('✅ Captura de éxito guardada en memoria.');
    
    // --- PASO FINAL: Cerrar Sesión ---
    console.log('Procediendo a cerrar la sesión...');
    await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle2' }); // Navegamos al dashboard para encontrar el menú
    const menuTriggerSelector = 'button[aria-haspopup="menu"]';
    await page.click(menuTriggerSelector);
    const logoutXPathSelector = "//button[contains(., 'Cerrar sesión')]";
    const logoutButton = await page.waitForSelector(`xpath/${logoutXPathSelector}`, { visible: true });
    if (!logoutButton) throw new Error('El botón de logout no apareció.');
    await logoutButton.click();
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('✅ Cierre de sesión exitoso.');
    
    if (!screenshotBuffer) {
        throw new Error("Prueba finalizada, pero no se pudo tomar la captura de la confirmación.");
    }

    // CAMBIO 4: Devolver la imagen como respuesta de éxito
    console.log('🎉 ¡Prueba de ciclo completo de examen finalizada!');
    const imageBlob = new Blob([screenshotBuffer], { type: 'image/png' });
    return new NextResponse(imageBlob, {
        status: 200,
        headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-cache' },
    });

  } catch (error) {
    console.error('❌ Error en la prueba de resolución de examen:', error);
    if (page) {
      // CAMBIO 5: Corregir ruta de error para Vercel
      await page.screenshot({ path: '/tmp/error_exam_screenshot.png' });
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