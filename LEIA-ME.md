# Cardume: como colocar o app no ar e instalar no celular

Tempo estimado: 30 a 40 minutos, uma vez só. Tudo é gratuito, exceto a IA (opcional), que cobra por uso na Anthropic.

Você vai precisar de três contas: **Google** (para o Firebase), **GitHub** e **Mapbox**.

---

## Passo 1: Firebase (login, comunidade e fotos)

1. Acesse **console.firebase.google.com** e clique em **Criar um projeto**. Nome: `cardume`. Pode desativar o Google Analytics.
2. No menu da esquerda: **Criação › Firestore Database › Criar banco de dados**.
   - Local: **southamerica-east1 (São Paulo)**.
   - Escolha **Iniciar no modo de produção**.
3. No menu: **Criação › Authentication › Vamos começar › Método de login**. Ative:
   - **Google** (escolha seu e-mail de suporte e salve);
   - **Anônimo** (para o botão "Entrar como convidado").
4. Ainda em **Authentication › Configurações › Domínios autorizados**, clique em **Adicionar domínio** e coloque `SEU-USUARIO.github.io`, trocando SEU-USUARIO pelo seu usuário do GitHub.
5. Em **Firestore Database › Regras**: apague tudo, cole o conteúdo do arquivo **`firestore.rules`** deste pacote e clique em **Publicar**.
6. Clique na engrenagem **› Configurações do projeto › Seus apps** e depois no ícone **`</>`** (Web). Apelido: `cardume`. **Não** marque "Firebase Hosting". Clique em Registrar.
7. Vai aparecer um bloco `firebaseConfig = { apiKey: ..., authDomain: ..., ... }`. Abra o arquivo **`js/config.js`** deste pacote e copie cada valor para o lugar correspondente.

> Esses valores do Firebase podem ficar públicos no GitHub. Quem protege os dados são as regras do passo 5.

## Passo 2: Mapbox (mapa real, satélite e endereços)

1. Crie uma conta em **account.mapbox.com** (gratuita; o plano grátis cobre bem o uso pessoal).
2. Vá em **Tokens › Create a token**. Nome: `cardume`. Deixe os escopos públicos padrão.
3. Em **URL restrictions**, adicione `https://SEU-USUARIO.github.io`. Isso impede que outros sites usem o seu token.
4. Copie o token (começa com `pk.`) e cole em **`mapboxToken`** no arquivo **`js/config.js`**.

## Passo 3: GitHub (hospedagem)

1. Em **github.com**, clique em **New repository**. Nome: `cardume`. Marque **Public** e clique em **Create repository**.
2. Na página do repositório, clique em **uploading an existing file**.
3. Arraste **todo o conteúdo** da pasta `cardume` (os arquivos e as pastas `css`, `js`, `data` e `icons`), não a pasta em si. Depois clique em **Commit changes**.
   - O arquivo `index.html` precisa ficar na raiz do repositório.
4. Vá em **Settings › Pages**. Em **Branch**, escolha **main** e **/ (root)** e clique em **Save**.
5. Espere de 1 a 3 minutos. O endereço do app será:
   **`https://SEU-USUARIO.github.io/cardume/`**

## Passo 4: instalar no celular

- **iPhone (Safari):** abra o endereço, toque em **Compartilhar** (o quadrado com a seta) e depois em **Adicionar à Tela de Início**.
- **Android (Chrome):** abra o endereço, toque nos **⋮** e depois em **Instalar app** (ou "Adicionar à tela inicial").

O ícone do Cardume aparece na tela inicial e o app abre em tela cheia, como um app normal.

## Passo 5 (opcional): ligar a IA

O assistente de pesca e a identificação de peixes por foto usam a IA da Anthropic.

1. Acesse **console.anthropic.com**, crie uma conta, adicione créditos e vá em **API Keys › Create Key**.
2. No app, abra **Ajustes (engrenagem) › Inteligência artificial** e cole a chave.

> A chave fica guardada **só no seu aparelho** e vai direto para a Anthropic. **Nunca** coloque essa chave no GitHub nem no `config.js`. Cada uso é cobrado na sua conta da Anthropic.

---

## O que funciona fora do Claude

| Recurso | Fonte |
|---|---|
| Lua, sol, calendário lunar | Cálculo no próprio app (sempre funciona, até sem internet) |
| Clima, vento, pressão, chuva | **Open-Meteo, real** (sem chave) |
| Ondas, temperatura da água, correntes | **Open-Meteo Marine, real** |
| Maré | Modelo estimado (não use para navegação) |
| Mapa, satélite, busca de endereços | Mapbox (seu token) |
| Login, comunidade, curtidas, comentários, presença, fotos | Firebase (seu projeto) |
| Assistente e identificação de peixes | Anthropic (sua chave, opcional) |

## Problemas comuns

- **Aparece "Falta configurar o Firebase":** o `js/config.js` ainda está com `COLE_AQUI`. Revise o passo 1.7 e envie o arquivo de novo no GitHub.
- **O login com Google não abre:** confira o domínio autorizado (passo 1.4).
- **O mapa fica na "Carta offline":** confira o token do Mapbox e a restrição de URL (passo 2).
- **Não consigo publicar capturas:** confira se publicou as regras do Firestore (passo 1.5).
- **Mudei um arquivo e o celular não atualiza:** feche o app e abra de novo (ele busca a versão nova quando há internet).

## Moderação (opcional)

Depois de entrar no app uma vez, abra **Firebase › Authentication › Usuários** e copie o seu **UID**. Cole esse UID:
- em `ownerUid`, no `js/config.js`;
- no lugar de `SEU_UID_AQUI`, no `firestore.rules` (e publique as regras de novo).

Assim você ganha a tela de **Moderação** no Perfil.
