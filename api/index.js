const express = require('express');
const oracledb = require('oracledb');
const bcrypt = require('bcryptjs');
const emailValidator = require('email-validator');

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
  user: 'rm98044',
  password: '070305',
  connectString: 'oracle.fiap.com.br:1521/ORCL'
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
        id: result.lastRowid,
        nome: nome,
        email: email
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
        id: usuario[0],
        nome: usuario[1],
        email: usuario[2],
        dataCadastro: usuario[4]
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
  
  // Por simplicidade, vamos usar o token como userId
  // Em produção, você deveria validar o JWT
  const token = authHeader.split(' ')[1];
  req.userId = token; // Assumindo que o token é o userId
  next();
};

// Endpoint para obter perfil do usuário
app.get('/api/profile', authenticateUser, async (req, res) => {
  let connection;
  
  try {
    const userId = req.userId;
    connection = await getConnection();
    
    // Buscar dados do usuário
    const userSql = `
      SELECT id, nome, email, data_cadastro
      FROM usuarios
      WHERE id = :userId
    `;
    
    const userResult = await connection.execute(userSql, { userId: userId });
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    const user = userResult.rows[0];
    
    // Buscar roteiros salvos
    const roteirosSql = `
      SELECT id, titulo, descricao, data_criacao, data_modificacao
      FROM roteiros
      WHERE usuario_id = :userId
      ORDER BY data_criacao DESC
    `;
    
    const roteirosResult = await connection.execute(roteirosSql, { userId: userId });
    
    // Buscar favoritos
    const favoritosSql = `
      SELECT id, place_id, nome, endereco, tipo, rating, foto_url, data_favorito
      FROM favoritos
      WHERE usuario_id = :userId
      ORDER BY data_favorito DESC
    `;
    
    const favoritosResult = await connection.execute(favoritosSql, { userId: userId });
    
    res.status(200).json({
      success: true,
      data: {
        usuario: {
          id: user[0],
          nome: user[1],
          email: user[2],
          dataCadastro: user[3]
        },
        roteiros: roteirosResult.rows.map(row => ({
          id: row[0],
          titulo: row[1],
          descricao: row[2],
          dataCriacao: row[3],
          dataModificacao: row[4]
        })),
        favoritos: favoritosResult.rows.map(row => ({
          id: row[0],
          placeId: row[1],
          nome: row[2],
          endereco: row[3],
          tipo: row[4],
          rating: row[5],
          fotoUrl: row[6],
          dataFavorito: row[7]
        }))
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
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('❌ Erro ao fechar conexão:', err.message);
      }
    }
  }
});

// Endpoint para salvar roteiro
app.post('/api/roteiros', authenticateUser, async (req, res) => {
  let connection;
  
  try {
    const { titulo, descricao, locais } = req.body;
    const userId = req.userId;
    
    // Validação dos campos obrigatórios
    if (!titulo || !locais) {
      return res.status(400).json({
        success: false,
        message: 'Título e locais são obrigatórios'
      });
    }
    
    // Verificar limite de 3 roteiros
    connection = await getConnection();
    
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
        message: 'Limite de 3 roteiros salvos atingido'
      });
    }
    
    // Salvar roteiro
    const insertSql = `
      INSERT INTO roteiros (usuario_id, titulo, descricao, locais, data_criacao, data_modificacao)
      VALUES (:userId, :titulo, :descricao, :locais, SYSTIMESTAMP, SYSTIMESTAMP)
    `;
    
    const binds = {
      userId: userId,
      titulo: titulo,
      descricao: descricao || null,
      locais: JSON.stringify(locais)
    };
    
    const result = await connection.execute(insertSql, binds, { autoCommit: true });
    
    console.log('✅ Roteiro salvo com sucesso:', titulo);
    
    res.status(201).json({
      success: true,
      message: 'Roteiro salvo com sucesso',
      data: {
        id: result.lastRowid,
        titulo: titulo,
        descricao: descricao,
        totalRoteiros: totalRoteiros + 1
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
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('❌ Erro ao fechar conexão:', err.message);
      }
    }
  }
});

// Endpoint para adicionar favorito
app.post('/api/favoritos', authenticateUser, async (req, res) => {
  let connection;
  
  try {
    const { placeId, nome, endereco, tipo, rating, fotoUrl } = req.body;
    const userId = req.userId;
    
    // Validação dos campos obrigatórios
    if (!placeId || !nome) {
      return res.status(400).json({
        success: false,
        message: 'ID do local e nome são obrigatórios'
      });
    }
    
    connection = await getConnection();
    
    // Verificar se já está favoritado
    const checkSql = `
      SELECT id
      FROM favoritos
      WHERE usuario_id = :userId AND place_id = :placeId
    `;
    
    const checkResult = await connection.execute(checkSql, { 
      userId: userId, 
      placeId: placeId 
    });
    
    if (checkResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Este local já está nos seus favoritos'
      });
    }
    
    // Adicionar favorito
    const insertSql = `
      INSERT INTO favoritos (usuario_id, place_id, nome, endereco, tipo, rating, foto_url, data_favorito)
      VALUES (:userId, :placeId, :nome, :endereco, :tipo, :rating, :fotoUrl, SYSTIMESTAMP)
    `;
    
    const binds = {
      userId: userId,
      placeId: placeId,
      nome: nome,
      endereco: endereco || null,
      tipo: tipo || null,
      rating: rating || null,
      fotoUrl: fotoUrl || null
    };
    
    const result = await connection.execute(insertSql, binds, { autoCommit: true });
    
    console.log('✅ Favorito adicionado com sucesso:', nome);
    
    res.status(201).json({
      success: true,
      message: 'Local adicionado aos favoritos',
      data: {
        id: result.lastRowid,
        placeId: placeId,
        nome: nome
      }
    });
    
  } catch (err) {
    console.error('❌ Erro ao adicionar favorito:', err.message);
    
    // Tratamento específico para violação de chave única
    if (err.errorNum === 1) {
      return res.status(409).json({
        success: false,
        message: 'Este local já está nos seus favoritos'
      });
    }
    
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
app.delete('/api/favoritos/:favoritoId', authenticateUser, async (req, res) => {
  let connection;
  
  try {
    const { favoritoId } = req.params;
    const userId = req.userId;
    
    connection = await getConnection();
    
    // Verificar se o favorito pertence ao usuário
    const checkSql = `
      SELECT id, nome
      FROM favoritos
      WHERE id = :favoritoId AND usuario_id = :userId
    `;
    
    const checkResult = await connection.execute(checkSql, { 
      favoritoId: favoritoId, 
      userId: userId 
    });
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Favorito não encontrado'
      });
    }
    
    // Remover favorito
    const deleteSql = `
      DELETE FROM favoritos
      WHERE id = :favoritoId AND usuario_id = :userId
    `;
    
    await connection.execute(deleteSql, { 
      favoritoId: favoritoId, 
      userId: userId 
    }, { autoCommit: true });
    
    console.log('✅ Favorito removido com sucesso');
    
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

// Endpoint para remover roteiro
app.delete('/api/roteiros/:roteiroId', authenticateUser, async (req, res) => {
  let connection;
  
  try {
    const { roteiroId } = req.params;
    const userId = req.userId;
    
    connection = await getConnection();
    
    // Verificar se o roteiro pertence ao usuário
    const checkSql = `
      SELECT id, titulo
      FROM roteiros
      WHERE id = :roteiroId AND usuario_id = :userId
    `;
    
    const checkResult = await connection.execute(checkSql, { 
      roteiroId: roteiroId, 
      userId: userId 
    });
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Roteiro não encontrado'
      });
    }
    
    // Remover roteiro
    const deleteSql = `
      DELETE FROM roteiros
      WHERE id = :roteiroId AND usuario_id = :userId
    `;
    
    await connection.execute(deleteSql, { 
      roteiroId: roteiroId, 
      userId: userId 
    }, { autoCommit: true });
    
    console.log('✅ Roteiro removido com sucesso');
    
    res.status(200).json({
      success: true,
      message: 'Roteiro removido com sucesso'
    });
    
  } catch (err) {
    console.error('❌ Erro ao remover roteiro:', err.message);
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

// Endpoint de Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API funcionando corretamente',
    timestamp: new Date().toISOString()
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada'
  });
});

// Middleware de tratamento de erros global
app.use((err, req, res, next) => {
  console.error('❌ Erro global:', err.message);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: err.message
  });
});

// Inicializar servidor
async function startServer() {
  try {
    // Inicializar Oracle Client
    await initializeOracleClient();
    
    // Iniciar servidor
    app.listen(PORT, '0.0.0.0', () => {
      console.log('🚀 Servidor iniciado com sucesso!');
      console.log(`📡 Porta: ${PORT}`);
      console.log(`🔗 URL: http://localhost:${PORT}`);
      console.log(`🌐 Acessível em: http://0.0.0.0:${PORT}`);
      console.log('📊 Endpoints disponíveis:');
      console.log('   POST /api/register - Cadastro de usuário');
      console.log('   POST /api/login - Login de usuário');
      console.log('   GET  /api/health - Health check');
    });
    
  } catch (err) {
    console.error('❌ Erro ao iniciar servidor:', err.message);
    process.exit(1);
  }
}

// Iniciar aplicação
startServer();
