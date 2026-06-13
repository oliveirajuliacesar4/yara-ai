# App de Gastos com FlutterFlow + Firebase + OpenAI

Este guia mostra uma arquitetura segura para criar um app estilo chat de controle de gastos pessoais.

## Arquitetura recomendada

Fluxo:

1. Usuario faz login com Firebase Authentication
2. Usuario digita: `gastei 30 no mercado`
3. App envia a mensagem para uma Cloud Function
4. Cloud Function chama a OpenAI
5. OpenAI retorna JSON com `valor` e `categoria`
6. Cloud Function salva em `gastos` no Firestore
7. App atualiza a lista em tempo real

## Por que essa arquitetura e a melhor

Nao coloque a chave da OpenAI dentro do app mobile.

O ideal e:

- FlutterFlow -> Cloud Function
- Cloud Function -> OpenAI
- Cloud Function -> Firestore

Assim a sua chave fica protegida no backend.

## Estrutura do Firestore

Colecao: `gastos`

Campos:

- `userId` (string)
- `mensagem` (string)
- `valor` (number)
- `categoria` (string)
- `data` (timestamp)

Exemplo de documento:

```json
{
  "userId": "uid_do_usuario",
  "mensagem": "gastei 30 no mercado",
  "valor": 30,
  "categoria": "mercado",
  "data": "serverTimestamp"
}
```

## Estrutura visual no FlutterFlow

Tela principal:

- `Column`
- `Expanded`
- `ListView`
- `Row` fixa embaixo com:
  - `TextField`
  - `IconButton` enviar

Sugestao de hierarquia:

```text
Scaffold
  SafeArea
    Column
      Expanded
        ListView (mensagens/gastos)
      Container
        Row
          Expanded(TextField)
          IconButton(Enviar)
```

## Fluxo no botao Enviar

1. Ler texto do campo
2. Validar se nao esta vazio
3. Chamar Cloud Function `processarGasto`
4. Receber resposta com `valor` e `categoria`
5. Limpar o campo
6. A ListView atualiza com os dados do Firestore

## Collections sugeridas

Voce pode usar apenas `gastos`, mas recomendo:

- `users`
- `gastos`

Se quiser montar historico visual de chat, tambem pode usar:

- `mensagens`

Mas para a sua primeira versao, da para comecar apenas com `gastos`.

## Regras de seguranca do Firestore

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /gastos/{document} {
      allow read, write: if request.auth != null
        && request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null
        && request.auth.uid == resource.data.userId;
    }
  }
}
```

Observacao:
Em alguns cenarios, a escrita sera feita pela Cloud Function com Admin SDK. Nesse caso, a Function ignora essas regras e grava com permissao de servidor.

## Prompt recomendado para IA

Use um prompt simples e restrito:

```text
Voce extrai gastos de mensagens de usuarios.
Responda apenas em JSON valido.

Categorias permitidas:
- mercado
- transporte
- alimentacao
- lazer
- saude
- contas
- educacao
- outros

Se a mensagem for "gastei 30 no mercado", retorne:
{
  "valor": 30,
  "categoria": "mercado"
}

Se nao encontrar categoria clara, use "outros".
Se nao encontrar valor, use 0.
```

## Melhor forma de integrar no FlutterFlow

### Opcao recomendada

Criar uma chamada de API para sua Cloud Function HTTPS.

Exemplo:

- Metodo: `POST`
- URL: `https://REGIAO-PROJETO.cloudfunctions.net/processarGasto`
- Headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer <Firebase ID Token>`

Body:

```json
{
  "mensagem": "gastei 30 no mercado"
}
```

### Opcao alternativa

Usar Custom Action para chamar a Function.

## Melhorias recomendadas

- Salvar tambem a `categoriaOriginal` retornada pela IA
- Adicionar `confianca`
- Permitir editar o gasto caso a IA classifique errado
- Criar resumo por mes
- Criar dashboard com total por categoria
- Permitir comando como `recebi 1500 de salario`
- Suportar parcelamento: `paguei 120 em 3x`

## Observacao importante sobre OpenAI

Segundo a documentacao oficial da OpenAI, nao se deve colocar a chave da API em apps mobile ou frontend. A chave deve ficar no backend.

Links:

- https://platform.openai.com/docs/guides/structured-outputs
- https://platform.openai.com/docs/api-reference/responses
- https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety

