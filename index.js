const { chromium } = require('playwright');
const fs = require('fs');

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

	const data = await page.$$eval('.content-box', (elements) => {
		return elements.map((element) => {
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
				reason: reason?.replace(/^Motivo conmemorativo:\s*/, '').trim(),
				description: description?.replace(/^(Descripción|Description):\s*/, '').trim()
			}

			return coin
		});
	});

	const filteredData = data.filter((element) => element !== null);

	// Guarda los datos en un archivo JSON
	fs.writeFileSync(`${selectedPage.year}.json`, JSON.stringify(filteredData, null, 2));
	console.log(`Datos guardados en ${selectedPage.year}.json --- ${filteredData.length} registros guardados`);

	// Cierra el navegador
	await browser.close();
  })();