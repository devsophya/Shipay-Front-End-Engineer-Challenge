import React, { useState, useMemo } from 'react';
import initialItems from './data';
import ProductList from './components/ProductList';
import SearchInput from './components/SearchInput';
import useDebounce from './hooks/useDebounce';
import { ReactComponent as ShipayLogo } from './assets/images/Logo.svg';
import './App.css';


function App() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const filteredItems = useMemo(() => {
    if (!debouncedSearchTerm) {
      return initialItems;
    }

    const normalizedSearch = debouncedSearchTerm.toLowerCase().trim();
    
    return initialItems.filter(item =>
      item.name.toLowerCase().includes(normalizedSearch)
    );
  }, [debouncedSearchTerm]);

  return (
    <div className="app">
      <header className="app-header">
        <a 
          href="https://www.shipay.com.br/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="logo-link"
        >
          <ShipayLogo className="shipay-logo" />
        </a>
        <div className="slogan">
          <h2>Simplificando</h2>
          <h1>Pagamentos digitais</h1>
        </div>
        <p className="app-subtitle">
          Explore nossa coleção de produtos
        </p>
      </header>

      <main className="app-main">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar produtos..."
        />

        <ProductList 
          items={filteredItems}
          searchTerm={debouncedSearchTerm}
        />
      </main>

      <footer className="app-footer">
        <p>Total de produtos: {filteredItems.length} de {initialItems.length}</p>
      </footer>
    </div>
  );
}

export default App;
