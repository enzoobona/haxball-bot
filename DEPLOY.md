# Guía de deploy 100 % gratuito (Bracket + bot de Haxball)

Última revisión de los planes gratuitos: **octubre 2026**. Los planes gratis cambian seguido (Oracle
recortó su plan hace pocos meses), así que antes de empezar chequeá las páginas oficiales que se
mencionan en cada opción.

## 0. Cómo está armado el sistema (y qué hay que alojar)

```
 Jugadores ──► Sala de Haxball ◄── bot (Node)  ──► API de Bracket ◄── navegador (admin / público)
                (la crea el bot)    corre en TU PC      │
                                                        └──► Postgres
```

* **Bracket** (backend + frontend + base de datos) es lo único que necesita un servidor siempre prendido.
* **El bot NO se despliega en un servidor**: Haxball exige un token (`haxball.com/headlesstoken`) que se
  pide a mano resolviendo un captcha y **vence en minutos**. Por eso el bot se enciende desde la PC del
  organizador cuando hay partidos (`npm start`) y apunta al Bracket público. No hay forma gratuita ni
  paga de dejarlo 100 % desatendido sin saltear ese captcha.

## 1. Qué opción elegir

| | **A. Oracle Cloud (VM gratis)** | **B. Render + Neon** |
| --- | --- | --- |
| Tarjeta | Sí, para verificar la cuenta (no cobra si te quedás en "Always Free") | No |
| Siempre prendido | Sí | **No**: se duerme a los 15 min sin visitas y tarda ~1 min en despertar |
| Datos persistentes | Sí (disco de la VM) | Base sí (Neon). **Los logos subidos se pierden** en cada reinicio |
| Dificultad | Media (SSH + Docker) | Baja (todo por web) |
| Riesgos | "Out of capacity" al crear la VM; Oracle puede reclamar VMs inactivas | Base con latencia al despertar; 0,5 GB de límite |
| Recomendada para | Un torneo en serio | Probar, o torneos cortos |

**Mi recomendación:** la **A** si tenés una tarjeta para verificar la cuenta; si no, la **B**.

---

## 2. Antes de empezar (común a las dos)

1. Tener el proyecto en un repositorio de Git (GitHub, GitLab…) **o** el `.zip` a mano. Subí el repo sin
   el archivo `bot/.env` (ya está en `bot/.gitignore`).
2. Generar secretos (en Windows se puede usar Git Bash o WSL; o cualquier generador de contraseñas largas):
   ```bash
   openssl rand -hex 32     # para JWT_SECRET
   openssl rand -hex 24     # para POSTGRES_PASSWORD (solo letras y números)
   ```
3. Elegir el **email y la contraseña del administrador** de Bracket.

> La imagen de Docker ya viene lista para cualquier dominio: la URL de la API es relativa (`/api`), así que
> no hay que reconstruirla al cambiar de dirección.

---

## 3. Opción A — Oracle Cloud Always Free + Docker + HTTPS

Qué incluye hoy el plan (verificá en https://www.oracle.com/cloud/free/): una VM Arm **Ampere A1 con hasta
2 OCPU y 12 GB de RAM** (el plan anterior de 4 OCPU / 24 GB se recortó en 2026) y hasta dos VM AMD
`E2.1.Micro` de 1 GB. Con la A1 de 2 OCPU / 12 GB alcanza de sobra.

### A.1 Crear la cuenta y la VM

1. Registrate en Oracle Cloud (plan Free). **La región de origen no se puede cambiar después.** Si al crear
   la VM aparece *"Out of capacity"*, probá otro dominio de disponibilidad o reintentá más tarde: es un
   problema conocido de las Ampere gratuitas.
2. *Compute → Instances → Create instance*:
   * Imagen: **Ubuntu 24.04**.
   * Shape: *Ampere* → `VM.Standard.A1.Flex` con **2 OCPU y 12 GB** (no pidas más: Oracle apaga lo que
     exceda el plan gratis).
   * Descargá la **clave SSH privada** que te ofrece (la necesitás para entrar).
3. Anotá la **IP pública** de la instancia.

### A.2 Abrir los puertos 80 y 443 (hay que hacerlo en DOS lugares)

1. En Oracle: *Networking → Virtual Cloud Networks →* tu VCN *→ Security Lists →* la lista por defecto
   *→ Add Ingress Rules*: origen `0.0.0.0/0`, protocolo TCP, puerto destino `80`; repetir con `443`.
2. En la VM (las imágenes de Oracle traen reglas de firewall propias que bloquean todo lo demás):
   ```bash
   ssh -i clave.key ubuntu@IP_PUBLICA
   sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
   sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
   sudo netfilter-persistent save
   ```
   Si más adelante la página no carga desde afuera, el 90 % de las veces es este paso.

### A.3 Instalar Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
exit    # y volvé a entrar por SSH para que tome el grupo
docker --version
```

### A.4 Un dominio gratis

Caddy necesita un nombre de dominio para pedir el certificado HTTPS. Opción gratuita:
**DuckDNS** (https://www.duckdns.org): iniciá sesión, creá un subdominio (por ejemplo `mitorneo`) y pegá
la IP pública de la VM. Tu dominio queda `mitorneo.duckdns.org`.
(Alternativa sin registro: `IP-con-guiones.sslip.io`, por ejemplo `129-153-10-20.sslip.io`. Funciona, pero es
un dominio compartido y Let's Encrypt a veces limita los certificados.)

### A.5 Subir el proyecto y configurarlo

```bash
git clone TU_REPO.git haxball          # o subí el zip con scp y descomprimilo
cd haxball/bracket
cp deploy/prod.env.example .env
nano .env                              # completá DOMAIN, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, POSTGRES_PASSWORD
```

### A.6 Levantar todo

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml logs -f bracket     # Ctrl+C para salir
```

La primera vez tarda varios minutos (compila el frontend en Arm). Cuando termine:

* `https://TU_DOMINIO/api/ping` debe responder `"ping"`.
* `https://TU_DOMINIO` abre Bracket: entrá con `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

Las tablas se crean solas la primera vez y las migraciones se aplican al arrancar.

### A.7 Backups automáticos (importante en un servidor gratis)

```bash
cd ~/haxball/bracket
chmod +x deploy/backup.sh
./deploy/backup.sh                       # prueba manual: crea backups/bracket-FECHA.dump
crontab -e                               # y agregá esta línea (backup diario a las 4:00):
0 4 * * * /home/ubuntu/haxball/bracket/deploy/backup.sh >> /home/ubuntu/backup.log 2>&1
```

Bajate de vez en cuando la carpeta `backups/` a tu PC (`scp -i clave.key ubuntu@IP:~/haxball/bracket/backups/* .`):
si Oracle reclamara la VM, un backup en la misma VM se perdería con ella.

### A.8 Actualizar cuando cambie el código

```bash
cd ~/haxball && git pull
cd bracket && docker compose -f docker-compose.prod.yml up -d --build
```

### A.9 Si la VM es la `E2.1.Micro` (1 GB de RAM)

Compilar el frontend necesita más memoria. Agregá swap antes de construir:
```bash
sudo fallocate -l 3G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
```

---

## 4. Opción B — Render (web) + Neon (base de datos), sin tarjeta

Datos verificados (octubre 2026):

* **Render gratis** (https://render.com/docs/free): el servicio web se duerme tras 15 minutos sin tráfico
  y tarda alrededor de un minuto en volver. **Su Postgres gratuito vence a los 30 días** (con 14 de gracia
  antes de borrarse), por eso no lo usamos.
* **Neon gratis** (https://neon.com/pricing): 0,5 GB de almacenamiento y 100 horas de cómputo por mes por
  proyecto, la base se suspende tras 5 minutos de inactividad y no pide tarjeta.

### B.1 Crear la base en Neon

1. Entrá a https://neon.com, creá una cuenta y un proyecto (región cercana a la de Render; Frankfurt u Oregon).
2. Copiá la **connection string** y dejala con este formato (ojo: `postgresql://`, no `postgres://`, y con
   `sslmode=require` al final):
   ```
   postgresql://USUARIO:CLAVE@ep-xxxx.REGION.aws.neon.tech/neondb?sslmode=require
   ```
   Ese es el valor de `PG_DSN`.

### B.2 Crear el servicio en Render

1. Subí el repo a GitHub (con `render.yaml` en la raíz, ya incluido).
2. En https://render.com: *New → Blueprint* → elegí el repo. Render lee `render.yaml` y crea el servicio
   `bracket` en el plan **Free**.
3. Te pide los valores marcados como secretos:
   * `PG_DSN`: la de Neon (paso B.1).
   * `ADMIN_EMAIL` y `ADMIN_PASSWORD`: los del administrador.
   * `BASE_URL` y `CORS_ORIGINS`: todavía no sabés la URL; poné `https://bracket.onrender.com` y corregilo después.
   (`JWT_SECRET` se genera solo.)
4. Esperá el primer build (varios minutos). Render te da una URL tipo `https://bracket-xxxx.onrender.com`.
5. Entrá a *Environment* y actualizá `BASE_URL` y `CORS_ORIGINS` con esa URL real (sin barra final);
   Render redespliega solo.
6. Probá `https://TU-URL.onrender.com/api/ping` y entrá a la web con el admin.

### B.3 Qué esperar (límites reales)

* **Primera visita tras 15 min sin uso: ~1 minuto de carga.** Para evitarlo podés usar un monitor gratuito
  (por ejemplo UptimeRobot) que visite `/api/ping` cada 5 minutos; consume casi todas las horas gratis del
  mes (750), lo cual está bien porque es un único servicio.
* **Logos de equipos/torneo**: el disco de Render gratis es efímero, se pierden al reiniciar. El resto de los
  datos (partidos, estadísticas, jugadores) está en Neon y no se pierde.
* **Backups**: Neon gratis solo restaura hasta 6 horas atrás. Hacé un respaldo manual antes de cada fecha
  importante, desde tu PC con el cliente de Postgres (`pg_dump`):
  ```bash
  pg_dump "postgresql://USUARIO:CLAVE@ep-xxxx.REGION.aws.neon.tech/neondb?sslmode=require" -Fc -f respaldo.dump
  ```
* Si Neon "duerme" la base, la primera consulta tarda un instante más. Si en algún momento ves un error
  de conexión justo después de un rato sin uso, recargá: ver "Problemas comunes".

---

## 5. Conectar el bot (igual para A y B)

1. En Bracket (navegador) creá el torneo, los equipos y los jugadores. **El nombre de cada jugador en
   Bracket tiene que ser el mismo que usa en Haxball** (el bot ignora mayúsculas y tildes).
2. Abrí el torneo: el número en la barra de direcciones (`/tournaments/3/...`) es el `BRACKET_TOURNAMENT_ID`.
3. En la PC del organizador, en la carpeta `bot/`, copiá `.env.example` como `.env` y completá:
   ```
   BRACKET_API_URL=https://TU_DOMINIO/api          # sin barra final; en Render: https://TU-URL.onrender.com/api
   BRACKET_USERNAME=el ADMIN_EMAIL
   BRACKET_PASSWORD=el ADMIN_PASSWORD
   BRACKET_TOURNAMENT_ID=3
   HAXBALL_TOKEN=             # se pide justo antes de arrancar (ver abajo)
   ADMIN_PASSWORD=una-clave   # para que los admins usen !admin <clave> en la sala
   ```
4. Pedí el token en https://www.haxball.com/headlesstoken, pegalo en `HAXBALL_TOKEN` y ejecutá `npm start`.
5. En la sala: `!admin <clave>`, luego `!partido <id>`, mover a los jugadores y `!iniciar`.
   Al terminar, el resultado y las estadísticas se envían a Bracket solos.

Si Bracket está dormido (opción B), la primera petición puede tardar cerca de un minuto o fallar. Para
evitar sorpresas, abrí la página de Bracket un minuto antes de empezar. Si justo al terminar un partido
Bracket no responde, el resultado queda guardado y se reintenta solo (`!pendientes`, `!reintentar`).

## 6. Llevar a producción datos de tu Bracket local

Si ya cargaste cosas en tu Bracket local (Docker en tu PC):

```bash
# 1) En tu PC: exportar
docker compose exec -T postgres pg_dump -U bracket_dev -d bracket_dev -Fc > local.dump

# 2) Opción A (Oracle): copiar y restaurar en la VM
scp -i clave.key local.dump ubuntu@IP:~/haxball/bracket/
docker compose -f docker-compose.prod.yml exec -T postgres pg_restore -U bracket -d bracket --clean --if-exists --no-owner < local.dump
docker compose -f docker-compose.prod.yml restart bracket

# 2) Opción B (Neon): restaurar directo desde tu PC (con el cliente de Postgres instalado)
pg_restore --clean --if-exists --no-owner -d "postgresql://USUARIO:CLAVE@ep-xxxx.REGION.aws.neon.tech/neondb?sslmode=require" local.dump
```

Al reiniciar, Bracket aplica las migraciones pendientes (incluidas las que agregan `match_player_stats.team_id`,
los roles de usuario y los perfiles de jugador; **los goles en contra de los jugadores se eliminan**), así que no
hay que hacer nada más. Los usuarios y contraseñas de tu base local se copian también: iniciás sesión con los de
tu base, no con `ADMIN_EMAIL`. Todos los usuarios que ya existían quedan con rol `ADMIN`.

## 7. Problemas comunes

| Síntoma | Causa probable | Qué hacer |
| --- | --- | --- |
| La web no carga desde afuera (A) | Falta abrir 80/443 en Oracle **o** en `iptables` | Repetí el paso A.2 completo |
| Caddy no consigue el certificado | El dominio no apunta a la IP, o el 80/443 está cerrado | Revisá DuckDNS y A.2; `docker compose -f docker-compose.prod.yml logs caddy` |
| `docker compose` dice "Falta JWT_SECRET…" | `.env` incompleto o en otra carpeta | El `.env` va en `bracket/`, junto a `docker-compose.prod.yml` |
| 401 / "Could not validate credentials" en el bot | Usuario o clave del `.env` del bot incorrectos | Revisá `BRACKET_USERNAME` / `BRACKET_PASSWORD`. Si la sesión simplemente venció, el bot se vuelve a loguear solo |
| El bot se corta con "No se recibió el link de la sala" | `HAXBALL_TOKEN` vencido | Pedí uno nuevo y reiniciá |
| "No estás inscripto en…" al entrar a la cancha | El nombre en Haxball no coincide con el de Bracket, o falta asignarlo al equipo | Corregí el nombre/equipo en Bracket y usá `!actualizar` |
| Un resultado no llegó a Bracket | Bracket dormido o caído al terminar el partido | No se pierde: `!pendientes` y `!reintentar` (se reintenta solo cada minuto) |
| Error de conexión a la base justo después de un rato de inactividad (B) | Neon suspendió la base | Recargá/reintentá; si se repite, probá la cadena de conexión "pooled" de Neon (host con `-pooler`) |
| Se perdieron los logos (B) | Disco efímero de Render gratis | Volvé a subirlos (o usá la opción A) |

## 8. Qué pude comprobar y qué no

Probado de verdad (en un entorno de pruebas con Postgres local): el backend completo con su suite
de tests (incluidos tests nuevos de `finish`/`reset`/estadísticas), la migración sobre tres tipos de base
existente, el arranque desde una base vacía sirviendo el frontend con la API relativa, el bot (pruebas
unitarias + una simulación de punta a punta con sala y Bracket simulados) y la capa de API del bot contra el
backend real.

**No pude probar** (no tengo acceso a esos servicios): las construcciones de Docker en sí, el deploy real en
Oracle, Render y Neon, la conexión SSL a Neon, ni una sala de Haxball real (requiere el captcha del token).
Los pasos de las opciones A y B están armados con la documentación oficial vigente, pero es esperable que
algún detalle de las consolas web (nombres de menús) haya cambiado.

## 8 bis. Cuentas de jugadores, roles y estadísticas acumuladas

* **Roles**: `ADMIN` crea y edita clubes, torneos y todo lo que cuelga de ellos (y es el rol que necesita la
  cuenta del bot). `USER` es un jugador: solo ve la página pública y su propia página **Mi jugador**.
  Quien se registra en la web es siempre `USER`; los usuarios que ya existían, y el de `ADMIN_EMAIL`, son `ADMIN`.
  Para promover o degradar una cuenta: `python cli.py set-user-role --email alguien@correo.com --role ADMIN`
  (en Docker: `docker compose exec backend python cli.py set-user-role ...`).
* **Registro abierto**: para que los jugadores puedan crear su cuenta, `ALLOW_USER_REGISTRATION` tiene que estar
  en `true` (en `render.yaml` ya viene así). Como las cuentas nuevas no tienen ningún permiso de edición, abrirlo
  es seguro; si te llegan registros basura, configurá un captcha (`CAPTCHA_SECRET`).
* **Jugador con cuenta**: cada usuario crea su jugador (un nombre único, que queda reservado) y vincula su
  navegador de Haxball con `!vincular CODIGO` (ver `bot/README.md`). Sus estadísticas de todos los torneos se
  suman en su perfil. Quien no tiene cuenta sigue jugando igual, con estadísticas solo del torneo.
* **¿Cómo se conecta un jugador con su fila del torneo?** Dos caminos, los dos disponibles:
  * *Automático* (por defecto): si hay una fila **sin cuenta** de un torneo **abierto** con el mismo nombre que
    el jugador (normalizado: sin tildes ni mayúsculas), se vincula sola, al crear el perfil o al crear la fila.
    Los torneos archivados no se tocan.
  * *Manual*: en **Jugadores** del torneo, cada fila tiene un botón para vincularla (o desvincularla) de un
    jugador con cuenta. Es el camino para torneos viejos o nombres que no coinciden.
  * Si preferís que **solo** vincule el organizador, poné `AUTO_LINK_PLAYERS_BY_NAME=false`. Es más seguro: con el
    automático, alguien podría registrarse con el nombre de un inscripto antes que su dueño y quedarse con su
    fila (los nombres de los jugadores son públicos). El bot ya tenía ese mismo punto débil con los nombres
    sin cuenta; por eso el organizador siempre puede corregirlo a mano.
* **Seguridad del vínculo**: el código es de un solo uso, vence a los 10 minutos, se guarda solo su hash y el
  bot lo oculta del chat. Un `auth` no puede pertenecer a dos jugadores. Un jugador puede tener hasta 5 navegadores.

## 9. Página pública para tus seguidores

Cualquier persona puede ver tus torneos **sin iniciar sesión**; solo vos (con tu usuario) ves las pantallas
para editar.

* **Portada pública** (`https://TU_DOMINIO/`): lista los torneos publicados. Si ya iniciaste sesión, en `/` ves
  tu panel de organizador; para ver la portada como la ve el público entrá a `/torneos` (o al enlace
  *Sitio público* del menú).
* **Publicar un torneo**: en el panel, *Ajustes del torneo → Página pública del torneo*: escribí un enlace
  corto (sin espacios, por ejemplo `copa_stream`), tildá *Permitir que cualquier persona vea el torneo* y
  guardá. Aparece en la portada y su enlace es `https://TU_DOMINIO/tournaments/copa_stream/dashboard`
  (el botón *Copiar enlace público* lo copia). Para ocultarlo, destildá la casilla.
* **Qué ve el público**: *Partidos*, *Llaves*, *Posiciones* y *Equipos*, todo en solo lectura y con
  actualización automática. Nunca ven jugadores sueltos, ajustes, edición de resultados ni el panel.
* **Personalizarlo**: en el `.env` de `bracket/` (ver `deploy/prod.env.example`) podés poner `SITE_NAME`,
  `SITE_TAGLINE`, `STREAM_URL` y `DISCORD_URL`. Son parte de la compilación del frontend, así que después de
  cambiarlos hay que reconstruir: `docker compose -f docker-compose.prod.yml up -d --build`.
* **Para OBS / el stream**: `/tournaments/copa_stream/dashboard/present/courts` y
  `/tournaments/copa_stream/dashboard/present/standings` son pantallas pensadas para agregar como fuente de
  navegador.
