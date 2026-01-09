import apiService from '../../services/api.service';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { nome, email, telefone, empresa, cargo, interesse } = req.body;

    if (!nome || !email || !telefone || !interesse) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios faltando' 
      });
    }

    const result = await apiService.request('/leads', {
      method: 'POST',
      body: JSON.stringify({
        nome,
        email,
        telefone,
        empresa,
        cargo,
        interesse,
        origem: 'website',
        data_cadastro: new Date().toISOString()
      })
    });

    res.status(201).json({
      success: true,
      lead: result
    });

  } catch (error) {
    console.error('[API] Erro ao criar lead:', error);
    
    res.status(error.status || 500).json({
      error: error.message || 'Erro interno do servidor'
    });
  }
}
