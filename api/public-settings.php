<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/admin/bootstrap.php';
if(($_SERVER['REQUEST_METHOD']??'GET')!=='GET'){header('Allow: GET');template_json(['ok'=>false,'message'=>'Method not allowed.'],405);}
template_json(template_public());
