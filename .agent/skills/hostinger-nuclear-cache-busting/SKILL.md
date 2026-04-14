# Hostinger Nuclear Cache Busting Protocol (HCDN Force Invalidation)

Este protocolo es la solución definitiva para cuando Hostinger (y su HCDN) se niegan a servir el código nuevo, incluso después de limpiar el caché desde el panel. Se basa en la **invalidación por cambio de nombre estructural**, haciendo que sea imposible para el servidor servir una versión vieja.

## Cuándo usar esta Skill
- Despliegas cambios pero el sitio sigue mostrando el código viejo.
- Recibes errores 404 en archivos JS/CSS (`assets/index-XXXX.js`).
- El subdominio (`admin.suito.pro`) muestra una versión distinta a la ruta principal (`suito.pro/admin`).

## Estrategia Técnica (Los 4 Pilares)

### 1. Versionado de Archivos de Entrada (HTML)
No confíes en `index.html`. Cambia el nombre del archivo de entrada en cada versión crítica.
- **Ejemplo**: `index.html` → `home-v2028.html`
- **Ejemplo**: `admin/dashboard.html` → `admin/dashboard-v2028.html`

### 2. Configuración de Vite (Hash Forzado)
Fuerza a Vite a generar nombres de archivos que no puedan estar cacheados.
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Añade un sufijo de versión global a TODOS los assets
        entryFileNames: `assets/[name]-[hash]-v2028.js`,
        chunkFileNames: `assets/[name]-[hash]-v2028.js`,
        assetFileNames: `assets/[name]-[hash]-v2028.[ext]`
      }
    }
  }
})
```

### 3. Enrutamiento Blindado (.htaccess)
Usa el `.htaccess` para redirigir las rutas amigables a los archivos versionados. Esto engaña al CDN.
```apache
# Root .htaccess
RewriteRule ^admin/?$ admin/dashboard-v2028.html [L]
RewriteRule ^$ home-v2028.html [L]

# Carpeta Específica (Admin .htaccess)
# Es vital si el subdominio apunta directamente a esta carpeta
DirectoryIndex dashboard-v2028.html
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{REQUEST_URI} ^/$
    RewriteRule ^$ dashboard-v2028.html [L]
</IfModule>
```

### 4. Limpieza de Estado de Despliegue (GitHub Actions)
Cambia el `state-name` en la acción de FTP para forzar una sincronización total de archivos, ignorando lo que ya estaba arriba.
```yaml
- name: 📂 Sync files
  uses: SamKirkland/FTP-Deploy-Action@v4.3.5
  with:
    # Cambia este nombre para resetear el historial de subida
    state-name: .ftp-deploy-sync-state-v2028-NUCLEAR.json
```

## Resumen del Flujo de Trabajo
1. Elige una versión (ej: `v2028`).
2. Renombra los HTML fuentes.
3. Actualiza `vite.config.ts` con el nuevo hash.
4. Actualiza `.htaccess` con las nuevas rutas.
5. Sube los cambios y espera 2-3 minutos.
