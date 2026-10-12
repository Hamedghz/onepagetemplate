// Run this function with playwright-cli run-code; see MOTION.md.
async (page) => {
  const results = [];
  const check = (name, condition) => {
    if (!condition) throw new Error(`${results.join('\n')}\nFAIL ${name}`);
    results.push(`PASS ${name}`);
  };
  const state = () => page.evaluate(() => {
    const stage = document.querySelector('.scene-stage');
    return { x: -stage.scrollLeft, width: stage.clientWidth, maximum: stage.scrollWidth - stage.clientWidth, active: [...document.querySelectorAll('.scene-link')].findIndex((node) => node.classList.contains('active')), y: scrollY, bodyHeight: document.body.scrollHeight };
  });
  const settle = async () => {
    let previous = -99999;
    for (let index = 0; index < 25; index += 1) {
      await page.waitForTimeout(80);
      const current = (await state()).x;
      if (Math.abs(current - previous) < 0.1) return;
      previous = current;
    }
    throw new Error('Scroll did not settle within 2 seconds');
  };
  const reset = async (value = 0) => {
    await page.locator('.scene-stage').evaluate((stage, next) => { stage.scrollLeft = -next; }, value);
    await page.waitForTimeout(100);
  };
  await page.route('**/api/public-settings.php', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"downloads":[]}' }));
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('http://127.0.0.1:4174/');
  await page.locator('.scene-stage').waitFor();
  await page.mouse.move(600, 700);
  check('all seven panes mounted with no hidden/inert content', await page.locator('.scene').count() === 7 && await page.locator('.scene-frame[inert],.scene-frame[aria-hidden]').count() === 0);
  check('mandatory snap removed', await page.locator('.scene-stage').evaluate((stage) => getComputedStyle(stage).scrollSnapType === 'none'));

  await page.mouse.wheel(0, 120);
  await settle();
  let current = await state();
  check('wheel moves by pixels, not a whole scene', Math.abs(current.x - 120) <= 1 && current.active === 0);
  await page.waitForTimeout(400);
  check('fractional position stays without recentering', Math.abs((await state()).x - 120) <= 1);
  await page.mouse.wheel(0, 2);
  await settle();
  check('tiny trackpad deltas are accepted', Math.abs((await state()).x - 122) <= 1);
  await page.mouse.wheel(-80, 0);
  await settle();
  check('horizontal RTL wheel follows physical direction', Math.abs((await state()).x - 202) <= 1);
  await page.mouse.wheel(0, -40);
  await settle();
  check('reverse wheel is continuous', Math.abs((await state()).x - 162) <= 1);
  await page.locator('.scene-stage').dispatchEvent('wheel', { deltaY: 3, deltaX: 0, deltaMode: 1 });
  await settle();
  check('line-based wheel delta is normalized', Math.abs((await state()).x - 210) <= 1);
  await page.locator('.scene-stage').dispatchEvent('wheel', { deltaY: 100, deltaX: 0, ctrlKey: true });
  await page.waitForTimeout(150);
  check('ctrl-wheel zoom is not intercepted', Math.abs((await state()).x - 210) <= 1);

  await reset(640);
  check('neighbors remain rendered halfway between scenes', await page.evaluate(() => {
    const frames = [...document.querySelectorAll('.scene-frame')];
    return [frames[0], frames[1]].every((node) => {
      const rect = node.getBoundingClientRect();
      return rect.left < innerWidth && rect.right > 0 && node.querySelector('section') && getComputedStyle(node.querySelector('.scene-motion')).opacity === '1';
    });
  }));
  check('active scene is derived from physical progress', (await state()).active === 1);
  await page.locator('.scene-stage').focus();
  await page.keyboard.press('ArrowLeft');
  await settle();
  check('left arrow advances RTL by pixels', Math.abs((await state()).x - 720) <= 1);
  await page.keyboard.press('ArrowRight');
  await settle();
  check('right arrow reverses by pixels', Math.abs((await state()).x - 640) <= 1);

  await page.locator('.scene-link').nth(6).click();
  await settle();
  current = await state();
  check('navigation arrives at last scene', Math.abs(current.x - current.maximum) <= 1 && current.active === 6);
  await page.locator('.scene-link').nth(0).click();
  await page.waitForTimeout(90);
  await page.mouse.move(600, 700);
  await page.locator('.scene-stage').evaluate((stage) => stage.addEventListener('wheel', () => { window.motionInterruptionPosition = -stage.scrollLeft; }, { capture: true, once: true }));
  await page.mouse.wheel(0, 120);
  await settle();
  const beforeInterrupt = await page.evaluate(() => window.motionInterruptionPosition);
  check('wheel interrupts navigation at the current position', Math.abs((await state()).x - beforeInterrupt - 120) <= 1 && beforeInterrupt > 1000);

  await reset(500);
  await page.mouse.move(500, 700);
  await page.mouse.down();
  await page.mouse.move(680, 700, { steps: 12 });
  await page.waitForTimeout(100);
  await page.mouse.up();
  await settle();
  check('mouse drag follows distance without scene snapping', Math.abs((await state()).x - 680) <= 2);
  check('drag state is released', await page.locator('.is-dragging').count() === 0);

  await reset(1760);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(180);
  check('resize preserves fractional section progress', Math.abs((await state()).x / 1440 - 1.375) < 0.01);
  await page.locator('.language-button').click();
  await page.waitForTimeout(150);
  check('English content is left aligned while track stays RTL', await page.evaluate(() => document.documentElement.lang === 'en' && getComputedStyle(document.querySelector('.scene-motion')).direction === 'ltr' && getComputedStyle(document.querySelector('.scene-stage')).direction === 'rtl' && getComputedStyle(document.querySelector('.scene')).textAlign === 'start'));
  check('language change preserves position', Math.abs((await state()).x / 1440 - 1.375) < 0.01);
  check('desktop has no vertical page scroll', (await state()).y === 0 && (await state()).bodyHeight === 900);

  await page.locator('.scene-link').nth(3).click();
  await settle();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(250);
  check('mobile uses vertical layout at the selected scene', await page.evaluate(() => getComputedStyle(document.querySelector('.scene-stage')).display === 'block' && scrollY > 500) && (await state()).active === 3);
  await page.evaluate(() => window.scrollTo({ top: document.querySelector('#education').getBoundingClientRect().top + scrollY - 115, behavior: 'instant' }));
  await page.waitForTimeout(200);
  check('mobile nav follows native scrolling', (await state()).active === 5);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(200);
  check('return to desktop preserves selected section', (await state()).active === 5 && Math.abs((await state()).x - 6400) <= 1 && (await state()).y === 0);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(150);
  await reset(100);
  await page.mouse.move(600, 700);
  await page.mouse.wheel(0, 20);
  await page.waitForTimeout(80);
  check('reduced motion keeps manual scrolling immediate and continuous', Math.abs((await state()).x - 120) <= 1);
  check('reduced motion disables automatic-motion toggle', await page.locator('.motion-button').isDisabled());

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('http://127.0.0.1:4174/');
  await page.locator('.scene-stage').waitFor();
  await page.mouse.move(600, 700);
  await page.locator('.motion-button').click();
  await page.evaluate(() => document.activeElement.blur());
  await page.mouse.move(-10, -10);
  await page.waitForTimeout(7800);
  check('explicit pause keeps idle motion stopped', (await state()).x < 1);
  await page.locator('.motion-button').click();
  await page.evaluate(() => document.activeElement.blur());
  await page.mouse.move(-10, -10);
  await page.waitForTimeout(8000);
  current = await state();
  check('idle motion cruises slowly instead of jumping sections', current.x > 5 && current.x < 40);
  await page.mouse.move(600, 700);
  const hovered = (await state()).x;
  await page.waitForTimeout(300);
  check('hover stops automatic motion', Math.abs((await state()).x - hovered) < 1);

  await reset(current.maximum - 8);
  await page.evaluate(() => document.activeElement.blur());
  await page.mouse.move(-10, -10);
  await page.waitForTimeout(7900);
  current = await state();
  check('automatic motion stops at the end without wraparound', current.x > current.maximum - 1 && current.active === 6);
  await page.waitForTimeout(250);
  check('last scene stays at the end', (await state()).x > current.maximum - 1);
  return { results, summary: `${results.length}/${results.length} continuous-motion browser checks passed.` };
}
