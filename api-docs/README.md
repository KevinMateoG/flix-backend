# Flix Backend API Documentation

Complete reference documentation and OpenAPI 3.0 (Swagger) specification for the Flix Backend REST API.

---

## Table of Contents

1. [Overview and Conventions](#1-overview-and-conventions)
   - [Base URL](#base-url)
   - [Data Format and Headers](#data-format-and-headers)
   - [Authentication and Session Management](#authentication-and-session-management)
   - [Standard Error Format](#standard-error-format)
2. [Swagger (OpenAPI 3.0) Guide](#2-swagger-openapi-30-guide)
   - [Interactive Swagger UI](#interactive-swagger-ui)
   - [OpenAPI 3.0 Specification Files](#openapi-30-specification-files)
   - [Authenticating Requests in Swagger UI](#authenticating-requests-in-swagger-ui)
3. [Endpoints Reference](#3-endpoints-reference)
   - [3.1 Health](#31-health)
   - [3.2 Authentication (`/api/auth`)](#32-authentication-apiauth)
   - [3.3 Movies and Playable Content (`/api/movies`)](#33-movies-and-playable-content-apimovies)
   - [3.4 TMDB Metadata (`/api/tmdb`)](#34-tmdb-metadata-apitmdb)
   - [3.5 Profile (`/api/profile`)](#35-profile-apiprofile)
   - [3.6 Watch History (`/api/watch-history`)](#36-watch-history-apiwatch-history)
   - [3.7 My List (`/api/my-list`)](#37-my-list-apimy-list)
   - [3.8 Dislikes (`/api/dislikes`)](#38-dislikes-apidislikes)
4. [Data Models](#4-data-models)

---

## 1. Overview and Conventions

### Base URL

In local development, the server listens on port `3000` by default (configurable via the `PORT` environment variable):

```text
http://localhost:3000
```

### Data Format and Headers

- All API request and response bodies use JSON (`application/json`), except for the root health check endpoint (`GET /`), which returns plain text.
- Timestamps are serialized as ISO 8601 UTC strings (for example, `2026-10-18T18:00:00.000Z`).
- Country and region codes follow ISO 3166-1 alpha-2 format (for example, `US`, `MX`, `ES`).
- Language codes follow IETF BCP 47 / TMDB format (for example, `en-US`, `es-ES`).

### Authentication and Session Management

Authentication is powered by **Better Auth** (`better-auth`) mounted at `/api/auth`.

- **Public route groups**:
  - `GET /`
  - `/api-docs` and `/api-docs.json`
  - `/api/auth/*`
  - `/api/movies/*`
  - `/api/tmdb/*`
- **Protected route groups** (enforced by `authMiddleware`):
  - `/api/profile/*`
  - `/api/watch-history/*`
  - `/api/my-list/*`
  - `/api/dislikes/*`

When a user signs up (`POST /api/auth/sign-up/email`) or signs in (`POST /api/auth/sign-in/email`), Better Auth issues a session cookie (`better-auth.session_token`). `authMiddleware` validates the session from incoming request headers via `auth.api.getSession` and attaches `req.userId` and `req.sessionId` to the Express request object. If no valid session is present, protected endpoints respond with HTTP `401 Unauthorized`.

### Standard Error Format

Application routes return errors using a consistent JSON structure:

```json
{
  "error": "Descriptive error message"
}
```

| HTTP Status | Meaning |
| --- | --- |
| `200 OK` | Request succeeded. |
| `400 Bad Request` | Missing or invalid path, query, or body parameter. |
| `401 Unauthorized` | Missing or expired authentication session on a protected endpoint. |
| `404 Not Found` | Requested resource does not exist or does not belong to the authenticated user. |
| `500 Internal Server Error` | Unhandled server, database, or upstream provider error. |

---

## 2. Swagger (OpenAPI 3.0) Guide

The Flix Backend API is documented using the **OpenAPI 3.0.3** standard and served interactively via `swagger-ui-express`.

### Interactive Swagger UI

With the backend server running (`npm run dev` or via Docker), open the interactive Swagger UI in your browser:

```text
http://localhost:3000/api-docs
```

And the raw OpenAPI 3.0 JSON specification is served at:

```text
http://localhost:3000/api-docs.json
```

### OpenAPI 3.0 Specification Files

| File | Description |
| --- | --- |
| `src/lib/swagger.ts` | TypeScript module exporting `openApiSpec` mounted by Express at `/api-docs` and `/api-docs.json`. |
| `api-docs/openapi.json` | Standalone OpenAPI 3.0.3 JSON specification file suitable for importing into Swagger Editor, Postman, Insomnia, or code generators. |
| `api-docs/README.md` | Complete Markdown reference documentation of all endpoints and schemas. |

### Authenticating Requests in Swagger UI

1. Open `http://localhost:3000/api-docs` in your browser.
2. Expand **Auth > POST `/api/auth/sign-up/email`** or **POST `/api/auth/sign-in/email`**, click **Try it out**, and execute the request with valid credentials.
3. Because Swagger UI runs on the same origin (`http://localhost:3000`), the browser automatically stores the `better-auth.session_token` cookie and sends it with subsequent requests to protected routes (`/api/profile`, `/api/watch-history`, `/api/my-list`, `/api/dislikes`).
4. Alternatively, copy the `token` returned in the login response, click the **Authorize** button at the top of Swagger UI, and paste the token under `bearerAuth` or `cookieAuth`.

---

## 3. Endpoints Reference

### 3.1 Health

#### `GET /`

Checks whether the API process is alive. Used by Docker Compose healthchecks.

- **Authentication**: None
- **Response (`200 OK`, `text/html; charset=utf-8`)**:
  ```text
  Flix Backend OK
  ```

---

### 3.2 Authentication (`/api/auth`)

Handled by Better Auth (`toNodeHandler(auth)`). Below are the core email/password and session endpoints used by clients.

#### `POST /api/auth/sign-up/email`

Registers a new user with email and password. After user creation, a database hook automatically inserts a default profile row in `profiles` with `id = user.id`, `displayName = user.name`, and `region = "US"`.

- **Authentication**: None
- **Request Body (`application/json`)**:
  | Field | Type | Required | Description |
  | --- | --- | --- | --- |
  | `name` | `string` | Yes | User display name. |
  | `email` | `string` | Yes | User email address (must be unique). |
  | `password` | `string` | Yes | Account password. |
  | `image` | `string` | No | Optional URL for the user's avatar image. |

- **Example Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "password": "StrongPassword123!"
  }
  ```

- **Response (`200 OK`)**:
  ```json
  {
    "token": "session_token_string",
    "user": {
      "id": "user_id_string",
      "email": "jane.doe@example.com",
      "name": "Jane Doe",
      "image": null,
      "emailVerified": false,
      "createdAt": "2026-10-18T18:00:00.000Z",
      "updatedAt": "2026-10-18T18:00:00.000Z"
    }
  }
  ```

---

#### `POST /api/auth/sign-in/email`

Authenticates an existing user and establishes a session.

- **Authentication**: None
- **Request Body (`application/json`)**:
  | Field | Type | Required | Description |
  | --- | --- | --- | --- |
  | `email` | `string` | Yes | Registered email address. |
  | `password` | `string` | Yes | Account password. |
  | `rememberMe` | `boolean` | No | Whether to keep the session persistent. |

- **Example Request Body**:
  ```json
  {
    "email": "jane.doe@example.com",
    "password": "StrongPassword123!"
  }
  ```

- **Response (`200 OK`)**:
  ```json
  {
    "redirect": false,
    "token": "session_token_string",
    "user": {
      "id": "user_id_string",
      "email": "jane.doe@example.com",
      "name": "Jane Doe",
      "image": null,
      "emailVerified": false,
      "createdAt": "2026-10-18T18:00:00.000Z",
      "updatedAt": "2026-10-18T18:00:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: Invalid email or password.

---

#### `GET /api/auth/get-session`

Returns the current session and user associated with the request cookies or authorization header.

- **Authentication**: Session cookie (`better-auth.session_token`)
- **Response (`200 OK`)**:
  ```json
  {
    "session": {
      "id": "session_id_string",
      "userId": "user_id_string",
      "token": "session_token_string",
      "expiresAt": "2026-10-25T18:00:00.000Z",
      "ipAddress": "127.0.0.1",
      "userAgent": "Bruno",
      "createdAt": "2026-10-18T18:00:00.000Z",
      "updatedAt": "2026-10-18T18:00:00.000Z"
    },
    "user": {
      "id": "user_id_string",
      "email": "jane.doe@example.com",
      "name": "Jane Doe",
      "image": null,
      "emailVerified": false,
      "createdAt": "2026-10-18T18:00:00.000Z",
      "updatedAt": "2026-10-18T18:00:00.000Z"
    }
  }
  ```
  *(Returns `null` if no valid session is active.)*

---

#### `POST /api/auth/sign-out`

Revokes the active session and clears the session cookie.

- **Authentication**: Session cookie (`better-auth.session_token`)
- **Request Body (`application/json`)**:
  ```json
  {}
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true
  }
  ```

---

### 3.3 Movies and Playable Content (`/api/movies`)

Defined in `src/routes/movies.route.ts`. Queries the `playable_content` table and generates Mux HLS playback URLs.

#### `GET /api/movies`

Lists all playable content records, optionally filtered by region availability (`available_regions @> ARRAY[region]`).

- **Authentication**: None
- **Query Parameters**:
  | Parameter | Type | Required | Default | Description |
  | --- | --- | --- | --- | --- |
  | `region` | `string` | No | — | ISO 3166-1 alpha-2 country code (e.g., `US`). When omitted, returns all playable content. |

- **Response (`200 OK`)**:
  ```json
  [
    {
      "tmdbId": 157336,
      "muxPlaybackId": "qxb01i6T202018GGSNzgwtm00hzV02M4FbdQ344Xw2bU6I",
      "muxAssetId": null,
      "availableRegions": ["AD", "AE", "AR", "BR", "CA", "CO", "ES", "GB", "MX", "US"]
    }
  ]
  ```
- **Error Responses**:
  - `500 Internal Server Error`: `{ "error": "Internal Server Error" }`

---

#### `GET /api/movies/:tmdbId/playable`

Checks whether a specific title (`tmdbId`) is available for playback in a given region.

- **Authentication**: None
- **Path Parameters**:
  | Parameter | Type | Required | Description |
  | --- | --- | --- | --- |
  | `tmdbId` | `number` | Yes | Numeric TMDB identifier. |

- **Query Parameters**:
  | Parameter | Type | Required | Default | Description |
  | --- | --- | --- | --- | --- |
  | `region` | `string` | No | `US` | ISO 3166-1 alpha-2 country code. |

- **Response (`200 OK`)**:
  ```json
  {
    "playable": true
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{ "error": "tmdbId must be a number" }`
  - `500 Internal Server Error`: `{ "error": "Internal Server Error" }`

---

#### `GET /api/movies/:tmdbId/stream`

Retrieves the Mux playback metadata and HLS stream URL (`.m3u8`) for a playable title.

- **Authentication**: None
- **Path Parameters**:
  | Parameter | Type | Required | Description |
  | --- | --- | --- | --- |
  | `tmdbId` | `number` | Yes | Numeric TMDB identifier. |

- **Response (`200 OK`)**:
  ```json
  {
    "tmdbId": 157336,
    "muxPlaybackId": "qxb01i6T202018GGSNzgwtm00hzV02M4FbdQ344Xw2bU6I",
    "muxAssetId": null,
    "availableRegions": ["US", "CA", "GB"],
    "streamUrl": "https://stream.mux.com/qxb01i6T202018GGSNzgwtm00hzV02M4FbdQ344Xw2bU6I.m3u8"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{ "error": "tmdbId must be a number" }`
  - `404 Not Found`: `{ "error": "No playable content found for this tmdbId" }`
  - `500 Internal Server Error`: `{ "error": "Internal Server Error" }`

---

### 3.4 TMDB Metadata (`/api/tmdb`)

Defined in `src/routes/tmdb.route.ts`. Proxies requests to The Movie Database (TMDB) v3 API using the server's `TMDB_API_KEY`.

#### `GET /api/tmdb/search`

Performs a multi-search (`/search/multi` with `include_adult=false`) across movies, TV series, and people. If `q` is omitted or has fewer than 2 non-whitespace characters, returns `{ "results": [] }` immediately.

- **Authentication**: None
- **Query Parameters**:
  | Parameter | Type | Required | Default | Description |
  | --- | --- | --- | --- | --- |
  | `q` | `string` | Yes | — | Search query string (minimum 2 characters after trimming). |
  | `page` | `number` | No | `1` | Results page number. |
  | `language` | `string` | No | `en-US` | Localization language tag. |

- **Response (`200 OK`)**:
  ```json
  {
    "page": 1,
    "results": [
      {
        "id": 157336,
        "media_type": "movie",
        "title": "Interstellar",
        "overview": "The adventures of a group of explorers...",
        "poster_path": "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
        "backdrop_path": "/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg",
        "release_date": "2014-11-05",
        "vote_average": 8.4
      }
    ],
    "total_pages": 1,
    "total_results": 1
  }
  ```
- **Error Responses**:
  - `500 Internal Server Error`: `{ "error": "<TMDB error message>" }`

---

#### `GET /api/tmdb/trending`

Fetches trending movies, TV shows, or all media from TMDB (`/trending/:type/:window`).

- **Authentication**: None
- **Query Parameters**:
  | Parameter | Type | Required | Default | Description |
  | --- | --- | --- | --- | --- |
  | `type` | `'movie' \| 'tv' \| 'all'` | No | `all` | Media type filter. |
  | `window` | `'day' \| 'week'` | No | `week` | Trending time window. |
  | `language` | `string` | No | `en-US` | Localization language tag. |

- **Response (`200 OK`)**: Paginated TMDB trending response (`page`, `results`, `total_pages`, `total_results`).
- **Error Responses**:
  - `500 Internal Server Error`: `{ "error": "<TMDB error message>" }`

---

#### `GET /api/tmdb/popular`

Fetches popular movies or TV shows from TMDB (`/:type/popular`).

- **Authentication**: None
- **Query Parameters**:
  | Parameter | Type | Required | Default | Description |
  | --- | --- | --- | --- | --- |
  | `type` | `'movie' \| 'tv'` | No | `movie` | Media type (`movie` or `tv`). |
  | `page` | `number` | No | `1` | Page number. |
  | `region` | `string` | No | `US` | ISO 3166-1 alpha-2 country code. |
  | `language` | `string` | No | `en-US` | Localization language tag. |

- **Response (`200 OK`)**: Paginated TMDB popular list.
- **Error Responses**:
  - `500 Internal Server Error`: `{ "error": "<TMDB error message>" }`

---

#### `GET /api/tmdb/top-rated`

Fetches top-rated movies or TV shows from TMDB (`/:type/top_rated`).

- **Authentication**: None
- **Query Parameters**:
  | Parameter | Type | Required | Default | Description |
  | --- | --- | --- | --- | --- |
  | `type` | `'movie' \| 'tv'` | No | `movie` | Media type (`movie` or `tv`). |
  | `page` | `number` | No | `1` | Page number. |
  | `region` | `string` | No | `US` | ISO 3166-1 alpha-2 country code. |
  | `language` | `string` | No | `en-US` | Localization language tag. |

- **Response (`200 OK`)**: Paginated TMDB top-rated list.
- **Error Responses**:
  - `500 Internal Server Error`: `{ "error": "<TMDB error message>" }`

---

#### `GET /api/tmdb/movie/:id`

Fetches detailed movie information from TMDB (`/movie/:id`), appending `credits`, `videos`, `watch/providers`, and `recommendations`.

- **Authentication**: None
- **Path Parameters**:
  | Parameter | Type | Required | Description |
  | --- | --- | --- | --- |
  | `id` | `number` | Yes | Numeric TMDB movie ID. |

- **Query Parameters**:
  | Parameter | Type | Required | Default | Description |
  | --- | --- | --- | --- | --- |
  | `language` | `string` | No | `en-US` | Localization language tag. |

- **Response (`200 OK`)**: TMDB movie details object including `credits`, `videos`, `watch/providers`, and `recommendations`.
- **Error Responses**:
  - `400 Bad Request`: `{ "error": "id must be a number" }`
  - `500 Internal Server Error`: `{ "error": "<TMDB error message>" }`

---

#### `GET /api/tmdb/tv/:id`

Fetches detailed TV series information from TMDB (`/tv/:id`), appending `credits`, `videos`, `watch/providers`, `recommendations`, and `aggregate_credits`.

- **Authentication**: None
- **Path Parameters**:
  | Parameter | Type | Required | Description |
  | --- | --- | --- | --- |
  | `id` | `number` | Yes | Numeric TMDB TV series ID. |

- **Query Parameters**:
  | Parameter | Type | Required | Default | Description |
  | --- | --- | --- | --- | --- |
  | `language` | `string` | No | `en-US` | Localization language tag. |

- **Response (`200 OK`)**: TMDB TV series details object including `credits`, `videos`, `watch/providers`, `recommendations`, and `aggregate_credits`.
- **Error Responses**:
  - `400 Bad Request`: `{ "error": "id must be a number" }`
  - `500 Internal Server Error`: `{ "error": "<TMDB error message>" }`

---

#### `GET /api/tmdb/tv/:id/season/:season`

Fetches episode details and metadata for a specific season of a TV series (`/tv/:id/season/:season`).

- **Authentication**: None
- **Path Parameters**:
  | Parameter | Type | Required | Description |
  | --- | --- | --- | --- |
  | `id` | `number` | Yes | Numeric TMDB TV series ID. |
  | `season` | `number` | Yes | Season number. |

- **Query Parameters**:
  | Parameter | Type | Required | Default | Description |
  | --- | --- | --- | --- | --- |
  | `language` | `string` | No | `en-US` | Localization language tag. |

- **Response (`200 OK`)**: TMDB season details object with `episodes` array.
- **Error Responses**:
  - `400 Bad Request`: `{ "error": "id and season must be numbers" }`
  - `500 Internal Server Error`: `{ "error": "<TMDB error message>" }`

---

#### `GET /api/tmdb/details/:tmdbId`

Resolves TMDB details by numeric ID when the media type is unknown. Attempts to fetch movie details first; if not found, attempts TV series details and injects `media_type: "movie" | "tv"` into the returned object.

- **Authentication**: None
- **Path Parameters**:
  | Parameter | Type | Required | Description |
  | --- | --- | --- | --- |
  | `tmdbId` | `number` | Yes | Numeric TMDB identifier. |

- **Query Parameters**:
  | Parameter | Type | Required | Default | Description |
  | --- | --- | --- | --- | --- |
  | `language` | `string` | No | `en-US` | Localization language tag. |

- **Response (`200 OK`)**: TMDB movie or TV details object augmented with `"media_type": "movie"` or `"media_type": "tv"`.
- **Error Responses**:
  - `400 Bad Request`: `{ "error": "tmdbId must be a number" }`
  - `404 Not Found`: `{ "error": "Not found" }`
  - `500 Internal Server Error`: `{ "error": "<message>" }`

---

### 3.5 Profile (`/api/profile`)

Defined in `src/routes/profile.route.ts`. All endpoints in this group require authentication via `authMiddleware`.

#### `GET /api/profile/me`

Retrieves the profile associated with the authenticated user (`req.userId`).

- **Authentication**: Required (`authMiddleware`)
- **Response (`200 OK`)**:
  ```json
  {
    "id": "user_id_string",
    "displayName": "Jane Doe",
    "avatarUrl": null,
    "plan": null,
    "memberSince": null,
    "region": "US",
    "language": "en-US",
    "maturityRating": "TV-MA",
    "isKids": false,
    "regionSource": null
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: `{ "error": "Unauthorized" }`
  - `404 Not Found`: `{ "error": "Profile not found" }`
  - `500 Internal Server Error`: `{ "error": "<message>" }`

---

#### `PATCH /api/profile/region`

Updates the geographic region of the authenticated user's profile.

- **Authentication**: Required (`authMiddleware`)
- **Request Body (`application/json`)**:
  | Field | Type | Required | Description |
  | --- | --- | --- | --- |
  | `region` | `string` | Yes | Non-empty ISO country code (e.g., `"US"`, `"MX"`). |

- **Example Request Body**:
  ```json
  {
    "region": "US"
  }
  ```
- **Response (`200 OK`)**: Returns the updated profile object.
- **Error Responses**:
  - `400 Bad Request`: `{ "error": "region is required and must be a string" }`
  - `401 Unauthorized`: `{ "error": "Unauthorized" }`
  - `500 Internal Server Error`: `{ "error": "<message>" }`

---

#### `PATCH /api/profile/settings`

Updates one or more preference settings (`language`, `maturityRating`, `isKids`) on the authenticated user's profile. At least one valid field must be provided.

- **Authentication**: Required (`authMiddleware`)
- **Request Body (`application/json`)**:
  | Field | Type | Required | Description |
  | --- | --- | --- | --- |
  | `language` | `string` | No | Preferred language tag (e.g., `"en-US"`, `"es-ES"`). |
  | `maturityRating` | `string` | No | Maturity rating filter (e.g., `"G"`, `"PG-13"`, `"TV-MA"`). |
  | `isKids` | `boolean` | No | Whether the profile is a Kids profile. |

- **Example Request Body**:
  ```json
  {
    "language": "en-US",
    "maturityRating": "TV-MA",
    "isKids": false
  }
  ```
- **Response (`200 OK`)**: Returns the updated profile object.
- **Error Responses**:
  - `400 Bad Request`: `{ "error": "No valid fields to update" }`
  - `401 Unauthorized`: `{ "error": "Unauthorized" }`
  - `500 Internal Server Error`: `{ "error": "<message>" }`

---

### 3.6 Watch History (`/api/watch-history`)

Defined in `src/routes/watch-history.route.ts`. All endpoints in this group require authentication via `authMiddleware`.

#### `GET /api/watch-history`

Retrieves the "Continue Watching" list for the authenticated user: entries where `completed = false` and `progressSeconds > 0`, ordered by `updatedAt` descending.

- **Authentication**: Required (`authMiddleware`)
- **Query Parameters**:
  | Parameter | Type | Required | Default | Description |
  | --- | --- | --- | --- | --- |
  | `limit` | `number` | No | `10` | Maximum number of records to return. |

- **Response (`200 OK`)**:
  ```json
  [
    {
      "id": 1,
      "userId": "user_id_string",
      "profileId": "user_id_string",
      "tmdbId": 157336,
      "mediaType": "movie",
      "title": "Interstellar",
      "posterPath": "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
      "seasonNumber": 0,
      "episodeNumber": 0,
      "episodeTmdbId": null,
      "progressSeconds": 1800,
      "durationSeconds": 10140,
      "completed": false,
      "completedAt": null,
      "muxPlaybackId": "qxb01i6T202018GGSNzgwtm00hzV02M4FbdQ344Xw2bU6I",
      "device": null,
      "createdAt": null,
      "updatedAt": "2026-10-18T18:10:00.000Z"
    }
  ]
  ```
- **Error Responses**:
  - `401 Unauthorized`: `{ "error": "Unauthorized" }`
  - `500 Internal Server Error`: `{ "error": "<message>" }`

---

#### `POST /api/watch-history/update-progress`

Inserts or updates playback progress for a movie or episode.
- Uses a unique composite index on `(profile_id, tmdb_id, media_type, season_number, episode_number)` to perform an upsert (`ON CONFLICT DO UPDATE`).
- `seasonNumber` and `episodeNumber` default to `0` when omitted (used for movies).
- Automatically sets `completed = true` and populates `completedAt` when `progressSeconds >= durationSeconds * 0.9`.

- **Authentication**: Required (`authMiddleware`)
- **Request Body (`application/json`)**:
  | Field | Type | Required | Description |
  | --- | --- | --- | --- |
  | `tmdbId` | `number` | Yes | Numeric TMDB identifier. |
  | `mediaType` | `'movie' \| 'tv'` | Yes | Content media type. |
  | `progressSeconds` | `number` | Yes | Current playback position in seconds. |
  | `durationSeconds` | `number` | Yes | Total content duration in seconds. |
  | `title` | `string` | No | Display title of the movie or series. |
  | `posterPath` | `string` | No | Relative TMDB poster path. |
  | `playbackId` | `string` | No | Mux playback ID (stored as `muxPlaybackId`). |
  | `seasonNumber` | `number` | No | Season number (`0` for movies). |
  | `episodeNumber` | `number` | No | Episode number (`0` for movies). |

- **Example Request Body**:
  ```json
  {
    "tmdbId": 157336,
    "mediaType": "movie",
    "progressSeconds": 1800,
    "durationSeconds": 10140,
    "title": "Interstellar",
    "posterPath": "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    "playbackId": "qxb01i6T202018GGSNzgwtm00hzV02M4FbdQ344Xw2bU6I",
    "seasonNumber": 0,
    "episodeNumber": 0
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: `{ "error": "Unauthorized" }`
  - `500 Internal Server Error`: `{ "error": "<message>" }`

---

#### `GET /api/watch-history/:tmdbId/season/:seasonNumber`

Retrieves episode watch progress for a specific TV series and season for the authenticated user.

- **Authentication**: Required (`authMiddleware`)
- **Path Parameters**:
  | Parameter | Type | Required | Description |
  | --- | --- | --- | --- |
  | `tmdbId` | `number` | Yes | Numeric TMDB TV series ID. |
  | `seasonNumber` | `number` | Yes | Season number. |

- **Response (`200 OK`)**:
  ```json
  [
    {
      "episodeNumber": 1,
      "progressSeconds": 1420,
      "durationSeconds": 3480
    }
  ]
  ```
- **Error Responses**:
  - `400 Bad Request`: `{ "error": "tmdbId and seasonNumber must be numbers" }`
  - `401 Unauthorized`: `{ "error": "Unauthorized" }`
  - `500 Internal Server Error`: `{ "error": "<message>" }`

---

### 3.7 My List (`/api/my-list`)

Defined in `src/routes/my-list.route.ts`. Manages the authenticated user's personal watchlist (`my_list` table). All endpoints require authentication via `authMiddleware`.

#### `GET /api/my-list`

Returns all items saved in the authenticated user's list, ordered by `addedAt` ascending.

- **Authentication**: Required (`authMiddleware`)
- **Response (`200 OK`)**:
  ```json
  [
    {
      "id": 1,
      "profileId": "user_id_string",
      "tmdbId": 157336,
      "mediaType": "movie",
      "addedAt": "2026-10-18T18:00:00.000Z"
    }
  ]
  ```
- **Error Responses**:
  - `401 Unauthorized`: `{ "error": "Unauthorized" }`
  - `500 Internal Server Error`: `{ "error": "<message>" }`

---

#### `POST /api/my-list/toggle`

Toggles a title in the authenticated user's list. If `(profileId, tmdbId, mediaType)` already exists in `my_list`, the record is deleted and `{ "added": false }` is returned; otherwise a new record is inserted and `{ "added": true }` is returned.

- **Authentication**: Required (`authMiddleware`)
- **Request Body (`application/json`)**:
  | Field | Type | Required | Description |
  | --- | --- | --- | --- |
  | `tmdbId` | `number` | Yes | Numeric TMDB identifier. |
  | `mediaType` | `'movie' \| 'tv'` | Yes | Content media type. |

- **Example Request Body**:
  ```json
  {
    "tmdbId": 157336,
    "mediaType": "movie"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "added": true
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{ "error": "tmdbId and mediaType are required" }`
  - `401 Unauthorized`: `{ "error": "Unauthorized" }`
  - `500 Internal Server Error`: `{ "error": "<message>" }`

---

#### `GET /api/my-list/check`

Checks whether a specific title is present in the authenticated user's list.

- **Authentication**: Required (`authMiddleware`)
- **Query Parameters**:
  | Parameter | Type | Required | Description |
  | --- | --- | --- | --- |
  | `tmdbId` | `number` | Yes | Numeric TMDB identifier. |
  | `mediaType` | `'movie' \| 'tv'` | Yes | Content media type. |

- **Response (`200 OK`)**:
  ```json
  {
    "inList": true
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{ "error": "tmdbId and mediaType are required" }`
  - `401 Unauthorized`: `{ "error": "Unauthorized" }`
  - `500 Internal Server Error`: `{ "error": "<message>" }`

---

#### `DELETE /api/my-list/:itemId`

Removes an item from the authenticated user's list by its primary key (`my_list.id`), verifying ownership (`profile_id = req.userId`).

- **Authentication**: Required (`authMiddleware`)
- **Path Parameters**:
  | Parameter | Type | Required | Description |
  | --- | --- | --- | --- |
  | `itemId` | `number` | Yes | Primary key (`id`) of the `my_list` record. |

- **Response (`200 OK`)**:
  ```json
  {
    "success": true
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{ "error": "itemId must be a number" }`
  - `401 Unauthorized`: `{ "error": "Unauthorized" }`
  - `404 Not Found`: `{ "error": "Item not found or not owned by user" }`
  - `500 Internal Server Error`: `{ "error": "<message>" }`

---

### 3.8 Dislikes (`/api/dislikes`)

Defined in `src/routes/dislikes.route.ts`. Manages disliked titles for the authenticated user (`dislikes` table). All endpoints require authentication via `authMiddleware`.

#### `POST /api/dislikes/toggle`

Toggles the dislike state for a title. If `(profileId, tmdbId, mediaType)` exists in `dislikes`, removes it and returns `{ "added": false }`; otherwise inserts it and returns `{ "added": true }`.

- **Authentication**: Required (`authMiddleware`)
- **Request Body (`application/json`)**:
  | Field | Type | Required | Description |
  | --- | --- | --- | --- |
  | `tmdbId` | `number` | Yes | Numeric TMDB identifier. |
  | `mediaType` | `'movie' \| 'tv'` | Yes | Content media type. |

- **Example Request Body**:
  ```json
  {
    "tmdbId": 157336,
    "mediaType": "movie"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "added": true
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{ "error": "tmdbId and mediaType are required" }`
  - `401 Unauthorized`: `{ "error": "Unauthorized" }`
  - `500 Internal Server Error`: `{ "error": "<message>" }`

---

#### `GET /api/dislikes/check`

Checks whether a specific title is marked as disliked by the authenticated user.

- **Authentication**: Required (`authMiddleware`)
- **Query Parameters**:
  | Parameter | Type | Required | Description |
  | --- | --- | --- | --- |
  | `tmdbId` | `number` | Yes | Numeric TMDB identifier. |
  | `mediaType` | `'movie' \| 'tv'` | Yes | Content media type. |

- **Response (`200 OK`)**:
  ```json
  {
    "disliked": false
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{ "error": "tmdbId and mediaType are required" }`
  - `401 Unauthorized`: `{ "error": "Unauthorized" }`
  - `500 Internal Server Error`: `{ "error": "<message>" }`

---

## 4. Data Models

Defined in `src/db/schema.ts` using Drizzle ORM (`pg-core`).

### `profiles`

| Column | Type | Nullable | Description |
| --- | --- | --- | --- |
| `id` | `text` (PK, FK -> `user.id`) | No | Matches the Better Auth user ID. |
| `displayName` | `text` (`display_name`) | Yes | User display name. |
| `avatarUrl` | `text` (`avatar_url`) | Yes | URL to profile avatar image. |
| `plan` | `text` | Yes | Subscription plan identifier. |
| `memberSince` | `timestamptz` (`member_since`) | Yes | Membership start timestamp. |
| `region` | `text` | Yes | ISO 3166-1 alpha-2 country code (defaults to `"US"` on registration). |
| `language` | `text` | Yes | Preferred language tag. |
| `maturityRating` | `text` (`maturity_rating`) | Yes | Content maturity rating setting. |
| `isKids` | `boolean` (`is_kids`) | Yes | Whether the profile is restricted to children's content. |
| `regionSource` | `text` (`region_source`) | Yes | Source of the region setting. |

### `playable_content`

| Column | Type | Nullable | Description |
| --- | --- | --- | --- |
| `tmdbId` | `bigint` (`tmdb_id`, PK) | No | Numeric TMDB identifier. |
| `muxPlaybackId` | `text` (`mux_playback_id`) | No | Mux playback identifier used to build `.m3u8` stream URLs. |
| `muxAssetId` | `text` (`mux_asset_id`) | Yes | Optional Mux asset identifier. |
| `availableRegions` | `text[]` (`available_regions`) | Yes | Array of ISO 3166-1 alpha-2 country codes where playback is permitted. |

### `watch_history`

Unique constraint: `watch_history_profile_content_episode_idx` on `(profile_id, tmdb_id, media_type, season_number, episode_number)`.

| Column | Type | Nullable | Description |
| --- | --- | --- | --- |
| `id` | `bigserial` (PK) | No | Auto-incrementing primary key. |
| `userId` | `text` (`user_id`, FK -> `user.id`) | No | Owning user ID. |
| `profileId` | `text` (`profile_id`, FK -> `profiles.id`) | No | Owning profile ID. |
| `tmdbId` | `bigint` (`tmdb_id`) | No | Numeric TMDB identifier. |
| `mediaType` | `text` (`media_type`) | No | `"movie"` or `"tv"`. |
| `title` | `text` | Yes | Cached content title. |
| `posterPath` | `text` (`poster_path`) | Yes | Cached TMDB poster path. |
| `seasonNumber` | `integer` (`season_number`) | No | Season number (`0` for movies). |
| `episodeNumber` | `integer` (`episode_number`) | No | Episode number (`0` for movies). |
| `episodeTmdbId` | `bigint` (`episode_tmdb_id`) | Yes | Optional episode TMDB ID. |
| `progressSeconds` | `integer` (`progress_seconds`) | Yes | Playback progress in seconds. |
| `durationSeconds` | `integer` (`duration_seconds`) | Yes | Total duration in seconds. |
| `completed` | `boolean` | Yes | `true` when `progressSeconds >= durationSeconds * 0.9`. |
| `completedAt` | `timestamptz` (`completed_at`) | Yes | Timestamp when marked completed. |
| `muxPlaybackId` | `text` (`mux_playback_id`) | Yes | Associated Mux playback ID. |
| `device` | `text` | Yes | Playback device identifier. |
| `createdAt` | `timestamptz` (`created_at`) | Yes | Record creation timestamp. |
| `updatedAt` | `timestamptz` (`updated_at`) | Yes | Last update timestamp. |

### `my_list`

| Column | Type | Nullable | Description |
| --- | --- | --- | --- |
| `id` | `bigserial` (PK) | No | Auto-incrementing primary key. |
| `profileId` | `text` (`profile_id`, FK -> `profiles.id`) | No | Owning profile ID. |
| `tmdbId` | `bigint` (`tmdb_id`) | No | Numeric TMDB identifier. |
| `mediaType` | `text` (`media_type`) | No | `"movie"` or `"tv"`. |
| `addedAt` | `timestamptz` (`added_at`) | Yes | Timestamp when the item was added. |

### `dislikes`

| Column | Type | Nullable | Description |
| --- | --- | --- | --- |
| `id` | `bigserial` (PK) | No | Auto-incrementing primary key. |
| `profileId` | `text` (`profile_id`, FK -> `profiles.id`) | No | Owning profile ID. |
| `tmdbId` | `bigint` (`tmdb_id`) | No | Numeric TMDB identifier. |
| `mediaType` | `text` (`media_type`) | No | `"movie"` or `"tv"`. |
| `addedAt` | `timestamptz` (`added_at`) | Yes | Timestamp when the dislike was recorded. |

