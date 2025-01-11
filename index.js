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
				// const description = element.querySelector('p') ? element.querySelector('p').textContent.trim() : null;
				const texts = Array.from(element.querySelectorAll('p')).map((p) => p.textContent.trim())
				const reason = texts[0];
				const description = texts.slice(1)[0]

				if (country === 'Unknown') {
					return null; // Ignorar elementos con country 'Unknown'
				}

				const coin = {
					country,
					reason: reason?.replace(/^Motivo conmemorativo:\s*/, '').trim(),
					description: description?.replace(/^Descripción:\s*/, '').trim()
				}

				return coin
			});
		});

		const filteredData = data.filter((element) => element !== null);

    // Guarda los datos en un archivo JSON
    fs.writeFileSync(`${selectedPage.year}-data.json`, JSON.stringify(filteredData, null, 2));
    console.log('Datos guardados en monedas.json');

    // Cierra el navegador
    await browser.close();
  })();