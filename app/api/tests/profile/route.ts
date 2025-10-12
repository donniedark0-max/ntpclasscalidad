// D:\UTP-Class Guardian\ntpclasscalidad\app\api\tests\profile\route.ts

import { NextResponse } from 'next/server';
import puppeteer, { Page } from 'puppeteer';
import { login, logout } from '@/lib/puppeteer-helpers';

// --- Funciones para generar datos de prueba aleatorios ---

function generateRandomPhoneNumber(): string {
  return `9${Math.floor(10000000 + Math.random() * 90000000)}`;
}

function generateRandomEmail(): string {
  const randomString = Math.random().toString(36).substring(2, 10);
  return `test.${randomString}@example.com`;
}

function generateRandomAddress(): string {
    const streets = ["Av. Arequipa", "Calle Las Begonias", "Jirón de la Unión", "Av. Javier Prado", "Calle Alcanfores"];
    const number = Math.floor(100 + Math.random() * 900);
    return `${streets[Math.floor(Math.random() * streets.length)]} ${number}`;
}

function getRandomCivilStatus(): string {
    const options = ["Soltero(a)", "Casado(a)", "Conviviente", "Divorciado(a)", "Viudo(a)"];
    return options[Math.floor(Math.random() * options.length)];
}

function getRandomMobility(): string {
    const options = ["Transporte Público", "Auto Propio", "Bicicleta", "A pie"];
    return options[Math.floor(Math.random() * options.length)];
}

async function clearAndType(page: Page, selector: string, text: string) {
    await page.waitForSelector(selector);
    await page.click(selector, { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type(selector, text);
}


export async function GET() {
  console.log('🚀 Iniciando prueba COMPLETA de edición de perfil...');
  let browser = null;

  try {
    browser = await puppeteer.launch({
      headless: false,
      slowMo: 120,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 900 });

    await login(page);
    await page.goto(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/sae`, { waitUntil: 'networkidle2' });
    console.log('✅ Navegado a la página principal de SAE.');
    
    const profileCard = await page.waitForSelector('a[href="/dashboard/profile"]');
    if (!profileCard) throw new Error("No se encontró la tarjeta 'Editar Perfil'");
    
    await profileCard.click();
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('✅ Navegado a la página de edición de perfil.');

    console.log('📝 Editando sección de Contacto (uno por uno)...');
    const newPhone = generateRandomPhoneNumber();
    const newEmail = generateRandomEmail();

    const contactSection = await page.waitForSelector("xpath///p[contains(., 'Celular')]/ancestor::div[contains(@class, 'rounded-lg')]");
    if (!contactSection) throw new Error("No se encontró la sección de contacto.");

    // -- Editar y Guardar Celular --
    let editButtons = await contactSection.$$('button');
    if (!editButtons[0]) throw new Error("No se encontró el botón 'Editar' para Celular.");
    await editButtons[0].click();
    await clearAndType(page, 'input[aria-label="Celular"]', newPhone);
    const savePhoneButton = await page.waitForSelector("xpath///input[@aria-label='Celular']/../../div/button[contains(., 'Guardar')]");
    if (!savePhoneButton) throw new Error("No se encontró el botón 'Guardar' para el celular.");
    await savePhoneButton.click();
    await page.waitForFunction((phone) => document.body.innerText.includes(phone), {}, newPhone);
    console.log(`✅ Verificado: Celular actualizado a ${newPhone}`);

    // -- Editar y Guardar Correo --
    editButtons = await contactSection.$$('button');
    if (!editButtons[1]) throw new Error("No se encontró el botón 'Editar' para Correo.");
    await editButtons[1].click();
    await clearAndType(page, 'input[aria-label="Correo personal"]', newEmail);
    const saveEmailButton = await page.waitForSelector("xpath///input[@aria-label='Correo personal']/../../div/button[contains(., 'Guardar')]");
    if (!saveEmailButton) throw new Error("No se encontró el botón 'Guardar' para el correo.");
    await saveEmailButton.click();
    await page.waitForFunction((email) => document.body.innerText.includes(email), {}, newEmail);
    console.log(`✅ Verificado: Correo actualizado a ${newEmail}`);

    console.log('📝 Editando sección de Nombres y Apellidos...');
    const newName = "TestNombreModificado";
    const newLastName = "TestApellidoModificado";

    const personalSection = await page.waitForSelector("xpath///p[contains(., 'Nombres')]/ancestor::div[contains(@class, 'rounded-lg')]");
    if (!personalSection) throw new Error("No se encontró la sección de datos personales.");

    const editPersonalButton = await personalSection.$("button[class*='text-blue-600']");
    if (!editPersonalButton) throw new Error("No se encontró el botón 'Editar Nombres/Apellidos'.");
    await editPersonalButton.click();

    await clearAndType(page, 'input[aria-label="Nombres"]', newName);
    await clearAndType(page, 'input[aria-label="Apellidos"]', newLastName);

    const savePersonalButton = await personalSection.$("button.text-blue-600");
    if (!savePersonalButton) {
        throw new Error("No se encontró el botón 'Guardar' en la sección personal.");
    }
    await savePersonalButton.click();
    
    await page.waitForFunction((name) => document.body.innerText.includes(name), {}, newName);
    console.log(`✅ Verificado: Nombre actualizado a ${newName} ${newLastName}`);
    
    console.log('📝 Editando sección completa de Otros Datos...');
    const newCivilStatus = getRandomCivilStatus();
    const newAddress = generateRandomAddress();
    const newMobility = getRandomMobility();
    const newEmergencyContact = generateRandomPhoneNumber();

    const otherSection = await page.waitForSelector("xpath///p[contains(., 'Estado Civil')]/ancestor::div[contains(@class, 'rounded-lg')]");
    if (!otherSection) throw new Error("No se encontró la sección de otros datos.");
    
    const editOtherButton = await otherSection.$('button');
    if (!editOtherButton) throw new Error("No se encontró el botón 'Editar' en la sección de otros datos.");
    await editOtherButton.click();
    
    await clearAndType(page, 'input[aria-label="Estado Civil"]', newCivilStatus);
    await clearAndType(page, 'input[aria-label="Dirección"]', newAddress);
    await clearAndType(page, 'input[aria-label="Movilidad"]', newMobility);
    await clearAndType(page, 'input[aria-label="Contacto de emergencia"]', newEmergencyContact);

    const saveOtherButton = await otherSection.$("button.text-blue-600");
    if (!saveOtherButton) {
        throw new Error("No se encontró el botón 'Guardar' en la sección de otros datos.");
    }
    await saveOtherButton.click();

    await page.waitForFunction((text) => document.body.innerText.includes(text), {}, newCivilStatus);
    console.log(`✅ Verificado: Estado Civil actualizado a "${newCivilStatus}"`);
    await page.waitForFunction((text) => document.body.innerText.includes(text), {}, newAddress);
    console.log(`✅ Verificado: Dirección actualizada a "${newAddress}"`);

    await logout(page);

    console.log('🎉 ¡Prueba completa de edición de perfil finalizada con éxito!');
    return NextResponse.json({ success: true, message: 'Prueba de edición de perfil completada correctamente.' });

  } catch (error) {
    console.error('❌ Error en la prueba de edición de perfil:', error);
    if (browser) {
      const page = (await browser.pages())[0];
      if (page) {
        await page.screenshot({ path: 'public/error-profile-test.png' });
        console.log('📸 Se ha guardado una captura de pantalla del error.');
      }
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  } finally {
    if (browser) await browser.close();
  }
}
