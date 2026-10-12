from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile
import re
import sys
import json
import hashlib

site = Path(__file__).resolve().parents[1]
dist = site / "dist"
frontend_only = "--frontend-only" in sys.argv[1:]
obfuscated = "--obfuscated" in sys.argv[1:]
arguments = [argument for argument in sys.argv[1:] if argument not in ("--frontend-only", "--obfuscated")]
if len(arguments) > 1 or any(argument.startswith("--") for argument in arguments):
    raise SystemExit("Usage: package_release.py [output.zip] [--frontend-only] [--obfuscated]")
out = Path(arguments[0]).expanduser().resolve() if arguments else site.parent / ("onepagetemplate-frontend.zip" if frontend_only else "onepagetemplate-install.zip")
if not dist.is_dir():
    raise SystemExit("Build dist first with npm run build")
if out.exists():
    raise SystemExit(f"Refusing to overwrite existing release: {out}")

required = [
    site / ".htaccess", site / "install.php", site / "README.md", site / "SECURITY_REVIEW.md", site / "MOTION.md", site / "TEMPLATE.md", site / "LICENSE", site / "NOTICE",
    site / "admin" / ".htaccess", site / "admin" / "index.php",
    site / "admin" / "api.php", site / "admin" / "bootstrap.php",
    site / "admin" / "admin.css", site / "admin" / "admin.js",
    site / "api" / ".htaccess", site / "api" / "public-settings.php",
    site / "dl" / ".htaccess",
]
if frontend_only:
    required = [site / "MOTION.md", site / "LICENSE", site / "NOTICE"]
elif obfuscated:
    required = [site / ".protected" / "admin.js" if path == site / "admin" / "admin.js" else path for path in required]
missing = [str(p) for p in required if not p.is_file()]
if missing:
    raise SystemExit("Missing release files: " + ", ".join(missing))

static_assets = {
    "assets/favicon.svg", "assets/template-logo.svg",
    "assets/Vazirmatn-OFL.txt", "assets/vazirmatn.woff2",
}
generated_asset = re.compile(r"assets/index-[A-Za-z0-9_-]+\.(?:js|css)\Z")


def require_local_file(path):
    """Reject links/junctions before a release can include files outside the source."""
    if not path.resolve().is_relative_to(site):
        raise SystemExit("Release input is outside the site: " + str(path))
    current = path
    while current != site:
        if current.is_symlink() or getattr(current.lstat(), "st_file_attributes", 0) & 0x400:
            raise SystemExit("Release input is a link or reparse point: " + str(path))
        current = current.parent


require_local_file(dist)
build_files = []
build_names = set()
for p in sorted(dist.rglob("*")):
    require_local_file(p)
    if not p.is_file():
        continue
    arc = p.relative_to(dist).as_posix()
    if arc != "index.html" and arc not in static_assets and not generated_asset.fullmatch(arc):
        raise SystemExit("Unexpected build file; review before publishing: " + arc)
    build_files.append((p, arc))
    build_names.add(arc)
build_needed = {"index.html", *static_assets}
if not build_needed.issubset(build_names):
    raise SystemExit("Build is missing required files: " + ", ".join(sorted(build_needed - build_names)))
if not any(n.endswith(".js") for n in build_names) or not any(n.endswith(".css") for n in build_names):
    raise SystemExit("Build must include the generated JavaScript and CSS assets")
for p in required:
    require_local_file(p)
if obfuscated:
    manifest_path = site / ".protected" / "manifest.json"
    require_local_file(manifest_path)
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    protected_files = [(path, name) for path, name in build_files if name.endswith(".js")]
    if not frontend_only:
        protected_files.append((site / ".protected" / "admin.js", "admin/admin.js"))
    for path, name in protected_files:
        if manifest.get(name) != hashlib.sha256(path.read_bytes()).hexdigest():
            raise SystemExit("Obfuscated build manifest mismatch: " + name)

out.parent.mkdir(parents=True, exist_ok=True)
with ZipFile(out, "x", ZIP_DEFLATED, compresslevel=8) as zf:
    for p, arc in build_files:
        zf.write(p, arc)
    for p in required:
        if p == site / ".protected" / "admin.js":
            arc = "admin/admin.js"
        elif p == site / "README.md":
            arc = "README.md"
        else:
            arc = p.relative_to(site).as_posix()
        zf.write(p, arc)

with ZipFile(out) as zf:
    names = set(zf.namelist())
    needed = {"index.html", "MOTION.md", "LICENSE", "NOTICE"} if frontend_only else {"index.html", "README.md", "SECURITY_REVIEW.md", "MOTION.md", "TEMPLATE.md", "LICENSE", "NOTICE", ".htaccess", "install.php", "admin/.htaccess", "api/.htaccess", "dl/.htaccess", "admin/index.php", "admin/api.php", "admin/bootstrap.php", "api/public-settings.php"}
    if not needed.issubset(names):
        raise SystemExit("Release is missing required files: " + ", ".join(sorted(needed - names)))
    forbidden = [n for n in names if n.endswith(("config.php", ".json", ".lock")) or n.lower().endswith(".pdf") or "node_modules/" in n or n.startswith(("src/", "admin/storage/"))]
    if forbidden:
        raise SystemExit("Unexpected sensitive/runtime files: " + ", ".join(sorted(forbidden)))
    if frontend_only and any(name not in build_names | needed for name in names):
        raise SystemExit("Frontend update contains a file outside its whitelist")
    bad = zf.testzip()
    if bad:
        raise SystemExit("Archive CRC failed: " + bad)
print(f"Created {out} ({out.stat().st_size} bytes, {len(names)} files)")
