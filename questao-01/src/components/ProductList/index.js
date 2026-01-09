import React from 'react';
import ProductItem from '../ProductItem';
import './ProductList.css';

const ProductList = ({ items, searchTerm }) => {
  if (items.length === 0) {
    return (
      <div className="product-list-empty">
        <svg 
          className="empty-icon" 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <h3>Nenhum produto encontrado</h3>
        {searchTerm && (
          <p>Não encontramos produtos que correspondam a "{searchTerm}"</p>
        )}
      </div>
    );
  }

  return (
    <div className="product-list">
      <ul className="product-list-items" role="list">
        {items.map(item => (
          <ProductItem key={item.id} product={item} />
        ))}
      </ul>
    </div>
  );
};

export default ProductList;
