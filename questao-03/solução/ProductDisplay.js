import React, { useState, useEffect } from 'react';
import './ProductDisplay.css';

function ProductDisplay() {
  const [products, setProducts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProducts = () => {
    setLoading(true);
    setError(null);

    fetch('/api/products')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (!Array.isArray(data)) {
          throw new Error('Resposta da API inválida');
        }
        
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erro ao carregar produtos:', err);
        setError(err.message || 'Erro ao carregar produtos');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadProducts();
  }, []);

  if (loading) {
    return (
      <div className="product-display">
        <h2>Produtos Shipay</h2>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Carregando produtos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-display">
        <h2>Produtos Shipay</h2>
        <div className="error-container">
          <svg className="error-icon" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h3>Ops! Algo deu errado</h3>
          <p>{error}</p>
          <button onClick={loadProducts} className="retry-button">
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="product-display">
        <h2>Produtos Shipay</h2>
        <div className="empty-container">
          <svg className="empty-icon" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
          </svg>
          <h3>Nenhum produto encontrado</h3>
          <p>Não há produtos disponíveis no momento.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="product-display">
      <h2>Produtos Shipay</h2>
      
      <div className="product-count">
        {products.length} {products.length === 1 ? 'produto' : 'produtos'}
      </div>

      <div className="product-grid">
        {products.map(product => (
          <div key={product.id} className="product-card">
            <div className="product-header">
              <h3>{product.name}</h3>
              <span className="product-badge">
                {product.category || 'Produto'}
              </span>
            </div>
            
            <p className="product-description">
              {product.description || 'Sem descrição'}
            </p>
            
            <div className="product-footer">
              <span className="product-price">
                R$ {product.price?.toFixed(2) || '0.00'}
              </span>
              <button className="product-button">
                Ver detalhes
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="product-footer-info">
        <button onClick={loadProducts} className="refresh-button">
          Atualizar lista
        </button>
      </div>
    </div>
  );
}

export default ProductDisplay;

