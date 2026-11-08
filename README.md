# Flix Backend

API REST del proyecto **Flix** (plataforma de streaming de películas y series). Se encarga de la autenticación, la gestión de contenido reproducible, la lista personal del usuario, el historial de reproducción y la integración con TMDB y Mux, implementada bajo **Clean Architecture (4 capas)** y lista para desplegar en **Vercel** con **Neon DB**.

> Este repositorio contiene **una sola aplicación**: el backend. El frontend vive en su propio repositorio: [flix-frontend](https://github.com/KevinMateoG/flix-frontend).

---

## Tabla de contenido

1. [Tecnologías y versiones](#1-tecnologías-y-versiones)
2. [Estructura del repositorio (Clean Architecture)](#2-estructura-del-repositorio-clean-architecture)
3. [Requisitos](#3-requisitos)
4. [Variables de entorno](#4-variables-de-entorno)
5. [Ejecución local](#5-ejecución-local)
6. [Base de datos en Neon DB: migraciones y datos semilla](#6-base-de-datos-en-neon-db-migraciones-y-datos-semilla)
7. [Despliegue en Vercel](#7-despliegue-en-vercel)
8. [Scripts disponibles](#8-scripts-disponibles)
9. [Documentación de la API](#9-documentación-de-la-api)

---

## 1. Tecnologías y versiones

| Tecnología | Versión | Uso |
| --- | --- | --- |
| Node.js | 22 | Entorno de ejecución |
| TypeScript | ^7.0.2 | Lenguaje (módulos ES, `"type": "module"`) |
| Express | ^5.2.1 | Framework HTTP |
| Neon DB (PostgreSQL) | Serverless PostgreSQL | Base de datos en la nube |
| Drizzle ORM | ^1.0.0-rc.4 | ORM y definición del esquema |
| Drizzle Kit | ^1.0.0-rc.4 | Generación y ejecución de migraciones |
| pg (node-postgres) | ^8.23.0 | Driver de PostgreSQL con soporte SSL |
| better-auth | ^1.7.5 | Autenticación |
| @mux/mux-node | ^15.2.0 | Video streaming (Mux) |
| Vercel | Serverless Functions | Plataforma de despliegue |

Servicios externos: [TMDB](https://www.themoviedb.org/) (metadatos de películas y series), [Mux](https://www.mux.com/) (video) y [Neon DB](https://neon.tech/) (PostgreSQL Serverless).

---

## 2. Estructura del repositorio (Clean Architecture)

```text
flix-backend/
├── drizzle/                     # Migraciones generadas por Drizzle Kit
├── scripts/
│   ├── migrate-if-needed.mjs    # Aplica migraciones en Neon DB si hacen falta
│   ├── seed-data.mjs            # Carga datos iniciales desde los CSV en Neon DB
│   ├── playable-content.csv     # Contenido reproducible
│   ├── my-list.csv              # Datos de "Mi lista"
│   └── watch-history.csv        # Datos de historial de reproducción
├── src/                         # Código fuente en Clean Architecture (4 capas)
│   ├── domain/                  # Modelos e interfaces de repositorios (puertos)
│   ├── application/             # Casos de uso, paginación y errores de aplicación
│   ├── infrastructure/          # Drizzle + Neon DB, Better Auth, DTOs, TMDB y Mux
│   ├── interface/               # Controladores, middlewares y routers Express
│   └── index.ts                 # Composición de dependencias y exportación para Vercel
├── tests/                       # Smoke tests y pruebas de contrato
├── drizzle.config.ts            # Configuración de Drizzle Kit
├── vercel.json                  # Configuración de rutas Serverless para Vercel
├── .env.example                 # Plantilla de variables de entorno
├── tsconfig.json
└── package.json
```

---

## 3. Requisitos

- [Node.js 22](https://nodejs.org/) y npm.
- Un proyecto en [Neon DB](https://neon.tech/) (cadena de conexión PostgreSQL con `?sslmode=require`).
- Credenciales de TMDB y Mux.

---

## 4. Variables de entorno

Copia `.env.example` a `.env` en la raíz del proyecto (o configúralas en el panel de **Environment Variables** de Vercel):

```env
# Servidor
PORT=3000
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000

# Base de datos (Neon DB Serverless Postgres)
DATABASE_URL="postgresql://neondb_owner:password@ep-example-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Autenticación (better-auth)
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=<cadena-aleatoria-larga>
BETTER_AUTH_TRUSTED_ORIGINS=http://localhost:5173,http://localhost:3000

# TMDB
TMDB_API_KEY=<tu-api-key>
TMDB_READ_ACCESS_TOKEN=<tu-token>

# Mux
MUX_TOKEN_ID=<tu-token-id>
MUX_TOKEN_SECRET=<tu-token-secret>
PUBLIC_MUX_PLAYBACK_DOMAIN=stream.mux.com
```

| Variable | Descripción |
| --- | --- |
| `PORT` | Puerto en el que escucha la API en desarrollo local (por defecto `3000`). |
| `FRONTEND_URL` | URL del frontend (origen CORS permitido). |
| `BACKEND_URL` | URL pública del backend. |
| `DATABASE_URL` | Cadena de conexión a Neon DB (`postgresql://...?sslmode=require`). |
| `BETTER_AUTH_URL` | URL pública del backend usada por Better Auth. |
| `BETTER_AUTH_SECRET` | Secreto para firmar sesiones (`openssl rand -base64 32`). |
| `BETTER_AUTH_TRUSTED_ORIGINS` | Orígenes confiables separados por coma (ej. URL del frontend en Vercel y local). |
| `TMDB_API_KEY` / `TMDB_READ_ACCESS_TOKEN` | Credenciales de la API de TMDB. |
| `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET` | Credenciales de la API de Mux. |
| `PUBLIC_MUX_PLAYBACK_DOMAIN` | Dominio de reproducción de Mux (por defecto `stream.mux.com`). |

---

## 5. Ejecución local

```bash
# 1. Instalar dependencias
npm ci

# 2. Configurar .env con tu DATABASE_URL de Neon DB
cp .env.example .env

# 3. Aplicar migraciones y cargar datos semilla en Neon DB
npm run db:migrate
npm run db:seed

# 4. Iniciar en modo desarrollo (recarga automática)
npm run dev
```

La API quedará disponible en `http://localhost:3000`.

---

## 6. Base de datos en Neon DB: migraciones y datos semilla

- El esquema se define en `src/infrastructure/repository/schema.ts` y las migraciones se guardan en `drizzle/`.
- Configuración: `drizzle.config.ts` (dialecto `postgresql`, usa `DATABASE_URL`).
- Los datos iniciales se cargan desde los CSV de `scripts/` (`playable-content.csv`, `my-list.csv`, `watch-history.csv`).

Comandos disponibles:

```bash
# Generar una nueva migración tras modificar el esquema
npx drizzle-kit generate

# Aplicar migraciones directamente con Drizzle Kit
npx drizzle-kit migrate

# Aplicar migraciones si hacen falta + cargar datos semilla en Neon DB
npm run db:migrate
npm run db:seed
```

---

## 7. Despliegue en Vercel

1. Importa el repositorio `flix-backend` en [Vercel](https://vercel.com/).
2. Configura las variables de entorno de la [sección 4](#4-variables-de-entorno) en **Project Settings → Environment Variables** (`DATABASE_URL` apuntando a Neon DB, `FRONTEND_URL`, `BACKEND_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_TRUSTED_ORIGINS`, `TMDB_*` y `MUX_*`).
3. Vercel detectará `vercel.json` y el `export default app` de `src/index.ts` para servir todas las rutas como función Serverless.

---

## 8. Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia el servidor en desarrollo con `nodemon` + `tsx`. |
| `npm run build` | Compila el proyecto TypeScript a `dist/`. |
| `npm test` | Ejecuta la suite de smoke tests y contratos de arquitectura. |
| `npm start` | Ejecuta la versión compilada en `dist/src/index.js`. |
| `npm run db:migrate` | Verifica y aplica las migraciones pendientes en Neon DB. |
| `npm run db:seed` | Inserta los datos semilla iniciales en Neon DB. |

---

## 9. Documentación de la API

La documentación de la API está implementada con **Swagger (OpenAPI 3.0)**:

- **Swagger UI interactivo**: `/api-docs`
- **Especificación OpenAPI 3.0 en JSON (endpoint)**: `/api-docs.json`
- **Especificación OpenAPI 3.0 estática**: [api-docs/openapi.json](api-docs/openapi.json)
- **Referencia detallada en Markdown**: [api-docs/README.md](api-docs/README.md)

---

## Repositorios relacionados

- Frontend: [KevinMateoG/flix-frontend](https://github.com/KevinMateoG/flix-frontend)
