import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ResponsiveLayout from '../Layout/ResponsiveLayout';
import '../Layout/GlobalLayout.css';

const Finalizados = () => {
  const navigate = useNavigate();
  const [comandas, setComandas] = useState([]);
  const [filtroAtivo, setFiltroAtivo] = useState('semana');
  const [carregando, setCarregando] = useState(false);

  const carregarDadosPorPeriodo = async (periodo) => {
    setCarregando(true);
    try {
      const userId = localStorage.getItem('userId');
      console.log('🔍 Carregando dados para período:', periodo);
      console.log('👤 UserId:', userId);
      
      if (!userId) {
        console.error('❌ UserId não encontrado no localStorage');
        alert('Erro: Usuário não autenticado. Faça login novamente.');
        navigate('/login');
        return;
      }
      
      const agora = new Date();
      let dataInicio;
      
      if (periodo === 'dia') {
        dataInicio = new Date();
        dataInicio.setHours(0, 0, 0, 0);
      } else if (periodo === 'semana') {
        dataInicio = new Date();
        const diaSemana = dataInicio.getDay();
        const distSegunda = diaSemana === 0 ? 6 : diaSemana - 1;
        dataInicio.setDate(dataInicio.getDate() - distSegunda);
        dataInicio.setHours(0, 0, 0, 0);
      }
      
      const dataFim = new Date();
      dataFim.setHours(23, 59, 59, 999);
      
      console.log('📅 Período de busca:', {
        inicio: dataInicio.toLocaleString(),
        fim: dataFim.toLocaleString()
      });
      
      // Buscar comandas finalizadas do período
      console.log('🔄 Buscando comandas...');
      const resComandas = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/comandas/${userId}`);
      
      if (!resComandas.ok) {
        console.error('❌ Erro na requisição de comandas:', resComandas.status);
        throw new Error(`Erro ${resComandas.status} ao buscar comandas`);
      }
      
      const dataComandas = await resComandas.json();
      console.log('📊 Total de comandas recebidas:', dataComandas.length);
      
      const comandasFiltradas = dataComandas
        .filter(c => {
          if (c.status !== 'finalizada') return false;
          const dataEncerramento = new Date(c.encerradaEm);
          return dataEncerramento >= dataInicio && dataEncerramento <= dataFim;
        })
        .sort((a, b) => new Date(b.encerradaEm) - new Date(a.encerradaEm))
        .slice(0, periodo === 'dia' ? 10 : 50) // Limita resultados
        .map(c => ({ ...c, tipo: 'comanda' }));
      
      console.log('✅ Comandas filtradas:', comandasFiltradas.length);
      
      setComandas(comandasFiltradas);
      
      console.log('🎯 Dados carregados com sucesso!');
    } catch (err) {
      console.error('Erro ao carregar dados por período:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDadosPorPeriodo('semana'); // Carrega dados da semana por padrão
  }, []);

  // Recarrega dados quando o filtro ativo muda
  useEffect(() => {
    carregarDadosPorPeriodo(filtroAtivo);
  }, [filtroAtivo]);

  // Ordena todas as comandas por data de encerramento
  const todosItens = comandas
    .sort((a, b) => new Date(b.encerradaEm) - new Date(a.encerradaEm));

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
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              onClick={() => carregarDadosPorPeriodo(filtroAtivo)} 
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
              <span style={{ color: 'white', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>↻ Atualizar</span>
            </button>
          </div>
        </div>

        {/* Cards de Filtro por Período */}
        <div style={{
          marginBottom: '30px',
          padding: '25px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderRadius: '15px',
          border: '2px solid #00ff00'
        }}>
          <h3 style={{
            color: '#00ff00',
            textAlign: 'center',
            marginBottom: '25px',
            fontSize: '22px',
            fontWeight: 'bold'
          }}>
            🎯 Filtros por Período
          </h3>
          
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '20px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => setFiltroAtivo('dia')}
              style={{
                padding: '15px 30px',
                fontSize: '18px',
                fontWeight: 'bold',
                borderRadius: '12px',
                border: filtroAtivo === 'dia' ? '3px solid #00ff00' : '2px solid #666',
                backgroundColor: filtroAtivo === 'dia' ? '#00ff00' : 'rgba(0, 0, 0, 0.7)',
                color: filtroAtivo === 'dia' ? '#000' : '#00ff00',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: filtroAtivo === 'dia' ? '0 6px 20px rgba(0, 255, 0, 0.4)' : '0 2px 8px rgba(0, 0, 0, 0.3)',
                transform: filtroAtivo === 'dia' ? 'translateY(-3px)' : 'translateY(0)',
                minWidth: '120px'
              }}
              onMouseEnter={(e) => {
                if (filtroAtivo !== 'dia') {
                  e.target.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
                  e.target.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (filtroAtivo !== 'dia') {
                  e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                  e.target.style.transform = 'translateY(0)';
                }
              }}
            >
              📅 DIA
            </button>
            
            <button
              onClick={() => setFiltroAtivo('semana')}
              style={{
                padding: '15px 30px',
                fontSize: '18px',
                fontWeight: 'bold',
                borderRadius: '12px',
                border: filtroAtivo === 'semana' ? '3px solid #00ff00' : '2px solid #666',
                backgroundColor: filtroAtivo === 'semana' ? '#00ff00' : 'rgba(0, 0, 0, 0.7)',
                color: filtroAtivo === 'semana' ? '#000' : '#00ff00',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: filtroAtivo === 'semana' ? '0 6px 20px rgba(0, 255, 0, 0.4)' : '0 2px 8px rgba(0, 0, 0, 0.3)',
                transform: filtroAtivo === 'semana' ? 'translateY(-3px)' : 'translateY(0)',
                minWidth: '120px'
              }}
              onMouseEnter={(e) => {
                if (filtroAtivo !== 'semana') {
                  e.target.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
                  e.target.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (filtroAtivo !== 'semana') {
                  e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                  e.target.style.transform = 'translateY(0)';
                }
              }}
            >
              📊 SEMANA
            </button>
          </div>
          
          <div style={{
             marginTop: '20px',
             textAlign: 'center',
             color: '#00ff00',
             fontSize: '16px'
           }}>
             Mostrando: <strong>{filtroAtivo === 'dia' ? 'Hoje (últimos 10)' : 'Esta Semana (últimos 50)'}</strong> | 
             Total de itens: <strong>{todosItens.length}</strong>
           </div>
        </div>

        {carregando && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#007bff',
            fontSize: '18px'
          }}>
            🔄 Carregando dados do {filtroAtivo}...
          </div>
        )}

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
                  backgroundColor: '#6f42c1',
                  color: 'white',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '500',
                  marginTop: '10px'
                }}>
                  Comanda
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

