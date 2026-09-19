# ClickClick Go

Plataforma serverless de enlaces inteligentes ("Linktree local") para negocios, sobre el ecosistema de **Cloudflare** (Pages + Functions + KV + R2).

- **Frontend**: Vite + React 18 + Tailwind CSS
- **API**: Cloudflare Pages Functions (Edge)
- **Metadatos**: Workers KV (binding `BUSINESSES`)
- **Imágenes**: Cloudflare R2 (binding `ASSETS_BUCKET` → bucket `go-negocios`)

## Producción

- Proyecto Pages: **clickclick-go-git** (cuenta `Marilynlp34@gmail.com`)
- URL de Pages: **https://clickclick-go-git.pages.dev**
- Dominio final: **https://go.clyclick.online** (con *y*)
- Cuenta / Account ID: `b7b66ae5b0e09546ff49833d681753e9`
- KV namespace `BUSINESSES`: `cfa813b56aaa4c3e903ec8b4c4cedfb9`
- R2 bucket: `go-negocios`

## Requisitos del entorno

- Node.js v20.9.0
- npm 10.1.0
- Wrangler v3.114.17 (devDependency, se usa con `npx wrangler`)

## Puesta en marcha (desarrollo local)

```bash
# 1. Instalar dependencias
npm install

# 2. Frontend en modo dev (solo UI, sin Functions)
npm run dev

# 3. Iniciar sesión en Cloudflare
npx wrangler login && npx wrangler whoami

# 4. Variables locales (token admin de desarrollo)
copy .dev.vars.example .dev.vars

# 5. Build + entorno local completo (UI + Functions + KV + R2 simulados)
npm run build
npm run pages:dev
```

> **Token admin en local:** el script `pages:dev` pasa
> `ADMIN_SECRET_KEY=dev-token-local-clickclick-2026` vía `--binding`
> (solo desarrollo). Se usa `--binding` porque en Wrangler 3 la carga de
> `.dev.vars` en `pages dev` no siempre propaga la variable al runtime.
> En producción el secreto real se define con `wrangler pages secret put` y
> NUNCA se versiona.

## API

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/business/:slug` | pública | Perfil de un negocio (edge-cache) |
| GET | `/api/businesses` | pública | Índice ligero de negocios (para el admin) |
| POST | `/admin/api/save` | Access | Crear/editar negocio en KV |
| POST | `/admin/api/delete` | Access | Eliminar negocio de KV |
| POST | `/admin/api/upload` | Access | Subir logo (multipart) a R2 |
| GET | `/api/assets/*` | pública | Servir imágenes desde R2 (cache immutable) |

Las escrituras se sirven bajo `/admin`, por lo que heredan la protección de
Cloudflare Access. Las rutas heredadas bajo `/api` conservan el fallback
`Authorization: Bearer <ADMIN_SECRET_KEY>` para desarrollo y transición.

## Despliegue a producción

El proyecto Pages `clickclick-go-git` está conectado directamente al repositorio
GitHub `ArielVelaTI/go-clyclick`. Cada `push` a `main` hace que Cloudflare obtenga
el commit, ejecute `npm run build` y publique `dist`. Las demás ramas generan
deployments de preview.

### Despliegue manual de emergencia

```bash
# (Solo la primera vez) crear el proyecto Pages
npx wrangler pages project create clickclick-go-git --production-branch main

# Definir el secreto administrativo (una vez, o para rotarlo)
npx wrangler pages secret put ADMIN_SECRET_KEY --project-name clickclick-go-git

# Compilar y desplegar
npm run build
npx wrangler pages deploy dist --project-name clickclick-go-git --branch main
```

> Nota: `wrangler pages deploy` sobre un proyecto inexistente abre un prompt
> interactivo que bloquea. Crea el proyecto antes con `pages project create`.

## Estructura

```
functions/
  _middleware.js              # CORS global
  api/
    _lib.js                   # helpers: auth, slugify, índice KV, modelo
    business/[slug].js        # GET perfil público (edge-cache)
    businesses.js             # GET índice de negocios
    save.js                   # POST crear/editar (auth)
    delete.js                 # POST eliminar (auth)
    upload.js                 # POST subir logo a R2 (auth)
    assets/[[path]].js        # GET servir imágenes de R2
  admin/api/                  # aliases protegidos por Access para escrituras
public/                       # Assets estáticos + _redirects (SPA)
src/                          # App React (perfil público + panel admin)
wrangler.toml                 # Bindings KV (BUSINESSES) y R2 (ASSETS_BUCKET)
```

## Pendientes de configuración (dashboard)

- **Dominio**: en Workers & Pages → clickclick-go → Custom domains, añadir
  `go.clyclick.online` (la zona ya está en Cloudflare, crea el CNAME + SSL).
- **Zero Trust**: `go.clyclick.online/admin` está protegido con Access + OTP
  por email. Las operaciones de escritura viven bajo `/admin/api/*` para que
  Access inyecte el JWT que validan las Pages Functions.
