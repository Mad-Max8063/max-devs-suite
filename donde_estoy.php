<?php
echo "<h1>🔬 Suero de la Verdad Suito</h1>";
echo "<b>Ruta física (Abstolute Path):</b> " . __FILE__ . "<br>";
echo "<b>Directorios aquí (CWD):</b> " . getcwd() . "<br><br>";
echo "<b>Archivos en esta carpeta:</b><br>";
print_r(scandir('.'));
?>
