# Cultura sin fronteras

Plataforma en español para descubrir cultura, explorar una agenda, guardar favoritos y proponer contenido sujeto a revisión editorial. Primera versión funcional con **React + Vite + JavaScript + Tailwind CSS**, **React Router**, **Express**, **PostgreSQL** y **Sequelize**.

## Inicio rápido en este equipo

El proyecto se preparó en `C:\Users\ZenBook\Documents\GitHub\cultura-mundial`. Las dependencias están instaladas y `backend/.env` contiene una configuración local generada e ignorada por Git. Se creó una instancia PostgreSQL independiente en el puerto **55432**, con las bases `cultura` y `cultura_test`; no se modificó el servicio PostgreSQL existente.

```powershell
cd C:\Users\ZenBook\Documents\GitHub\cultura-mundial
npm run db:local:start
npm run dev
```

Abre **http://localhost:5173**. La API escucha en **http://localhost:3001/api**. Usa `localhost` en el navegador: es el origen autorizado en la configuración local. Ctrl+C detiene Vite y Express. `npm run db:local:stop` detiene únicamente la instancia indicada en `LOCAL_PG_DATA`.

La carpeta de datos local está indicada en `LOCAL_PG_DATA` dentro de `backend/.env`, bajo el directorio de trabajo de Codex. Conserva esa carpeta para mantener las cuentas y los favoritos. No se crea una cuenta administrativa con contraseña predeterminada: sigue la sección **Administrador**.

## Estructura

```text
frontend/
  public/images/             Fotografías WebP, versiones de 640 y 1600 px
  src/components/           Navegación, tarjetas, calendario, formulario y protección de rutas
  src/pages/                Inicio, explorador, detalle, cuenta, favoritos, propuestas y administración
  src/context/              Sesión, favoritos y avisos
  src/services/             Cliente HTTP y carga de recursos
  src/styles.css            Tailwind y diseño editorial adaptable
backend/
  src/models/               User, Event, Favorite y conexión Sequelize
  src/routes/               Rutas públicas, de cuenta y administrativas
  src/controllers/          Autenticación, eventos, propuestas, favoritos y moderación
  src/middleware/           Sesión, autorización y protección CSRF
  src/services/             Validación Zod y exportación RFC 5545
  migrations/               Migraciones versionadas con Umzug
  seeders/                  12 ediciones ficticias y 1 tradición documentada
  scripts/                  Migración, semillas, creación de administrador y retirada de ejemplos
  test/                     Pruebas de integración contra PostgreSQL real
```

## Configuración en otro equipo

Requiere Node.js **22.12 o superior**, npm y PostgreSQL **14 o superior**. No utiliza SQLite ni almacenamiento simulado.

1. Instala las dependencias desde la raíz:

   ```sh
   npm install
   ```

2. Crea un usuario y dos bases en PostgreSQL. Ejecuta con una cuenta que pueda crear roles y bases; sustituye la contraseña de ejemplo:

   ```sql
   CREATE ROLE cultura LOGIN PASSWORD 'TU_CONTRASENA_LOCAL';
   CREATE DATABASE cultura OWNER cultura;
   CREATE DATABASE cultura_test OWNER cultura;
   ```

3. Copia `backend/.env.example` a `backend/.env`. Configura `DATABASE_URL`, `TEST_DATABASE_URL` y un `SESSION_SECRET` aleatorio de al menos 32 caracteres. Genera uno con:

   ```sh
   node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
   ```

   Las contraseñas dentro de las URL deben estar codificadas si contienen caracteres reservados. No subas `.env` a Git. `LOCAL_PG_BIN` y `LOCAL_PG_DATA` solo son necesarios para los comandos opcionales de una instancia propia inicializada con `initdb`; no son necesarios si PostgreSQL corre como servicio.

4. Crea las tablas y carga los ejemplos:

   ```sh
   npm run db:migrate
   npm run db:seed
   npm run dev
   ```

`db:migrate` registra las migraciones en `SequelizeMeta`. Las tablas no se crean con `sync({ alter: true })`. `db:seed` es idempotente: no sobreescribe registros editados ni vuelve a publicar ejemplos retirados. Para iniciar una base sin contenido ficticio, omite la semilla o retira los ejemplos después de cargarla.

## Administrador

Define en `backend/.env` estos valores con tus propias credenciales:

```dotenv
ADMIN_EMAIL=tu-correo@tu-dominio.com
ADMIN_NAME=Tu nombre
ADMIN_PASSWORD=una-contraseña-larga-y-única
```

Ejecuta `npm run admin:create` y elimina `ADMIN_PASSWORD` del archivo cuando termines. Inicia sesión en `/cuenta` y abre **Administración**. El script no modifica roles ni contraseñas de usuarios existentes. El registro público siempre crea usuarios normales y descarta cualquier rol enviado por el cliente.

El panel permite crear, editar, aprobar, rechazar y retirar contenido, además de retirar todos los ejemplos. La nota de moderación aparece únicamente en el panel y en las propuestas de su autor. Aprobar registra la revisión editorial, pero **no marca las fechas como confirmadas automáticamente**. La imagen predeterminada es una foto ilustrativa de Antigua Guatemala: el editor debe sustituirla cuando no corresponda.

## Recorridos disponibles

- `/`: buscador, próximas ediciones, categorías, países, tradición destacada y «Sorpréndeme».
- `/explorar`: filtros combinables por búsqueda, país, categoría, tipo y rango de fechas; orden y paginación. Los filtros se conservan en la URL.
- `/explorar?vista=calendario`: mes anterior/siguiente, selección de día y agenda. Carga todas las páginas de resultados del mes. En móvil se simplifica la cuadrícula y se muestra la agenda en una columna.
- `/eventos/:id`: contexto cultural, fechas, acceso, fuente, última revisión, créditos, favoritos, compartir, archivo `.ics` y relacionados.
- `/cuenta`: registro, inicio/cierre de sesión y enlaces personales.
- `/guardados`: favoritos persistentes asociados a la cuenta.
- `/proponer`, `/propuestas`: formulario y seguimiento de estados.
- `/admin`, `/admin/nuevo`, `/admin/editar/:id`: gestión con autorización en servidor.
- `/creditos`: origen de las fotografías y criterios del contenido.

Los rangos de fecha seleccionan eventos que **se solapan** con el intervalo, incluidos los eventos de varios días. Una tradición general no tiene fecha de edición y no se incluye al filtrar por fechas ni al exportar calendario. El calendario respeta el país, categoría, búsqueda y rango; el filtro de tradiciones generales muestra una agenda vacía con explicación. La paginación se aplica a las tarjetas, no recorta silenciosamente el calendario.

## Datos y privacidad

| Tabla           | Campos y relaciones principales                                                                                                                                                                                                              |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Users`         | UUID, nombre, correo único, hash bcrypt, rol `user/admin`, marcas de tiempo.                                                                                                                                                                 |
| `Events`        | UUID, título, país, ciudad, categoría, `edition/tradition`, descripción, origen, actividades JSONB, lugar, fechas DATEONLY, horarios, zona IANA, confirmación, acceso, fuente, revisión y créditos. Autor opcional con `ON DELETE SET NULL`. |
| `Favorites`     | Clave compuesta `(userId, eventId)` y referencias con borrado en cascada; evita duplicados.                                                                                                                                                  |
| `Sessions`      | Identificador, datos de sesión, vencimiento y marcas de tiempo; persistidas en PostgreSQL y depuradas al expirar.                                                                                                                            |
| `SequelizeMeta` | Migraciones aplicadas.                                                                                                                                                                                                                       |

Estados editoriales: `pending`, `published`, `rejected`, `withdrawn`. Todas las consultas públicas, el azar, los relacionados, los favoritos y la descarga `.ics` exigen estado `published`. Las propuestas son privadas por defecto. Retirar contenido lo conserva en la base para revisión; no elimina datos de forma irreversible.

Las contraseñas se protegen con bcrypt (coste 12; máximo 72 bytes UTF-8). La sesión usa cookies `HttpOnly`, `SameSite=Lax`, duración de siete días y `Secure` en producción. Al iniciar sesión se regenera su identificador. Las mutaciones requieren token CSRF ligado a la sesión; también se valida `Origin`. Se usa Helmet, límites de solicitudes y JSON, validación en el servidor, listas explícitas de campos y consultas parametrizadas por Sequelize. Los hashes no aparecen en respuestas de la API.

La dependencia `uuid` de Sequelize está fijada mediante `overrides` a la rama 11 parcheada (compatible con CommonJS), por el aviso [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq). La compatibilidad de las operaciones usadas se comprueba en las pruebas de integración.

## Contenido de demostración y fuentes

Hay **12 ediciones ficticias**, de 2026–2027, en siete países y las seis categorías. Se etiquetan como ejemplos tanto en tarjetas como en fichas; no afirman precios ni fechas oficiales. La fuente de esas fichas es una referencia visual, etiquetada como tal. Se incluye una tradición real sin edición ni fechas: los barriletes gigantes de Santiago Sacatepéquez y Sumpango, basada en la [decisión 19.COM 7.B.41 de la UNESCO](https://ich.unesco.org/en/decisions/19.COM/7.B.41), consultada el 14 de noviembre de 2026.

Para retirar los ejemplos antes de publicar:

```sh
npm run db:remove-demo
```

También puedes hacerlo en el panel. Se conserva la tradición documentada. La base inicial no es una agenda de festivales reales confirmados: sustituye los ejemplos por convocatorias verificadas mediante el editor.

Fotografías bajo [Unsplash License](https://unsplash.com/license), con créditos y enlaces en cada ficha y en `/creditos`:

- [Antigua Guatemala, By Topo](https://unsplash.com/photos/a-clock-tower-with-a-mountain-in-the-background-XOSMdXIWk_I).
- [Faroles japoneses, ayumi kubo](https://unsplash.com/photos/glowing-japanese-lanterns-at-a-night-festival-guEJrCgWtGs).
- [Papel picado de Oaxaca, ayumi kubo](https://unsplash.com/photos/colorful-banners-strung-across-a-street-at-dusk-WE4aEV8NYAE).
- [Especias en Marrakech, Andy Kennedy](https://unsplash.com/photos/a-variety-of-colorful-bags-filled-with-different-types-of-spices-_n9PLGmJq9Y).

Son imágenes de contexto, no fotografías de los encuentros ficticios. Las tarjetas secundarias usan versiones WebP pequeñas y carga diferida. Las imágenes fallidas tienen un estado alternativo accesible. Las fuentes editoriales se revisan **manualmente**: no se promete una integración externa. Si un enlace falla, la ficha conserva la última fecha de revisión; ante un fallo de la API, se muestra un error y la opción de reintentar. La tipografía se solicita a Google Fonts con alternativas del sistema.

## Pruebas y compilación

```sh
npm test
npm run build
```

Las pruebas usan `TEST_DATABASE_URL` y rechazan bases cuyo nombre no termine en `_test`. **Vacían las tablas de esa base de prueba**; no uses allí datos que quieras conservar. Aplican las migraciones reales y comprueban:

1. Hashes, cookie HttpOnly, sesión y prevención de escalada de rol.
2. Filtros combinados, solapamiento de fechas, orden y paginación.
3. Validaciones de campos, fechas, URL y horarios.
4. CSRF, origen y permisos del backend.
5. Favoritos sin duplicados y persistencia tras cerrar e iniciar sesión.
6. Propuestas ocultas hasta su aprobación y retirada efectiva en todos los recorridos públicos.
7. Creación, edición, rechazo y notas privadas de moderación.
8. ICS con fin exclusivo para días completos, UTC para horarios, escape y plegado UTF-8.
9. Retirada de ejemplos y selección aleatoria solo de contenido publicado.

## Ejecución del build

Express sirve automáticamente `frontend/dist` y devuelve `index.html` para rutas de React cuando existe el build:

```sh
npm run build
npm start
```

Para probar el build localmente en `http://localhost:3001`, ajusta `CLIENT_ORIGIN` y `PUBLIC_URL` a ese origen y reinicia el servidor. En desarrollo normal usa `http://localhost:5173` con el proxy de Vite.

Para producción configura HTTPS, `NODE_ENV=production`, el origen y URL públicos, una base PostgreSQL gestionada y un secreto robusto. Usa `TRUST_PROXY=1` solo si Express está detrás de un proxy confiable. El servidor escucha en loopback: el proxy debe estar en el mismo host. El despliegue remoto, correo de recuperación/verificación y subida de archivos no forman parte de esta primera versión. No hay cuentas administrativas predeterminadas ni credenciales reales en `.env.example`.

Si falla la conexión, revisa el puerto y las credenciales, arranca PostgreSQL y consulta `/api/health`. Si el formulario indica sesión expirada, recarga para obtener un token CSRF nuevo. Usa siempre el mismo hostname y puerto configurados en `CLIENT_ORIGIN`.
