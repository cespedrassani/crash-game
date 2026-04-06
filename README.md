# Crash Game 🎮

Um jogo de crash multiplayer em tempo real — o multiplicador sobe a partir de `1.00x` e pode crashar a qualquer momento. Aposte antes da rodada começar e saque antes do crash para garantir o lucro. Se o crash acontecer antes do seu cashout, você perde a aposta.

---

## Como rodar o projeto

### Pré-requisitos

- [Bun](https://bun.sh) >= 1.x
- [Docker](https://www.docker.com) + Docker Compose

### Subindo tudo

```bash
# 1. Clone o repositório
git clone <url-do-repo>
cd crash-game

# 2. Instale as dependências do monorepo
bun install

# 3. Suba toda a infraestrutura e serviços
bun run docker:up
```

Só isso. O `docker:up` sobe o banco, o broker, o Keycloak, o Kong, os dois serviços de backend e o frontend — tudo junto, sem nenhum passo manual.

### Acessando

| O quê                    | URL                                                                      |
| ------------------------ | ------------------------------------------------------------------------ |
| **Frontend (jogo)**      | http://localhost:3000                                                    |
| **API Gateway (Kong)**   | http://localhost:8000                                                    |
| **Keycloak (Admin UI)**  | http://localhost:8080 — `admin` / `admin`                                |
| **RabbitMQ (UI)**        | http://localhost:15672 — `admin` / `admin`                               |
| **Games Service (direto)** | http://localhost:4001                                                  |
| **Wallets Service (direto)** | http://localhost:4002                                                |

### Usuário de teste

O Keycloak já vem com um usuário pré-configurado:

```
Usuário: player
Senha:   player123
```

Ao fazer login pela primeira vez, uma carteira é criada automaticamente com **R$ 1.000,00** de saldo inicial.

```
Usuário: player5
Senha:   player123
```

Esse usuário é criado automaticamente a cada startup, mas sem carteira. Serve para testar o fluxo de criar carteira via API.

### Outros comandos úteis

```bash
bun run docker:down    # Para os containers
bun run docker:prune   # Remove tudo: containers, volumes e imagens (reset completo)
bun test               # Roda os testes unitários dos dois serviços
bun run test:e2e       # Roda os testes e2e (requer docker:up rodando)
```

---

## Tecnologias utilizadas

### Backend

| Tecnologia         | Versão   | Para quê                                       |
| ------------------ | -------- | ---------------------------------------------- |
| **Bun**            | 1.x      | Runtime e gerenciador de pacotes                |
| **NestJS**         | 11       | Framework dos dois microserviços                |
| **TypeScript**     | 5.x      | Strict mode em todo o projeto                  |
| **Prisma**         | 6.x      | ORM e migrations do banco                      |
| **PostgreSQL**     | 18       | Banco de dados (um schema por serviço)          |
| **RabbitMQ**       | 4.2      | Broker de mensagens entre os serviços           |
| **amqplib**        | —        | Cliente AMQP para comunicação com RabbitMQ      |
| **passport-jwt**   | —        | Validação de JWT emitido pelo Keycloak          |
| **jwks-rsa**       | —        | Busca dinâmica da chave pública do Keycloak     |
| **Socket.IO**      | 4.x      | WebSocket para tempo real no Games Service      |
| **@nestjs/swagger**| —        | Documentação automática da API                  |

### Frontend

| Tecnologia            | Versão | Para quê                                          |
| --------------------- | ------ | ------------------------------------------------- |
| **Next.js**           | 15     | Framework React com App Router                    |
| **React**             | 19     | UI                                                |
| **TypeScript**        | 5.x    | Tipagem forte                                     |
| **Tailwind CSS**      | v4     | Estilização                                       |
| **Radix UI**          | —      | Componentes acessíveis (Dialog, Toast, etc.)      |
| **TanStack Query**    | v5     | Cache e gerenciamento de estado do servidor       |
| **Zustand**           | v5     | Estado global do cliente (auth, game state)       |
| **Socket.IO Client**  | 4.x    | Conexão WebSocket com o Games Service             |
| **Sonner**            | —      | Toast notifications                               |
| **Lucide React**      | —      | Ícones                                            |

### Infraestrutura

| Tecnologia  | Versão | Para quê                                            |
| ----------- | ------ | --------------------------------------------------- |
| **Kong**    | 3.9    | API Gateway — proxy, roteamento e CORS centralizado |
| **Keycloak**| 26.5   | Identity Provider — login, tokens JWT, PKCE         |
| **Docker**  | —      | Containerização de tudo                             |

---

## Arquitetura

O projeto segue uma arquitetura de **microserviços** com dois serviços de backend, cada um com seu próprio banco de dados. Eles se comunicam de forma assíncrona via RabbitMQ. O frontend fala com ambos através do Kong, que funciona como ponto único de entrada.

```
┌──────────────────────────────────────────────────────┐
│                      Frontend                        │
│              Next.js 15 — localhost:3000             │
└──────────────────┬───────────────┬───────────────────┘
                   │  REST/HTTP    │  WebSocket
                   ▼               ▼
┌──────────────────────────────────────────────────────┐
│                    Kong (API Gateway)                │
│                    localhost:8000                    │
│  /games  ──────────────────────────────────────────► │──► Games Service  :4001
│  /wallets ─────────────────────────────────────────► │──► Wallets Service :4002
│  /socket.io ───────────────────────────────────────► │──► Games Service  :4001
└──────────────────────────────────────────────────────┘

┌─────────────────────┐     RabbitMQ      ┌─────────────────────┐
│   Games Service     │ ──────────────►   │   Wallets Service   │
│   NestJS + Bun      │ ◄──────────────   │   NestJS + Bun      │
│   PostgreSQL:games  │                   │   PostgreSQL:wallets │
└─────────────────────┘                   └─────────────────────┘

┌──────────────────────────────────────────────────────┐
│                     Keycloak                         │
│            Identity Provider (OIDC/JWT)              │
│     Validado pelos dois serviços via jwks-rsa        │
└──────────────────────────────────────────────────────┘
```

### Fluxo de uma rodada

1. O **Games Service** inicia automaticamente uma fase de apostas (10s por padrão)
2. O frontend recebe via **WebSocket** o evento de nova rodada
3. O jogador faz uma **aposta via REST** (`POST /games/bet`)
4. O Games Service publica um evento no **RabbitMQ** para debitar o saldo
5. O Wallets Service consome o evento, debita o saldo e publica a confirmação
6. A rodada começa: o multiplicador sobe e é transmitido via **WebSocket**
7. O jogador pode fazer **cashout via REST** (`POST /games/bet/cashout`)
8. Quando a rodada crasha (ou o jogador faz cashout), o Games Service publica eventos de crédito para quem ganhou
9. O Wallets Service credita os saldos e o ciclo recomeça

---

## Estrutura do projeto

O repositório é um **monorepo Bun Workspaces** com a seguinte organização:

```
crash-game/
├── services/
│   ├── games/          # Serviço de jogo (engine, apostas, WebSocket)
│   │   ├── src/
│   │   │   ├── domain/         # Entidades, value objects, eventos de domínio
│   │   │   ├── application/    # Commands, queries (CQRS)
│   │   │   ├── infrastructure/ # Prisma, RabbitMQ, auth
│   │   │   └── presentation/   # Controllers REST + Gateway WebSocket
│   │   ├── prisma/
│   │   └── tests/ (unit/ + e2e/)
│   │
│   └── wallets/        # Serviço de carteira (saldo, transações)
│       ├── src/
│       │   ├── domain/         # Wallet entity, Money VO, eventos de domínio
│       │   ├── application/    # Commands, queries (CQRS)
│       │   ├── infrastructure/ # Prisma, RabbitMQ, outbox relay
│       │   └── presentation/   # Controllers REST
│       ├── prisma/
│       └── tests/ (unit/ + e2e/)
│
├── packages/
│   ├── common/         # JWT strategy/guard compartilhado entre serviços
│   └── events/         # Tipos de eventos e topologia do RabbitMQ
│
├── frontend/           # Next.js 15 App
│   └── src/
│       ├── app/        # Rotas (login, game, auth/callback)
│       ├── components/ # UI components (game, wallet, layout)
│       ├── hooks/      # React hooks (useSocket, useGameState, useWallet...)
│       ├── store/      # Zustand stores (auth, game)
│       ├── services/   # Chamadas REST (gameService, walletService)
│       └── lib/        # Auth PKCE, socket client, api client
│
├── docker/
│   ├── kong/           # Configuração declarativa do Kong
│   ├── keycloak/       # Realm exportado (importado automaticamente)
│   └── postgres/       # Script de criação dos múltiplos bancos
│
└── docker-compose.yml
```

---

## Decisões técnicas

### DDD (Domain-Driven Design)

Os dois serviços seguem a mesma arquitetura em camadas:

- **Domain** — Entidades, value objects, eventos de domínio. Zero dependências externas. Aqui ficam as regras de negócio.
- **Application** — Use cases implementados como comandos e queries (CQRS). Orquestra o domínio sem expor detalhes de infraestrutura.
- **Infrastructure** — Implementações concretas: Prisma para banco, amqplib para RabbitMQ, JWT para auth.
- **Presentation** — Controllers REST e WebSocket Gateway. Recebe a requisição, chama o use case, devolve a resposta.

### Dinheiro como centavos inteiros (bigint)

Todo valor monetário é armazenado e trafegado em **centavos como `BIGINT`**. Isso elimina completamente problemas de precisão de ponto flutuante — que seriam críticos num sistema de apostas. O value object `Money` encapsula essa conversão e expõe helpers para formatar em reais quando necessário.

### Outbox Pattern

Para garantir que eventos do Wallets Service não se percam em caso de falha entre gravar no banco e publicar no broker, foi implementado o **Transactional Outbox Pattern**: o evento é gravado no banco na mesma transação da operação de negócio. Um relay periódico lê os eventos pendentes e os publica no RabbitMQ, marcando-os como enviados só após confirmação.

### Kong em modo declarativo (DB-less)

O Kong foi configurado no modo **DB-less**, onde toda a configuração vive num arquivo `kong.yml`. Isso significa que não precisa de banco separado para o Kong e a configuração é versionada junto com o código. O roteamento é simples: `/games/*` vai para o Games Service e `/wallets/*` vai para o Wallets Service.

### Autenticação com Keycloak + PKCE

O frontend implementa o fluxo **Authorization Code + PKCE** diretamente, sem biblioteca de terceiros. O PKCE (Proof Key for Code Exchange) é o padrão recomendado para SPAs — evita que um atacante que intercepte o authorization code consiga trocá-lo por tokens sem ter o `code_verifier` original.

Os dois serviços de backend validam o JWT offline usando a **chave pública do Keycloak** (buscada via JWKS), sem precisar consultar o Keycloak a cada requisição.

### Pacotes compartilhados

O monorepo tem dois pacotes internos em `packages/`:

- **`@crash/common`** — JWT strategy e guard do NestJS/Passport, reaproveitados nos dois serviços sem duplicação.
- **`@crash/events`** — Tipagem dos eventos e topologia do RabbitMQ (nomes de exchanges e queues). Garante que produtor e consumidor falem a mesma língua.

### WebSocket via Kong

O Socket.IO do frontend se conecta via Kong (`/socket.io`), que faz proxy para o Games Service. Isso mantém o frontend com um único ponto de entrada para tudo, sem precisar saber as portas internas dos serviços.

### Provably Fair

O crash point de cada rodada é determinístico e verificável: gerado a partir de um **hash chain** (HMAC-SHA256) usando uma seed da casa e uma seed do servidor. Qualquer jogador pode verificar independentemente que o resultado de uma rodada passada não foi manipulado, usando o endpoint `GET /games/rounds/:id/verify`.

---

## API

Todos os endpoints são acessados via Kong em `http://localhost:8000`.

### Wallets — `/wallets`

| Método | Endpoint      | Auth | Descrição                                      |
| ------ | ------------- | ---- | ---------------------------------------------- |
| `GET`  | `/health`     | Não  | Health check                                   |
| `POST` | `/wallets`    | Sim  | Cria a carteira do jogador autenticado         |
| `GET`  | `/wallets/me` | Sim  | Retorna carteira e saldo atual                 |
| `POST` | `/wallets/deposit` | Sim | Deposita saldo na carteira                |

### Games — `/games`

| Método | Endpoint                        | Auth | Descrição                                      |
| ------ | ------------------------------- | ---- | ---------------------------------------------- |
| `GET`  | `/health`                       | Não  | Health check                                   |
| `GET`  | `/rounds/current`               | Não  | Estado atual da rodada com apostas             |
| `GET`  | `/rounds/history`               | Não  | Histórico paginado de rodadas                  |
| `GET`  | `/rounds/:id/verify`            | Não  | Dados de verificação provably fair             |
| `GET`  | `/bets/me`                      | Sim  | Histórico de apostas do jogador                |
| `POST` | `/bet`                          | Sim  | Faz aposta na rodada atual                     |
| `POST` | `/bet/cashout`                  | Sim  | Saca no multiplicador atual                    |

### WebSocket — `ws://localhost:8000/socket.io`

O servidor emite eventos em tempo real para todos os clientes conectados:

| Evento              | Quando é emitido                                    |
| ------------------- | --------------------------------------------------- |
| `round:betting`     | Nova fase de apostas iniciada                       |
| `round:started`     | Rodada começa, multiplicador começa a subir         |
| `round:tick`        | A cada tick — multiplicador atual                   |
| `round:crashed`     | Rodada crashou — multiplicador final + hash         |
| `bet:placed`        | Um jogador apostou                                  |
| `bet:cashedout`     | Um jogador sacou                                    |

---

## Testes

```bash
# Unitários (domínio puro — sem Docker necessário)
bun test

# E2E (requer docker:up rodando)
bun run test:e2e
```

Os testes unitários cobrem as regras de domínio dos dois serviços: ciclo de vida do round, lógica de aposta, cashout, saldo insuficiente, precisão monetária e o algoritmo provably fair.

Os testes E2E sobem os serviços reais e exercitam os fluxos completos: apostar → cashout → saldo atualizado, apostar → crash → aposta perdida, erros de validação, etc.
