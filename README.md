# Flix Backend

API REST del proyecto **Flix** (plataforma de streaming de películas y series). Se encarga de la autenticación, la gestión de contenido reproducible, la lista personal del usuario, el historial de reproducción y la integración con TMDB y Mux.

> Este repositorio contiene **una sola aplicación**: el backend. El frontend vive en su propio repositorio: [flix-frontend](https://github.com/KevinMateoG/flix-frontend).

---

## Tabla de contenido

1. [Tecnologías y versiones](#1-tecnologías-y-versiones)
2. [Estructura del repositorio](#2-estructura-del-repositorio)
3. [Requisitos](#3-requisitos)
4. [Cómo descargar el proyecto](#4-cómo-descargar-el-proyecto)
5. [Variables de entorno](#5-variables-de-entorno)
6. [Ejecución local (sin Docker)](#6-ejecución-local-sin-docker)
7. [Ejecución con Docker](#7-ejecución-con-docker)
8. [Base de datos: migraciones y datos semilla](#8-base-de-datos-migraciones-y-datos-semilla)
9. [Scripts disponibles](#9-scripts-disponibles)
10. [Integración continua (Jenkins)](#10-integración-continua-jenkins)
11. [Documentación de la API](#11-documentación-de-la-api)

---

## 1. Tecnologías y versiones

| Tecnología | Versión | Uso |
| --- | --- | --- |
| Node.js | 22 (imagen `node:22-alpine`) | Entorno de ejecución |
| TypeScript | ^7.0.2 | Lenguaje (módulos ES, `"type": "module"`) |
| Express | ^5.2.1 | Framework HTTP |
| PostgreSQL | 17 (imagen `postgres:17-alpine`) | Base de datos |
| Drizzle ORM | ^1.0.0-rc.4 | ORM y definición del esquema |
| Drizzle Kit | ^1.0.0-rc.4 | Generación y ejecución de migraciones |
| pg (node-postgres) | ^8.23.0 | Driver de PostgreSQL |
| better-auth | ^1.7.5 | Autenticación |
| @mux/mux-node | ^15.2.0 | Video streaming (Mux) |
| cors | ^2.8.6 | Control de orígenes permitidos |
| dotenv | ^18.0.1 | Carga de variables de entorno |
| tsx | ^4.23.13 | Ejecución de TypeScript en desarrollo |
| nodemon | ^3.1.14 | Recarga automática en desarrollo |
| Docker / Docker Compose | — | Contenedores |
| Jenkins | — | Pipeline de CI/CD |

Servicios externos: [TMDB](https://www.themoviedb.org/) (metadatos de películas y series) y [Mux](https://www.mux.com/) (video).

---

## 2. Estructura del repositorio

```
flix-backend/
├── drizzle/                     # Migraciones generadas por Drizzle Kit
│   └── 20260920002617_.../
│       ├── migration.sql
│       └── snapshot.json
├── scripts/
│   ├── migrate-if-needed.mjs    # Aplica migraciones solo si hacen falta
│   ├── seed-data.mjs            # Carga datos iniciales desde los CSV
│   ├── playable-content.csv     # Contenido reproducible
│   ├── my-list.csv              # Datos de "Mi lista"
│   └── watch-history.csv        # Datos de historial de reproducción
├── src/                         # Código fuente de la API (punto de entrada: src/index.ts)
├── Dockerfile                   # Imagen multi-stage (build + runtime)
├── docker-compose.yml           # Backend + PostgreSQL
├── docker-compose.dev.yml       # Stack completo: backend + PostgreSQL + frontend
├── drizzle.config.ts            # Configuración de Drizzle Kit
├── Jenkinsfile                  # Pipeline de CI/CD
├── tsconfig.json
└── package.json
```

---

## 3. Requisitos

**Para ejecutar con Docker (recomendado):**

- [Docker](https://docs.docker.com/get-docker/) y Docker Compose v2 (`docker compose`).
- Un archivo `.env` con las variables descritas en la [sección 5](#5-variables-de-entorno).

**Para ejecutar en local sin Docker:**

- [Node.js 22](https://nodejs.org/) y npm.
- Una base de datos [PostgreSQL](https://www.postgresql.org/download/) 17 accesible (local o en contenedor).
- Credenciales de TMDB y Mux.

---

## 4. Cómo descargar el proyecto

### Opción A: clonar el repositorio

```bash
git clone https://github.com/KevinMateoG/flix-backend.git
cd flix-backend
```

### Opción B: descargar la imagen desde Docker Hub

```bash
docker pull kevinmateog/flix-backend:latest
```

---

## 5. Variables de entorno

Crea un archivo `.env` en la raíz del proyecto (el archivo está en `.gitignore` y `.dockerignore`, **no lo subas al repositorio**).

```env
# Servidor
PORT=3000
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000

# Base de datos (para ejecución local sin Docker)
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/flix

# Autenticación (better-auth)
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=<cadena-aleatoria-larga>

# TMDB
TMDB_API_KEY=<tu-api-key>
TMDB_READ_ACCESS_TOKEN=<tu-token>

# Mux
MUX_TOKEN_ID=<tu-token-id>
MUX_TOKEN_SECRET=<tu-token-secret>
PUBLIC_MUX_PLAYBACK_DOMAIN=<dominio-de-reproducción>

# PostgreSQL (usadas por docker-compose para crear la base de datos)
POSTGRES_DB=flix
POSTGRES_USER=flix_user
POSTGRES_PASSWORD=<contraseña-segura>
```

| Variable | Descripción |
| --- | --- |
| `PORT` | Puerto en el que escucha la API (por defecto `3000`). |
| `FRONTEND_URL` | URL del frontend (origen permitido). |
| `BACKEND_URL` | URL pública del backend. |
| `DATABASE_URL` | Cadena de conexión a PostgreSQL. **Con Docker Compose se construye automáticamente** a partir de `POSTGRES_*`. |
| `BETTER_AUTH_URL` | URL base de better-auth (por defecto `http://localhost:3000`). |
| `BETTER_AUTH_SECRET` | Secreto para firmar sesiones. Genera uno con `openssl rand -base64 32`. |
| `BETTER_AUTH_TRUSTED_ORIGINS` | *(Opcional, usada en Docker Compose)* Orígenes confiables separados por coma. Por defecto `http://localhost:5173,http://localhost:3000`. |
| `TMDB_API_KEY` / `TMDB_READ_ACCESS_TOKEN` | Credenciales de la API de TMDB. |
| `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET` | Credenciales de la API de Mux. |
| `PUBLIC_MUX_PLAYBACK_DOMAIN` | Dominio de reproducción de Mux. |
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` | Base de datos, usuario y contraseña del contenedor PostgreSQL. |
| `POSTGRES_PORT` | *(Opcional)* Puerto expuesto de PostgreSQL en el host (por defecto `5432`). |

---

## 6. Ejecución local (sin Docker)

```bash
# 1. Instalar dependencias
npm ci

# 2. Configurar variables de entorno (ver sección 5)
#    Asegúrate de que DATABASE_URL apunte a un PostgreSQL en ejecución.

# 3. Aplicar migraciones
npx drizzle-kit migrate

# 4. Iniciar en modo desarrollo (recarga automática)
npm run dev
```

La API quedará disponible en `http://localhost:3000`.

**Compilar y ejecutar en modo producción:**

```bash
npm run build   # Compila TypeScript con tsc
npm start       # Ejecuta el código compilado con Node
```

---

## 7. Ejecución con Docker

### 7.1. Backend + PostgreSQL (`docker-compose.yml`)

Levanta la API (usando la imagen `kevinmateog/flix-backend` de Docker Hub) junto con un contenedor PostgreSQL 17.

```bash
# Con el .env ya creado (debe incluir POSTGRES_DB, POSTGRES_USER y POSTGRES_PASSWORD)
docker compose up -d

# Ver logs
docker compose logs -f backend

# Detener
docker compose down            # conserva los datos
docker compose down -v         # elimina también el volumen de la base de datos
```

- API: `http://localhost:3000`
- PostgreSQL: `localhost:5432`
- Al iniciar, el contenedor del backend **ejecuta automáticamente** las migraciones (`migrate-if-needed.mjs`) y carga los datos semilla (`seed-data.mjs`) antes de arrancar el servidor.
- El backend espera a que PostgreSQL esté saludable (`healthcheck`) antes de iniciar, y expone su propio `healthcheck` sobre `GET /`.

### 7.2. Stack completo: backend + base de datos + frontend (`docker-compose.dev.yml`)

Este archivo levanta los tres servicios (imágenes `kevinmateog/flix-backend`, `postgres:17-alpine` y `kevinmateog/flix-frontend`). Lee los archivos `.env` de **ambos** repositorios, por lo que deben estar clonados **uno al lado del otro**:

```
proyecto/
├── flix-backend/     # con su .env
└── flix-frontend/    # con su .env
```

```bash
cd flix-backend
docker compose -f docker-compose.dev.yml up -d
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- PostgreSQL: `localhost:5432`

Si no defines `POSTGRES_DB`, `POSTGRES_USER` ni `POSTGRES_PASSWORD`, este compose usa valores por defecto de desarrollo (`flix`, `flix_user`, `flix_1234_`). **No uses esos valores en producción.**

### 7.3. Construir la imagen manualmente

```bash
docker build -t kevinmateog/flix-backend:latest .
```

El `Dockerfile` es multi-stage: compila el proyecto con `npm run build` en una etapa y genera una imagen final ligera con `node:22-alpine`, que expone el puerto `3000`.

---

## 8. Base de datos: migraciones y datos semilla

- El esquema se define en `src/db/schema.ts` y las migraciones se guardan en `drizzle/`.
- Configuración: `drizzle.config.ts` (dialecto `postgresql`, usa `DATABASE_URL`).
- Con Docker, las migraciones y el seed corren automáticamente al iniciar el contenedor.
- Los datos iniciales se cargan desde los CSV de `scripts/` (`playable-content.csv`, `my-list.csv`, `watch-history.csv`).

Comandos manuales:

```bash
# Generar una nueva migración tras modificar el esquema
npx drizzle-kit generate

# Aplicar migraciones
npx drizzle-kit migrate

# Aplicar migraciones solo si hacen falta + cargar datos semilla
node scripts/migrate-if-needed.mjs
node scripts/seed-data.mjs
```

---

## 9. Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia el servidor en desarrollo con `nodemon` + `tsx`. |
| `npm run build` | Compila el proyecto TypeScript a `dist/`. |
| `npm start` | Ejecuta la versión compilada. |

---

## 10. Integración continua (Jenkins)

El `Jenkinsfile` define un pipeline con las siguientes etapas:

1. **Npm Install**: `npm ci` dentro de `node:22-alpine`.
2. **Build**: `npm run build`.
3. **Docker Build**: construye la imagen con las etiquetas `kevinmateog/flix-backend:$BUILD_NUMBER` y `kevinmateog/flix-backend:latest`.
4. **Docker Push**: inicia sesión en Docker Hub y publica `kevinmateog/flix-backend:latest`.

**Requisitos del servidor Jenkins:** Docker instalado y accesible para el agente, y una credencial de tipo *Username with password* con ID `dockerHub` que contenga las credenciales de Docker Hub.

---

## 11. Documentación de la API

La documentación de la API está implementada con **Swagger (OpenAPI 3.0)**:

- **Swagger UI interactivo** (con el servidor en ejecución): `http://localhost:3000/api-docs`
- **Especificación OpenAPI 3.0 en JSON (endpoint)**: `http://localhost:3000/api-docs.json`
- **Especificación OpenAPI 3.0 estática**: [api-docs/openapi.json](api-docs/openapi.json)
- **Referencia detallada en Markdown**: [api-docs/README.md](api-docs/README.md)

---

## Repositorios relacionados

- Frontend: [KevinMateoG/flix-frontend](https://github.com/KevinMateoG/flix-frontend)