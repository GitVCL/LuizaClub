import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, X } from 'lucide-react';

const ProductSearch = ({ produtos, onAddProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts([]);
      setIsOpen(false);
      return;
    }

    const filtered = produtos.filter(produto =>
      produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produto.valor.toString().includes(searchTerm)
    ).slice(0, 8); // Limita a 8 resultados

    setFilteredProducts(filtered);
    setIsOpen(filtered.length > 0);
    setSelectedIndex(-1);
  }, [searchTerm, produtos]);

  const handleKeyDown = (e) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredProducts.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && filteredProducts[selectedIndex]) {
          handleSelectProduct(filteredProducts[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelectProduct = (produto) => {
    onAddProduct(produto);
    setSearchTerm('');
    setIsOpen(false);
    setSelectedIndex(-1);
    searchRef.current?.focus();
  };

  const clearSearch = () => {
    setSearchTerm('');
    setIsOpen(false);
    setSelectedIndex(-1);
    searchRef.current?.focus();
  };

  return (
    <div className="product-search-container" style={{ position: 'relative', width: '100%' }}>
      <div className="search-input-wrapper" style={{ 
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#1f2937',
        border: '2px solid #00ff00',
        borderRadius: '8px',
        padding: '8px 12px'
      }}>
        <Search size={20} style={{ color: '#00ff00', marginRight: '8px' }} />
        <input
          ref={searchRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar produtos... (digite para pesquisar)"
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#00ff00',
            fontSize: '16px',
            fontFamily: 'monospace'
          }}
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#00ff00',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && filteredProducts.length > 0 && (
        <div
          ref={listRef}
          className="search-results"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: '#1f2937',
            border: '2px solid #00ff00',
            borderTop: 'none',
            borderRadius: '0 0 8px 8px',
            maxHeight: '300px',
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: '0 4px 6px rgba(0, 255, 0, 0.1)'
          }}
        >
          {filteredProducts.map((produto, index) => (
            <div
              key={produto.id}
              onClick={() => handleSelectProduct(produto)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: index < filteredProducts.length - 1 ? '1px solid #374151' : 'none',
                backgroundColor: selectedIndex === index ? '#374151' : 'transparent',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div style={{ flex: 1 }}>
                <div style={{ 
                  color: '#00ff00', 
                  fontWeight: 'bold',
                  fontFamily: 'monospace',
                  fontSize: '14px'
                }}>
                  {produto.nome}
                </div>
                <div style={{ 
                  color: '#9ca3af', 
                  fontSize: '12px',
                  fontFamily: 'monospace'
                }}>
                  R$ {produto.valor.toFixed(2)}
                </div>
              </div>
              <div style={{
                backgroundColor: '#00ff00',
                color: '#1f2937',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '12px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Plus size={12} />
                ADD
              </div>
            </div>
          ))}
        </div>
      )}

      {searchTerm && filteredProducts.length === 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: '#1f2937',
            border: '2px solid #00ff00',
            borderTop: 'none',
            borderRadius: '0 0 8px 8px',
            padding: '16px',
            textAlign: 'center',
            color: '#9ca3af',
            fontFamily: 'monospace',
            zIndex: 1000
          }}
        >
          Nenhum produto encontrado para "{searchTerm}"
        </div>
      )}
    </div>
  );
};

export default ProductSearch;
