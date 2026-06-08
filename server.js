const express = require('express');

const app = express(); // 👈 ISSO estava faltando

app.use(express.json());

// teste
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// cadastro
app.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.json({ erro: 'faltando dados' });
  }

  return res.json({ ok: true });
});

// iniciar servidor
const port = 3000;

app.listen(port, '0.0.0.0', () => {
  console.log('rodando na porta ' + port);
});
