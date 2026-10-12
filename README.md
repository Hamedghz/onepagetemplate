# Hamed Ghasemzadeh | حامد قاسم‌زاده

IT Engineer · IT Consultant · Network · AI · DevOps

زمینهٔ کاری من فناوری اطلاعات، شبکه، نرم‌افزار و تحلیل داده است. این مخزن کد وب‌سایت رزومهٔ شخصی من را نگهداری می‌کند: رابط دوزبانهٔ فارسی/انگلیسی با تم مشکی و طلایی، معرفی سوابق و پروژه‌ها، پروانهٔ مشاورهٔ ICT رتبهٔ ۳، و داشبورد مدیریت اطلاعات تماس و دانلود PDF.

My work covers information technology, networks, software and data analytics. This repository contains my bilingual personal résumé website, with a black and gold design, professional experience, selected projects, my Grade 3 ICT consultancy qualification, and a PHP dashboard for contact settings and PDF downloads.

[وب‌سایت / Website](https://www.hamedghz.ir) · [GitHub](https://github.com/Hamedghz) · [OMERTAOS](https://github.com/Hamedghz/OMERTAOS) · [Instagram](https://www.instagram.com/ghasemzadeh.hamed/) · [Email](mailto:me@hamedghz.ir)

> This repository provides source code and installation tools. The linked domain is the intended website address; publishing this repository does not deploy or verify the live site.

## امکانات / Features

- در دسکتاپ افقی، بخش‌ها با چرخ موس، کشیدن صفحه، کلیدهای جهت و ناوبری سایت به‌صورت پیوسته از راست به چپ جابه‌جا می‌شوند؛ اسکرول عمودی و قفل شدن روی هر بخش وجود ندارد. در موبایل و نمایشگر عمودی، بخش‌ها زیر هم و قابل اسکرول هستند.
- نسخهٔ فارسی راست‌چین و با اعداد فارسی است؛ نسخهٔ انگلیسی چپ‌به‌راست و چپ‌چین است. جهت حرکت افقی بخش‌ها در هر دو زبان حفظ می‌شود.
- گرافیک انتزاعی، لوگوی خوشنویسی، بخش پروژه‌ها با تمرکز بر OMERTAOS و لینک مرجع پروانه در سازمان نصر.
- حرکت خودکار قابل توقف است و تنظیم کاهش حرکت سیستم‌عامل رعایت می‌شود. با قرار گرفتن اشاره‌گر یا فوکوس در صفحه، یا مخفی شدن تب، حرکت خودکار متوقف می‌شود.
- نصب‌کنندهٔ یک‌بارهٔ PHP، یک حساب مدیر، تنظیم اطلاعات تماس و انتشار PDF از مسیرهایی مانند `/dl/example.pdf`.

On landscape desktop, the site uses continuous horizontal scrolling with no snapping or page-level vertical scrolling. All seven sections remain rendered. Mobile and portrait layouts use a normal vertical page. Persian has RTL alignment and Persian digits; English uses LTR alignment. Automatic motion can be paused and respects reduced-motion preferences. See [MOTION.md](MOTION.md) for interaction, validation and frontend-only update instructions. The admin dashboard is reached manually at `/admin/`; no public login link is shown.

## ساختار و فناوری / Structure and stack

React and Motion for React power the frontend. Vite produces static HTML, CSS and JavaScript. PHP handles installation, authentication and APIs; MySQL stores admin, contact and download records. **Node.js is needed for development/building, not on cPanel.** No Docker or alternate database is required.

| Path | Purpose |
|---|---|
| [`src/resume/App.jsx`](src/resume/App.jsx) | Public page, scenes and navigation |
| [`src/useContinuousScenes.js`](src/useContinuousScenes.js) | Shared continuous scroll, active section and motion controls |
| [`src/copy.js`](src/copy.js) | Persian/English résumé content |
| [`src/styles.css`](src/styles.css) | Layout, theme and responsive styles |
| [`src/publicData.js`](src/publicData.js) | Validation of public API data in the frontend |
| [`public/assets/`](public/assets/) | Calligraphy logo, favicon and self-hosted font |
| [`admin/`](admin/) | Login, dashboard, sessions, settings and uploads |
| [`api/public-settings.php`](api/public-settings.php) | Public contact settings and download list |
| [`install.php`](install.php) | Initial MySQL and admin setup |
| [`dl/.htaccess`](dl/.htaccess) | Rules for serving PDF downloads |
| [`scripts/package_release.py`](scripts/package_release.py) | Builds a cPanel installation ZIP from a whitelist |
| [`SECURITY_REVIEW.md`](SECURITY_REVIEW.md) | Security review, findings and validation limits |

## اجرای محلی / Local development

نیازمندی‌ها: Node.js **20.19+ یا 22.12+**، PHP **8.1+** (هاست موردنظر PHP 8.5 دارد)، MySQL و افزونه‌های PHP `pdo_mysql`، `fileinfo` و `mbstring`. برای ساخت ZIP، Python 3.10+ نیز لازم است.

Requirements: Node.js **20.19+ or 22.12+**, PHP **8.1+**, MySQL, and the PHP extensions `pdo_mysql`, `fileinfo` and `mbstring`. Python 3.10+ is required for the release packager.

```sh
npm ci
npm run build
```

در یک ترمینال PHP و در ترمینال دیگری Vite را اجرا کنید. / Run PHP and Vite in separate terminals:

```sh
php -S 127.0.0.1:4180 -t .
```

```sh
npm run dev -- --port 4173
```

Open `http://127.0.0.1:4173/`. Vite proxies `/admin`, `/api`, `/dl` and `/install.php` to PHP at `127.0.0.1:4180`. Before installation, the public page uses safe default contact settings. Database-backed login, settings and uploads require MySQL and the PHP extensions above. Local installation is exempt from web-server authentication only when both the request address and host are genuine loopback values.

محتوای رزومه را در `src/copy.js` تغییر دهید؛ سوابق و متن معرفی از داشبورد ویرایش نمی‌شوند. پس از تغییر محتوا، دوباره build بگیرید. ایمیل پیش‌فرض `me@hamedghz.ir` و تلفن `09331960933` هستند.

Edit résumé content in `src/copy.js` and rebuild. The dashboard edits contact details and publishes PDFs; it does not edit experience, education or bilingual page copy.

## ساخت بسته / Build the installation package

```sh
npm run build
python scripts/package_release.py ../hamed-resume-site-install.zip
```

برای به‌روزرسانی فقط رابط روی سایت نصب‌شده / To update only the frontend of an installed site:

```sh
python scripts/package_release.py ../hamed-resume-site-frontend.zip --frontend-only
```

این ZIP فقط صفحهٔ ساخته‌شده، assets و راهنمای حرکت/مجوزها را دارد. ابتدا assets و سپس `index.html` را منتقل کنید؛ تنظیمات نصب، PHP، `.htaccess` هاست، دیتابیس و دانلودها را حفظ کنید. جزئیات و بازگشت در [MOTION.md](MOTION.md) آمده است.

نام ZIP باید تازه باشد؛ بسته‌ساز فایل موجود را بازنویسی نمی‌کند. بسته فقط فایل‌های لازم برای استقرار را انتخاب می‌کند و فایل‌های مخفی `.htaccess` را حفظ می‌کند. رمز دیتابیس، پیکربندی واقعی نصب، قفل‌ها، فایل‌های PDF موجود، دادهٔ زمان اجرا، `node_modules` و کد منبع در ZIP نصب منتشر نمی‌شوند. ZIP منبع GitHub را روی هاست استخراج نکنید.

Choose a new ZIP filename each time: the packager refuses to overwrite an existing archive. The installation ZIP contains built frontend assets and the required PHP/Apache files. It excludes installed credentials, runtime records, existing PDFs, dependencies and source files. **Deploy the installation package, not GitHub's source ZIP or the whole repository.**

## نصب تازه در cPanel / Fresh cPanel installation

1. در cPanel یک دیتابیس MySQL و کاربر اختصاصی بسازید و دسترسی کاربر را به همان دیتابیس بدهید. نام کامل دارای پیشوند حساب cPanel را وارد کنید. نصب باید روی دیتابیس خالی انجام شود.
2. SSL/HTTPS را برای دامنه فعال کنید.
3. پیش از باز کردن نصب‌کننده، document root را موقتاً با **Directory Privacy** و یک حساب خصوصی محافظت کنید. با پنجرهٔ خصوصی مرورگر بررسی کنید که نام کاربری/گذرواژه درخواست می‌شود. در هاست عمومی، نصب‌کننده فقط کاربر احراز‌شدهٔ وب‌سرور در `REMOTE_USER` را قبول می‌کند؛ `PHP_AUTH_USER`، `Authorization` یا `HTTP_REMOTE_USER` به‌تنهایی مجوز نصب نیستند.
4. ZIP نصب را ابتدا در پوشه‌ای غیرعمومی استخراج کنید. `index.html`، `install.php`، پوشه‌های `admin`، `api`، `assets` و `dl` و فایل‌های مستندات بسته را به ریشهٔ دامنه منتقل کنید. **قواعد احراز هویت `.htaccess` ساخته‌شده توسط cPanel را جایگزین نکنید**؛ قواعد ریشهٔ بسته را با حفظ آن‌ها ادغام کنید.
5. در File Manager نمایش فایل‌های مخفی را روشن کنید. `.htaccess` ریشه و نسخه‌های `admin/.htaccess`، `api/.htaccess` و `dl/.htaccess` باید منتقل شوند.
6. `https://دامنه-شما/install.php` را باز کنید. میزبان، نام، کاربر و گذرواژهٔ MySQL و نام کاربری و گذرواژهٔ مدیر را وارد کنید. گذرواژهٔ مدیر باید دست‌کم ۱۴ نویسه و حداکثر ۷۲ بایت UTF-8 باشد. اگر باوجود Directory Privacy نصب با خطای مالکیت متوقف شد، از پشتیبانی هاست بخواهید انتقال معتبر `REMOTE_USER` از Apache به PHP را تنظیم کند.
7. پس از نصب موفق، **`install.php` را از هاست حذف کنید** و حفاظت موقت Directory Privacy را بردارید. با وارد کردن دستی `https://دامنه-شما/admin/` وارد شوید؛ لینک عمومی ورود وجود ندارد.
8. اطلاعات تماس را تنظیم کنید و PDF را بارگذاری کنید. نام `example.pdf` نشانی `/dl/example.pdf` می‌سازد؛ فایل هم‌نام موجود بازنویسی نمی‌شود.

English installation steps:

1. Create an empty MySQL database and a dedicated user in cPanel, then grant that user access to the database. Use the full cPanel-prefixed database and username.
2. Enable HTTPS for the domain.
3. Temporarily protect the document root with **cPanel Directory Privacy** and a private account. Confirm in a private browser window that authentication is required. On a public host the installer requires the web server's authenticated `REMOTE_USER`; client headers or `PHP_AUTH_USER` alone do not authorize installation.
4. Extract the installation ZIP into a non-public directory first, then transfer its built page, PHP files, assets and documentation into the document root. **Preserve the authentication directives in cPanel's `.htaccess`** and merge the package's root rules into them.
5. Show hidden files and transfer all four `.htaccess` files: root, `admin/`, `api/` and `dl/`.
6. Open `/install.php` over HTTPS and enter MySQL settings and the new admin credentials. The password must contain at least 14 characters and no more than 72 UTF-8 bytes. If Directory Privacy authenticates correctly but installation reports an ownership error, ask the host to pass the authenticated Apache `REMOTE_USER` to PHP.
7. After successful installation, **remove `install.php` from the host**, then remove the temporary Directory Privacy protection. Sign in by typing `/admin/` manually.
8. Edit contact settings and upload trusted PDF documents. Uploaded `example.pdf` is available at `/dl/example.pdf`; existing files are not overwritten.

PHP needs write access to `admin/` during initial setup and to `dl/` for uploads. Enable `pdo_mysql`, `fileinfo` and `mbstring`. Configure `upload_max_filesize` to at least `20M` and `post_max_size` above the upload size. The application accepts PDFs up to 20 MiB and 200 published files. **Published PDFs are public downloads.**

See [cPanel Directory Privacy documentation](https://docs.cpanel.net/cpanel/files/directory-privacy/) and the deployment requirements in [SECURITY_REVIEW.md](SECURITY_REVIEW.md). PHP's built-in development server does not apply `.htaccess`; test those rules on Apache/cPanel.

## ارتقا و بازگشت / Upgrade and rollback

پیش از جایگزینی فایل‌های هاست، از فایل‌ها و دیتابیس پشتیبان بگیرید. در نصب موجود، `admin/install-config.php`، `admin/installed.lock` و PDFهای `dl/` را حفظ کنید و نصب‌کننده را دوباره اجرا نکنید. قواعد `.htaccess` اختصاصی هاست را حفظ و ادغام کنید. این نسخه تغییر schema لازم ندارد. نصب تازه فقط جدول‌های `admin_users`، `settings`، `downloads` و `login_attempts` را با `CREATE TABLE IF NOT EXISTS` می‌سازد؛ عملیات `DROP` یا `TRUNCATE` ندارد و مدیر موجود را بازنویسی نمی‌کند.

Back up website files and MySQL before updating. Preserve `admin/install-config.php`, `admin/installed.lock`, uploaded PDFs and host-specific `.htaccess` directives. Do not rerun the installer for an existing installation. This version has no schema upgrade; fresh installation creates `admin_users`, `settings`, `downloads` and `login_attempts` without destructive SQL. Roll back by restoring the previous files from backup while keeping the configuration, database and downloads. No automatic deployment or cleanup script is provided.

The generated `admin/install-config.php` contains database credentials. It is excluded from version control and installation packages and must never be committed or copied into public assets. If setup fails after creating tables, it leaves the database intact; correct file permissions with the hosting provider before retrying.

## بررسی و محدودیت‌ها / Validation and limits

گزارش بررسی قبلی در [SECURITY_REVIEW.md](SECURITY_REVIEW.md) ثبت شده است: ساخت Vite، بررسی نحو ۵ فایل PHP، بررسی JavaScript مدیر، ۲۳ آزمون helper، ۹ بررسی endpoint، ۷ آزمون مجوز نصب و ۱۱ آزمون اعتبارسنجی دادهٔ عمومی موفق گزارش شده‌اند. چیدمان هفت بخش فارسی/انگلیسی در دسکتاپ و موبایل و صفحه‌بندی دانلودها با API شبیه‌سازی‌شده بررسی شده‌اند. این موارد شواهد همان بررسی هستند؛ به معنی آزمون دیتابیس واقعی یا تأیید امنیت هاست نیستند.

The existing [security review](SECURITY_REVIEW.md) records successful Vite builds, syntax checks for five PHP files and the admin JavaScript, 23 helper checks, nine endpoint checks, seven installer-authorization checks, and 11 public-data validation checks. It also records desktop/mobile review and download pagination using mocked API data. These are recorded results from that review, not a claim of full deployment verification.

The public-data checks can be rerun with:

```sh
node scripts/check_public_data.mjs
```

The reviewed local PHP CLI was 8.5.8 with no PDO drivers and with `fileinfo`/`mbstring` unavailable. MySQL-backed installation, successful login, persistence, upload transactions and concurrent database requests were **not fully tested locally**. Apache rules were reviewed in code but were not exercised by an Apache server. Automated line/branch coverage was not measured. Test fresh installation, authentication/CSRF, duplicate and invalid upload rejection, direct configuration-file denial and PDF response headers on cPanel before public use.

## مجوز / License and assets

The software code is licensed under the [MIT License](LICENSE). The supplied personal branding, calligraphy logo and résumé content are excluded from that software grant; see [NOTICE](NOTICE). The bundled Vazirmatn font retains its authors' copyright and [SIL Open Font License 1.1](public/assets/Vazirmatn-OFL.txt). Dependency licenses also continue to apply.

کد نرم‌افزار با مجوز MIT منتشر می‌شود. نام و نشان شخصی، لوگوی خوشنویسی و محتوای رزومه مشمول مجوز عمومی کد نیستند؛ حقوق هر اثر نزد صاحب آن باقی می‌ماند و این مخزن مالکیت یا حق واگذاری آثار اشخاص دیگر را تأیید نمی‌کند. جزئیات در [NOTICE](NOTICE) آمده است.

## منابع / References

[Vite static deployment](https://vite.dev/guide/static-deploy.html) · [Motion for React](https://motion.dev/docs/react-installation) · [WCAG pause, stop, hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) · [WCAG animation from interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions)
