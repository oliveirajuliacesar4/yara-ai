require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Healthcheck (ESSENCIAL PARA DEPLOY)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Rota base
app.get('/', (req, res) => {
  res.send('YARA AI backend funcionando 🚀');
});

// Exemplo rota IA (placeholder)
app.post('/ai', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Mensagem obrigatória' });
  }

  // Aqui você conecta sua IA depois
  return res.json({ reply: `YARA respondeu: ${message}` });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
