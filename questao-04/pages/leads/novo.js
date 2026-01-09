import { useState } from 'react';
import apiService from '../../services/api.service';

export default function NovoLead({ initialData, error }) {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    empresa: '',
    cargo: '',
    interesse: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitError(null);

    try {
      const result = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!result.ok) throw new Error('Erro ao criar lead');

      setSuccess(true);
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        empresa: '',
        cargo: '',
        interesse: ''
      });

    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="error-page">
        <h1>Erro ao carregar formulário</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="lead-form-page">
      <h1>Cadastro de Lead</h1>

      {success && (
        <div className="success-message">
          Lead cadastrado com sucesso!
        </div>
      )}

      {submitError && (
        <div className="error-message">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="lead-form">
        <div className="form-group">
          <label>Nome Completo</label>
          <input
            type="text"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Telefone</label>
          <input
            type="tel"
            value={formData.telefone}
            onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Empresa</label>
          <input
            type="text"
            value={formData.empresa}
            onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Cargo</label>
          <select
            value={formData.cargo}
            onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
          >
            <option value="">Selecione...</option>
            {initialData?.cargos?.map(cargo => (
              <option key={cargo.id} value={cargo.id}>
                {cargo.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Interesse</label>
          <select
            value={formData.interesse}
            onChange={(e) => setFormData({ ...formData, interesse: e.target.value })}
            required
          >
            <option value="">Selecione...</option>
            {initialData?.produtos?.map(produto => (
              <option key={produto.id} value={produto.id}>
                {produto.nome}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Enviando...' : 'Cadastrar Lead'}
        </button>
      </form>
    </div>
  );
}

export async function getServerSideProps() {
  try {
    const results = await apiService.batchRequest([
      { endpoint: '/leads/cargos' },           
      { endpoint: '/leads/produtos' },         
      { endpoint: '/leads/configuracoes' }    
    ]);

    const [cargos, produtos, configuracoes] = results;

    if (!cargos.success || !produtos.success) {
      throw new Error('Erro ao carregar dados do formulário');
    }

    return {
      props: {
        initialData: {
          cargos: cargos.data,
          produtos: produtos.data,
          configuracoes: configuracoes.success ? configuracoes.data : null
        }
      }
    };

  } catch (error) {
    console.error('[SSR] Erro ao carregar dados:', error);
    
    return {
      props: {
        initialData: null,
        error: error.message
      }
    };
  }
}
