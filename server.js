const express = require('express');

const app = express(); // 👈 ESSA LINHA RESOLVE SEU ERRO

app.use(express.json());

// teste
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// iniciar servidor
const port = 3000;

app.listen(port, '0.0.0.0', () => {
  console.log('rodando na porta ' + port);
});
