import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  // Enable dark mode
  await page.evaluate(() => {
    localStorage.setItem('client_followup_dark_mode', 'true');
    document.documentElement.classList.add('dark');
  });

  // Evaluate the color of the input inside a dark background
  const color = await page.evaluate(() => {
    const input = document.createElement('input');
    input.className = "w-full text-xs p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold";
    document.body.appendChild(input);
    const style = window.getComputedStyle(input);
    return {
      color: style.color,
      backgroundColor: style.backgroundColor,
      placeholderColor: window.getComputedStyle(input, '::placeholder').color
    };
  });
  console.log(color);

  await browser.close();
})();
