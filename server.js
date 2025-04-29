const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
// const sgMail = require('@sendgrid/mail');

// Configurar SendGrid (opcional, solo si lo necesitas)
// sgMail.setApiKey('TU_CLAVE_API_SENDGRID_AQUI');

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = "https://www.inemsoledad.com.co/api";

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.get("/status", (req, res) => {
    res.send('Proxy API is running');
});

const proxyOptions = {
    target: API_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/api': ''
    },
    onProxyReq: (proxyReq, req, res) => {
        proxyReq.setHeader('X-Proxy-Origin', 'NodeJS-Proxy');
    },
    onError: (err, req, res) => {
        console.error('Proxy Error:', err);
        res.status(500).json({ error: 'Error connecting to backend' });
    }
};

const proxy = createProxyMiddleware(proxyOptions);

app.use('/api', proxy);

// Comentar la ruta de SendGrid
/*
app.post('/send-email', express.json(), async (req, res) => {
    const { to, subject, text } = req.body;
    if (!to || !subject || !text) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    const msg = {
        to,
        from: 'tu_correo@dominio.com',
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
*/

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Proxy API running on port ${PORT}`);
});