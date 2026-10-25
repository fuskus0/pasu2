# PS2 Web (frontend para Play!)

Frontend estático para **Play!** (jpd002/Play-), un emulador de PS2 con build WebAssembly. No es una maqueta: el motor es real, pero **este proyecto no se ha podido ejecutar en el entorno donde se escribió** (sin red ni navegador). Pruébalo y reporta fallos.

## Estado
| Función | Estado |
|---|---|
| Carga local de ISO/CSO/CHD/ISZ/BIN/ELF, aviso de formato | Hecho (sin probar con un juego real) |
| Iniciar, pantalla completa, escalado visual | Hecho (sin probar) |
| Pausar/Reanudar/Reiniciar | Experimental: solo se activan si el motor exporta `pauseVm`/`resumeVm`/`resetVm` (nombres supuestos) |
| Gamepad con reasignación | Experimental: emite teclas sintéticas; las teclas por defecto hay que verificarlas en `Source/ui_js/Main.cpp` |
| Sticks analógicos | Solo como dirección digital |
| Partidas guardadas, estados, audio, FPS, táctil, resolución interna | Pendiente |
| BIOS | No aplica: Play! usa BIOS HLE integrada y no admite BIOS externa |

## Limitaciones honestas
- Compatibilidad parcial y rendimiento variable según juego y equipo; sin garantía de 60 FPS.
- Requiere Chrome/Edge modernos, hilos WASM y `SharedArrayBuffer`. GitHub Pages no permite cabeceras COOP/COEP, así que se usa `coi-serviceworker.js` (recarga la página una vez).
- El motor lo compila otro proyecto (`geklactus/play-browser`, con parches propios). Es un binario de terceros: revisa su código y la licencia de Play! (`LICENSE-Play.txt` en el tar) antes de publicarlo.
- Nunca se incluyen juegos ni BIOS. Usa solo copias de discos que poseas.

## Publicar en GitHub Pages
1. Crea un repo y sube estos archivos (`git init && git add . && git commit -m init && git push`) a la rama `main`.
2. En *Settings → Pages → Source* elige **GitHub Actions**.
3. El workflow `deploy.yml` descarga `Play.js`/`Play.wasm`, verifica su sha256 y despliega. Ajusta `PLAY_VERSION` a una release existente.
4. Abre `https://TU_USUARIO.github.io/TU_REPO/`, elige un juego e Iniciar.

## Compilar el motor tú mismo
Sigue "Building for Web Browsers" del README de jpd002/Play- (Emscripten, `emcmake cmake .. -DBUILD_PLAY=ON -DUSE_QT=OFF ...`). Copia `Play.js` y `Play.wasm` a `emulator/`. Necesitarás además hilos y, para guardados, un parche con IDBFS como el de play-browser.

## Desarrollo local
Sirve con cabeceras COOP/COEP (por ejemplo un servidor que envíe `Cross-Origin-Opener-Policy: same-origin` y `Cross-Origin-Embedder-Policy: require-corp`), o usa `localhost` con el service worker.
