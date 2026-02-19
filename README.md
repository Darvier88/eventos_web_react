# 🎉 Eventos Web - React Application

Aplicación web desarrollada en **React** que replica la funcionalidad de visualización y gestión de eventos del código Dart/Flutter original.

## 🚀 Características

- ✅ Visualización de todos los eventos disponibles
- ✅ Detalle completo de cada evento con información y localidades
- ✅ Diseño responsive (móvil y escritorio)
- ✅ Integración con API REST
- ✅ React Router para navegación
- ✅ Manejo de estados de carga y error
- ✅ Diseño moderno estilo buenplan.com.ec

## 📋 Requisitos Previos

- Node.js (v16 o superior)
- npm o yarn

## 🛠️ Instalación

1. **Instalar dependencias**
```bash
npm install
```

2. **Ejecutar en modo desarrollo**
```bash
npm run dev
```

La aplicación se abrirá en `http://localhost:3000`

3. **Build para producción**
```bash
npm run build
```

Los archivos compilados estarán en `dist/`

## 📁 Estructura del Proyecto

```
eventos-web-react/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── Header.jsx       # Barra de navegación
│   │   └── EventCard.jsx    # Card de evento
│   ├── pages/               # Páginas principales
│   │   ├── EventsPage.jsx   # Lista de eventos
│   │   └── EventDetailPage.jsx  # Detalle de evento
│   ├── services/            # Servicios de API
│   │   └── apiService.js    # Llamadas a la API
│   ├── styles/              # Estilos CSS
│   │   └── global.css       # Estilos globales
│   ├── App.jsx              # Componente principal
│   └── main.jsx             # Punto de entrada
├── index.html               # HTML base
├── package.json             # Dependencias
└── vite.config.js           # Configuración de Vite
```

## 🎨 Tecnologías Utilizadas

- **React 18** - Library UI
- **React Router DOM** - Navegación
- **Vite** - Build tool y dev server
- **Axios** - HTTP client
- **date-fns** - Manejo de fechas
- **CSS Modules** - Estilos

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Build producción
npm run build

# Preview del build
npm run preview

# Linting
npm run lint
```

## 🌐 API

La aplicación se conecta a: `https://api.macak.tech`

### Endpoints Utilizados

- `GET /event/all` - Obtener todos los eventos
- `GET /event?id={eventId}` - Obtener evento por ID
- `GET /ticket/event?id={eventId}` - Obtener tickets de un evento
- `GET /event/image?id={eventId}&type=banner` - Imagen banner
- `GET /event/image?id={eventId}&type=square` - Imagen cuadrada

## 📱 Características de Diseño

### Pantalla Principal
- Lista de eventos con cards
- Banner de imagen de cada evento
- Fecha, nombre y descripción
- Tema oscuro con acentos naranjas
- Responsive design

### Pantalla de Detalle
- Banner completo del evento
- Información detallada (fecha, hora, lugar, edad)
- Sección de localidades/tickets con precios
- Botón de compra (preparado para integración futura)
- Layout responsive (2 columnas en desktop)

## 🎯 Equivalencias Dart → React

| Dart/Flutter | React |
|--------------|-------|
| `ApiRepository` | `apiService.js` |
| `EventsScreen` | `EventsPage.jsx` |
| `EventDetailScreen` | `EventDetailPage.jsx` |
| `BLoC Pattern` | React Hooks (useState, useEffect) |
| `Navigator.push()` | `react-router-dom` |
| `StatefulWidget` | Functional Component con hooks |

## 🔄 Flujo de Datos

```
Usuario → Componente → useEffect → apiService → API
                           ↓
Usuario ← UI Update ← setState ← Response
```

## 🚧 Próximas Funcionalidades

- [ ] Sistema de autenticación
- [ ] Carrito de compras
- [ ] Proceso de checkout
- [ ] Historial de compras
- [ ] Búsqueda y filtros
- [ ] Favoritos
- [ ] Compartir eventos

## 🐛 Solución de Problemas

### Error de CORS
Si encuentras errores de CORS en desarrollo, puedes configurar un proxy en `vite.config.js`:

```javascript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://api.macak.tech',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
```

### Imágenes no cargan
Verifica la conexión a internet y que la API esté disponible.

## 📄 Licencia

Este proyecto es de código abierto.

## 👥 Contacto

Para preguntas o sugerencias sobre el proyecto.

---

Desarrollado con React ⚛️
