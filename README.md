# WhyNot — App Social Geolocalizada

MVP de una Progressive Web App (PWA) social basada en geolocalización en tiempo real. Los usuarios abren la app, otorgan permiso de ubicación, y aparecen como pins en un mapa interactivo. Pueden ver usuarios cercanos, chatear en tiempo real, y crear perfiles.

## Stack Técnico

### Frontend
- React 18 + Vite
- Mapbox GL JS (mapa interactivo con estilo oscuro)
- Socket.io-client (comunicación en tiempo real)
- Tailwind CSS (estilos mobile-first)
- PWA (manifest.json + service worker)

### Backend
- Node.js + Express
- Socket.io (WebSockets)
- MongoDB con índices geoespaciales 2dsphere
- Mongoose ODM
- JWT (sesiones anónimas + cuentas registradas)
- bcrypt, helmet, express-rate-limit

## Funcionalidades

### Fase 1 — Mapa y Geolocalización
- Mapa interactivo con ubicación en tiempo real
- Pins de usuarios cercanos (radio de 5km)
- Sesiones anónimas automáticas
- Detección de usuarios inactivos (60s)

### Fase 2 — Chat en Tiempo Real
- Chat 1-a-1 al tocar un pin
- Historial con paginación cursor-based
- Indicador de "escribiendo..."
- Notificaciones de mensajes no leídos
- Límite de 500 caracteres por mensaje

### Fase 3 — Perfiles
- Wizard de perfil en 3 pasos (nombre, lookingFor, intereses)
- Avatares generados (DiceBear API)
- Pins con color según lo que buscan
- Privacidad: mostrar/ocultar edad y distancia

### Fase 4 — Cuentas Opcionales
- Registro con email + contraseña
- Migración automática de datos anónimos
- Refresh tokens (30 días)
- Cambio de contraseña, eliminación de cuenta
- Job de limpieza automático (cron diario)

## Setup

### Requisitos
- Node.js 18+
- MongoDB (Atlas o local)
- Cuenta de Mapbox (token público gratuito)

### 1. Clonar y configurar

```bash
git clone <repo-url>
cd Whynot

# Crear archivo de variables de entorno
cp .env.example .env
```

Edita `.env` con tus valores:
- `MONGODB_URI` — Tu connection string de MongoDB Atlas (o `mongodb://localhost:27017/geosocial` para local)
- `VITE_MAPBOX_TOKEN` — Token público de Mapbox (obtenlo en mapbox.com)
- `JWT_SECRET` — String aleatorio fuerte (mín. 64 caracteres)

### 2. Instalar dependencias

```bash
# Backend
cd server && npm install && cd ..

# Frontend
cd client && npm install && cd ..
```

### 3. Iniciar en desarrollo

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

La app estará disponible en `http://localhost:5173`

### 4. MongoDB local (opcional)

Si prefieres MongoDB local en vez de Atlas:

```bash
docker-compose up -d
```

Y usa `MONGODB_URI=mongodb://localhost:27017/geosocial` en tu `.env`

## Estructura del Proyecto

```
├── client/                    # Frontend React + Vite
│   ├── public/                # PWA assets (manifest, sw, icon)
│   └── src/
│       ├── components/
│       │   ├── Map/           # MapView, MapControls, UserPin
│       │   ├── Chat/          # ChatDrawer, ChatList
│       │   ├── Profile/       # ProfileSetup, ProfileCard, ProfileEdit
│       │   ├── Auth/          # AuthModal, AccountSettings
│       │   └── UI/            # Avatar
│       ├── hooks/             # useGeolocation, useSocket, useAuth, useChat
│       ├── context/           # AuthContext, SocketContext
│       ├── services/          # api.js, socket.js
│       └── App.jsx
├── server/                    # Backend Node.js + Express
│   ├── config/                # db.js, env.js
│   ├── models/                # User, Conversation, Message
│   ├── routes/                # auth, users, chat
│   ├── middleware/            # auth (JWT), rateLimiter
│   ├── sockets/               # index, locationHandler, chatHandler
│   ├── utils/                 # geo.js, cleanup.js
│   └── server.js
├── .env.example
├── docker-compose.yml
└── README.md
```

## Variables de Entorno

| Variable | Descripción |
|----------|-------------|
| `PORT` | Puerto del servidor (default: 3001) |
| `MONGODB_URI` | Connection string de MongoDB |
| `JWT_SECRET` | Secreto para firmar JWTs |
| `JWT_EXPIRES_IN` | Expiración del JWT (default: 24h) |
| `VITE_MAPBOX_TOKEN` | Token público de Mapbox |
| `VITE_API_URL` | URL del backend (default: http://localhost:3001) |
| `VITE_SOCKET_URL` | URL de Socket.io (default: http://localhost:3001) |
| `DEFAULT_RADIUS_KM` | Radio de búsqueda (default: 5) |

## Notas Importantes

- La app funciona 100% sin crear cuenta — las cuentas son opcionales para persistencia
- Los datos de usuarios anónimos se retienen 30 días, luego se purgan automáticamente
- Los comentarios del código están en español
- La UI es mobile-first (optimizada para 375px+)
- Edad mínima: 18 años (validado en frontend y backend)

## Autor

Juan C. — Jíbaro en la Luna LLC
