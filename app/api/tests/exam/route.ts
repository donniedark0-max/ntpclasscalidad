import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import path from 'path';
import { login } from '@/lib/puppeteer-helpers'; 


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
  console.log('🚀 Iniciando prueba de ciclo completo: Login > Examen > Logout...');
  let browser = null;

  try {
    browser = await puppeteer.launch({
      headless: false, // Ponlo en false para ver al bot en acción
      slowMo: 150,     // Una pequeña pausa entre acciones para ver mejor lo que hace
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // PASOS 1-4: Navegación hasta el examen
    await login(page);
    
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
    
    // PASO 5: Resolver el examen
    console.log('✅ Página del formulario de examen cargada.');
    const examCardSelector = 'div.rounded-lg.bg-white.p-6.shadow-sm';
    const examCard = await page.waitForSelector(examCardSelector);
    if (!examCard) throw new Error('No se encontró la tarjeta principal del examen.');
    
    const questions = await examCard.$$('div:has(h3)');
    console.log(`🔎 Se encontraron ${questions.length} contenedores de preguntas. Procediendo a responder...`);

    for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const radioOptions = await question.$$('input[type="radio"]');
        if (radioOptions.length > 0) {
            const randomOption = getRandomOption(radioOptions);
            if (randomOption) await randomOption.click();
            continue;
        }
        const checkboxOptions = await question.$$('input[type="checkbox"]');
        if (checkboxOptions.length > 0) {
            const shuffled = checkboxOptions.sort(() => 0.5 - Math.random());
            const count = Math.floor(Math.random() * shuffled.length) + 1;
            for (let j = 0; j < count; j++) { await shuffled[j].click(); }
            continue;
        }
        const textArea = await question.$('textarea');
        if (textArea) {
            await textArea.type(PREDETERMINED_TEXT_ANSWER);
        }
        const fileInput = await question.$('input[type="file"]');
        if (fileInput) {
            const filePath = path.resolve(process.cwd(), 'public/error-exam-test.png');
            await fileInput.uploadFile(filePath);
        }
    }

    // PASO 6: Enviar el examen
    const submitButtonXPath = `//button[contains(., 'Enviar examen')]`;
    const submitButton = await page.waitForSelector(`xpath/${submitButtonXPath}`);
    if (!submitButton) throw new Error('No se encontró el botón para "Enviar examen"');
    await submitButton.click();
    
    // PASO 7: Verificar que el examen fue recibido
    const confirmationTextSelector = `//h2[contains(., 'Examen en revisión')]`;
    await page.waitForSelector(`xpath/${confirmationTextSelector}`);
    console.log('✅ ¡Pantalla de confirmación encontrada!');


    // PASO 8: Volver al curso y esperar a que el contenido del curso aparezca
    const returnToCourseLinkSelector = `//a[contains(., 'Volver al curso')]`;
    const returnLink = await page.waitForSelector(`xpath/${returnToCourseLinkSelector}`);
    if (!returnLink) throw new Error('No se encontró el enlace para "Volver al curso"');
    await returnLink.click();
    
    // En lugar de waitForNavigation, esperamos un elemento específico de la página del curso.
    console.log('Volviendo al curso, esperando a que aparezca el contenido...');
    const weeksTitleSelector = `//h2[contains(., 'Total de semanas')]`;
    await page.waitForSelector(`xpath/${weeksTitleSelector}`);
    console.log('✅ Se ha vuelto a la página del curso.');

    // PASO 9: Cerrar Sesión para finalizar la prueba
    console.log('Procediendo a cerrar la sesión...');
    const menuTriggerSelector = 'button[aria-haspopup="menu"]';
    const menuTrigger = await page.waitForSelector(menuTriggerSelector);
    if (!menuTrigger) throw new Error('No se encontró el botón del menú de perfil');
    await menuTrigger.click();
    console.log('Menú de perfil abierto.');

    const logoutXPathSelector = "//button[contains(., 'Cerrar sesión')]";
    const logoutButton = await page.waitForSelector(`xpath/${logoutXPathSelector}`);
    if (!logoutButton) {
        throw new Error('No se pudo encontrar el botón de "Cerrar sesión" en el menú.');
    }
    await logoutButton.click();
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    if (!page.url().endsWith('/')) {
        throw new Error('El cierre de sesión falló. No se redirigió a la página de inicio.');
    }
    console.log('✅ Sesión cerrada correctamente.');
    
    console.log('🎉 ¡Prueba de ciclo completo (Login > Examen > Logout) completada con éxito!');
    return NextResponse.json({ success: true, message: 'Ciclo de examen y sesión completado correctamente.' });

  } catch (error) {
    console.error('❌ Error en la prueba de resolución de examen:', error);
    if (browser) {
      const page = (await browser.pages())[0];
      if (page) {
        await page.screenshot({ path: 'public/error-exam-test.png' });
        console.log('📸 Se ha guardado una captura de pantalla del error en la carpeta public.');
      }
    }
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  } finally {
    if (browser) await browser.close();
  }
}