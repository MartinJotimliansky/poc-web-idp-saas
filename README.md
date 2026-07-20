# Demo CIAM - Supervielle

Demo de integracion CIAM con Transmit Security (OIDC/SSO) y API de Supervielle.

## Arquitectura

- **Frontend**: TypeScript + Vite (puerto 3000)
- **Backend**: Express.js (puerto 3001) - proxy para token exchange y API Supervielle
- **Config**: `config.yaml` (estructural) + `.env` (secretos)

## Flujo SSO

```
/ → Redirect OIDC a Transmit Security
  → /login/callback (code)
    → POST /api/auth/callback (exchange code → tokens)
      → POST /api/introspection (consulta API Supervielle)
```

## Requisitos

- Node.js 20.10.0+

## Setup

1. Clonar el repositorio:
```bash
git clone <repo-url>
cd "Demo Supervielle"
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:
```env
TRANSMIT_CLIENT_ID=<tu_client_id>
TRANSMIT_CLIENT_SECRET=<tu_client_secret>
SUPERVIELLE_API_KEY=<tu_api_key>
```

4. Ajustar `config.yaml` si es necesario (journey IDs, URLs, etc.)

## Ejecucion

Levantar ambos servicios en terminales separadas:

```bash
# Terminal 1 - Backend
npm run backend

# Terminal 2 - Frontend
npm start
```

Abrir `http://localhost:3000` en el navegador.

## Endpoints del backend

| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/config` | Config publica para el frontend |
| POST | `/api/auth/callback` | Token exchange OIDC |
| POST | `/api/introspection` | Proxy a API Supervielle |

## Estructura del proyecto

```
├── config.yaml          # Config estructural (commiteable)
├── .env.example         # Template de variables de entorno
├── server.js            # Backend Express
├── vite.config.ts       # Config Vite + proxy
├── index.html
├── public/              # Assets estaticos (SVG, CSS)
└── src/
    ├── main.ts          # Entry point + rutas
    ├── app.ts           # Init app + provider registry
    ├── router.ts        # SPA router
    ├── common.ts        # Utilidades compartidas
    ├── sdkState.ts      # Estado SDK en sessionStorage
    ├── ssoJourneyExecutor.ts  # Executor SSO journey
    ├── callbackHandler.ts     # Handler callback OIDC
    ├── stepHandlers.ts        # Registro de step handlers
    ├── config/loader.ts       # Carga config desde /api/config
    ├── providers/             # Identity providers (Transmit Security)
    ├── steps/                 # Step handlers individuales
    ├── components/            # Componentes UI (information, modal)
    └── types/                 # Tipos TypeScript
```
