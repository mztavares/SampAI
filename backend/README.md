# API de Autenticação com Node.js, Express e Oracle DB

## 📋 Descrição
API RESTful completa para sistema de autenticação com cadastro e login de usuários, desenvolvida em Node.js com Express e banco de dados Oracle.

## 🛠️ Tecnologias Utilizadas
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **Oracle DB** - Banco de dados
- **bcryptjs** - Criptografia de senhas
- **email-validator** - Validação de emails
- **nodemon** - Desenvolvimento

## 📁 Estrutura do Projeto
```
backend/
├── app.js              # Arquivo principal da aplicação
├── package.json        # Configurações e dependências
├── schema.sql          # Script SQL para criar tabelas
└── README.md           # Documentação
```

## 🚀 Instalação e Configuração

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Oracle Client
- Instale o Oracle Instant Client
- Configure o caminho no arquivo `app.js`:
```javascript
oracledb.initOracleClient({ libDir: '/path/to/your/instantclient' });
```

### 3. Configurar Banco de Dados
- Execute o script `schema.sql` no DBeaver ou cliente Oracle
- Configure as credenciais no arquivo `app.js`:
```javascript
const dbConfig = {
  user: 'seu_usuario',
  password: 'sua_senha',
  connectString: 'localhost:1521/orcl'
};
```

### 4. Executar Aplicação
```bash
# Produção
npm start

# Desenvolvimento
npm run dev
```

## 📊 Endpoints da API

### POST /api/register
**Cadastro de usuário**

**Request:**
```json
{
  "nome": "João Silva",
  "email": "joao@email.com",
  "senha": "123456"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Usuário cadastrado com sucesso",
  "data": {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@email.com"
  }
}
```

**Response (409):**
```json
{
  "success": false,
  "message": "Este email já está em uso."
}
```

### POST /api/login
**Login de usuário**

**Request:**
```json
{
  "email": "joao@email.com",
  "senha": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@email.com",
    "dataCadastro": "2024-01-15T10:30:00.000Z"
  }
}
```

**Response (401):**
```json
{
  "success": false,
  "message": "Email ou senha inválidos."
}
```

### GET /api/health
**Health check da API**

**Response (200):**
```json
{
  "success": true,
  "message": "API funcionando corretamente",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🗄️ Estrutura do Banco de Dados

### Tabela: usuarios
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | NUMBER | Chave primária (auto-incremento) |
| nome | VARCHAR2(100) | Nome completo do usuário |
| email | VARCHAR2(150) | Email único do usuário |
| senha_hash | VARCHAR2(255) | Hash da senha criptografada |
| data_cadastro | TIMESTAMP | Data/hora do cadastro |

## 🔒 Segurança

- **Senhas criptografadas** com bcrypt (salt rounds: 10)
- **Validação de email** com email-validator
- **Constraint de email único** no banco
- **Tratamento de erros** específicos para violação de chave única
- **Conexões seguras** com fechamento automático

## 🧪 Testando a API

### Usando cURL:

**Cadastro:**
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"nome":"João Silva","email":"joao@email.com","senha":"123456"}'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao@email.com","senha":"123456"}'
```

**Health Check:**
```bash
curl http://localhost:3000/api/health
```

## 📝 Logs

A aplicação gera logs detalhados para:
- ✅ Sucesso nas operações
- ❌ Erros de conexão
- ❌ Erros de validação
- ❌ Erros de banco de dados

## 🔧 Configurações Avançadas

### Variáveis de Ambiente
```bash
PORT=3000
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_CONNECT_STRING=localhost:1521/orcl
ORACLE_CLIENT_PATH=/path/to/your/instantclient
```

### Pool de Conexões (Opcional)
Para melhor performance, configure um pool de conexões:
```javascript
const poolConfig = {
  user: 'seu_usuario',
  password: 'sua_senha',
  connectString: 'localhost:1521/orcl',
  poolMin: 2,
  poolMax: 10,
  poolIncrement: 1
};
```

## 🚨 Tratamento de Erros

- **400**: Campos obrigatórios ausentes ou formato inválido
- **401**: Credenciais inválidas
- **409**: Email já em uso
- **404**: Rota não encontrada
- **500**: Erro interno do servidor

## 📈 Monitoramento

- Health check endpoint para verificar status
- Logs estruturados para debugging
- Tratamento de conexões com fechamento automático
- Validação de entrada em todos os endpoints