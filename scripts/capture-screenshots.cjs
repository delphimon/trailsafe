const {chromium}=require('@playwright/test');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.TRAILSAFE_BROWSER});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,geolocation:{latitude:47.42537,longitude:-121.41382,accuracy:8},permissions:['geolocation']});
  const page=await context.newPage();
  await page.goto(process.env.TRAILSAFE_TEST_URL||'http://127.0.0.1:8082');
  await page.getByRole('button',{name:'NEED HELP?',exact:true}).waitFor();
  await page.evaluate(async()=>{await Promise.all(['BarlowCondensed_600SemiBold','PublicSans_400Regular','PublicSans_700Bold'].map(f=>document.fonts.load(`16px ${f}`)));});
  await page.screenshot({path:'docs/screenshots/home.png',animations:'disabled'});
  await page.getByRole('button',{name:'NEED HELP?',exact:true}).click();
  await page.getByTestId('coordinates').waitFor();
  await page.screenshot({path:'docs/screenshots/emergency-dd.png',animations:'disabled'});
  await page.getByRole('button',{name:'Coordinate format',exact:true}).click();
  await page.screenshot({path:'docs/screenshots/coordinate-dropdown.png',animations:'disabled'});
  await page.getByRole('radio',{name:'Degrees & decimal minutes (DDM)',exact:true}).click();
  await page.getByRole('radio').first().waitFor({state:'hidden'});
  await page.screenshot({path:'docs/screenshots/emergency-ddm.png',animations:'disabled'});
  await page.getByRole('button',{name:'Coordinate format',exact:true}).click();
  await page.getByRole('radio',{name:'Universal Transverse Mercator (UTM)',exact:true}).click();
  await page.getByRole('radio').first().waitFor({state:'hidden'});
  await page.screenshot({path:'docs/screenshots/emergency-utm.png',animations:'disabled'});
  console.log('Captured Home, DD, DDM, UTM, and the coordinate dropdown using simulated GPS.');
 }finally{await browser.close();}
})();
