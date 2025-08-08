import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ResponsiveLayout from '../Layout/ResponsiveLayout';
import '../Layout/GlobalLayout.css';

const Finalizados = () => {
  const navigate = useNavigate();
  const [comandas, setComandas] = useState([]);
  const [finalizados, setFinalizados] = useState([]);

  useEffect(() => {
    const carregarComandasFinalizadas = async () => {
      try {
        const userId = localStorage.getItem('userId');
        const res = await fetch(`https://luizaclubbackend-production.up.railway.app/api/comandas/${userId}`);
        const data = await res.json();
        const filtradas = data
          .filter(c => c.status === 'finalizada')
          .map(c => ({ ...c, tipo: 'comanda' }));
        setComandas(filtradas);
      } catch (err) {
        console.error('Erro ao carregar comandas finalizadas:', err);
      }
    };

    const carregarQuartosFinalizados = async () => {
      try {
        const userId = localStorage.getItem('userId');
        const res = await fetch(`https://luizaclubbackend-production.up.railway.app/api/finalizados/${userId}`);
        const data = await res.json();
        const comTipo = data.map(q => ({ ...q, tipo: 'quarto' }));
        setFinalizados(comTipo);
      } catch (err) {
        console.error('Erro ao carregar quartos finalizados:', err);
      }
    };

    carregarComandasFinalizadas();
    carregarQuartosFinalizados();
  }, []);

  // Ordena e limita para mostrar apenas os 10 últimos
  const todosItens = [...comandas, ...finalizados]
    .sort((a, b) => new Date(b.encerradaEm) - new Date(a.encerradaEm))
    .slice(0, 10);

  return (
    <ResponsiveLayout>
      <div style={{ padding: '20px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '30px',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          <h2 style={{ margin: 0, color: '#333', fontSize: '28px' }}>Finalizados</h2>
          <button 
            onClick={() => window.location.reload()} 
            title="Atualizar" 
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            🔄 Atualizar
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px',
          marginTop: '20px'
        }}>
          {todosItens.length === 0 ? (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '40px',
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              color: '#6c757d',
              fontSize: '18px'
            }}>
              Nenhum item finalizado encontrado.
            </div>
          ) : (
            todosItens.map((item) => (
              <div key={item.id} style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e9ecef',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              }}>
                <h3 style={{ 
                  margin: '0 0 15px 0', 
                  color: '#333',
                  fontSize: '20px',
                  fontWeight: '600'
                }}>
                  {item.nome}
                </h3>
                <p style={{ 
                  margin: '8px 0', 
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#28a745'
                }}>
                  Total: R$ {item.total.toFixed(2)}
                </p>
                {item.dono && (
                  <p style={{ 
                    margin: '8px 0', 
                    color: '#6c757d',
                    fontSize: '16px'
                  }}>
                    Dono: {item.dono}
                  </p>
                )}
                <p style={{ 
                  margin: '8px 0', 
                  color: '#6c757d',
                  fontSize: '14px'
                }}>
                  Encerrado em: {new Date(item.encerradaEm).toLocaleString()}
                </p>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  backgroundColor: item.tipo === 'quarto' ? '#17a2b8' : '#6f42c1',
                  color: 'white',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '500',
                  marginTop: '10px'
                }}>
                  {item.tipo === 'quarto' ? 'Quarto' : 'Comanda'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </ResponsiveLayout>
  );
};

export default Finalizados;
