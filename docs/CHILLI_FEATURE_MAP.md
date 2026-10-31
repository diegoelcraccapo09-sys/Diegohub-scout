# Diego Hub — análisis de Chilli Hub y mapa de funciones

Fecha de revisión: 31 de octubre de 2026.

## Qué se observa públicamente

La web oficial de Chilli Hub anuncia Auto Steal en todas las zonas y eventos, Instant Steal V2/V3, Chilli Finder para huevos grandes, Halloween / The Hollow, herramientas de Admin Abuse y compatibilidad móvil/PC. También describe un feed de huevos entre servidores con incorporación a la partida desde el juego.

Los recorridos de interfaz publicados por terceros muestran más detalle: pestañas Farm, Player, Predictor, Progress, Server, Misc y Auto Hop; filtros por rareza, valor y zona; objetivos específicos; Auto Hatch/Equip, Auto Sell, Auto Fuse, Auto Favorite; predictores de huevos/laboratorio/fusión; progresión de base, trail y cinta; y herramientas de movimiento/anti-guard. Son descripciones de vídeos/listados comunitarios, no una auditoría independiente del código ni garantía de que cada función siga activa.

## Matriz de equivalencias

| Familia anunciada | Qué parece hacer | Enfoque de Diego Hub |
|---|---|---|
| Auto Steal / Instant Steal V2/V3 | Automatiza desplazamiento y robo dentro de la partida | No se implementan exploits ni acciones que alteren el cliente/servidor. Se ofrece Finder, cola manual de objetivos, filtros y acceso a servidores públicos |
| Target Areas / Min Rarity / Min Value | Filtra qué objetivos priorizar | Catálogo, filtros de huevos, favoritos, comparador y bitácora |
| Chilli Finder | Feed de hallazgos grandes entre servidores | Finder comunitario basado en reportes y fuentes autorizadas. No se presenta como feed global en vivo hasta disponer de backend y fuente de datos real |
| Halloween / The Hollow | Opciones específicas de eventos | Checklist personal por evento, registro de hallazgos y enlaces a anuncios; no inventa estado ni recompensas |
| Admin Abuse tools | Atajos asociados a eventos o poderes de administrador | Seguimiento de anuncios públicos y preparación del jugador. Nunca abusar de permisos ni interferir con otros jugadores |
| Player | Movimiento y utilidades del personaje | Perfil manual, historial de estadísticas y cálculos; sin speed hacks, invisibilidad, anti-ragdoll ni teleport |
| Predictor | Vista previa de huevos/lab/fusión | Calculadoras probabilísticas y catálogo de resultados verificados. No prometer predicciones sin datos fiables |
| Progress / Auto Farm | Automatiza upgrades, claims y gestión de economía | Planificador, temporizador de sesión, proyección de ingresos y registro de progreso |
| Server / Auto Hop | Buscar servidores y cambiar de instancia | Buscador de servidores públicos y unión manual por Job ID; sin salto automático masivo |
| Mobile / PC | Interfaz adaptable | Diseño responsive y controles táctiles; la compatibilidad real se valida en dispositivos, no se presume |

## Cambios añadidos en v3.4 y v3.5

- v3.4 añadió perfil manual, historial de progreso y checklist personal de Halloween / The Hollow.
- v3.5 corrige un campo que no corresponde al juego: no se registra ningún rebirth.
- El perfil registra Speed, dinero, ingreso de mascotas por segundo, base, cinta y trail.
- El historial muestra el ingreso estimado y la diferencia de Speed entre registros.
- Las copias JSON incluyen ahora el perfil y el historial del jugador; la importación elimina el campo antiguo `rebirths` si aparece en una copia anterior.
- El Finder local permite registrar zona/evento y peso del huevo, ordenar por mayor peso y validar el Job ID antes de ofrecer la unión manual.
- Los hallazgos siguen siendo privados del dispositivo: esto no crea un feed compartido ni un radar global.

## Límites y seguridad

- No ejecutar loaders desconocidos ni pedir contraseñas, cookies o tokens de Roblox.
- No construir bypass de anti-cheat, teleport, speed hacks, invisibilidad, anti-guard o automatización de robo.
- No afirmar que un predictor, feed o evento está en vivo sin una fuente real y comprobable.
- El buscador de servidores depende de un Worker configurado por el propietario y sigue sujeto a límites/errores de Roblox.
- Los informes comunitarios deben marcarse como comunitarios o por verificar.

## Fuentes revisadas

- Chilli Hub, página oficial y claims de producto: https://chillihub.pro/
- Chilli Hub, página del script: https://chillihub.pro/script
- Recorrido comunitario de Instant Steal V2 / Farm: https://rblxscript.org/en/script/chilli-hub-steal-an-egg-instant-steal-v2-and-lab-p-ovgk
- Recorrido comunitario de Player / Predictor / Progress: https://rblxscript.org/en/script/chilli-hub-steal-an-egg-auto-steal-egg-predictor-a-knuw

Los listados comunitarios indican que su contenido no se verifica de forma independiente y que los scripts pueden incumplir las reglas de Roblox o dejar de funcionar tras una actualización. Las afirmaciones de compatibilidad y funcionamiento deben tratarse como claims de terceros.
