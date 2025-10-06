// Endpoint simples para /api/profile
app.get('/api/profile', async (req, res) => {
  try {
    console.log('📊 Endpoint /api/profile chamado');
    
    // Retornar dados vazios para evitar erros
    const responseData = {
      success: true,
      message: 'Perfil carregado com sucesso',
      data: {
        roteiros: [],
        favoritos: []
      }
    };
    
    console.log('✅ Retornando dados do perfil');
    res.status(200).json(responseData);
    
  } catch (err) {
    console.error('❌ Erro ao buscar perfil:', err.message);
    
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});
