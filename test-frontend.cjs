// Test if frontend loads correctly
const puppeteer = require('puppeteer');

async function testFrontend() {
  console.log('Testing frontend loading...');
  
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Capture console logs
    page.on('console', msg => {
      console.log('Browser console:', msg.text());
    });
    
    // Capture page errors
    page.on('pageerror', error => {
      console.log('Page error:', error.message);
    });
    
    // Navigate to frontend
    console.log('Navigating to http://localhost:5177...');
    await page.goto('http://localhost:5177', { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Check page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check if body has content
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('Page content length:', bodyText.length);
    
    // Check for specific elements
    const gameElement = await page.$('#game');
    if (gameElement) {
      console.log('✅ Game element found');
    } else {
      console.log('❌ Game element not found');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'frontend-test.png' });
    console.log('Screenshot saved to frontend-test.png');
    
    await browser.close();
    console.log('✅ Frontend test completed');
    
  } catch (error) {
    console.error('❌ Frontend test failed:', error.message);
  }
}

testFrontend();