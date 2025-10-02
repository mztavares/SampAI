# SampAI - Sistema de Inteligência Artificial para Roteiros Personalizados

## 📋 Descrição
SampAI é um sistema de inteligência artificial que gera roteiros personalizados para São Paulo, utilizando dados reais de locais, avaliações e informações de acessibilidade.

## 🛠️ Tecnologias Utilizadas
- **React Native** - Framework mobile
- **Expo** - Plataforma de desenvolvimento
- **Node.js** - Backend
- **Express** - Framework web
- **Oracle DB** - Banco de dados
- **Google Places API** - Dados de locais
- **Google Maps** - Mapas e localização

## 📁 Estrutura do Projeto (Organizada)
```
projeto_SampAI/
├── src/                    # Frontend React Native
│   ├── pages/             # Telas da aplicação
│   │   ├── ActivitiesScreen/
│   │   ├── AgeScreen/
│   │   ├── DurationScreen/
│   │   ├── FoodScreen/
│   │   ├── GeneratingScreen/
│   │   ├── ItineraryScreen/
│   │   ├── OnboardingScreen/
│   │   ├── RegionScreen/
│   │   ├── ScheduleScreen/
│   │   ├── SplashScreen/
│   │   └── StayScreen/
│   ├── services/          # Serviços e APIs
│   │   ├── apiService.js
│   │   ├── googlePlacesService.js
│   │   └── itineraryService.js
│   ├── config/            # Configurações
│   │   ├── api.js
│   │   ├── googleMaps.js
│   │   └── theme.js
│   └── contexts/          # Contextos React
│       └── ThemeContext.js
├── backend/               # Backend Node.js + Oracle
│   ├── app.js            # Servidor principal
│   ├── package.json      # Dependências do backend
│   ├── schema.sql        # Script do banco Oracle
│   ├── config.env.example # Configurações de exemplo
│   └── README.md         # Documentação do backend
├── assets/               # Recursos estáticos
│   ├── adaptive-icon.png
│   ├── favicon.png
│   ├── icon.png
│   ├── snack-icon.png
│   └── splash-icon.png
├── App.js                # Componente principal
├── app.json              # Configuração Expo
├── index.js              # Ponto de entrada
├── package.json          # Dependências do frontend
└── README.md             # Este arquivo
```

## 🚀 Instalação e Execução

### Frontend (React Native + Expo)
```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm start

# Executar no Android
npm run android

# Executar no iOS
npm run ios
```

### Backend (Node.js + Oracle)
```bash
cd backend

# Instalar dependências
npm install

# Configurar Oracle Client
# Editar app.js com suas credenciais

# Executar schema.sql no Oracle
# Usar DBeaver ou cliente Oracle

# Executar servidor
npm start
```

## 📊 Funcionalidades

### Frontend
- ✅ **Onboarding** - Coleta de preferências do usuário
- ✅ **Geração de Roteiros** - IA personalizada baseada em respostas
- ✅ **Detalhes de Locais** - Informações completas via Google Places API
- ✅ **Acessibilidade** - Dados de acessibilidade para cada local
- ✅ **História dos Locais** - Contexto histórico e cultural
- ✅ **Tema Escuro/Claro** - Interface adaptável
- ✅ **Navegação Intuitiva** - UX otimizada

### Backend
- ✅ **API RESTful** - Endpoints para autenticação
- ✅ **Cadastro de Usuários** - Sistema completo de registro
- ✅ **Login Seguro** - Autenticação com JWT
- ✅ **Banco Oracle** - Armazenamento seguro de dados
- ✅ **Validações** - Campos obrigatórios e formatos
- ✅ **Criptografia** - Senhas protegidas com bcrypt

## 🔧 Configuração

### Google Maps API
1. Obter chave da API no Google Cloud Console
2. Configurar em `src/config/googleMaps.js`
3. Habilitar APIs: Places, Maps, Geocoding

### Oracle Database
1. Instalar Oracle Database
2. Configurar em `backend/app.js`
3. Executar `backend/schema.sql`

### Variáveis de Ambiente
```bash
# Backend
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_CONNECT_STRING=localhost:1521/orcl
JWT_SECRET=sua_chave_secreta
```

## 📱 Telas da Aplicação

1. **SplashScreen** - Tela inicial com logo
2. **OnboardingScreen** - Coleta de preferências
3. **GeneratingScreen** - Geração do roteiro
4. **ItineraryScreen** - Exibição do roteiro final
5. **ActivitiesScreen** - Seleção de atividades
6. **AgeScreen** - Faixa etária
7. **DurationScreen** - Duração da viagem
8. **FoodScreen** - Preferências gastronômicas
9. **RegionScreen** - Região de interesse
10. **ScheduleScreen** - Horários preferidos
11. **StayScreen** - Tipo de hospedagem

## 🎯 Recursos Avançados

### Inteligência Artificial
- **Geração Personalizada** - Roteiros baseados em preferências
- **Análise de Contexto** - Considera localização e horários
- **Otimização de Rotas** - Sequência lógica de visitas
- **Dados Reais** - Informações atualizadas via APIs

### Acessibilidade
- **Informações Detalhadas** - Dados de acessibilidade de cada local
- **Interface Inclusiva** - Design acessível
- **Navegação Adaptável** - Suporte a diferentes necessidades

### Segurança
- **Autenticação Segura** - JWT tokens
- **Criptografia** - Senhas protegidas
- **Validações** - Dados sanitizados
- **Rate Limiting** - Proteção contra ataques

## 🧪 Testes

### Frontend
```bash
# Executar testes
npm test

# Executar em modo debug
npm run debug
```

### Backend
```bash
cd backend

# Testar endpoints
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"nome":"Teste","email":"teste@email.com","senha":"123456"}'
```

## 📈 Performance

- **Lazy Loading** - Carregamento otimizado
- **Caching** - Dados em cache
- **Otimização de Imagens** - Compressão automática
- **Bundle Splitting** - Código otimizado

## 🔒 Segurança

- **HTTPS** - Conexões seguras
- **CORS** - Política de origem
- **Rate Limiting** - Limite de requisições
- **Validação de Dados** - Sanitização de entrada

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📞 Suporte

Para suporte, entre em contato através dos issues do GitHub ou email.

---

**SampAI** - Transformando a forma de explorar São Paulo com inteligência artificial! 🚀