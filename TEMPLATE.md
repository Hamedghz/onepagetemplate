# Template conversion and release review

## Scope

The current public tree is a reusable sample template. Real profile details,
employers, projects, education, credential issuer/reference and contact values
have been replaced by clearly marked examples. The personal calligraphy image
has been replaced by an original neutral SVG. Metadata, backend defaults, admin
branding, cookie/helper prefixes and installation documentation are generic.
The specified repository owner remains part of the GitHub repository URL.

Editable source remains public. The installation ZIP contains obfuscated public
and admin JavaScript, with no source maps. PHP remains readable: ionCube Loader
does not encode files, and a licensed Encoder was not supplied. The additional
build-only dependency `javascript-obfuscator` is used by the protected build.
Obfuscation is not encryption and cannot hide secrets in browser code.

## Impact

Affected files: bilingual content, public page, HTML metadata, SVG assets,
PHP helper references/defaults/branding, packaging and build/check scripts,
package metadata/lockfile, README, NOTICE, LICENSE, motion guide and CI workflows.
No database objects or API field names changed. No data is removed from the
original personal site. Existing database/auth/CSRF/upload rules are preserved.
The cookie/helper rename is for fresh installations; existing personal site
configuration must not be copied into this sample release.

The Pages workflows now validate source/build without publishing the repository.
Current source/release anonymization does not rewrite historical commits or tags.
An explicit separate history-cleanup operation is needed if old versions must
also become inaccessible; remote caches/forks may retain old material.

## Validation

Run `npm test`, PHP syntax checks, `npm run build:protected`, the Chromium motion
checks in `MOTION.md`, then package with `--obfuscated`. Verify ZIP CRC, the four
`.htaccess` files, build manifest hashes, and absence of personal/runtime files.
Database-backed installation and successful login/upload persistence still need
MySQL and the required PHP extensions; they are not proven by static checks.
Line/branch coverage is not measured. See the inherited `SECURITY_REVIEW.md` for
the backend review and its limits.

## Risk, migration and rollback

Risk is medium: generic internal naming, build obfuscation and sample conversion
need human review. No new public endpoint or destructive SQL is introduced.
Do not treat an obfuscated bundle as a security control or place credentials in
it. This is a fresh-install release, with no database migration. Revert the
conversion commit for source rollback; restore backed-up files/configuration
for a deployed installation. No deployment or automatic merge is performed.

## Suggested change summary

`feat(template): anonymize portfolio and add obfuscated release`

Replace profile and branding with bilingual examples, centralize reference links,
rename private internal prefixes consistently, provide a neutral SVG logo,
preserve motion/admin/download features, and ship editable source plus a verified
obfuscated JavaScript installation archive. Update docs and validation-only CI.

Verified 2026-10-12: 17 sample-content checks, 11 API-boundary checks, 11 continuous-scroll helper checks, PHP syntax for five files, protected Vite build and 31 Chromium motion checks passed. Dependency audit reported zero advisories. Browser settings were mocked for motion checks; database-backed login/installation/upload persistence was not tested.
