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
├── index.js
├── package.json
├── package-lock.json
├── .env
└── node_modules/
```

**Cambiá el valor de la variable HAXBALL_TOKEN del `.env` al valor que te aparezca en esta página [https://www.haxball.com/headlesstoken].**

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
node index.js
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
node index.js
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
node index.js
```

### Las siguientes veces

Solamente:

```bash
node index.js
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
* [ ] Existe `index.js`.
* [ ] Existe `package.json`.
* [ ] Existe `.env`.
* [ ] Ejecutaste `npm install`.
* [ ] Ejecutaste `node index.js`.

Si todo está marcado, **el proyecto debería poder ejecutarse.**
