import { chromium } from 'playwright';
// import fs from 'fs';
import turso from './db.js';
import { v4 as uuidv4 } from 'uuid';

(async () => {
	const args = process.argv.slice(2);
	const parsedArgs = {};

	args.forEach(arg => {
		const [key, value] = arg.split('=');
		parsedArgs[key.replace(/^--/, '')] = value || true;
	});

	const browser = await chromium.launch({ headless: true });
	const page = await browser.newPage();
	await page.goto('https://www.ecb.europa.eu/euro/coins/comm/html/index.es.html');

	const links = await page.$$eval('.box', links => links.map(link => ({
		year: link.innerText.split('\n')[0],
		url: link.href,
	})));

	const selectedPage = links.find(link => link.year === parsedArgs.year);

	// Navegamos a la página seleccionada
	await page.goto(selectedPage.url);

	// Extraemos los datos de la página
	const data = await page.$$eval('.box', (elements) => {
		const IMAGES_HOST = 'https://www.ecb.europa.eu/euro/coins/comm/html'

		return elements.map((element) => {
			const imageElement = element.querySelector('img');
			const imageSrc = imageElement ? imageElement.getAttribute('src') : null;

			const contentBoxesElement = element.querySelectorAll('.content-box');
			const data = Array.from(contentBoxesElement).map(element => {
				const countryElement = element.querySelector('h3');
				const country = countryElement ? countryElement.textContent.trim() : 'Unknown';
				const coinInfo = element.querySelectorAll('p') ? Array.from(element.querySelectorAll('p')).map((p) => p.innerText) : null

				if (country === 'Unknown' || coinInfo === null) {
					console.log(`Problema con country: ${country} o coinInfo: ${coinInfo}`);
					return null;
				}

				const splittedInfo = coinInfo.flatMap(item => item.split('\n').filter(line => line.trim() !== ''));
				const reason = splittedInfo[0];
				const description = splittedInfo.slice(1)[0]

				const coin = {
					country,
					description: description?.replace(/^(Descripción|Description):\s*/, '').trim(),
					imageSrc: `${IMAGES_HOST}/${imageSrc}`,
					reason: reason?.replace(/^Motivo conmemorativo:\s*/, '').trim()
				}

				return coin
			});

			return data
		});
	});

	const filteredData = data.flat().filter((element) => element !== null);

	// Guarda los datos en un archivo JSON
	// fs.writeFileSync(`${selectedPage.year}.json`, JSON.stringify(filteredData, null, 2));
	// console.log(`Datos guardados en ${selectedPage.year}.json --- ${filteredData.length} registros guardados`);

	try {
		await turso.execute("SELECT 1");
		console.log("Conectado a la base de datos con éxito!");
		// Inserta los datos en la base de datos
		for (const [key, value] of Object.entries(filteredData)) {
			const myUUID = uuidv4()
			const values = [myUUID, value.country, value.description, value.imageSrc, value.reason, selectedPage.year]
			await turso.execute("INSERT INTO coins (id, country, description, imageSrc, reason, year) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT (country, description) DO NOTHING", values)
		}
		console.log(`Datos insertados en la base de datos --- ${filteredData.length} registros insertados para el año ${selectedPage.year}`);
	} catch (error) {
		console.error("Conexión a la base de datos fallida:", error);
	}

	// Cierra el navegador
	await browser.close();
  })();