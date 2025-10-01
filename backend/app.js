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


// --- CONFIGURAÇÃO INICIAL ---
const app = express();
const PORT = process.env.PORT || 5000;

// --- MIDDLEWARES ---
app.use(cors()); // Permite a comunicação entre frontend e backend (essencial para a nuvem)
app.use(express.json());

app.get('/healthz', (req, res) => {
  res.status(200).send('ok');
});



// --- (A) CONEXÕES COM BANCOS DE DADOS ---

// Conexão com Oracle (seu código original)
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


// Conexão com Google Firestore (nova funcionalidade)
try {
  // 1. Buscamos o CONTEÚDO do JSON da variável de ambiente que criamos no Render.
  const serviceAccountString = process.env.FIREBASE_CREDENTIALS;

  // 2. Verificamos se a variável existe.
  if (serviceAccountString) {
    // 3. Convertemos a string JSON para um objeto JavaScript.
    const serviceAccount = JSON.parse(serviceAccountString);

    // 4. Usamos o objeto para inicializar o Firebase.
    initializeApp({ credential: cert(serviceAccount) });
    console.log('✅ Conectado ao Google Cloud Firestore com sucesso!');
  } else {
    // O aviso agora é sobre a nova variável de conteúdo.
    console.warn('🟠 AVISO: A integração com Firestore está desabilitada. Preencha a variável de ambiente FIREBASE_CREDENTIALS para ativar.');
  }
} catch (error) {
  // O erro agora pode ser de JSON inválido ou de conexão.
  console.error('❌ ERRO: Não foi possível conectar ao Firestore. Verifique a variável de ambiente FIREBASE_CREDENTIALS.', error.message);
}


// --- (B) NOVAS ROTAS DE API PARA A IA ---



app.post('/api/chat', async (req, res) => {
        const { conversationHistory, systemPrompt } = req.body;

    if (!conversationHistory || !systemPrompt) {
        return res.status(400).json({ error: 'Histórico da conversa e prompt do sistema são obrigatórios.' });
    }

    try {

        let contentsToSend = conversationHistory;

        // ===== LÓGICA CRÍTICA ADICIONADA AQUI =====
        // Se o histórico da conversa estiver vazio (primeira chamada do app),
        // a API do Gemini falha. Então, criamos uma "primeira fala" para iniciar.
        if (contentsToSend.length === 0) {
            // A API espera que o usuário fale primeiro, então simulamos isso.
            // O System Prompt ainda guiará a resposta do modelo.
            contentsToSend = [{ role: 'user', parts: [{ text: 'Olá, por favor, apresente-se como Oscar Niemeyer e inicie nossa conversa me dando boas vindas ao aplicativo SampAI e me explique brevemente a sua proposta e objetivo dele, ou o que ele me traz de bom.' }] }];
        }
        // ===========================================
        const geminiURL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent`;

        const requestBody = {
            // Mudei o formato da Instrução do sistema no formato esperado pela API
            system_instruction: {
                parts: [
                    { text: systemPrompt }
                ]
            },

            // Histórico da conversa já no formato Content - Aqui mantive o mesmo
            contents: conversationHistory
        };

        const geminiResponse = await fetch(geminiURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': process.env.GEMINI_API_KEY // Adicionei a chave de api como Header e nao como parametro na URL
            },
            body: JSON.stringify(requestBody)
        });
        if (!geminiResponse.ok) throw new Error(`Erro na API Gemini: ${await geminiResponse.text()}`);
        const geminiData = await geminiResponse.json();
        const aiTextResponse = geminiData.candidates[0].content.parts[0].text;

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
        console.error('❌ Erro no endpoint /api/chat:', error);
        res.status(500).json({ error: 'Falha ao processar a conversa.' });
    }
});

app.post('/api/finalizar-onboarding', async (req, res) => {
    const { conversation } = req.body;
    if (!process.env.FIREBASE_CREDENTIALS_PATH) {
      console.warn('Firestore desabilitado, pulando salvamento da conversa.');
      return res.status(200).json({ message: 'Conversa não salva (Firestore desabilitado).', conversationId: `simulado_${Date.now()}` });
    }
    try {
        const firestoreDB = getFirestore();
        const docRef = await firestoreDB.collection('conversas').add({
            createdAt: new Date(),
            conversation: conversation
            // Futuramente, adicione aqui o ID do usuário logado (ex: userId: req.userId)
        });
        res.status(200).json({ message: 'Conversa salva com sucesso!', conversationId: docRef.id });
    } catch (error) {
        console.error('❌ Erro ao salvar conversa no Firestore:', error);
        res.status(500).json({ error: 'Não foi possível salvar a conversa.' });
    }
});

// Esta rota agora simula a leitura do Firestore e a lógica do Vigía Urbano
app.post('/api/gerar-roteiro', async (req, res) => {
    const { conversationId } = req.body;
    console.log(`Gerando roteiro para a conversa ID: ${conversationId}`);

    try {
        // Passo 1: Buscar a conversa salva no Firestore (simulado por enquanto)
        // const firestoreDB = getFirestore();
        // const conversationDoc = await firestoreDB.collection('conversas').doc(conversationId).get();
        // const conversationData = conversationDoc.data();
        // A IA do Gemini analisaria 'conversationData' para extrair os pontos do roteiro.

        // Passo 2: Simular um roteiro gerado a partir da conversa
        const roteiroBase = {
            titulo: `Seu Projeto de Percurso em SP`,
            dias: [
                { dia: 1, titulo: "Cultura e Gastronomia", atividades: [ { hora: "10:30", titulo: "Passeio pela Avenida Paulista"}, { hora: "20:00", titulo: "Visita à Catedral da Sé"} ] },
                { dia: 2, titulo: "Natureza, Arte e Boemia", atividades: [ { hora: "15:00", titulo: "Exploração no Parque Ibirapuera"}, { hora: "22:00", titulo: "Noite na Vila Madalena"} ] }
            ]
        };
        
        // Passo 3: Chamar a lógica do "Vigía Urbano" para analisar o roteiro
        const roteiroAnalisado = analisarSegurancaRoteiro(roteiroBase);

        res.json(roteiroAnalisado);
    } catch (error) {
      console.error('❌ Erro ao gerar o roteiro:', error);
      res.status(500).json({ error: 'Falha ao gerar o roteiro.' });
    }
});

// --- Lógica do Vigía Urbano (integrada ao backend) ---
const analisarSegurancaRoteiro = (roteiroOriginal) => {
    // Esta função simula a análise de segurança que discutimos.
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


// --- (C) SUAS ROTAS EXISTENTES (AUTENTICAÇÃO, ROTEIROS, FAVORITOS) ---
// (Seu código original de /api/register, /api/login, /api/profile, etc. continua aqui, sem alterações)
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


// --- (D) ROTAS DE CONTROLE E INICIALIZAÇÃO ---
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


