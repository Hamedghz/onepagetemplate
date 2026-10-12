# One Page Template

قالب نمونهٔ رزومهٔ دوزبانهٔ فارسی/انگلیسی با تم مشکی و طلایی، هفت بخش، حرکت افقی پیوسته در دسکتاپ و چیدمان عمودی موبایل.

A reusable bilingual Persian/English portfolio template with continuous RTL horizontal desktop scrolling, English LTR content, a mobile vertical layout, accessible motion controls, and a PHP/MySQL admin dashboard for contact settings and public PDF downloads.

All profile details, employers, projects, education and credentials are fictional sample content. Replace them before publishing. The neutral SVG logo is included under the software license.

## Quick start

Requirements: Node 20.19+ or 22.12+, PHP 8.1+ (PHP 8.5 supported), MySQL, `pdo_mysql`, `fileinfo`, `mbstring`, and Python 3.10+ for packaging.

```sh
npm ci
npm test
npm run dev -- --port 4173
```

For PHP functionality, run `php -S 127.0.0.1:4180 -t .` in another terminal. Before installation, the API returns sample contact defaults. The installer requires an empty MySQL database and uses the existing owner-verification and CSRF protections.

## Customize

- `src/copy.js`: edit both languages, sample projects, experience, education, credentials, default contacts, logo, monogram and reference links.
- `src/styles.css`: theme tokens and layout.
- `index.html`: page title and description.
- `admin/bootstrap.php`: match contact defaults for new installations.
- The dashboard edits contact settings and PDF downloads; profile text remains in the source file.

## Editable source and obfuscated release

```sh
npm run build:protected
python scripts/package_release.py output/template-install.zip --obfuscated
```

The standard `npm run build` produces the ordinary minified build. `build:protected` additionally obfuscates the public and admin JavaScript with `javascript-obfuscator`, rehashes the public bundle filename, and generates no source maps. Editable source remains public. Obfuscation increases reading difficulty; it is not encryption, secret storage, or a substitute for authentication. PHP is readable and reviewed; ionCube encoding requires a separately licensed Encoder and is not applied here.

The prepared [installation ZIP](releases/onepagetemplate-install.zip) contains the obfuscated executable JavaScript and the PHP installer/dashboard. Deploy this ZIP, not GitHub's source archive.

## Fresh cPanel installation

1. Create an empty MySQL database and dedicated user in cPanel and grant access. Enable HTTPS and the PHP extensions above.
2. Temporarily protect the document root with cPanel Directory Privacy and confirm it asks for credentials. The public installer requires server-authenticated `REMOTE_USER`; browser-supplied headers alone do not authorize setup.
3. Extract the installation ZIP outside the public folder first. Copy its built page, assets, PHP files and all four `.htaccess` files into the domain root. Preserve and merge cPanel-specific authentication rules.
4. Open `/install.php`, provide database connection details and a new admin account. The password must have at least 14 characters and at most 72 UTF-8 bytes.
5. After successful installation, remove the installer from the host and remove temporary Directory Privacy. Log in manually at `/admin/`.
6. Edit contact settings and upload trusted PDF files. `example.pdf` becomes `/dl/example.pdf`. Existing filenames are not overwritten. Downloads are public, limited to 20 MiB per file and 200 files.

Set `upload_max_filesize` to at least `20M`, `post_max_size` above the upload size, and grant PHP write access to `admin/` during setup and `dl/` for uploads. Node is not needed on cPanel. GitHub Pages supports only a frontend preview, not PHP, login, uploads or MySQL. The included Actions perform validation only and do not deploy automatically.

## Validation, migration and rollback

Run `npm test`, `npm run build:protected`, and the Chromium checks described in [MOTION.md](MOTION.md). See [TEMPLATE.md](TEMPLATE.md) for this template conversion and its validation limits, and [SECURITY_REVIEW.md](SECURITY_REVIEW.md) for the inherited backend review.

This is a fresh-install template, not an in-place update of a personal site's configuration. Internal helper names and the session cookie use a generic Template prefix. No database schema change, destructive SQL or automatic migration is introduced. Back up files and database before updates; preserve installed configuration, locks, PDFs and hosting rules. Roll back by restoring the previous frontend/backend files and configuration. The original repository history is retained; conversion cleans the current tree and release, not historical commits.

## License

Software and the neutral SVG logo: [MIT](LICENSE). Font: [Vazirmatn SIL OFL](public/assets/Vazirmatn-OFL.txt). Dependencies retain their own licenses; see [NOTICE](NOTICE).
