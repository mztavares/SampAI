# Configuração do Google Maps

## Passos para configurar a API key do Google Maps

### 1. Obter a API Key no Google Cloud Console

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Selecione seu projeto (ex: "My First Project")
3. Vá para "APIs e serviços" > "Credenciais"
4. Clique em "Criar credenciais" > "Chave de API"
5. Copie a chave gerada

### 2. Configurar no projeto

1. **Substitua a API key nos arquivos:**
   - `app.json`: Substitua `"SUA_API_KEY_AQUI"` pela sua chave real
   - `src/config/googleMaps.js`: Substitua `'SUA_API_KEY_AQUI'` pela sua chave real

2. **Restringir a API key (Recomendado):**
   - No Google Cloud Console, clique na sua API key
   - Em "Restrições de aplicativo":
     - Para Android: Adicione o nome do pacote (ex: com.expo.sampai)
     - Para iOS: Adicione o ID do bundle (ex: com.expo.sampai)
   - Em "Restrições de API": Selecione apenas as APIs necessárias:
     - Maps SDK for Android
     - Maps SDK for iOS
     - Places API (para futuras funcionalidades)

### 3. APIs necessárias habilitadas

Certifique-se de que estas APIs estão ativadas no Google Cloud:
- ✅ Maps SDK for Android
- ✅ Maps SDK for iOS  
- ✅ Places API
- ✅ Distance Matrix API (opcional, para "mais próximos")
- ✅ Directions API (opcional, para otimização de rotas)

### 4. Testar o mapa

Após configurar a API key:

```bash
# Limpar cache e reinstalar
npx expo start --clear

# Para testar em dispositivo físico
npx expo start --tunnel
```

### 5. Próximos passos

Com a API key configurada, o mapa funcionará com:
- ✅ Marcadores dos locais do roteiro
- ✅ Localização do usuário
- ✅ Ordenação por proximidade, rating e preço
- 🔄 Integração com Places API (próxima etapa)

### Troubleshooting

**Erro: "Google Maps API key not found"**
- Verifique se a API key está correta no `app.json`
- Certifique-se de que as APIs estão habilitadas
- Teste em dispositivo físico (não funciona no simulador)

**Mapa não carrega**
- Verifique a conexão com internet
- Confirme se a API key tem as permissões corretas
- Verifique se não há restrições muito restritivas na API key
