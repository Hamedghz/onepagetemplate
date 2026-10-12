# حرکت پیوستهٔ رزومه / Continuous résumé navigation

## رفتار / Behavior

در دسکتاپ افقی، هفت بخش روی یک مسیر مشترک از راست به چپ قرار دارند. چرخ موس و ترک‌پد به‌اندازهٔ حرکت ورودی صفحه را جلو یا عقب می‌برند؛ صفحه روی ابتدای هر بخش قفل نمی‌شود. می‌توان بین دو بخش توقف کرد و محتوای هر دو را دید. ناوبری بالا و شمارهٔ پایین از موقعیت واقعی مسیر به‌روز می‌شوند. متن هیچ بخش هنگام جابه‌جایی حذف یا محو نمی‌شود.

The seven desktop sections share one RTL scrolling track. Wheel/trackpad input moves it by pixels, with interruptible smoothing and no mandatory snap. Neighboring sections stay rendered at intermediate positions. Navigation and the progress rail follow the actual scroll position. English content remains LTR and left aligned inside this RTL journey.

- چرخ موس عمودی: پایین برای جلو رفتن، بالا برای بازگشت. حرکت افقی ترک‌پد از جهت فیزیکی مسیر پیروی می‌کند.
- با موس، قسمت غیرتعاملی صفحه را بگیرید و به راست بکشید تا به بخش بعدی برسید. لینک‌ها و دکمه‌ها قابل کلیک می‌مانند؛ لمس از اسکرول بومی مرورگر استفاده می‌کند.
- برای صفحه‌کلید، لینک «رفتن به محتوای اصلی» را انتخاب کنید. در محتوای اصلی، `←` مسیر را جلو و `→` عقب می‌برد؛ `PageDown`/`PageUp` حرکت بیشتری دارند و `Home`/`End` به ابتدا/انتها می‌روند. کنترل‌های تعاملی کلیدهای خود را حفظ می‌کنند.
- ناوبری بالا به ابتدای بخش انتخابی می‌رود. حرکت موس یا کشیدن، حرکت در حال اجرا را از موقعیت فعلی ادامه می‌دهد.
- حرکت خودکار پس از ۷ ثانیه بی‌تعامل بودن با سرعت ۱۶ پیکسل در ثانیه آغاز می‌شود. اشاره‌گر روی صفحه، فوکوس، لمس فعال یا تب مخفی آن را متوقف می‌کند. دکمهٔ «توقف حرکت» توقف ماندگار در همان بازدید را اعمال می‌کند. در انتهای مسیر بازگشت خودکار وجود ندارد.
- تنظیم `prefers-reduced-motion` حرکت خودکار و نرم‌سازی ورودی را خاموش می‌کند. جابه‌جایی دستی همچنان پیوسته است. در موبایل و نمایشگر عمودی، اسکرول عمودی بومی و نمایش همهٔ بخش‌ها حفظ می‌شود.
- تغییر اندازه در دسکتاپ موقعیت نسبی را نگه می‌دارد؛ تغییر بین دسکتاپ و موبایل بخش منتخب را نگه می‌دارد.

## نصب این به‌روزرسانی روی سایت موجود / Update an installed site

این تغییر فقط رابط عمومی را عوض می‌کند. فایل‌های PHP، API، ورود مدیر، دیتابیس و دانلودهای موجود نیاز به تغییر ندارند.

1. از `index.html` و پوشهٔ `assets` فعلی هاست یک نسخهٔ پشتیبان بگیرید.
2. ZIP به‌روزرسانی رابط را ابتدا در پوشهٔ موقت استخراج کنید.
3. فایل‌های جدید `assets` را در پوشهٔ `assets` ریشهٔ دامنه کپی کنید. فایل‌های قبلی را نگه دارید تا صفحات باز یا کش‌شده همچنان کار کنند.
4. سپس `index.html` جدید را جایگزین کنید و صفحه را با `Ctrl+F5` یا در پنجرهٔ خصوصی باز کنید.
5. فایل `MOTION.md` راهنمای این نسخه است و `LICENSE` و `NOTICE` مجوزها را توضیح می‌دهند.

Existing cPanel installation: upload the new assets first, then replace `index.html`. Keep older assets during the update so cached pages still work. Preserve the host's `.htaccess`, `admin/install-config.php`, installation lock, database and PDF files. The frontend ZIP contains no PHP files, credentials, installer or database migrations. Do not rerun installation for this update. No production deployment is performed by these scripts.

بازگشت: `index.html` و فایل‌های `assets` قبلی را از نسخهٔ پشتیبان برگردانید. تغییر یا بازگردانی دیتابیس لازم نیست.

Rollback: restore the previous built page and assets from backup. No database rollback is needed.

## ساخت و اجرای بررسی‌ها / Build and validation

```sh
npm ci
node scripts/check_continuous_helpers.mjs
node scripts/check_public_data.mjs
npm run build
npm run preview -- --port 4174 --strictPort
```

در ترمینال دیگری / In another terminal:

```sh
npx --yes --package @playwright/cli playwright-cli -s=hamed-continuous open http://127.0.0.1:4174/
npx --yes --package @playwright/cli playwright-cli -s=hamed-continuous run-code --filename scripts/check_continuous_browser.js
```

On Windows PowerShell use `npm.cmd` and `npx.cmd`. The browser checks mock the public settings response with an empty download list. They check continuous wheel input, intermediate rendering, physical active state, keyboard movement, navigation interruption, mouse drag, resize, bilingual direction, mobile restoration, reduced motion, pause/hover and automatic movement stopping at the end. Layout with download data is a separate review. These checks do not test backend or database behavior. Automated line/branch coverage is not measured.

```sh
python scripts/package_release.py output/hamedghz-continuous-update.zip --frontend-only
```

The packager uses a whitelist, rejects links/reparse points and refuses to overwrite an existing ZIP. Its existing full installation mode remains available; that mode preserves the four required `.htaccess` files and includes this motion guide.

## اثر تغییر / Impact and review

Changed: `src/useContinuousScenes.js`, `src/resume/App.jsx`, `src/styles.css`, `src/copy.js`, the release packager, two targeted check scripts, this guide and `README.md`. No dependency was added. The main risk is public interaction behavior on devices/browsers not covered by the checks. This is a medium-risk UI change; human review is required before production use or merging the draft PR.

The new controller uses no dynamic HTML, credential storage or new network endpoints. The existing API sanitizer and download URL rules remain in place. No PHP/authentication/CSRF/database code or schema changes are included.

## نتیجهٔ بررسی این نسخه / Results for this revision

On 2026-10-12 the production Vite build passed, all 11 continuous-scroll helper checks passed, all 11 existing public-data checks passed, and all 31 Chromium browser interaction checks passed. Browser API responses were mocked; this validation did not connect to the production database. Line/branch coverage was not measured. Firefox, Safari and physical touch devices were not exercised in this check.

The checks caught and fixed scroll pixel-rounding stalls, layout-switch event ordering, the mobile sticky-header overflow ancestor, and live changes to the system reduced-motion preference. Backend security review remains in `SECURITY_REVIEW.md`; the new motion code was reviewed for interaction/accessibility and introduces no credential or HTML injection path.

Suggested PR title: `fix(resume): make horizontal scene navigation continuous`

Suggested PR summary: Replace discrete wheel jumps and mandatory snapping with a shared, interruptible pixel-based scroll controller. Keep all seven scenes rendered, derive active navigation and the progress rail from physical scrolling, add mouse dragging, preserve RTL/LTR content and mobile fallback, and respect reduced motion and pause controls. Add targeted helper/browser checks and a frontend-only release mode. No backend migration or deployment; rollback by restoring previous built frontend files.

## منابع / References

[Motion values and transforms](https://motion.dev/docs/react-use-transform) · [RTL scrollLeft and fractional positions](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollLeft) · [WCAG interactive animation](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) · [WCAG pause, stop, hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)
