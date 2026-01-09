import React from 'react';
import './SearchInput.css';


const SearchInput = ({ value, onChange, placeholder = 'Buscar...' }) => {
  const handleChange = (event) => {
    onChange(event.target.value);
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="search-input-container">
      <div className="search-input-wrapper">
        <svg 
          className="search-icon" 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>

        <input
          type="text"
          className="search-input"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          aria-label="Campo de busca de produtos"
          autoComplete="off"
        />

        {value && (
          <button
            type="button"
            className="clear-button"
            onClick={handleClear}
            aria-label="Limpar busca"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchInput;
