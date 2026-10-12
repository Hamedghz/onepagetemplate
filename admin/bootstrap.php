<?php
declare(strict_types=1);
ini_set('display_errors', '0');
ini_set('log_errors', '1');
define('TEMPLATE_BOOTSTRAP', true);
define('TEMPLATE_CONFIG', __DIR__ . '/install-config.php');
define('TEMPLATE_DL', dirname(__DIR__) . '/dl');
const TEMPLATE_MAX_PDF = 20 * 1024 * 1024;
const TEMPLATE_MAX_REQUEST = TEMPLATE_MAX_PDF + 1024 * 1024;
const TEMPLATE_MAX_DOWNLOADS = 200;

function template_installed(): bool { return is_file(__DIR__ . '/installed.lock') && is_file(TEMPLATE_CONFIG); }
function template_config(): array {
    if (!is_file(TEMPLATE_CONFIG)) return [];
    $config = require TEMPLATE_CONFIG;
    return is_array($config) ? $config : [];
}
function template_db(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;
    $c = template_config();
    if (!isset($c['host'], $c['name'], $c['user'], $c['password'])) throw new RuntimeException('Database unavailable');
    $dsn = 'mysql:host=' . $c['host'] . ';dbname=' . $c['name'] . ';charset=utf8mb4';
    $pdo = new PDO($dsn, $c['user'], $c['password'], [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES=>false]);
    return $pdo;
}
function template_secure_request(): bool { return isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== '' && strtolower((string)$_SERVER['HTTPS']) !== 'off'; }
function template_local_request(): bool {
    $host = strtolower((string)($_SERVER['HTTP_HOST'] ?? ''));
    return in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1'], true) && preg_match('/\A(?:localhost|127\.0\.0\.1)(?::\d+)?\z/', $host) === 1;
}
function template_setup_authorized(): bool {
    // REMOTE_USER is set by server-side authentication, never read from HTTP_* or Authorization headers.
    $user = $_SERVER['REMOTE_USER'] ?? null;
    return template_local_request() || (is_string($user) && trim($user) !== '');
}
function template_https(): void {
    if (!template_secure_request() && !template_local_request()) { http_response_code(400); exit('برای ورود مدیر، HTTPS را فعال کنید.'); }
}
function template_headers(): void {
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: same-origin');
    header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'; object-src 'none'");
}
function template_field(array $input, string $key): ?string { $v = $input[$key] ?? ''; return is_string($v) ? $v : null; }
function template_filename(string $name): bool { return preg_match('/\A[A-Za-z0-9][A-Za-z0-9._-]{0,119}\.pdf\z/i', $name) === 1; }
function template_contact_valid(string $key, mixed $value): bool {
    if (!is_string($value)) return false;
    if ($key === 'email') return strlen($value) <= 254 && ($value === '' || filter_var($value, FILTER_VALIDATE_EMAIL) !== false);
    if ($key === 'phone') return strlen($value) <= 32 && ($value === '' || preg_match('/\A\+?[0-9 ()-]{7,24}\z/', $value) === 1);
    if ($key !== 'instagram' || strlen($value) > 2048) return false;
    if ($value === '') return true;
    $parts = parse_url($value);
    return filter_var($value, FILTER_VALIDATE_URL) !== false && is_array($parts) && strtolower($parts['scheme'] ?? '') === 'https'
        && in_array(strtolower($parts['host'] ?? ''), ['instagram.com', 'www.instagram.com'], true)
        && !isset($parts['user']) && !isset($parts['pass']) && (!isset($parts['port']) || $parts['port'] === 443);
}
function template_session(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    $secure = template_secure_request();
    ini_set('session.use_strict_mode','1'); ini_set('session.use_only_cookies','1');
    session_name($secure ? '__Host-TemplateAdmin' : 'template_admin_dev');
    session_set_cookie_params(['lifetime'=>0,'path'=>'/','secure'=>$secure,'httponly'=>true,'samesite'=>'Strict']);
    session_start();
    if (($_SESSION['auth'] ?? false) === true && ((int)($_SESSION['last'] ?? 0) < time()-1800 || (int)($_SESSION['started'] ?? 0) < time()-43200)) { $_SESSION=[]; session_regenerate_id(true); }
    if (($_SESSION['auth'] ?? false) === true) $_SESSION['last']=time();
}
function template_csrf(): string { if (!isset($_SESSION['csrf']) || !is_string($_SESSION['csrf'])) $_SESSION['csrf']=bin2hex(random_bytes(32)); return $_SESSION['csrf']; }
function template_check_csrf(mixed $v): bool { return is_string($v) && isset($_SESSION['csrf']) && hash_equals((string)$_SESSION['csrf'],$v); }
function template_json(array $data, int $status=200): never { http_response_code($status); template_headers(); header('Content-Type: application/json; charset=utf-8'); echo json_encode($data,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT|JSON_INVALID_UTF8_SUBSTITUTE); exit; }
function template_require_admin(): void { if (!template_installed()) template_json(['ok'=>false,'message'=>'ابتدا نصب سایت را از مسیر /install.php کامل کنید.'],503); if (($_SESSION['auth']??false)!==true) template_json(['ok'=>false,'message'=>'ابتدا وارد پنل شوید.'],401); }
function template_defaults(): array { return ['email'=>'hello@example.com','phone'=>'+12025550123','instagram'=>'https://www.instagram.com/example/']; }
function template_public(): array {
    $contact=template_defaults(); $items=[];
    if (!template_installed()) return ['contact'=>$contact,'downloads'=>$items];
    try { $pdo=template_db(); foreach($pdo->query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('email','phone','instagram')")->fetchAll() as $r) if(array_key_exists($r['setting_key'],$contact) && template_contact_valid($r['setting_key'],$r['setting_value'])) $contact[$r['setting_key']]=$r['setting_value'];
        foreach($pdo->query('SELECT filename,title_fa,title_en FROM downloads ORDER BY id DESC LIMIT '.TEMPLATE_MAX_DOWNLOADS)->fetchAll() as $r) if(template_filename($r['filename']) && is_file(TEMPLATE_DL.'/'.$r['filename']) && !is_link(TEMPLATE_DL.'/'.$r['filename'])) $items[]=['file'=>$r['filename'],'titleFa'=>$r['title_fa'],'titleEn'=>$r['title_en']];
    } catch(Throwable) { }
    return ['contact'=>$contact,'downloads'=>$items];
}
