const express = require('express');
const oracledb = require('oracledb');
const bcrypt = require('bcryptjs');
const emailValidator = require('email-validator');
require('dotenv').config();
const { VertexAI } = require('@google-cloud/vertexai');


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware para parsing JSON
app.use(express.json());

// Middleware para CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Configuração da conexão com Oracle
const dbConfig = {
  user: process.env.DB_USER || 'rm98044',
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECTION_STRING || 'oracle.fiap.com.br:1521/ORCL'
};

// Função para inicializar o Oracle Client
async function initializeOracleClient() {
  try {
    // Para servidor remoto, não precisa do Oracle Client local
    // oracledb.initOracleClient({ libDir: 'C:\\oracle\\instantclient_21_8' });
    console.log('✅ Oracle Client configurado para servidor remoto');
  } catch (err) {
    console.error('❌ Erro ao inicializar Oracle Client:', err.message);
    process.exit(1);
  }
}

// Função para obter conexão com o banco
async function getConnection() {
  try {
    console.log('🔗 Tentando conectar com Oracle...');
    console.log('📋 Configuração:', {
      user: dbConfig.user,
      connectString: dbConfig.connectString
    });
    
    const connection = await oracledb.getConnection(dbConfig);
    console.log('✅ Conexão Oracle estabelecida com sucesso!');
    return connection;
  } catch (err) {
    console.error('❌ Erro ao conectar com o banco:', err.message);
    console.error('❌ Detalhes do erro:', err);
    throw err;
  }
}
app.post('/api/chat', async (req, res) => {
    console.log("--> [INÍCIO] Requisição recebida em /api/chat.");
    const { conversationHistory, systemPrompt } = req.body;

    if (!conversationHistory || !systemPrompt) {
        return res.status(400).json({ error: 'Histórico da conversa e prompt do sistema são obrigatórios.' });
    }

    try {
        // --- LÓGICA FINAL E CORRETA DE AUTENTICAÇÃO ---

        // 1. Lemos o CONTEÚDO JSON da nossa variável de ambiente customizada.
        const credentialsString = process.env.GCP_CREDENTIALS;
        if (!credentialsString) {
            throw new Error("A variável de ambiente GCP_CREDENTIALS não foi encontrada ou está vazia.");
        }
        const credentials = JSON.parse(credentialsString);

        // 2. Inicializamos o cliente Vertex AI, passando as credenciais DIRETAMENTE.
        // Isso impede a biblioteca de tentar procurar um arquivo.
        const vertex_ai = new VertexAI({
          project: credentials.project_id,
          location: "us-central1",
          googleAuthOptions: {
            credentials, // seu JSON da service account
          },
        });

        // 2. Seleciona o modelo e define o prompt do sistema
        const generativeModel = vertex_ai.getGenerativeModel({
            model: 'gemini-2.5-flash', // Nome de modelo estável para Vertex AI
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
        });

        // 3. Extrai a última mensagem do usuário do histórico para enviar
        const lastUserMessage = conversationHistory.length > 0 ? conversationHistory[conversationHistory.length - 1].parts[0].text : 'Olá, por favor, apresente-se.';
        
        // 4. Cria o histórico para o chat (todas as mensagens, exceto a última)
        const chatHistory = conversationHistory.slice(0, -1);

        const chat = generativeModel.startChat({
            history: chatHistory,
        });

        console.log("--> [INFO] Enviando para a API Vertex AI...");
        const result = await chat.sendMessage(lastUserMessage);
        
        if (!result.response || !result.response.candidates || result.response.candidates.length === 0) {
            console.error("--> [ERRO] A API Vertex AI respondeu, mas sem conteúdo válido.", result);
            throw new Error('Resposta inválida da API Vertex AI.');
        }

        const aiTextResponse = result.response.candidates[0].content.parts[0].text;
        console.log("--> [SUCESSO] Resposta recebida da API Vertex AI.");

        // --- CÓDIGO DA ELEVENLABS (CONTINUA IGUAL) ---
        console.log("--> [INFO] Enviando para a API ElevenLabs...");
        const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'fxQNo5MuMrwdFQ3f5TBM';
        const elevenLabsURL = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;
        const elevenLabsResponse = await fetch(elevenLabsURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'xi-api-key': process.env.ELEVENLABS_API_KEY },
            body: JSON.stringify({ model_id: 'eleven_multilingual_v2', text: aiTextResponse, voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
        });
        if (!elevenLabsResponse.ok) throw new Error(`Erro na API ElevenLabs: ${await elevenLabsResponse.text()}`);
        
        const audioArrayBuffer = await elevenLabsResponse.arrayBuffer();
        res.json({ text: aiTextResponse, audio: Buffer.from(audioArrayBuffer).toString('base64') });

    } catch (error) {
        console.error('--> [ERRO FATAL] Erro no endpoint /api/chat:', error);
        res.status(500).json({ error: 'Falha ao processar a conversa.' });
    }
});
// Endpoint de Cadastro (POST /api/register)
app.post('/api/register', async (req, res) => {
  let connection;
  
  try {
    console.log('📝 Recebida requisição de cadastro:', req.body);
    const { nome, email, senha } = req.body;
    
    // Validação dos campos obrigatórios
    if (!nome || !email || !senha) {
      return res.status(400).json({
        success: false,
        message: 'Todos os campos são obrigatórios (nome, email, senha)'
      });
    }
    
    // Validação do formato do email
    if (!emailValidator.validate(email)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de email inválido'
      });
    }
    
    // Criptografar a senha
    const saltRounds = 10;
    const senhaHash = await bcrypt.hash(senha, saltRounds);
    
    // Conectar ao banco
    connection = await getConnection();
    
    // Inserir usuário na tabela
    const sql = `
      INSERT INTO usuarios (nome, email, senha_hash, data_cadastro)
      VALUES (:nome, :email, :senhaHash, SYSTIMESTAMP)
    `;
    
    const binds = {
      nome: nome,
      email: email,
      senhaHash: senhaHash
    };
    
    const result = await connection.execute(sql, binds, { autoCommit: true });
    
    console.log('✅ Usuário cadastrado com sucesso:', email);
    
    res.status(201).json({
      success: true,
      message: 'Usuário cadastrado com sucesso',
      data: {
        id: String(result.lastRowid),
        nome: String(nome),
        email: String(email)
      }
    });
    
  } catch (err) {
    console.error('❌ Erro no cadastro:', err.message);
    
    // Tratamento específico para violação de chave única
    if (err.errorNum === 1) {
      return res.status(409).json({
        success: false,
        message: 'Este email já está em uso.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: err.message
    });
    
  } finally {
    // Fechar conexão se foi aberta
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('❌ Erro ao fechar conexão:', err.message);
      }
    }
  }
});

// Endpoint de Login (POST /api/login)
app.post('/api/login', async (req, res) => {
  let connection;
  
  try {
    const { email, senha } = req.body;
    
    // Validação dos campos obrigatórios
    if (!email || !senha) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }
    
    // Validação do formato do email
    if (!emailValidator.validate(email)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de email inválido'
      });
    }
    
    // Conectar ao banco
    connection = await getConnection();
    
    // Buscar usuário pelo email
    const sql = `
      SELECT id, nome, email, senha_hash, data_cadastro
      FROM usuarios
      WHERE email = :email
    `;
    
    const binds = { email: email };
    const result = await connection.execute(sql, binds);
    
    // Verificar se o usuário foi encontrado
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email ou senha inválidos.'
      });
    }
    
    const usuario = result.rows[0];
    const senhaHash = usuario[3]; // senha_hash está na posição 3
    
    // Verificar se a senha está correta
    const senhaValida = await bcrypt.compare(senha, senhaHash);
    
    if (!senhaValida) {
      return res.status(401).json({
        success: false,
        message: 'Email ou senha inválidos.'
      });
    }
    
    console.log('✅ Login realizado com sucesso:', email);
    
    res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        id: String(usuario[0]),
        nome: String(usuario[1] || ''),
        email: String(usuario[2] || ''),
        dataCadastro: usuario[4] ? new Date(usuario[4]).toISOString() : null
      }
    });
    
  } catch (err) {
    console.error('❌ Erro no login:', err.message);
    
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: err.message
    });
    
  } finally {
    // Fechar conexão se foi aberta
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('❌ Erro ao fechar conexão:', err.message);
      }
    }
  }
});

// Middleware para verificar autenticação
const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Token de acesso necessário'
    });
  }
  
  // O token é o ID do usuário (simplificado)
  const token = authHeader.split(' ')[1];
  const userId = parseInt(token);
  
  // Verificar se o token é um número válido
  if (isNaN(userId) || userId <= 0) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
  
  req.userId = userId;
  next();
};

// Endpoint para salvar roteiro
app.post('/api/roteiros', authenticateUser, async (req, res) => {
  let connection;

  const systemPrompt = `Você é um gerador de alertas de segurança pública, dado um roteiro que será feito por um usuário, você deve analisar os locais e gerar alertas de segurança relevantes para cada local, considerando fatores como criminalidade, áreas perigosas, horários de maior risco, entre outros. Seu objetivo é fornecer informações que ajudem o usuário a evitar situações de risco durante o roteiro. Seja claro e objetivo em suas recomendações.`;
  
  try {
    console.log('💾 Endpoint /api/roteiros chamado');
    const { titulo, descricao, locais } = req.body;
    const userId = req.userId; // Vem do token de autenticação
    const vertex_ai = new VertexAI({
      project: credentials.project_id,
      location: "us-central1",
      googleAuthOptions: {
        credentials, // seu JSON da service account
      },
    });

    // 2. Seleciona o modelo e define o prompt do sistema
    const generativeModel = vertex_ai.getGenerativeModel({
        model: 'gemini-2.5-flash', // Nome de modelo estável para Vertex AI
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
    });
    const chat = generativeModel.startChat();

    console.log("--> [INFO] Enviando para a API Vertex AI...");
    const resultAi = await chat.sendMessage(lastUserMessage);

    if (!resultAi.response || !resultAi.response.candidates || resultAi.response.candidates.length === 0) {
        console.error("--> [ERRO] A API Vertex AI respondeu, mas sem conteúdo válido.", resultAi);
        throw new Error('Resposta inválida da API Vertex AI.');
    }

    const aiTextResponse = resultAi.response.candidates[0].content.parts[0].text;
    console.log("--> [SUCESSO] Resposta recebida da API Vertex AI.");
        
    // Validação básica
    if (!titulo || !locais) {
      return res.status(400).json({
        success: false,
        message: 'Título e locais são obrigatórios'
      });
    }
    
    // Conectar ao banco
    connection = await getConnection();
    
    // Verificar quantos roteiros o usuário já tem
    const countSql = `
      SELECT COUNT(*) as total
      FROM roteiros
      WHERE usuario_id = :userId
    `;
    
    const countResult = await connection.execute(countSql, { userId: userId });
    const totalRoteiros = countResult.rows[0][0];
    
    if (totalRoteiros >= 3) {
      return res.status(400).json({
        success: false,
        message: 'Limite de 3 roteiros atingido'
      });
    }

    const id_roteiro = `roteiro_${Date.now()}_${userId}`;
    
    // Inserir roteiro na tabela
    const sql = `
      INSERT INTO roteiros (usuario_id, titulo, descricao, locais, data_criacao, data_modificacao, id_roteiro)
      VALUES (:userId, :titulo, :descricao, :locais, SYSTIMESTAMP, SYSTIMESTAMP, :idRoteiro)
    `;

    const sqlAlertas = `
      INSERT INTO SEGURANCA_PUBLICA_ALERTAS (ID_ROTEIRO, ALERTA)
      VALUES (:idRoteiro, :alerta)
    `;

    const bindsAlertas = {
      idRoteiro: id_roteiro,
      alerta: aiTextResponse
    };
    
    const binds = {
      userId: userId,
      titulo: titulo,
      descricao: descricao || null,
      locais: JSON.stringify(locais),
      idRoteiro: id_roteiro
    };
    
    const result = await connection.execute(sql, binds, { autoCommit: true });
    await connection.execute(sqlAlertas, bindsAlertas, { autoCommit: true });
    
    console.log('✅ Roteiro salvo no Oracle:', titulo);
    
    res.status(201).json({
      success: true,
      message: 'Roteiro salvo com sucesso',
      data: {
        id: String(result.lastRowid),
        titulo: String(titulo),
        descricao: String(descricao || ''),
        totalLocais: Array.isArray(locais) ? locais.length : 0,
        totalRoteiros: totalRoteiros + 1,
        id_roteiro: id_roteiro
      }
    });
    
  } catch (err) {
    console.error('❌ Erro ao salvar roteiro:', err.message);
    
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: err.message
    });
    
  } finally {
    // Fechar conexão se foi aberta
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('❌ Erro ao fechar conexão:', err.message);
      }
    }
  }
});

// Endpoint para carregar roteiro específico
app.get('/api/roteiros/:id', authenticateUser, async (req, res) => {
  let connection;
  try {
    console.log('📋 Endpoint /api/roteiros/:id chamado');
    const { id } = req.params;
    const userId = req.userId;
    
    connection = await getConnection();

    const sql = `
      SELECT id, titulo, descricao, data_criacao, data_modificacao, locais
      FROM roteiros
      WHERE id = :id AND usuario_id = :userId
    `;
    const result = await connection.execute(sql, { id: parseInt(id), userId: userId });

    const sqlAlertas = `
      SELECT ALERTA
      FROM SEGURANCA_PUBLICA_ALERTAS
      WHERE ID_ROTEIRO = :idRoteiro
    `;

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Roteiro não encontrado'
      });
    }

    const alertasResult = await connection.execute(sqlAlertas, { idRoteiro: result.rows[0][6] });
    
    const row = result.rows[0];
    let locations = [];
    
    try {
      const locaisData = row[5];
      if (locaisData) {
        let locaisString = '';
        if (typeof locaisData === 'string') {
          locaisString = locaisData;
        } else if (locaisData && typeof locaisData.getData === 'function') {
          locaisString = await locaisData.getData();
        } else {
          locaisString = String(locaisData);
        }
        
        if (locaisString && typeof locaisString === 'string' && locaisString.trim()) {
          locations = JSON.parse(locaisString);
        }
      }
    } catch (error) {
      console.error('Erro ao fazer parse dos locais:', error.message);
      locations = [];
    }
    
    const roteiro = {
      id: String(row[0]),
      titulo: String(row[1] || ''),
      descricao: String(row[2] || ''),
      data_criacao: row[3] ? new Date(row[3]).toISOString() : null,
      data_modificacao: row[4] ? new Date(row[4]).toISOString() : null,
      locations: locations,
      totalLocais: Array.isArray(locations) ? locations.length : 0,
      alertas: alertasResult.rows.map(r => String(r[0] || ''))
    };
    
    console.log(`✅ Roteiro carregado: ${roteiro.titulo} com ${locations.length} locais`);
    
    res.status(200).json({
      success: true,
      message: 'Roteiro carregado com sucesso',
      data: roteiro
    });
  } catch (err) {
    console.error('❌ Erro ao carregar roteiro:', err.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: err.message
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('❌ Erro ao fechar conexão:', err.message);
      }
    }
  }
});

// Função para buscar dados completos do Google Places
const fetchPlaceDetails = async (placeId) => {
  try {
    if (!placeId || placeId.startsWith('local_') || placeId.startsWith('favorite_')) {
      return null;
    }

    // Por enquanto, desabilitar a busca da API para evitar erros
    // Retornar null para usar os dados enviados pelo frontend
    console.log('⚠️ Busca da API do Google Places desabilitada temporariamente');
    return null;

    /* 
    // TODO: Implementar busca da API do Google Places com módulo adequado
    const apiKey = 'AIzaSyC2JhGeNqfhzqsH7LmHQRiRC4HTrHQDCOg';
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&language=pt-BR&fields=name,formatted_address,rating,user_ratings_total,types,photos,editorial_summary,price_level`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.result) {
      return {
        nome: data.result.name,
        endereco: data.result.formatted_address,
        rating: data.result.rating || 0,
        user_ratings_total: data.result.user_ratings_total || 0,
        tipos: data.result.types || [],
        price_level: data.result.price_level || 0,
        descricao: data.result.editorial_summary?.overview || null
      };
    }
    
    return null;
    */
  } catch (error) {
    console.log('⚠️ Erro ao buscar detalhes do Google Places:', error.message);
    return null;
  }
};

// Endpoint para adicionar favorito
app.post('/api/favoritos', authenticateUser, async (req, res) => {
  let connection;
  try {
    console.log('⭐ Endpoint /api/favoritos chamado');
    console.log('📍 Dados recebidos:', req.body);
    const { nome, endereco, tipo, rating, place_id } = req.body;
    const userId = req.userId;
    
    console.log('📍 Dados processados:', { userId, nome, endereco, tipo, rating, place_id });
    
    if (!nome) {
      return res.status(400).json({
        success: false,
        message: 'Nome do local é obrigatório'
      });
    }
    
    connection = await getConnection();
    
    // Verificar se já existe nos favoritos (priorizar place_id)
    let checkSql, checkBinds;
    
    if (place_id && place_id !== '' && !place_id.startsWith('local_') && !place_id.startsWith('favorite_')) {
      // Se temos um place_id válido do Google, usar ele como chave principal
      console.log('🔍 Verificando duplicação por place_id:', place_id);
      checkSql = `
        SELECT COUNT(*) as total
        FROM favoritos
        WHERE usuario_id = :userId AND place_id = :place_id
      `;
      checkBinds = { userId: userId, place_id: place_id };
    } else {
      // Fallback: verificar por nome
      console.log('🔍 Verificando duplicação por nome:', nome);
      checkSql = `
        SELECT COUNT(*) as total
        FROM favoritos
        WHERE usuario_id = :userId AND nome = :nome
      `;
      checkBinds = { userId: userId, nome: nome };
    }
    
    console.log('🔍 SQL de verificação:', checkSql);
    console.log('🔍 Parâmetros:', checkBinds);
    
    const checkResult = await connection.execute(checkSql, checkBinds);
    const duplicateCount = checkResult.rows[0][0];
    
    console.log('🔍 Resultado da verificação:', duplicateCount);
    
    if (duplicateCount > 0) {
      console.log('⚠️ Local já existe nos favoritos');
      return res.status(400).json({
        success: false,
        message: 'Local já está nos favoritos'
      });
    }
    
    console.log('✅ Local não existe nos favoritos, prosseguindo com inserção');
    
    // Buscar dados completos da API do Google Places se temos place_id válido
    let dadosCompletos = null;
    if (place_id && !place_id.startsWith('local_') && !place_id.startsWith('favorite_')) {
      console.log('🔍 Buscando dados completos da API do Google Places...');
      dadosCompletos = await fetchPlaceDetails(place_id);
      console.log('📍 Dados da API:', dadosCompletos);
    }
    
    // Usar dados da API se disponíveis, senão usar dados enviados
    const finalNome = dadosCompletos?.nome || nome;
    const finalEndereco = dadosCompletos?.endereco || endereco || '';
    const finalTipo = dadosCompletos?.tipos?.[0] || tipo || '';
    const finalRating = dadosCompletos?.rating || rating || 0;
    const finalUserRatingsTotal = dadosCompletos?.user_ratings_total || 0;
    const finalPriceLevel = dadosCompletos?.price_level || 0;
    const finalDescricao = dadosCompletos?.descricao || '';
    
    // Usar apenas os campos que sabemos que existem na tabela
    const sql = `
      INSERT INTO favoritos (usuario_id, nome, endereco, tipo, rating, place_id, data_favorito)
      VALUES (:userId, :nome, :endereco, :tipo, :rating, :place_id, SYSTIMESTAMP)
    `;
    const binds = {
      userId: userId,
      nome: finalNome,
      endereco: finalEndereco,
      tipo: finalTipo,
      rating: finalRating,
      place_id: place_id || `local_${Date.now()}_${userId}`
    };
    
    const result = await connection.execute(sql, binds, { autoCommit: true });
    
    console.log('✅ Favorito adicionado:', finalNome);
    
    res.status(201).json({
      success: true,
      message: 'Local adicionado aos favoritos',
      data: {
        id: String(result.lastRowid),
        nome: String(finalNome),
        endereco: String(finalEndereco),
        tipo: String(finalTipo),
        rating: Number(finalRating) || 0,
        place_id: String(place_id || `local_${Date.now()}_${userId}`)
      }
    });
  } catch (err) {
    console.error('❌ Erro ao adicionar favorito:', err.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: err.message
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('❌ Erro ao fechar conexão:', err.message);
      }
    }
  }
});

// Endpoint para remover favorito
app.delete('/api/favoritos/:id', authenticateUser, async (req, res) => {
  let connection;
  try {
    console.log('🗑️ Endpoint DELETE /api/favoritos/:id chamado');
    const { id } = req.params;
    const userId = req.userId;
    
    connection = await getConnection();
    
    // Verificar se o favorito existe e pertence ao usuário
    const checkSql = `
      SELECT COUNT(*) as total
      FROM favoritos
      WHERE id = :id AND usuario_id = :userId
    `;
    const checkResult = await connection.execute(checkSql, { 
      id: parseInt(id), 
      userId: userId 
    });
    
    if (checkResult.rows[0][0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'Favorito não encontrado'
      });
    }
    
    // Remover favorito
    const deleteSql = `
      DELETE FROM favoritos
      WHERE id = :id AND usuario_id = :userId
    `;
    const result = await connection.execute(deleteSql, { 
      id: parseInt(id), 
      userId: userId 
    }, { autoCommit: true });
    
    console.log('✅ Favorito removido, ID:', id);
    
    res.status(200).json({
      success: true,
      message: 'Favorito removido com sucesso'
    });
  } catch (err) {
    console.error('❌ Erro ao remover favorito:', err.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: err.message
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('❌ Erro ao fechar conexão:', err.message);
      }
    }
  }
});

// Endpoint para obter perfil do usuário
app.get('/api/profile', authenticateUser, async (req, res) => {
  let connection;
  
  try {
    console.log('📊 Endpoint /api/profile chamado');
    const userId = req.userId; // Vem do token de autenticação
    
    // Conectar ao banco
    connection = await getConnection();
    
    // Buscar roteiros salvos
    const roteirosSql = `
      SELECT id, titulo, descricao, data_criacao, data_modificacao, locais
      FROM roteiros
      WHERE usuario_id = :userId
      ORDER BY data_criacao DESC
    `;
    
    const roteirosResult = await connection.execute(roteirosSql, { userId: userId });
    
    // Transformar dados para o formato esperado usando Promise.all para lidar com async
    const roteiros = await Promise.all(roteirosResult.rows.map(async (row) => {
      let locations = [];
      try {
        // Tratar os dados dos locais de forma mais robusta
        const locaisData = row[5];
        if (locaisData) {
          // Se é um CLOB do Oracle, converter para string primeiro
          let locaisString = '';
          if (typeof locaisData === 'string') {
            locaisString = locaisData;
          } else if (locaisData && typeof locaisData.getData === 'function') {
            // É um CLOB do Oracle - precisa aguardar a Promise
            locaisString = await locaisData.getData();
          } else {
            // Tentar converter diretamente
            locaisString = String(locaisData);
          }
          
          // Fazer parse do JSON
          if (locaisString && typeof locaisString === 'string' && locaisString.trim()) {
            locations = JSON.parse(locaisString);
          } else if (locaisString) {
            // Se não é string, tentar converter
            const stringData = String(locaisString);
            if (stringData && stringData !== '[object Object]') {
              locations = JSON.parse(stringData);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao fazer parse dos locais:', error.message);
        locations = [];
      }
      
      return {
        id: String(row[0]), // Converter para string
        titulo: String(row[1] || ''),
        descricao: String(row[2] || ''),
        data_criacao: row[3] ? new Date(row[3]).toISOString() : null,
        data_modificacao: row[4] ? new Date(row[4]).toISOString() : null,
        locations: locations,
        totalLocais: Array.isArray(locations) ? locations.length : 0
      };
    }));
    
    console.log(`✅ Encontrados ${roteiros.length} roteiros para o usuário`);
    
        // Buscar favoritos do usuário
        const favoritosSql = `
          SELECT id, nome, endereco, tipo, rating, data_favorito, place_id
          FROM favoritos
          WHERE usuario_id = :userId
          ORDER BY data_favorito DESC
        `;
        const favoritosResult = await connection.execute(favoritosSql, { userId: userId });
        
        const favoritos = favoritosResult.rows.map(row => ({
          id: String(row[0]),
          nome: String(row[1] || ''),
          endereco: String(row[2] || ''),
          tipo: String(row[3] || ''),
          rating: row[4] ? parseFloat(row[4]) : 0,
          data_favorito: row[5] ? new Date(row[5]).toISOString() : null,
          place_id: String(row[6] || ''),
          user_ratings_total: 0, // Valor padrão
          price_level: 0, // Valor padrão
          descricao: '' // Valor padrão
        }));
        
        console.log(`✅ Encontrados ${favoritos.length} favoritos para o usuário`);
        
        res.status(200).json({
          success: true,
          message: 'Perfil carregado com sucesso',
          data: {
            roteiros: roteiros,
            favoritos: favoritos
          }
        });
    
  } catch (err) {
    console.error('❌ Erro ao buscar perfil:', err.message);
    
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: err.message
    });
    
  } finally {
    // Fechar conexão se foi aberta
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('❌ Erro ao fechar conexão:', err.message);
      }
    }
  }
});

// Endpoint de Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API funcionando corretamente',
    timestamp: new Date().toISOString()
  });
});

// Inicializar servidor
async function startServer() {
  try {
    await initializeOracleClient();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log('✅ Oracle Client configurado para servidor remoto');
      console.log('🚀 Servidor iniciado com sucesso!');
      console.log(`📡 Porta: ${PORT}`);
      console.log(`🔗 URL: http://localhost:${PORT}`);
      console.log(`🌐 Acessível em: http://0.0.0.0:${PORT}`);
      console.log('📊 Endpoints disponíveis:');
      console.log('   POST /api/register - Cadastro de usuário');
      console.log('   POST /api/login - Login de usuário');
      console.log('   POST /api/roteiros - Salvar roteiro');
      console.log('   GET  /api/profile - Perfil do usuário');
      console.log('   GET  /api/health - Health check');
    });
    
  } catch (err) {
    console.error('❌ Erro ao iniciar servidor:', err.message);
    process.exit(1);
  }
}

startServer();
