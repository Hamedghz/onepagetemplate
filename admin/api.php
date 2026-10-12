<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';
hamed_https(); hamed_session();
hamed_headers();
if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > HAMED_MAX_REQUEST) hamed_json(['ok'=>false,'message'=>'حجم درخواست بیش از حد مجاز است.'],413);
$method=$_SERVER['REQUEST_METHOD']??'GET'; $action=is_string($_GET['action']??null)?$_GET['action']:(is_string($_POST['action']??null)?$_POST['action']:'');
if($method==='GET' && $action==='state') { hamed_require_admin(); try {hamed_db(); $public=hamed_public(); hamed_json(['ok'=>true,'csrf_token'=>hamed_csrf(),'settings'=>$public['contact'],'downloads'=>$public['downloads']]);}catch(Throwable){hamed_json(['ok'=>false,'message'=>'ذخیره‌سازی پنل در دسترس نیست.'],503);} }
if($method!=='POST'){header('Allow: GET, POST');hamed_json(['ok'=>false,'message'=>'درخواست پشتیبانی نمی‌شود.'],405);}
if(!hamed_check_csrf($_POST['csrf_token']??null)) hamed_json(['ok'=>false,'message'=>'نشست فرم منقضی شده؛ صفحه را تازه‌سازی کنید.'],419);
if($action==='login') {
 if(!hamed_installed()) hamed_json(['ok'=>false,'message'=>'نصب سایت کامل نشده است.'],503);
 try {$pdo=hamed_db(); $ip=hash('sha256',(string)($_SERVER['REMOTE_ADDR']??'unknown')); $now=time();
  $pdo->beginTransaction();$pdo->prepare('INSERT IGNORE INTO login_attempts(ip_hash,attempts,window_start,blocked_until) VALUES(?,0,?,0)')->execute([$ip,$now]);
  $q=$pdo->prepare('SELECT attempts,window_start,blocked_until FROM login_attempts WHERE ip_hash=? FOR UPDATE');$q->execute([$ip]);$rate=$q->fetch();
  if((int)$rate['blocked_until']>$now){$pdo->commit();header('Retry-After: '.((int)$rate['blocked_until']-$now));hamed_json(['ok'=>false,'message'=>'تلاش‌های ورود زیاد بوده؛ ۱۵ دقیقه دیگر دوباره امتحان کنید.'],429);}
  $expired=(int)$rate['window_start']<$now-900;$n=($expired?0:(int)$rate['attempts'])+1;$blocked=$n>=8?$now+900:0;
  $pdo->prepare('UPDATE login_attempts SET attempts=?,window_start=?,blocked_until=? WHERE ip_hash=?')->execute([$n,$expired?$now:(int)$rate['window_start'],$blocked,$ip]);$pdo->commit();
  $q=$pdo->query('SELECT id,username,password_hash FROM admin_users ORDER BY id LIMIT 1')->fetch();$pass=hamed_field($_POST,'password');$username=hamed_field($_POST,'username');$username=$username===null?null:trim($username);
  $valid=$q && is_string($pass) && strlen($pass)<=1024 && $username!==null && strlen($username)<=64;
  $passwordOk=$valid && password_verify($pass,$q['password_hash']);
  if(!$passwordOk || !hash_equals($q['username'],$username)) {usleep(random_int(180000,350000));hamed_json(['ok'=>false,'message'=>'نام کاربری یا گذرواژه درست نیست.'],401);}
  $pdo->prepare('UPDATE login_attempts SET attempts=0,window_start=?,blocked_until=0 WHERE ip_hash=?')->execute([$now,$ip]);session_regenerate_id(true);$_SESSION=['auth'=>true,'username'=>$q['username'],'started'=>$now,'last'=>$now,'csrf'=>bin2hex(random_bytes(32))];hamed_json(['ok'=>true,'message'=>'وارد شدید.']);
 } catch(Throwable){if(isset($pdo)&&$pdo->inTransaction())$pdo->rollBack();hamed_json(['ok'=>false,'message'=>'ورود انجام نشد؛ تنظیمات دیتابیس را بررسی کنید.'],503);}
}
hamed_require_admin();
if($action==='logout'){$_SESSION=[];$p=session_get_cookie_params();setcookie(session_name(),'',['expires'=>time()-3600,'path'=>$p['path'],'secure'=>$p['secure'],'httponly'=>true,'samesite'=>'Strict']);session_destroy();hamed_json(['ok'=>true]);}
if($action==='save_settings'){
 $vals=[];foreach(['email','phone','instagram'] as $key){$value=hamed_field($_POST,$key);$value=$value===null?null:trim($value);if(!hamed_contact_valid($key,$value))hamed_json(['ok'=>false,'message'=>'اطلاعات تماس معتبر نیست؛ پیوند اینستاگرام باید HTTPS و از دامنهٔ Instagram باشد.'],422);$vals[$key]=$value;}
 try{$pdo=hamed_db();$pdo->beginTransaction();$q=$pdo->prepare('INSERT INTO settings(setting_key,setting_value) VALUES(?,?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)');foreach($vals as $k=>$v)$q->execute([$k,$v]);$pdo->commit();hamed_json(['ok'=>true,'message'=>'تنظیمات ذخیره شد.']);}catch(Throwable){if(isset($pdo)&&$pdo->inTransaction())$pdo->rollBack();hamed_json(['ok'=>false,'message'=>'ذخیره تنظیمات انجام نشد.'],500);}
}
if($action==='upload_download'){
 $fa=hamed_field($_POST,'title_fa');$en=hamed_field($_POST,'title_en');$f=$_FILES['download_file']??null;
 if(!is_string($fa)||!is_string($en)) hamed_json(['ok'=>false,'message'=>'عنوان‌ها معتبر نیستند.'],422);
 if(!extension_loaded('mbstring')) hamed_json(['ok'=>false,'message'=>'افزونهٔ mbstring فعال نیست.'],503);
 $fa=trim($fa);$en=trim($en);
 if($fa===''||$en===''||!mb_check_encoding($fa,'UTF-8')||!mb_check_encoding($en,'UTF-8')||mb_strlen($fa,'UTF-8')>120||mb_strlen($en,'UTF-8')>120) hamed_json(['ok'=>false,'message'=>'عنوان فارسی و انگلیسی را وارد کنید.'],422);
 if(!is_array($f)||($f['error']??UPLOAD_ERR_NO_FILE)!==UPLOAD_ERR_OK||!is_string($f['tmp_name']??null)||!is_string($f['name']??null)||!is_int($f['size']??null)||!is_uploaded_file($f['tmp_name'])) hamed_json(['ok'=>false,'message'=>'بارگذاری فایل کامل نشد.'],422);
 $name=(string)$f['name'];$tmp=(string)$f['tmp_name'];$size=(int)$f['size'];
 if(!hamed_filename($name)||$size<8||$size>HAMED_MAX_PDF||filesize($tmp)!==$size) hamed_json(['ok'=>false,'message'=>'فقط فایل PDF با نام انگلیسی و حداکثر ۲۰ مگابایت پذیرفته می‌شود.'],422);
 if(!class_exists('finfo')) hamed_json(['ok'=>false,'message'=>'افزونهٔ fileinfo روی PHP فعال نیست.'],503);
 $fi=new finfo(FILEINFO_MIME_TYPE);$h=@fopen($tmp,'rb');$sig=is_resource($h)?fread($h,5):'';if(is_resource($h))fclose($h);
 if(!in_array($fi->file($tmp),['application/pdf','application/x-pdf'],true)||$sig!=='%PDF-') hamed_json(['ok'=>false,'message'=>'محتوای فایل PDF معتبر نیست.'],422);
 if(!is_dir(HAMED_DL)||is_link(HAMED_DL)||!is_writable(HAMED_DL)) hamed_json(['ok'=>false,'message'=>'PHP اجازهٔ نوشتن در پوشهٔ dl را ندارد.'],500);
 $guard=@fopen(__DIR__.'/upload.lock','c');if(!is_resource($guard)||!flock($guard,LOCK_EX))hamed_json(['ok'=>false,'message'=>'قفل بارگذاری در دسترس نیست.'],503);
 $dest=HAMED_DL.'/'.$name;$created=false;
 try{$pdo=hamed_db();if((int)$pdo->query('SELECT COUNT(*) FROM downloads')->fetchColumn()>=HAMED_MAX_DOWNLOADS)hamed_json(['ok'=>false,'message'=>'سقف ۲۰۰ فایل منتشرشده تکمیل شده است.'],422);
  if(file_exists($dest)||is_link($dest))hamed_json(['ok'=>false,'message'=>'این نام قبلاً استفاده شده است. نام دیگری انتخاب کنید.'],409);
  $pdo->beginTransaction();$q=$pdo->prepare('INSERT INTO downloads(filename,title_fa,title_en,size_bytes) VALUES(?,?,?,?)');$q->execute([$name,$fa,$en,$size]);
  // Exclusive creation avoids replacing an existing file even if another process writes the same path.
  $out=@fopen($dest,'x+b');if(!is_resource($out))throw new RuntimeException('Exclusive file creation failed');$created=true;
  $in=@fopen($tmp,'rb');try{if(!is_resource($in)||stream_copy_to_stream($in,$out,HAMED_MAX_PDF+1)!==$size||!fflush($out))throw new RuntimeException('File copy failed');}finally{if(is_resource($in))fclose($in);fclose($out);}
  chmod($dest,0644);$pdo->commit();flock($guard,LOCK_UN);fclose($guard);hamed_json(['ok'=>true,'message'=>'فایل منتشر شد.','url'=>'/dl/'.rawurlencode($name)]);
 }catch(Throwable $e){if(isset($pdo)&&$pdo->inTransaction())$pdo->rollBack();if($created)@unlink($dest);flock($guard,LOCK_UN);fclose($guard);hamed_json(['ok'=>false,'message'=>$e instanceof PDOException && $e->getCode()==='23000'?'نام فایل تکراری است.':'بارگذاری انجام نشد.'],500);}
}
hamed_json(['ok'=>false,'message'=>'عملیات شناخته‌شده نیست.'],400);
