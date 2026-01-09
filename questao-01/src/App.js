import React, { useState, useMemo } from 'react';
import initialItems from './data';
import ProductList from './components/ProductList';
import SearchInput from './components/SearchInput';
import useDebounce from './hooks/useDebounce';
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
        <h1>Produtos Transacionais Shipay</h1>
        <p className="app-subtitle">
          Explore nossa coleção de produtos para pagamentos
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
