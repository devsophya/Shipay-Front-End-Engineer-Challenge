import React, { useState, useEffect } from 'react';


function ProductDisplay() {
  const [products, setProducts] = useState(null); 
  useEffect(() => {
    fetch('/api/products')
      .then(response => response.json())
      .then(data => setProducts(data));
  }, []);

  return (
    <div className="product-display">
      <h2>Produtos Shipay</h2>
      
      {products.map(product => (
        <div key={product.id} className="product-card">
          <h3>{product.name}</h3>
          <p>{product.description}</p>
          <span className="price">R$ {product.price}</span>
        </div>
      ))}
    </div>
  );
}

export default ProductDisplay;
