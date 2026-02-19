# 🔧 Configuración Backend para Payphone

## ⚠️ IMPORTANTE

Para que Payphone funcione correctamente, **tu backend debe exponer estos dos endpoints**:

### 1. Crear Transacción (POST)
```
POST /api/payments/payphone/create-transaction
```

**Request body:**
```json
{
  "reference": "purchase_id_123",
  "amount": 500000,
  "currency": "ARS",
  "description": "Compra de 2 tickets para concierto X",
  "customerEmail": "usuario@example.com",
  "customerPhone": "+541234567890"
}
```

**Response:**
```json
{
  "id": "transaction_token_from_payphone",
  "reference": "purchase_id_123",
  "amount": 500000,
  "status": "pending"
}
```

**Qué debe hacer tu backend:**
1. Recibir los datos de la compra
2. Validar que el usuario esté autenticado
3. Llamar a Payphone API con tu **Secret Key**
4. Retornar el token de transacción

**Ejemplo en Node.js/Express:**
```javascript
app.post('/api/payments/payphone/create-transaction', async (req, res) => {
  try {
    const { reference, amount, currency, description, customerEmail, customerPhone } = req.body;

    const response = await fetch('https://api.payphone.com.ar/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PAYPHONE_SECRET_KEY}`,
      },
      body: JSON.stringify({
        merchant_id: process.env.PAYPHONE_MERCHANT_ID,
        reference,
        amount,
        currency,
        description,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        callback_url: process.env.PAYPHONE_CALLBACK_URL,
        success_url: process.env.PAYPHONE_SUCCESS_URL,
        failure_url: process.env.PAYPHONE_FAILURE_URL,
      }),
    });

    if (!response.ok) {
      throw new Error(`Payphone error: ${response.statusText}`);
    }

    const transactionData = await response.json();
    res.json(transactionData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

### 2. Verificar Estado de Transacción (GET)
```
GET /api/payments/payphone/transaction-status/:transactionId
```

**Response:**
```json
{
  "id": "transaction_id",
  "reference": "purchase_id_123",
  "status": "approved",
  "amount": 500000
}
```

**Qué debe hacer tu backend:**
1. Recibir el ID de la transacción
2. Llamar a Payphone API para obtener el estado
3. Actualizar el estado de la compra en tu BD si es necesario
4. Retornar el estado

**Ejemplo en Node.js/Express:**
```javascript
app.get('/api/payments/payphone/transaction-status/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;

    const response = await fetch(`https://api.payphone.com.ar/transactions/${transactionId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.PAYPHONE_SECRET_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Payphone error: ${response.statusText}`);
    }

    const transactionData = await response.json();
    res.json(transactionData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 📋 Variables de Entorno Backend Necesarias

Añade a tu `.env` del backend:

```env
# Payphone
PAYPHONE_MERCHANT_ID=017dbf4b-b977-4341-8cbc-815c7c5a9945
PAYPHONE_SECRET_KEY=tu_secret_key_aqui
PAYPHONE_CALLBACK_URL=https://tudominio.com/api/payments/payphone/callback
PAYPHONE_SUCCESS_URL=https://tudominio.com/payment-success
PAYPHONE_FAILURE_URL=https://tudominio.com/payment-failure
```

---

## 🔄 Flujo Completo

1. **Usuario selecciona tickets** → PurchaseTicketPage.jsx
2. **Usuario hace clic en "PAGAR CON PAYPHONE"** → Valida y llama a `handlePayphonePayment()`
3. **Frontend llama a `/api/payments/payphone/create-transaction`** → Backend crea la transacción en Payphone
4. **Backend retorna el token de transacción** → Frontend abre el widget
5. **Usuario completa el pago en el widget** → Payphone redirige a `/payment-callback` o `/payment-success`
6. **PaymentCallbackPage.jsx verifica el estado** → Llama a `/api/payments/payphone/transaction-status`
7. **Backend retorna el estado** → Página muestra confirmación

---

## ✅ Checklist

- [ ] Crear endpoint `/api/payments/payphone/create-transaction` en backend
- [ ] Crear endpoint `/api/payments/payphone/transaction-status/:id` en backend
- [ ] Configurar variables de entorno en backend con Secret Key
- [ ] Probar con transacciones de prueba de Payphone
- [ ] Configurar webhook callback en Payphone para confirmaciones en tiempo real
- [ ] Añadir validaciones de seguridad (CSRF, validar compra, etc.)

---

¿Necesitas ayuda con la implementación del backend?
