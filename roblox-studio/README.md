# Diego Hub — Roblox Studio Edition

Esta carpeta contiene el primer prototipo real de la interfaz Diego Hub en **Luau**.

## Alcance

- Interfaz flotante y arrastrable con mouse o pantalla táctil.
- Ventana minimizable.
- Pestañas Inicio, Catálogo, Calculadora, Progreso y Ajustes.
- Lectura de estadísticas básicas del personaje de la experiencia propia (vida y WalkSpeed).
- Calculadora matemática de probabilidad acumulada.
- Lista de progreso local durante la sesión.
- Sin cargadores remotos, cookies, contraseñas, acceso a cuentas ni llamadas HTTP.

**No es un ejecutor ni un script para inyectar en Steal An Egg mediante Delta.** Está pensado para una experiencia propia o una experiencia en la que tengas autorización para desarrollar. No lee ni modifica el estado de otros juegos.

## Instalación en Roblox Studio

1. Abre una experiencia tuya en Roblox Studio.
2. En Explorer, abre StarterPlayer.
3. Abre StarterPlayerScripts.
4. Inserta un LocalScript.
5. Copia el contenido de DiegoHub.client.lua dentro del LocalScript.
6. Pulsa Play para probarlo.

El panel se crea en PlayerGui y se elimina/recrea al iniciar para evitar duplicados.

## Arquitectura recomendada para la siguiente fase

- StarterPlayerScripts/DiegoHub.client.lua: punto de entrada de la interfaz.
- ReplicatedStorage/DiegoHub/Modules: módulos reutilizables de interfaz y presentación.
- ServerScriptService/DiegoHubServer: validación y lógica autoritativa del juego propio.
- ReplicatedStorage/DiegoHub/Remotes: comunicación cliente-servidor con validación en el servidor.

No guardes secretos ni lógica sensible en LocalScripts o ModuleScripts replicados al cliente. El servidor debe validar toda acción que afecte progreso, monedas, inventario o recompensas.

## Límites del prototipo

- El catálogo usa datos de demostración, no una base de datos oficial de Steal An Egg.
- La lista de progreso vive solo mientras la interfaz está abierta.
- No se ha probado en un dispositivo físico ni en una sesión publicada; debe probarse en Studio, especialmente en pantalla pequeña.
- La calculadora presupone intentos independientes con la misma probabilidad.

## Documentación oficial

- Luau: https://create.roblox.com/docs/luau
- Tipos y ubicaciones de scripts: https://create.roblox.com/docs/scripting/locations
- Seguridad y mitigación de trampas: https://create.roblox.com/docs/scripting/security/security-tactics
- ModuleScript: https://create.roblox.com/docs/reference/engine/classes/ModuleScript
