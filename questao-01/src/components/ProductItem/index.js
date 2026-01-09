import React from 'react';
import './ProductItem.css';

const ProductItem = ({ product }) => {
  const transactionType = product.name.startsWith('Cash In') ? 'cash-in' : 'cash-out';

  return (
    <li className={`product-item product-item--${transactionType}`}>
      <div className="product-item-content">
        <span className={`product-badge product-badge--${transactionType}`}>
          {transactionType === 'cash-in' ? 'Entrada' : 'Saída'}
        </span>
        <h3 className="product-name">{product.name}</h3>
      </div>
    </li>
  );
};

export default ProductItem;
