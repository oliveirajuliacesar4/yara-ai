const express = require('express');
const app = express();

app.use(express.json());

// rota de teste
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// rota de cadastro
app.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.json({ erro: 'faltando dados' });
  }

  return res.json({ ok: true });
});

// iniciar servidor
app.listen(3000, '0.0.0.0', () => {
  console.log('rodando');
});
