<?php
// card_seo_proxy.php — Renderizador OG/Twitter para bots sociales.
// Solo se invoca vía .htaccess cuando el UA coincide con un scraper conocido.

declare(strict_types=1);

const SUPABASE_URL  = 'https://bfsttdiokdqyvwjuvcbp.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmc3R0ZGlva2RxeXZ3anV2Y2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzc1NDUsImV4cCI6MjA4Nzk1MzU0NX0.TqmEpfSlN25f9eZjw3ULIhJ0PiHAH3NuNCQEoESPD-w';
const CACHE_SECONDS = 300;

header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: public, max-age=' . CACHE_SECONDS);
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');

$slugRaw = $_GET['slug'] ?? '';
if (!is_string($slugRaw) || !preg_match('/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/', $slugRaw)) {
    http_response_code(404);
    echo '<!doctype html><title>404</title>';
    exit;
}
$slug = $slugRaw;

$endpoint = SUPABASE_URL . '/rest/v1/businesses'
    . '?slug=eq.' . rawurlencode($slug)
    . '&select=nombre_negocio,profession,description,foto_url,cover_url'
    . '&limit=1';

$ch = curl_init($endpoint);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 2,
    CURLOPT_TIMEOUT        => 3,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_SSL_VERIFYHOST => 2,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_HTTPHEADER     => [
        'apikey: ' . SUPABASE_ANON,
        'Authorization: Bearer ' . SUPABASE_ANON,
        'Accept: application/json',
    ],
]);
$body   = curl_exec($ch);
$status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
curl_close($ch);

$row = null;
if ($status === 200 && is_string($body)) {
    $decoded = json_decode($body, true);
    if (is_array($decoded) && isset($decoded[0]) && is_array($decoded[0])) {
        $row = $decoded[0];
    }
}

$name    = isset($row['nombre_negocio']) ? (string) $row['nombre_negocio'] : 'Suito | Tarjeta Digital';
$prof    = isset($row['profession'])     ? (string) $row['profession']     : '';
$descRaw = isset($row['description'])    ? (string) $row['description']
    : 'Tarjeta digital para emprendedores y profesionales. Compartí tu contacto al instante.';
$desc    = $prof !== '' ? $prof . ' — ' . $descRaw : $descRaw;
$img     = isset($row['cover_url']) && $row['cover_url']
    ? (string) $row['cover_url']
    : (isset($row['foto_url']) && $row['foto_url']
        ? (string) $row['foto_url']
        : 'https://suito.pro/assets/favicon.png');

$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host   = $_SERVER['HTTP_HOST'] ?? 'suito.pro';
$canon  = $scheme . '://' . $host . '/card/' . $slug;

$h = static fn(string $v): string => htmlspecialchars($v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
?><!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title><?= $h($name) ?> | Suito</title>
<meta name="description" content="<?= $h(mb_substr($desc, 0, 200)) ?>">
<link rel="canonical" href="<?= $h($canon) ?>">
<meta property="og:type" content="profile">
<meta property="og:site_name" content="Suito">
<meta property="og:url" content="<?= $h($canon) ?>">
<meta property="og:title" content="<?= $h($name) ?>">
<meta property="og:description" content="<?= $h(mb_substr($desc, 0, 200)) ?>">
<meta property="og:image" content="<?= $h($img) ?>">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="<?= $h($name) ?>">
<meta name="twitter:description" content="<?= $h(mb_substr($desc, 0, 200)) ?>">
<meta name="twitter:image" content="<?= $h($img) ?>">
</head>
<body>
<h1><?= $h($name) ?></h1>
<p><?= $h($desc) ?></p>
</body>
</html>
