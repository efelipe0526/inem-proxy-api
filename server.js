const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');

// Configurar SendGrid (opcional, solo si lo necesitas)
sgMail.setApiKey('TU_CLAVE_API_SENDGRID_AQUI'); // Reemplaza con tu clave de SendGrid

const app = express();
const PORT = 3000;
const HOST = "localhost";
const API_URL = "https://www.inemsoledad.com.co/api"; // URL de tu backend actual

// Habilitar CORS para permitir solicitudes desde la app Flutter
app.use(cors({
    origin: '*', // En producción, ajusta esto a la URL de tu app Flutter
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para logging de solicitudes (para depuración)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Ruta de estado para verificar que el proxy está funcionando
app.get("/status", (req, res) => {
    res.send('Proxy API is running');
});

// Configuración del proxy para redirigir solicitudes al backend
const proxyOptions = {
    target: API_URL, // URL del backend
    changeOrigin: true, // Cambia el origen de la solicitud para que coincida con el target
    pathRewrite: {
        '^/api': '' // Elimina el prefijo /api de la URL (ajusta según necesidad)
    },
    onProxyReq: (proxyReq, req, res) => {
        // Agregar o modificar headers si es necesario
        proxyReq.setHeader('X-Proxy-Origin', 'NodeJS-Proxy');
    },
    onError: (err, req, res) => {
        console.error('Proxy Error:', err);
        res.status(500).json({ error: 'Error connecting to backend' });
    }
};

// Crear el proxy middleware
const proxy = createProxyMiddleware(proxyOptions);

// Usar el proxy para todas las solicitudes que comiencen con /api
app.use('/api', proxy);

// Ruta personalizada para enviar correos con SendGrid (opcional)
app.post('/send-email', express.json(), async (req, res) => {
    const { to, subject, text } = req.body;

    if (!to || !subject || !text) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const msg = {
        to,
        from: 'tu_correo@dominio.com', // Reemplaza con tu correo verificado en SendGrid
        subject,
        text
    };

    try {
        await sgMail.send(msg);
        res.json({ message: 'Email sent successfully' });
    } catch (error) {
        console.error('SendGrid Error:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
});

// Iniciar el servidor
app.listen(PORT, HOST, () => {
    console.log(`Proxy API running at ${HOST}:${PORT}`);
});