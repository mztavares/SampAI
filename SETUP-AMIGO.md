# 🚀 Setup para Amigo - SampAI

## 📋 Pré-requisitos
- Node.js (versão 18 ou superior)
- Expo CLI: `npm install -g @expo/cli`

## 🔧 Instalação

### 1. Instalar dependências
```bash
# Backend
cd backend
npm install
cd ..

# Frontend
npm install
```

### 2. Configurar banco Oracle
O banco já está configurado com as credenciais:
- Host: oracle.fiap.com.br
- Port: 1521
- Database: ORCL
- User: rm98044
- Password: 070305

## 🚀 Como rodar

### Terminal 1 - Backend:
```bash
node backend/app.js
```

### Terminal 2 - Frontend:
```bash
npx expo start
```

## 📱 Testando
1. Abra o app no celular
2. Clique em "Criar Conta"
3. Preencha os campos
4. Clique em "Criar Conta"

## ❌ Problemas comuns

### Erro "Unable to resolve module events"
- Execute: `cd backend && npm install`
- Certifique-se de que o Node.js está instalado

### Erro "Network request failed"
- Verifique se o backend está rodando na porta 5000
- Teste: http://localhost:5000/api/health

### Erro de conexão Oracle
- O banco está configurado para servidor remoto
- Não precisa instalar Oracle Client local

## 🆘 Suporte
Se tiver problemas, verifique:
1. Backend rodando: `netstat -ano | findstr :5000`
2. Logs do backend no terminal
3. Logs do app no Expo
