# Diego Hub — proxy de servidores

GitHub Pages solo sirve archivos estáticos. El navegador no puede saltarse CORS de Roblox, así que el buscador necesita un intermediario pequeño. Este Worker está limitado a **un único juego** y a **una única ruta**; no es un proxy abierto.

## Desplegar (una sola vez)

1. Abre https://dash.cloudflare.com/ y entra en **Workers & Pages**.
2. Crea un Worker nuevo (puedes llamarlo `diego-hub-servers`).
3. En el editor del Worker, reemplaza el ejemplo por el contenido completo de `worker/roblox-servers-proxy.js`.
4. Pulsa **Deploy** y copia la URL `https://....workers.dev`.
5. Abre Diego Hub → **Servidores**. Pega esa URL en **Conexión segura** y pulsa **Guardar URL**.

El panel agregará `/servers` automáticamente. No agregues cookies, claves ni tokens.

## Seguridad y límites

- Solo acepta solicitudes desde `https://diegoelcraccapo09-sys.github.io`.
- Solo consulta el endpoint público de servidores de Steal An Egg (Place ID fijado en el código).
- Solo permite GET y OPTIONS; no acepta destinos arbitrarios ni rutas de otros sitios.
- No inicia sesión, no toca cuentas, no se une automáticamente a partidas y no automatiza Roblox.
- Roblox puede responder 429/403 o cambiar su API; el proxy no puede evitar esos límites.
- El plan gratuito de Cloudflare Workers suele alcanzar para un uso personal moderado, pero revisa sus límites vigentes.

Si se usa un dominio personalizado para GitHub Pages, cambia `ALLOWED_ORIGIN` en el Worker para que coincida exactamente con el origen de ese dominio.
