const express = require('express');
const oracledb = require('oracledb');
const bcrypt = require('bcryptjs');
const emailValidator = require('email-validator');

// --- NOVOS MÓDULOS PARA A FUNCIONALIDADE DE IA, CORS E ENV ---
const cors = require('cors');
const fetch = require('node-fetch');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config();

// ===== MUDANÇA 1: Adicionando a biblioteca oficial do Google Vertex AI =====
const { VertexAI } = require('@google-cloud/vertexai');


// --- CONFIGURAÇÃO INICIAL ---
const app = express();
const PORT = process.env.PORT || 5000;

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());

app.get('/healthz', (req, res) => {
  res.status(200).send('ok');
});



// --- (A) CONEXÕES COM BANCOS DE DADOS ---

// Conexão com Oracle (seu código original - sem alterações)
const dbConfig = {
  user: process.env.DB_USER || 'rm98044',
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECT_STRING || 'oracle.fiap.com.br:1521/ORCL'
};

async function initializeOracleClient() {
  try {
    console.log('✅ Oracle Client configurado para servidor remoto');
  } catch (err) {
    console.error('❌ Erro ao inicializar Oracle Client:', err.message);
    process.exit(1);
  }
}

async function getConnection() {
  try {
    const connection = await oracledb.getConnection(dbConfig);
    console.log('✅ Conexão Oracle estabelecida com sucesso!');
    return connection;
  } catch (err) {
    console.error('❌ Erro ao conectar com o banco Oracle:', err.message);
    throw err;
  }
}


// ===== MUDANÇA 2: Conexão com Firestore usando a nova variável de ambiente genérica =====
try {
  const serviceAccountString = process.env.GCP_CREDENTIALS; // Usando a nova credencial
  if (serviceAccountString) {
    const serviceAccount = JSON.parse(serviceAccountString);
    initializeApp({ credential: cert(serviceAccount) });
    console.log('✅ Conectado ao Google Cloud Firestore com sucesso!');
  } else {
    console.warn('🟠 AVISO: A integração com Firestore está desabilitada. Preencha a variável de ambiente GCP_CREDENTIALS para ativar.');
  }
} catch (error) {
  console.error('❌ ERRO: Não foi possível conectar ao Firestore. Verifique a variável de ambiente GCP_CREDENTIALS.', error.message);
}


// --- (B) NOVAS ROTAS DE API PARA A IA ---

// ===== MUDANÇA 3: Rota /api/chat totalmente refeita para usar o Vertex AI SDK =====
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
            project: credentials.project_id, // Pegamos o ID do projeto do próprio JSON
            location: 'us-central1',
            credentials: credentials       // <-- O PASSO CHAVE!
        });

        // 2. Seleciona o modelo e define o prompt do sistema
        const generativeModel = vertex_ai.getGenerativeModel({
            model: 'gemini-1.5-flash-001', // Nome de modelo estável para Vertex AI
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


// Rota /api/finalizar-onboarding (sem alterações)
app.post('/api/finalizar-onboarding', async (req, res) => {
    const { conversation } = req.body;
    // Corrigido para verificar a variável de ambiente correta
    if (!process.env.GCP_CREDENTIALS) {
      console.warn('Firestore desabilitado, pulando salvamento da conversa.');
      return res.status(200).json({ message: 'Conversa não salva (Firestore desabilitado).', conversationId: `simulado_${Date.now()}` });
    }
    try {
        const firestoreDB = getFirestore();
        const docRef = await firestoreDB.collection('conversas').add({
            createdAt: new Date(),
            conversation: conversation
        });
        res.status(200).json({ message: 'Conversa salva com sucesso!', conversationId: docRef.id });
    } catch (error) {
        console.error('❌ Erro ao salvar conversa no Firestore:', error);
        res.status(500).json({ error: 'Não foi possível salvar a conversa.' });
    }
});


// Rota /api/gerar-roteiro (sem alterações)
app.post('/api/gerar-roteiro', async (req, res) => {
    const { conversationId } = req.body;
    console.log(`Gerando roteiro para a conversa ID: ${conversationId}`);
    try {
        const roteiroBase = {
            titulo: `Seu Projeto de Percurso em SP`,
            dias: [
                { dia: 1, titulo: "Cultura e Gastronomia", atividades: [ { hora: "10:30", titulo: "Passeio pela Avenida Paulista"}, { hora: "20:00", titulo: "Visita à Catedral da Sé"} ] },
                { dia: 2, titulo: "Natureza, Arte e Boemia", atividades: [ { hora: "15:00", titulo: "Exploração no Parque Ibirapuera"}, { hora: "22:00", titulo: "Noite na Vila Madalena"} ] }
            ]
        };
        const roteiroAnalisado = analisarSegurancaRoteiro(roteiroBase);
        res.json(roteiroAnalisado);
    } catch (error) {
      console.error('❌ Erro ao gerar o roteiro:', error);
      res.status(500).json({ error: 'Falha ao gerar o roteiro.' });
    }
});

// Lógica do Vigía Urbano (sem alterações)
const analisarSegurancaRoteiro = (roteiroOriginal) => {
    const DADOS_RISCO = {
        'Catedral da Sé': { noite: { nivel: 'Elevado', analise: "A região central apresenta um risco maior de roubos a transeuntes neste horário.", recomendacoes: "Utilize transporte por aplicativo. Evite caminhar pela praça. Não exiba objetos de valor." } },
        'Avenida Paulista': { tarde: { nivel: 'Médio', analise: "Grande concentração de pessoas, propício para furtos de oportunidade.", recomendacoes: "Use bolsas e mochilas viradas para a frente do corpo." } },
        'Parque Ibirapuera': { tarde: { nivel: 'Baixo', analise: "O local é geralmente seguro durante o dia.", recomendacoes: "Mantenha seus pertences sempre junto ao corpo." } },
        'Vila Madalena': { noite: { nivel: 'Elevado', analise: "O risco de furtos e roubos de oportunidade aumenta na saída dos bares.", recomendacoes: "Aguarde seu transporte dentro do estabelecimento." } }
    };

    roteiroOriginal.dias = roteiroOriginal.dias.map(dia => ({
        ...dia,
        atividades: dia.atividades.map(atv => {
            const hora = parseInt(atv.hora.split(':')[0]);
            const periodo = hora < 12 ? 'manha' : hora < 18 ? 'tarde' : 'noite';
            
            for (const key in DADOS_RISCO) {
                if (atv.titulo.includes(key)) {
                    const informacaoSeguranca = DADOS_RISCO[key][periodo];
                    if (informacaoSeguranca) {
                        return { ...atv, seguranca: informacaoSeguranca };
                    }
                }
            }
            return atv;
        })
    }));
    return roteiroOriginal;
};


// --- SUAS ROTAS EXISTENTES (AUTENTICAÇÃO, ETC. - SEM ALTERAÇÕES) ---
app.post('/api/register', async (req, res) => {
  let connection;
  try {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios' });
    if (!emailValidator.validate(email)) return res.status(400).json({ success: false, message: 'Formato de email inválido' });
    const senhaHash = await bcrypt.hash(senha, 10);
    connection = await getConnection();
    const sql = `INSERT INTO usuarios (nome, email, senha_hash, data_cadastro) VALUES (:nome, :email, :senhaHash, SYSTIMESTAMP)`;
    const result = await connection.execute(sql, { nome, email, senhaHash }, { autoCommit: true });
    res.status(201).json({ success: true, message: 'Usuário cadastrado com sucesso', data: { id: result.lastRowid, nome, email } });
  } catch (err) {
    if (err.errorNum === 1) return res.status(409).json({ success: false, message: 'Este email já está em uso.' });
    res.status(500).json({ success: false, message: 'Erro interno do servidor', error: err.message });
  } finally {
    if (connection) { try { await connection.close(); } catch (e) { console.error(e); } }
  }
});

app.post('/api/login', async (req, res) => {
  let connection;
  try {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ success: false, message: 'Email e senha são obrigatórios' });
    if (!emailValidator.validate(email)) return res.status(400).json({ success: false, message: 'Formato de email inválido' });
    connection = await getConnection();
    const sql = `SELECT id, nome, email, senha_hash FROM usuarios WHERE email = :email`;
    const result = await connection.execute(sql, { email });
    if (result.rows.length === 0) return res.status(401).json({ success: false, message: 'Email ou senha inválidos.' });
    const usuario = result.rows[0];
    const senhaValida = await bcrypt.compare(senha, usuario[3]);
    if (!senhaValida) return res.status(401).json({ success: false, message: 'Email ou senha inválidos.' });
    res.status(200).json({ success: true, message: 'Login realizado com sucesso', data: { id: usuario[0], nome: usuario[1], email: usuario[2] } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro interno do servidor', error: err.message });
  } finally {
    if (connection) { try { await connection.close(); } catch (e) { console.error(e); } }
  }
});


// --- ROTAS DE CONTROLE E INICIALIZAÇÃO (sem alterações) ---
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API funcionando corretamente' });
});

app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Rota não encontrada' });
});

app.use((err, req, res, next) => {
  console.error('❌ Erro global:', err.stack);
  res.status(500).json({ success: false, message: 'Erro interno do servidor' });
});

async function startServer() {
  try {
    await initializeOracleClient();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor SampAI iniciado com sucesso na porta ${PORT}!`);
    });
  } catch (err) {
    console.error('❌ Erro fatal ao iniciar servidor:', err.message);
    process.exit(1);
  }
}

startServer();