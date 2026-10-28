# 🚀 Cómo ejecutar el proyecto

Esta guía explica paso a paso cómo preparar la computadora y ejecutar el proyecto.

---

## 1. Abrir una terminal

Primero abrí una terminal.

En Windows:

1. Presioná `Windows + R`.
2. Escribí:

```text
cmd
```

3. Presioná **Enter**.

Se va a abrir una ventana negra.

---

# 2. Comprobar si Node.js está instalado

En la terminal escribí:

```bash
node -v
```

y presioná **Enter**.

### Si aparece algo como:

```text
v22.14.0
```

Perfecto. **Node.js ya está instalado.**

Podés continuar con el siguiente paso.

### Si aparece algo como:

```text
'node' no se reconoce como un comando interno o externo...
```

Significa que Node.js **no está instalado**.

En ese caso, instalalo desde:

https://nodejs.org/

Descargá la versión **LTS** y seguí el instalador dejando las opciones por defecto.

Después de instalarlo, **cerrá la terminal y abrí una nueva**.

Volvé a comprobar:

```bash
node -v
```

---

# 3. Comprobar si npm está instalado

Ahora escribí:

```bash
npm -v
```

Debería aparecer un número, por ejemplo:

```text
10.9.2
```

Si aparece un número, **npm está instalado correctamente**.

> npm normalmente se instala junto con Node.js, por lo que si Node está instalado correctamente, probablemente npm también lo esté.

Si `npm` no funciona, reinstalá Node.js desde:

https://nodejs.org/

---

# 4. Comprobar que todo está listo

Antes de continuar deberías poder ejecutar estos dos comandos:

```bash
node -v
npm -v
```

Y ambos deberían mostrar un número.

Por ejemplo:

```text
C:\Users\Usuario>node -v
v22.14.0

C:\Users\Usuario>npm -v
10.9.2
```

Si ambos funcionan, la computadora está preparada.

---

# 5. Descomprimir el proyecto

Buscá el archivo `.zip` del proyecto.

Hacé clic derecho sobre él y seleccioná:

**Extraer todo**

Elegí dónde querés guardar el proyecto.

Por ejemplo:

```text
Documentos/mi-proyecto
```

Dentro de la carpeta deberías encontrar archivos parecidos a:

```text
mi-proyecto/
├── script.js
├── run.js
├── teams-config.json
├── package.json
├── package-lock.json
├── .env
└── node_modules/
```

**Copiá `.env.example` como `.env` (si no existe) y cambiá el valor de la variable HAXBALL_TOKEN del `.env` al valor que te aparezca en esta página [https://www.haxball.com/headlesstoken].**

---

# 6. Abrir la terminal dentro del proyecto

Entrá a la carpeta del proyecto.

Hacé clic en la barra de dirección de la carpeta y escribí:

```text
cmd
```

Presioná **Enter**.

La terminal debería abrirse directamente dentro de la carpeta.

Por ejemplo:

```text
C:\Users\Usuario\Documents\mi-proyecto>
```

---

# 7. Instalar las dependencias

Ahora ejecutá:

```bash
npm install
```

Presioná **Enter** y esperá a que termine.

Esto instala las librerías que necesita el proyecto.

Aunque el ZIP ya tenga una carpeta `node_modules`, **hacé igualmente este paso**. Así npm puede comprobar que las dependencias están instaladas correctamente.

---

# 8. Ejecutar el proyecto

Cuando termine `npm install`, ejecutá:

```bash
npm start
```

Presioná **Enter**.

Si todo está correctamente configurado, el programa debería arrancar.

---

# 9. Dejarlo funcionando

Mientras la terminal esté abierta y el programa siga ejecutándose, el proyecto estará funcionando.

**No cierres la ventana.**

Si cerrás la terminal, el programa se detiene.

Para detenerlo manualmente, presioná:

```text
Ctrl + C
```

---

# 🔄 Cómo ejecutarlo las próximas veces

No necesitás repetir toda la instalación.

Simplemente:

### 1. Abrí la carpeta del proyecto.

### 2. Abrí una terminal dentro de ella.

### 3. Ejecutá:

```bash
npm start
```

Y listo.

---

# ❗ Si aparece un error

Si aparece un mensaje de error, especialmente uno que aparece en rojo:

**No borres archivos ni cambies configuraciones.**

Copiá el mensaje completo de la terminal y mandáselo a quien te pasó el proyecto.

---

# 📋 Resumen rápido

### Primera vez

Comprobar Node:

```bash
node -v
```

Comprobar npm:

```bash
npm -v
```

Entrar a la carpeta del proyecto y ejecutar:

```bash
npm install
```

Después:

```bash
npm start
```

### Las siguientes veces

Solamente:

```bash
npm start
```

### Para detenerlo

```text
Ctrl + C
```

---

## ✅ Checklist

Antes de ejecutar el proyecto, asegurate de que:

* [ ] Node.js está instalado (`node -v` funciona).
* [ ] npm está instalado (`npm -v` funciona).
* [ ] El proyecto está descomprimido.
* [ ] Existe `script.js`.
* [ ] Existe `package.json`.
* [ ] Existe `.env`.
* [ ] Ejecutaste `npm install`.
* [ ] Ejecutaste `npm start`.

Si todo está marcado, **el proyecto debería poder ejecutarse.**

---

# 🆕 Configuración y novedades

Todo lo nuevo se configura en el `.env` (mirá `.env.example`, trae todas las opciones comentadas).
Si no configurás nada, el bot funciona igual que antes.

## Seguridad y moderación

| Qué | Cómo |
| --- | --- |
| Admin con clave | Poné `ADMIN_PASSWORD=...` en el `.env`. Los jugadores escriben `!admin <clave>` (el mensaje no se ve en el chat). Con esto el primero que entra **ya no es admin** automáticamente. |
| Admins fijos | `ADMIN_AUTHS=auth1,auth2` (identidad de Haxball). |
| Clave de sala | `ROOM_PASSWORD=...` |
| Expulsar / banear | `!kick <jugador> [motivo]`, `!ban <jugador> [motivo]`, `!clearbans` |
| Silenciar | `!mute <jugador> [minutos]`, `!unmute <jugador>` |
| Jugadores | Podés escribir el nombre, `"nombre con espacios"` o `#id` (los ids se ven con `!players`). |

## Reglas del torneo

* **Solo juegan los inscriptos**: un jugador solo puede entrar al equipo del partido si está inscripto en ese equipo en Bracket (su nombre en la sala tiene que coincidir con el de Bracket). Para amistosos, `ENFORCE_ROSTERS=false`.
* **Identidad**: la primera vez que entra un jugador inscripto, su nombre queda vinculado a su navegador. Si otra persona usa ese nombre, la sala la rechaza. Si el dueño cambió de computadora, un admin usa `!desvincular <nombre>`.
* **Nombres repetidos** en la sala se rechazan.
* **Eliminación directa**: si hay empate se juega **muerte súbita** (gana el primer gol; `OVERTIME_SECONDS` define cada período).
* **Goles en contra**: suman al marcador del rival y se anuncian en la sala, pero **no son una estadística del jugador** (no se guardan ni se muestran en `!stats` ni en Bracket).
* Se guarda un **replay** (`.hbr2`) de cada partido en la carpeta `replays/`.

## Jugadores con cuenta (vincular el navegador)

Los jugadores pueden registrarse en la web de Bracket (tienen rol `USER`: solo ven la parte pública y
sus estadísticas) y vincular su navegador de Haxball **una sola vez**:

1. En la web, **Mi jugador**: eligen su nombre de jugador y piden **Vincular Haxball**. Reciben un código
   de un solo uso que vence en 10 minutos.
2. En la sala escriben `!vincular CODIGO`. El mensaje no se ve en el chat. El bot manda el código y el `auth`
   del navegador a Bracket y queda guardado el vínculo.
3. Desde ahí el bot lo reconoce en **cualquier sala**, sin clave (`!yo` muestra cómo te ve el bot).
   Sus estadísticas de cada torneo se suman a su perfil.

Reglas:

* El **nombre de un jugador con navegador vinculado queda reservado**: si entra otra persona (otro `auth`, o
  sin `auth`) con ese nombre, la sala la rechaza.
* Un jugador reconocido puede entrar con cualquier nombre libre: sus estadísticas van a **su** fila del torneo
  (la vinculada a su perfil), no a la que "se llame igual".
* Si cambia de computadora o borra los datos del navegador, genera otro código y se vincula de nuevo (hasta 5
  navegadores por jugador; los gestiona desde la web).
* Los jugadores **sin cuenta** siguen funcionando como antes (nombre inscripto + vínculo local con `!desvincular`).
* La cuenta que usa el bot (`BRACKET_USERNAME`) tiene que tener rol `ADMIN`.
* Cinco `!vincular` fallidos seguidos expulsan al jugador de la sala.

## Si Bracket falla al terminar un partido

El resultado **no se pierde**: queda guardado en `data/pending-results.json` y se reintenta solo cada
`RETRY_SECONDS`. Comandos de admin: `!pendientes` (ver qué quedó sin enviar) y `!reintentar`.
Si algo se cargó mal, `!resetPartido <id>` lo deshace (también descarta un resultado pendiente).
`!actualizar` vuelve a leer jugadores y equipos desde Bracket.

## Camisetas y emoji de los equipos

Se cargan **en Bracket**, al crear o editar el equipo (sección "Camiseta y emoji"): hasta 3 colores,
color del número, ángulo de las franjas (0° = verticales, 90° = horizontales, igual que en Haxball) y un
emoji que reemplaza a la bandera en los mensajes de la sala.

El bot los lee al cargar un partido (`!partido`) y con `!actualizar`; no hace falta reiniciarlo.
Cada dato se resuelve por separado, con esta prioridad:

1. Lo cargado en Bracket.
2. `teams-config.json` (respaldo: trae los países de siempre con sus colores y banderas).
3. Un color generado automáticamente a partir del nombre.

Por ejemplo, si a "Paraguay" solo le ponés un emoji en Bracket, conserva sus colores de `teams-config.json`.
Si le ponés colores en Bracket, usa esos y el color del número se calcula solo (negro o blanco, el que se
lea mejor) salvo que cargues uno.

## Encender el bot

* `npm start`: arranca con **reinicio automático** si el programa se cae.
* `npm run start:once`: arranca una sola vez, sin supervisor.
* `npm test`: corre las pruebas.

> El `HAXBALL_TOKEN` se pide a mano en https://www.haxball.com/headlesstoken (hay que resolver un captcha)
> y **vence rápido**, así que generalo justo antes de arrancar. Por eso el bot no puede quedar
> 100 % desatendido: si el token venció, el bot se corta con un mensaje claro en lugar de reintentar
> en vano. En la práctica se enciende desde la PC del organizador cuando hay partidos.
