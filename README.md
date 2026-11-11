# Flix — Backend (Plataforma de Streaming de Películas y Series)

API REST del proyecto **Flix**, una plataforma full-stack de streaming y descubrimiento de películas y series desarrollada como Proyecto de Aula de Desarrollo Web Full-Stack (2026-2). Implementada en **Node.js**, **Express** y **TypeScript** bajo **Clean Architecture (Arquitectura Limpia en 4 capas)** y preparada para despliegue Serverless en **Vercel** conectado a **Neon (PostgreSQL Serverless)**.

Se conecta de forma integral con el [frontend de Flix](https://github.com/KevinMateoG/flix-frontend) (Next.js 16 App Router), gestionando la autenticación robusta mediante **Better Auth** con sesiones y control de acceso basado en roles (`admin` y `user`), almacenamiento de imágenes en un **Bucket S3** (Neon Object Storage), catálogo reproducible con streaming HLS de **Mux** y metadatos sincronizados con **TMDB**.

---

## Tabla de contenido

1. [Enlaces del proyecto y despliegues en producción](#1-enlaces-del-proyecto-y-despliegues-en-producción)
2. [Credenciales de prueba (Seed)](#2-credenciales-de-prueba-seed)
3. [Reparto del trabajo](#3-reparto-del-trabajo)
4. [Descripción del dominio, recursos y roles](#4-descripción-del-dominio-recursos-y-roles)
5. [Arquitectura del Backend (Clean Architecture - 4 capas)](#5-arquitectura-del-backend-clean-architecture---4-capas)
6. [Base de datos (Neon PostgreSQL) y migraciones](#6-base-de-datos-neon-postgresql-y-migraciones)
7. [Autenticación, Seguridad y Control de Acceso (401 y 403)](#7-autenticación-seguridad-y-control-de-acceso-401-y-403)
8. [Subida de imágenes a Bucket S3](#8-subida-de-imágenes-a-bucket-s3)
9. [Documentación de la API (Swagger y Markdown)](#9-documentación-de-la-api-swagger-y-markdown)
10. [Tecnologías utilizadas](#10-tecnologías-utilizadas)
11. [Requisitos previos](#11-requisitos-previos)
12. [Variables de entorno](#12-variables-de-entorno)
13. [Instalación y ejecución local](#13-instalación-y-ejecución-local)
14. [Pruebas automatizadas (Smoke Tests y Contratos)](#14-pruebas-automatizadas-smoke-tests-y-contratos)
15. [Despliegue en Vercel](#15-despliegue-en-vercel)
16. [Scripts disponibles](#16-scripts-disponibles)

---

## 1. Enlaces del proyecto y despliegues en producción

| Elemento | Plataforma | Enlace |
| --- | --- | --- |
| **Backend / API desplegada (Producción)** | Vercel | `[PEGAR_LINK_BACKEND_VERCEL_AQUI]` |
| **Frontend desplegado (Producción)** | Vercel | `[PEGAR_LINK_FRONTEND_VERCEL_AQUI]` |
| **Swagger UI Interactivo (API Docs)** | Vercel / Local | `[URL_BACKEND]/api-docs` |
| **Especificación OpenAPI 3.0 (JSON)** | Vercel / Local | `[URL_BACKEND]/api-docs.json` |
| **Repositorio Backend** | GitHub | [https://github.com/KevinMateoG/flix-backend](https://github.com/KevinMateoG/flix-backend) |
| **Repositorio Frontend** | GitHub | [https://github.com/KevinMateoG/flix-frontend](https://github.com/KevinMateoG/flix-frontend) |

---

## 2. Credenciales de prueba (Seed)

Tras ejecutar `npm run db:seed` en el backend (conectado a **Neon PostgreSQL**), se crean automáticamente los siguientes usuarios de prueba (contraseña para todas las cuentas: `Flix1234!`):

| Rol | Correo | Contraseña | Descripción y Permisos |
| --- | --- | --- | --- |
| `admin` | `test1@flix.local` | `Flix1234!` | Acceso completo administrativo. Autorizado para rutas `/api/admin/*`, creación, edición y borrado lógico de recursos. |
| `user` | `test2@flix.local` | `Flix1234!` | Usuario estándar. Acceso a catálogo, streaming, Mi Lista, historial y perfil. Recibe **`403 Forbidden`** al intentar acceder a endpoints administrativos. |
| `user` | `test3@flix.local` | `Flix1234!` | Usuario estándar secundario para pruebas multi-perfil y listas personalizadas. |
| `user` | `test4@flix.local` | `Flix1234!` | Usuario estándar para pruebas de streaming y continuidad de reproducción. |

> **Nota de seguridad:** Las contraseñas están almacenadas mediante funciones criptográficas de derivación de claves (`better-auth/crypto`) con hash seguro y salt. Ninguna respuesta de la API expone contraseñas ni sus hashes. El rol `admin` no puede registrarse desde el formulario público de registro (el campo `role` está protegido y fijado por defecto en `user`).

---

## 3. Reparto del trabajo

El reparto del trabajo es consistente y coordinado en ambos repositorios del proyecto:

| Integrante | Responsabilidades y módulos construidos |
| --- | --- |
| **Juan José Ocampo** | • **CRUD completo en recursos del dominio, borrado lógico y paginación `{ data, pagination }`:** Implementación y estandarización de operaciones (`GET`, `POST`, `PUT/PATCH`, `DELETE`) en los recursos del dominio con borrado lógico (`status` / `isActive`).<br>• **Paginación estándar y filtros:** Estandarización de respuestas paginadas `{ data, pagination: { total, currentPage, limit, totalPages } }` con validación estricta de parámetros numéricos positivos (`page`, `limit`) y filtros de consulta.<br>• **Integración de catálogo paginado y control de rol:** Soporte de la respuesta paginada desde `/api/movies` y soporte para la verificación de permisos en el backend y frontend. |
| **Emanuel García Ríos** | • **Subida de imágenes como archivo a Bucket S3:** Implementación del flujo multipart (`multer`) y servicio de almacenamiento S3 compatible con Neon Object Storage para subir avatares de perfil (JPEG/PNG/WebP, máx. 2MB, validación de firma mágica binaria), guardando la URL pública en Neon DB y eliminando archivos previos.<br>• **Autenticación, sesiones y control de roles (401 y 403):** Integración de sesiones con Better Auth, cookies seguras, middleware de autenticación (`req.userId`, `req.userRole`) y middleware de autorización `requireRole('admin')` que responde `403 Forbidden`.<br>• **Avatar por defecto:** Generación y exposición de avatar gris anónimo por defecto (`/static/default-avatar.svg`) ante perfiles sin imagen personalizada. |
| **Kevin Mateo Gómez** | • **Diseño y estructuración bajo Clean Architecture (4 capas):** Definición de la estructura modular desacoplada: `domain/`, `application/`, `infrastructure/` e `interface/`, asegurando inversión de dependencias y aislamiento de reglas de negocio.<br>• **Integración con Neon DB (PostgreSQL Serverless) y Drizzle ORM:** Modelado del esquema relacional, constraints `CHECK`, índices compuestos y configuración de Drizzle Kit para migraciones reproducibles.<br>• **Servicios externos y adaptadores:** Integración del SDK de Mux para generación de URLs de streaming HLS (`.m3u8`) y cliente TMDB para metadatos de películas y series. |
| **Kevin Cifuentes** | • **Documentación OpenAPI 3.0 / Swagger y pruebas automatizadas:** Definición e implementación de la especificación Swagger interactiva en `/api-docs`, exportación JSON y suite de smoke tests automatizados con Node Test Runner (`tests/clean-architecture.smoke.test.ts`).<br>• **Scripts de migración y seed:** Creación de `scripts/seed-data.mjs` y `scripts/migrate-if-needed.mjs` para carga masiva desde CSV (`playable-content.csv`, `my-list.csv`, `watch-history.csv`) y sincronización de secuencias PostgreSQL.<br>• **Calidad de código y despliegue Serverless:** Configuración de Vercel (`vercel.json`), tipado TypeScript estricto y estandarización de manejo de errores HTTP (`AppError`). |

---

## 4. Descripción del dominio, recursos y roles

**Flix** es una plataforma de streaming y descubrimiento multimedia en la que los usuarios exploran títulos organizados por región, visualizan avances y reproducciones HLS, configuran su perfil personal, gestionan su lista de seguimiento e historial, mientras los administradores gestionan el catálogo.

### Recursos del dominio (con relaciones por llave foránea en Neon DB)

1. **Usuarios y Cuentas (`user`, `account`, `session`):** Entidades de autenticación gestionadas por Better Auth con llaves foráneas en cascada. El modelo `user` incluye el campo `role` (`'admin' | 'user'`).
2. **Perfiles (`profiles`):** Recurso asociado 1:1 con `user` (`FOREIGN KEY (id) REFERENCES "user"("id") ON DELETE CASCADE`). Almacena preferencias de idioma, clasificación por edad (`maturityRating`), control parental (`isKids`), región geográfica y las rutas y URLs del avatar (`avatar_url`, `avatar_path`).
3. **Catálogo de Contenido Reproducible (`playable_content`):** Películas y series habilitadas para reproducción vía Mux, identificadas por su `tmdb_id`, con `mux_playback_id`, `mux_asset_id` y arreglo de regiones permitidas (`available_regions`).
4. **Mi Lista (`my_list`):** Colección personal de favoritos del usuario (`FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE`).
5. **Historial de Reproducción (`watch_history`):** Registro de progreso por título, temporada y episodio (`FOREIGN KEY (user_id) REFERENCES "user"(id)` y `FOREIGN KEY (profile_id) REFERENCES profiles(id)`), con índice único compuesto para upsert de reproducción.
6. **Preferencias de No Me Gusta (`dislikes`):** Registro de exclusiones de recomendaciones (`FOREIGN KEY (profile_id) REFERENCES profiles(id)`).

### Roles del sistema

| Rol | Capacidades y Alcance |
| --- | --- |
| `admin` | Acceso irrestricto. Puede acceder a endpoints administrativos (`/api/admin/*`), gestionar el catálogo y realizar mutaciones críticas. Creado exclusivamente vía script `seed`. |
| `user` | Acceso estándar. Puede autenticarse, consultar catálogo y streams según su región, administrar su avatar, preferencias de perfil, historial y Mi Lista. Si intenta invocar rutas administrativas recibe un código **`403 Forbidden`**. |

---

## 5. Arquitectura del Backend (Clean Architecture - 4 capas)

El backend está organizado estrictamente en **cuatro capas concéntricas**, garantizando que la lógica de negocio no dependa de frameworks, bases de datos ni servicios externos:

```text
flix-backend/
├── drizzle/                                 # Migraciones SQL versionadas (Drizzle Kit)
├── scripts/
│   ├── migrate-if-needed.mjs                # Verificación y aplicación segura de migraciones
│   ├── seed-data.mjs                        # Carga de datos semilla (usuarios, catálogo, listas, historial)
│   ├── playable-content.csv                 # Catálogo semilla inicial
│   ├── my-list.csv                          # Semilla para Mi Lista
│   └── watch-history.csv                    # Semilla para historial de reproducción
├── src/
│   ├── domain/                              # CAPA 1: DOMINIO (Reglas e Interfaces puras)
│   │   ├── models/                          # Entidades TypeScript (User, Profile, PlayableContent, etc.)
│   │   ├── repository/                      # Puertos / Interfaces de Repositorios (ProfileRepository, etc.)
│   │   └── storage/                         # Puertos para almacenamiento de archivos (AvatarStorage)
│   ├── application/                         # CAPA 2: APLICACIÓN (Casos de Uso)
│   │   ├── auth.use-case.ts                 # Orquestación de sesiones e inicialización de perfiles
│   │   ├── profile.use-case.ts              # Reglas de perfil, validación y reemplazo de avatares
│   │   ├── catalog.use-case.ts              # Reglas de consulta de catálogo reproducible
│   │   ├── playback.use-case.ts             # Generación de URLs seguras HLS con Mux
│   │   ├── history.use-case.ts              # Lógica de progreso y estado completado (90%)
│   │   ├── library.use-case.ts              # Gestión de Mi Lista y Dislikes
│   │   ├── tmdb.use-case.ts                 # Orquestación de metadatos de TMDB
│   │   ├── pagination.ts                    # Formato estándar { data, pagination }
│   │   └── errors/                          # Clases de error de negocio (AppError) y validadores
│   ├── infrastructure/                      # CAPA 3: INFRAESTRUCTURA (Adaptadores y Drivers)
│   │   ├── auth/                            # Adaptador Better Auth y manejo de cookies
│   │   ├── dtos/                            # Data Transfer Objects y transformadores
│   │   ├── repository/                      # Implementaciones Drizzle ORM sobre Neon DB
│   │   │   ├── client.ts                    # Conexión pg pool con SSL para Neon
│   │   │   ├── schema.ts                    # Definición de tablas, constraints e índices en Drizzle
│   │   │   └── drizzle-*.repository.ts      # Repositorios concretos
│   │   └── services/                        # Adaptadores de clientes externos
│   │       ├── s3-avatar-storage.service.ts # Implementación de S3 para Neon Object Storage
│   │       ├── mux.service.ts               # Integración con el SDK de Mux
│   │       └── tmdb.service.ts              # Cliente HTTP para The Movie Database
│   ├── interface/                           # CAPA 4: INTERFAZ / ADAPTADORES PRIMARIOS
│   │   ├── assets/                          # Activos estáticos servidos (default-avatar.svg)
│   │   ├── controllers/                     # Controladores HTTP desacoplados
│   │   ├── middlewares/                     # Middlewares Express (auth, role, upload, error)
│   │   └── routers/                         # Definición y montaje de rutas Express
│   │       ├── app.router.ts                # Fábrica de la aplicación Express
│   │       ├── admin.router.ts              # Rutas protegidas por rol admin (403)
│   │       ├── profile.router.ts            # Rutas de perfil y subida de avatar
│   │       └── swagger.ts                   # Especificación OpenAPI 3.0.3 embebida
│   └── index.ts                             # Entry point: composición de dependencias (DI)
├── tests/                                   # Pruebas automatizadas (Smoke Tests y Contratos)
│   └── clean-architecture.smoke.test.ts
├── api-docs/                                # Documentación de API estática
│   ├── openapi.json                         # Especificación OpenAPI 3.0 en JSON independiente
│   └── README.md                            # Guía completa de endpoints en Markdown
├── drizzle.config.ts                        # Configuración de Drizzle Kit
├── vercel.json                              # Configuración Serverless para Vercel
├── .env.example                             # Plantilla de variables de entorno seguras
├── tsconfig.json                            # Configuración estricta de TypeScript
└── package.json
```

---

## 6. Base de datos (Neon PostgreSQL) y migraciones

El sistema utiliza **Neon DB** (PostgreSQL Serverless en la nube) con SSL obligatorio (`sslmode=require`). 

- El esquema se define de forma tipada en `src/infrastructure/repository/schema.ts`.
- Las migraciones SQL versionadas son generadas y ejecutadas mediante **Drizzle Kit**.
- Integridad referencial con llaves foráneas (`ON DELETE CASCADE`), restricciones `CHECK` para roles (`CHECK (role IN ('admin', 'user'))`) e índices compuestos únicos (ej. `watch_history_profile_content_episode_idx` para garantizar consistencia sin duplicación).

### Comandos de base de datos:

```bash
# 1. Generar nueva migración SQL tras modificar el esquema
npx drizzle-kit generate

# 2. Aplicar migraciones pendientes directamente en Neon DB
npx drizzle-kit migrate

# 3. Aplicar migraciones y sembrar datos de prueba (usuarios, catálogo, listas)
npm run db:migrate
npm run db:seed
```

---

## 7. Autenticación, Seguridad y Control de Acceso (401 y 403)

La autenticación está delegada en **Better Auth**, el cual gestiona sesiones persistentes en base de datos (`session` y `account` en Neon):

1. **Sesiones y Tokens:** Tras `POST /api/auth/sign-in/email` o `POST /api/auth/sign-up/email`, se emite una cookie segura de sesión (`better-auth.session_token`). El backend también soporta autenticación mediante cabecera HTTP estándar `Authorization: Bearer <token>`.
2. **Middleware de Autenticación (`authMiddleware`):** Centralizado en `src/interface/middlewares/auth.middleware.ts`. Inspecciona las credenciales y adjunta `req.userId`, `req.userRole` y `req.sessionId`. Ante peticiones no autenticadas a rutas protegidas, responde inmediatamente con **`401 Unauthorized`**.
3. **Middleware de Autorización de Rol (`requireRole`):** Implementado en `src/interface/middlewares/role.middleware.ts`:
   ```typescript
   export function requireRole(...allowedRoles: UserRole[]) {
     return function roleMiddleware(req: Request, _res: Response, next: NextFunction): void {
       if (!req.userRole || !allowedRoles.includes(req.userRole)) {
         next(AppError.forbidden("Forbidden: insufficient permissions"));
         return;
       }
       next();
     };
   }
   ```
   Si un usuario autenticado con rol `user` intenta acceder a cualquier ruta del router administrativo (`/api/admin/*`), el middleware detiene la petición y devuelve **`403 Forbidden`** con el formato estándar `{ "error": "Forbidden: insufficient permissions" }`.
4. **Manejo Centralizado de Errores:** `src/interface/middlewares/error.middleware.ts` intercepta todas las excepciones (`AppError`, errores de validación y de base de datos), retornando códigos HTTP semánticos (`400`, `401`, `403`, `404`, `409`, `413`) sin exponer nunca trazas internas ni stack traces.

---

## 8. Subida de imágenes a Bucket S3

El proyecto cumple con el requerimiento de subida de archivos binarios a almacenamiento S3 (no ingreso de URLs de texto a mano):

- **Recepción multipart con `multer`:** `src/interface/middlewares/avatar-upload.middleware.ts` procesa la carga en memoria (`storage: multer.memoryStorage()`) bajo el campo multipart `avatar`.
- **Validaciones de archivo en aplicación:**
  - Formatos admitidos: `image/jpeg`, `image/png`, `image/webp`.
  - Tamaño máximo permitido: **2 MB** (peticiones mayores son rechazadas con **`413 Payload Too Large`**).
  - Validación de firma binaria (*magic numbers*): Se inspeccionan los bytes del buffer para certificar que el archivo coincide con su tipo declarado y no es un ejecutable disfrazado.
- **Neon Object Storage / S3 Adapter:** `src/infrastructure/services/s3-avatar-storage.service.ts` utiliza `@aws-sdk/client-s3` con `forcePathStyle: true` y sube el archivo con una clave única estructurada: `${userId}/${randomUUID()}.${ext}`.
- **Persistencia en Neon DB:** Se actualizan en la tabla `profiles` los campos `avatar_url` (URL pública directa del objeto en el bucket) y `avatar_path` (clave de almacenamiento). Si el usuario ya contaba con un avatar anterior, este se elimina automáticamente del bucket para evitar archivos huérfanos.
- **Avatar por defecto:** Cuando un usuario no ha subido foto o elimina su avatar actual (`DELETE /api/profile/avatar`), el backend devuelve la URL del avatar predeterminado en SVG (`/static/default-avatar.svg`), garantizando una experiencia visual impecable.

---

## 9. Documentación de la API (Swagger y Markdown)

La API cuenta con documentación completa en múltiples formatos:

- **Documentación de referencia en Markdown:** Consulta la guía detallada de endpoints, parámetros, cuerpos de petición y modelos de datos en:
  👉 **[api-docs/README.md](api-docs/README.md)**
- **Swagger UI Interactivo:** Disponible al iniciar el backend ingresando a:
  👉 `http://localhost:3000/api-docs` (o en la URL de producción correspondiente).
- **Especificación OpenAPI 3.0 en formato JSON:**
  - En tiempo de ejecución: `GET /api-docs.json`
  - Archivo estático descargable: [api-docs/openapi.json](api-docs/openapi.json)

---

## 10. Tecnologías utilizadas

| Tecnología | Versión | Propósito en el Backend |
| --- | --- | --- |
| **Node.js** | 22 | Entorno de ejecución en servidor |
| **TypeScript** | ^7.0.2 | Tipado estático estricto (ES Modules) |
| **Express** | ^5.2.1 | Framework HTTP y enrutamiento modular |
| **Neon PostgreSQL** | Serverless | Base de datos relacional PostgreSQL en la nube |
| **Drizzle ORM** | ^1.0.0-rc.4 | Mapeo objeto-relacional y consultas seguras |
| **Drizzle Kit** | ^1.0.0-rc.4 | Generador y ejecutor de migraciones SQL |
| **Better Auth** | ^1.7.5 | Autenticación, gestión de sesiones y control de roles |
| **@aws-sdk/client-s3** | ^3.1164.0 | Cliente S3 para Neon Object Storage |
| **Multer** | ^2.5.0 | Procesamiento de subida de archivos multipart |
| **@mux/mux-node** | ^15.2.0 | Generación de streaming seguro HLS para video |
| **Swagger UI Express** | ^5.0.1 | Interfaz gráfica interactiva de documentación OpenAPI |
| **pg** | ^8.23.0 | Driver de conexión nativo a PostgreSQL con soporte SSL |

---

## 11. Requisitos previos

- **Node.js** versión 22 o superior y **npm**.
- Una instancia activa de **Neon PostgreSQL** con soporte SSL habilitado.
- Credenciales para **Neon Object Storage** o servicio S3 compatible.
- Clave de API de **The Movie Database (TMDB)**.
- Token de acceso a **Mux** para video streaming.

---

## 12. Variables de entorno

Copia el archivo `.env.example` para crear tu `.env` local. El archivo `.env` está protegido en `.gitignore` y **nunca debe subirse al control de versiones**.

```env
# Servidor
PORT=3000
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000

# Base de datos (Neon PostgreSQL Serverless)
DATABASE_URL="postgresql://neondb_owner:password@ep-example-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Autenticación (Better Auth)
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=tu-clave-secreta-de-al-menos-32-caracteres
BETTER_AUTH_TRUSTED_ORIGINS=http://localhost:5173,http://localhost:3000

# TMDB (Metadatos de Películas y Series)
TMDB_BASE_URL=https://api.themoviedb.org/3
TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p
TMDB_READ_ACCESS_TOKEN=tu-read-access-token-de-tmdb
TMDB_API_KEY=tu-api-key-de-tmdb

# Mux (Streaming HLS)
MUX_TOKEN_ID=tu-mux-token-id
MUX_TOKEN_SECRET=tu-mux-token-secret
PUBLIC_MUX_PLAYBACK_DOMAIN=stream.mux.com

# Almacenamiento S3 (Neon Object Storage - Bucket avatars con acceso public_read)
AWS_ENDPOINT_URL_S3="https://br-tu-branch.storage.c-9.us-east-2.aws.neon.tech"
AWS_ACCESS_KEY_ID="tu-key-id"
AWS_SECRET_ACCESS_KEY="tu-secret-key"
AWS_REGION="us-east-2"
AVATARS_BUCKET="avatars"
```

---

## 13. Instalación y ejecución local

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/KevinMateoG/flix-backend.git
   cd flix-backend
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar el entorno:**
   ```bash
   cp .env.example .env
   # Edita .env con tus credenciales de Neon, S3, TMDB y Mux
   ```

4. **Aplicar migraciones y cargar datos semilla (Seed) en Neon DB:**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. **Iniciar en modo desarrollo con recarga en caliente:**
   ```bash
   npm run dev
   ```
   La API quedará escuchando en `http://localhost:3000` y la documentación interactiva estará disponible en `http://localhost:3000/api-docs`.

---

## 14. Pruebas automatizadas (Smoke Tests y Contratos)

El proyecto incluye una suite automatizada de pruebas sin dependencias de bases de datos externas (`tests/clean-architecture.smoke.test.ts`), implementada con el test runner nativo de Node.js:

- Valida la disponibilidad del endpoint raíz `/`.
- Comprueba la barrera de seguridad de autenticación (`401 Unauthorized` ante peticiones sin sesión).
- **Comprueba el control de acceso basado en roles:**
  - Sin sesión en `/api/admin/ping` → `401 Unauthorized`.
  - Con sesión de usuario normal (`role = 'user'`) → **`403 Forbidden`**.
  - Con sesión de administrador (`role = 'admin'`) → **`200 OK`**.
- Verifica contratos de perfil, validaciones de configuración, Mi Lista, historial y streaming de catálogo.

Para ejecutar las pruebas:
```bash
npm test
```

---

## 15. Despliegue en Vercel

1. Importa el repositorio `flix-backend` en la consola de [Vercel](https://vercel.com/).
2. Configura las variables de entorno detalladas en la [Sección 12](#12-variables-de-entorno) en **Project Settings → Environment Variables**.
3. El archivo `vercel.json` enrutará automáticamente todas las peticiones entrantes hacia la función Serverless generada desde `src/index.ts`:
   ```json
   {
     "$schema": "https://openapi.vercel.sh/vercel.json",
     "rewrites": [
       {
         "source": "/(.*)",
         "destination": "/src/index.ts"
       }
     ]
   }
   ```
4. Despliega la aplicación y prueba los endpoints accediendo a `/api-docs` en tu dominio de producción.

---

## 16. Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia el servidor de desarrollo con `nodemon` y `tsx`. |
| `npm run build` | Compila el código TypeScript a JavaScript en el directorio `dist/`. |
| `npm start` | Ejecuta el servidor compilado en producción (`node dist/src/index.js`). |
| `npm test` | Ejecuta la suite de smoke tests automatizados y contratos de arquitectura. |
| `npm run db:migrate` | Verifica y aplica migraciones SQL pendientes en Neon DB. |
| `npm run db:seed` | Inserta los datos iniciales de prueba (usuarios, roles, catálogo e historial) en Neon DB. |

---

## Repositorios relacionados

- **Frontend:** [https://github.com/KevinMateoG/flix-frontend](https://github.com/KevinMateoG/flix-frontend)
- **Backend:** [https://github.com/KevinMateoG/flix-backend](https://github.com/KevinMateoG/flix-backend)
