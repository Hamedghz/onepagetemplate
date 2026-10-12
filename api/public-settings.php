<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/admin/bootstrap.php';
if(($_SERVER['REQUEST_METHOD']??'GET')!=='GET'){header('Allow: GET');hamed_json(['ok'=>false,'message'=>'Method not allowed.'],405);}
hamed_json(hamed_public());
