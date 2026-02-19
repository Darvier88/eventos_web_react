# 🔧 Configuración de Payphone - Guía Completa

## 📋 Paso 1: Obtener Credenciales de Payphone

1. Ve a [Payphone Developer Console](https://developer.payphone.com.ar) o [Payphone Merchant Portal](https://merchant.payphone.com.ar)
2. Registra tu cuenta como Comerciante
3. En tu dashboard, busca la sección "API Keys" o "Credenciales"
4. Obtén:
   - **Merchant ID**: Identificador único de tu cuenta
   - **Public Key**: Clave pública para cliente (frontend)
   - **Secret Key**: Clave privada para servidor (backend)

## 📝 Paso 2: Configurar Archivo `.env`

Edita el archivo `.env` en la raíz del proyecto y reemplaza con tus credenciales reales:

```env
# Payphone Configuration
VITE_PAYPHONE_MERCHANT_ID=tu_merchant_id_aqui
VITE_PAYPHONE_PUBLIC_KEY=tu_public_key_aqui
VITE_PAYPHONE_API_URL=https://api.payphone.com.ar
VITE_APP_CALLBACK_URL=http://localhost:3000/payment-callback
```

### Nota sobre URLs:
- **En desarrollo**: `http://localhost:3000/payment-callback`
- **En producción**: Reemplaza con tu dominio real, ej: `https://tudominio.com/payment-callback`

## 🛠️ Paso 3: Configurar Webhook en Payphone

1. En el dashboard de Payphone, ve a "Webhook Settings" o "Callbacks"
2. Configura la URL de respuesta:
   ```
   https://tudominio.com/payment-callback
   ```
3. Asegúrate de que Payphone pueda hacer POST a esa URL con el estado de la transacción

## 📦 Paso 4: Instalar Dependencias (Opcional)

Si necesitas el SDK de Payphone en JavaScript, ejecuta:

```bash
npm install payphone-sdk
```

**Nota**: El código actual usa fetch API, así que es opcional.

## 🔗 Paso 5: Integración del Script de Payphone

Si usas el widget de Payphone, agrega el script en `index.html`:

```html
<script src="https://widget.payphone.com.ar/payphone.js"></script>
```

## 🧪 Paso 6: Probar la Integración

1. Inicia el servidor:
   ```bash
   npm run dev
   ```

2. Ve a una página de compra con tickets que tengan costo

3. Verás dos botones:
   - "PAGAR CON TARJETA" (flujo existente)
   - "PAGAR CON PAYPHONE" (nuevo, si está configurado)

4. Haz clic en "PAGAR CON PAYPHONE"

5. Se abrirá el widget de Payphone

6. Completa el pago con datos de prueba (Payphone proporciona tarjetas de test)

## 🔐 Notas de Seguridad

⚠️ **IMPORTANTE**: Nunca comitas tu archivo `.env` con credenciales reales. Agrega a `.gitignore`:

```
.env
.env.local
```

## 📱 Métodos de Pago Soportados

Payphone soporta:
- Tarjetas de crédito (Visa, Mastercard, American Express)
- Transferencia bancaria
- Billeteras digitales
- Otros según configuración en tu cuenta

## 🆘 Troubleshooting

### Error: "Payphone no está configurado"
- Verifica que `VITE_PAYPHONE_MERCHANT_ID` y `VITE_PAYPHONE_PUBLIC_KEY` estén en `.env`
- Recarga el servidor (npm run dev)

### Error: "Widget de Payphone no está cargado"
- Asegúrate de que el script `payphone.js` está cargado en `index.html`
- Verifica la URL en el browser devtools

### Error: "Error al crear transacción"
- Verifica que tu API Key sea válida
- Comprueba que el monto sea válido
- Revisa los logs del servidor

## 📚 Documentación Oficial

- [Payphone API Docs](https://docs.payphone.com.ar)
- [Widget Integration Guide](https://docs.payphone.com.ar/widget)
- [Testing Guide](https://docs.payphone.com.ar/testing)

## 🔄 Próximos Pasos

1. Agregar métodos al `apiService.js`:
   ```javascript
   updatePurchaseTransaction(purchaseId, transactionId)
   updatePurchasePaymentStatus(purchaseId, paymentData)
   ```

2. Crear página de confirmación (`PurchaseConfirmationPage`)

3. Configurar webhook en tu backend para recibir confirmaciones de Payphone

4. Implementar reintentos automáticos en caso de error

---

¿Necesitas ayuda con alguno de estos pasos?
