# Publicar no Firebase Hosting

Este projeto ficou preparado para deploy como site estatico usando o `index.html` da raiz.

## O que ja esta pronto

- `firebase.json` configurado para publicar a raiz do projeto
- pastas e arquivos que nao devem ir para o hosting foram adicionados em `ignore`
- `.firebaserc.example` com o formato esperado do projeto

## Antes de publicar

1. Crie ou escolha um projeto no Firebase
2. Ative `Authentication > Sign-in method > Email/Password` se for usar autenticacao real
3. Em `Authentication > Settings > Authorized domains`, adicione o dominio final do site
4. Renomeie `.firebaserc.example` para `.firebaserc` e troque `SEU_PROJECT_ID` pelo ID real do projeto

## Comandos

Instalar a CLI:

```powershell
npm install -g firebase-tools
```

Entrar na conta:

```powershell
firebase login
```

Publicar:

```powershell
firebase deploy --only hosting
```

## Observacao importante

Hoje o `index.html` tem o JavaScript principal embutido nele. O arquivo `app.js` existe na raiz, mas nao esta sendo carregado por essa pagina. Ou seja: o deploy atual publica a versao definida em `index.html`.
