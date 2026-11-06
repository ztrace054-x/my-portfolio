const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 require('node:fs').mkdirSync('artifacts/certificate-qa',{recursive:true});
 // Run against a local static preview on port 4173.

 const browser=await chromium.launch({...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {}),headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:1100},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/#/certificates');
 await page.locator('.certificate-earned').waitFor();await page.locator('.certificate-preview-button img').evaluate(img=>img.decode());
 await page.screenshot({path:'artifacts/certificate-qa/certificates-desktop.png',fullPage:true});
 await page.getByRole('button',{name:'View certificate',exact:true}).click();assert(await page.locator('#certificate-preview').evaluate(d=>d.open));
 for(let i=0;i<5;i++){await page.keyboard.press('Tab');assert(await page.evaluate(()=>!!document.activeElement.closest('dialog')));}
 await page.screenshot({path:'artifacts/certificate-qa/certificate-preview.png'});
 await page.keyboard.press('Escape');assert(!(await page.locator('#certificate-preview').evaluate(d=>d.open)));assert(await page.getByRole('button',{name:'View certificate',exact:true}).evaluate(e=>e===document.activeElement));
 await page.getByRole('button',{name:'Preview Ethical Hacking for Beginners certificate',exact:true}).click();await page.getByRole('button',{name:'Close preview'}).click();
 const downloadPromise=page.waitForEvent('download');await page.getByRole('link',{name:'Download original',exact:true}).click();const download=await downloadPromise;assert.equal(download.suggestedFilename(),'Md_Saad_Certificate.png');
 for(const width of [390,320]){await page.setViewportSize({width,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.equal(await page.locator('.certificate-earned').evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length),1);await page.screenshot({path:`artifacts/certificate-qa/certificates-mobile-${width}.png`,fullPage:true});await page.getByRole('button',{name:'View certificate',exact:true}).click();assert(await page.locator('#certificate-preview').evaluate(d=>d.scrollWidth<=d.clientWidth));await page.keyboard.press('Escape');}
 await page.goto('http://127.0.0.1:4173/#/dashboard');await page.locator('.dashboard-stat').first().waitFor();assert.equal(await page.locator('.dashboard-stat').nth(3).locator('.stat-number').innerText(),'1');assert.equal(await page.locator('.dashboard-stat').nth(0).locator('.stat-number').innerText(),'0');assert.deepEqual(errors,[]);
 await browser.close();console.log('PASS: desktop/mobile 390/320, original download, keyboard focus containment/restoration, Escape/close, dashboard count, no browser errors');
})().catch(e=>{console.error(e);process.exit(1)});
