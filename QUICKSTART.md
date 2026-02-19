# 🚀 Quick Start - Eventos Web React

## ⚡ Inicio en 3 Pasos (2 minutos)

### 1️⃣ Instalar Dependencias
```bash
cd eventos-web-react
npm install
```
⏱️ Tiempo: ~1 minuto

### 2️⃣ Ejecutar la Aplicación
```bash
npm run dev
```
⏱️ Tiempo: ~10 segundos

### 3️⃣ Abrir en el Navegador
Vite abrirá automáticamente `http://localhost:3000`

¡Listo! 🎉

---

## 📸 Vistas

### Vista 1: Lista de Eventos (Página Principal)
- Card con banner de imagen
- Fecha y hora del evento
- Nombre y descripción
- Botón de bookmark

### Vista 2: Detalle del Evento
- Banner completo
- Información del evento
- Lista de tickets/localidades
- Botón de compra

---

## 🎯 Comandos Útiles

```bash
# Desarrollo (con hot reload)
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Linting
npm run lint
```

---

## 📁 Archivos Importantes

```
eventos-web-react/
├── src/
│   ├── App.jsx                    # ← Componente principal
│   ├── main.jsx                   # ← Punto de entrada
│   ├── pages/
│   │   ├── EventsPage.jsx         # ← Lista de eventos
│   │   └── EventDetailPage.jsx    # ← Detalle del evento
│   └── services/
│       └── apiService.js          # ← Cambiar API URL aquí
└── vite.config.js                 # ← Configuración Vite
```

---

## ⚙️ Configuración

### Cambiar URL de API
```javascript
// src/services/apiService.js
const API_BASE_URL = 'https://tu-api.com';  // ← Cambiar aquí
```

### Cambiar Puerto
```javascript
// vite.config.js
export default defineConfig({
  server: {
    port: 3000  // ← Cambiar aquí
  }
})
```

### Cambiar Colores
```css
/* src/styles/global.css */
:root {
  --accent-color: #ff9800;  /* ← Cambiar aquí */
}
```

---

## 🔧 Tecnologías

- **React 18** - UI Library
- **Vite** - Build tool (súper rápido)
- **React Router** - Navegación
- **Axios** - HTTP requests
- **date-fns** - Manejo de fechas

---

## 📱 Responsive

✅ Móvil (< 900px): Layout 1 columna
✅ Desktop (> 900px): Layout 2 columnas en detalle

---

## 🎨 Diseño

- Tema oscuro (#1a1a1a)
- Acentos naranjas (#ff9800)
- Inspirado en buenplan.com.ec
- Animaciones suaves
- Cards con hover effects

---

## 🐛 Problemas Comunes

### ❌ "Cannot find module"
```bash
npm install
```

### ❌ Puerto ya en uso
```bash
# Cambiar puerto en vite.config.js
# O matar el proceso:
npx kill-port 3000
```

### ❌ CORS errors
- Normal en desarrollo
- Se soluciona con proxy o en producción

---

## 📖 Estructura React vs Dart

| Concepto Dart | Equivalente React |
|---------------|-------------------|
| `StatefulWidget` | Functional Component + useState |
| `BLoC` | useState + useEffect |
| `ApiRepository` | apiService.js |
| `Navigator.push()` | useNavigate() |
| `FutureBuilder` | useEffect + loading state |

---

## 🚀 Deploy Rápido

### Vercel (Recomendado)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Arrastra carpeta dist/ a netlify.com/drop
```

### GitHub Pages
```bash
npm run build
# Push carpeta dist/ a gh-pages branch
```

---

## 💡 Tips

✨ **Hot Reload**: Los cambios se reflejan automáticamente
✨ **Vite es rápido**: Build en segundos
✨ **DevTools**: React DevTools en Chrome
✨ **Console**: Revisa la consola para errores
✨ **Network**: Revisa las llamadas API en DevTools

---

## 📚 Aprender Más

- [React Docs](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)
- [React Router](https://reactrouter.com/)

---

**¡Disfruta desarrollando! ⚛️**
