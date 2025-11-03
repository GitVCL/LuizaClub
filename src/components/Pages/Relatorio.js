import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  AreaChart, Area, CartesianGrid
} from 'recharts';
import ResponsiveLayout from '../Layout/ResponsiveLayout';
import '../GlobalLayout.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

function Relatorio() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  const [comandas, setComandas] = useState([]);
  // Quartos
  const [quartos, setQuartos] = useState([]);
  const [totaisQuartos, setTotaisQuartos] = useState({ hoje: 0, semana: 0, mes: 0, ano: 0 });
  const [mostrarTotaisQuartos, setMostrarTotaisQuartos] = useState(false);
  const [totais, setTotais] = useState({
    comandas: { hoje: 0, semana: 0, mes: 0, ano: 0 },
  });
  const [mostrarTotais, setMostrarTotais] = useState(false);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [horaInicio, setHoraInicio] = useState('00:00');
  const [horaFim, setHoraFim] = useState('23:59');
  const [totalPorPeriodo, setTotalPorPeriodo] = useState(null);

  const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#00C49F', '#AA66CC', '#FF8800'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resComandas = await fetch(`${API_BASE}/api/comandas/${userId}`);
        const dadosComandas = await resComandas.json();
        setComandas(dadosComandas);
        calcularTotais(dadosComandas);

        const resQuartos = await fetch(`${API_BASE}/api/quartos/${userId}`);
        const dadosQuartos = await resQuartos.json();
        setQuartos(dadosQuartos);
        calcularTotaisQuartos(dadosQuartos);
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
      }
    };

    fetchData();
  }, []);

  const dadosComandas = comandas.map((c) => ({ nome: c.nome, total: c.total }));
  const ultimas10Comandas = dadosComandas.slice(-10);

  const calcularTotais = (comandas) => {
    const agora = new Date();
    const inicioHoje = new Date();
    inicioHoje.setHours(0, 0, 0, 0);

    const inicioSemana = new Date();
    const diaSemana = inicioSemana.getDay();
    const distSegunda = diaSemana === 0 ? 6 : diaSemana - 1;
    inicioSemana.setDate(inicioSemana.getDate() - distSegunda);
    inicioSemana.setHours(0, 0, 0, 0);

    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const inicioAno = new Date(agora.getFullYear(), 0, 1);

    const filtrar = (lista, data) =>
      lista.filter((item) => {
        if (!item.encerradaEm) return false;
        return new Date(item.encerradaEm) >= data;
      });

    const somar = (lista) => lista.reduce((acc, item) => acc + item.total, 0);

    setTotais({
      comandas: {
        hoje: somar(filtrar(comandas, inicioHoje)),
        semana: somar(filtrar(comandas, inicioSemana)),
        mes: somar(filtrar(comandas, inicioMes)),
        ano: somar(filtrar(comandas, inicioAno)),
      }
    });
  };

  const calcularValorFaturadoQuarto = (tempo) => {
    if (tempo === '1 hora') return 100;
    if (tempo === '1 hora gringo') return 150;
    if (tempo === '25 minutos' || tempo === '40 minutos') return 50;
    return 0;
  };

  const calcularTotaisQuartos = (quartos) => {
    const agora = new Date();
    const inicioHoje = new Date(); inicioHoje.setHours(0, 0, 0, 0);
    const inicioSemana = new Date();
    const diaSemana = inicioSemana.getDay();
    const distSegunda = diaSemana === 0 ? 6 : diaSemana - 1;
    inicioSemana.setDate(inicioSemana.getDate() - distSegunda);
    inicioSemana.setHours(0, 0, 0, 0);
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const inicioAno = new Date(agora.getFullYear(), 0, 1);

    const finalizados = quartos.filter((q) => q.status === 'finalizado' && q.encerradoEm);

    const filtrar = (lista, data) => lista.filter((item) => new Date(item.encerradoEm) >= data);
    const somar = (lista) => lista.reduce((acc, item) => acc + calcularValorFaturadoQuarto(item.tempo), 0);

    setTotaisQuartos({
      hoje: somar(filtrar(finalizados, inicioHoje)),
      semana: somar(filtrar(finalizados, inicioSemana)),
      mes: somar(filtrar(finalizados, inicioMes)),
      ano: somar(filtrar(finalizados, inicioAno)),
    });
  };

  const buscarFinalizadosPorPeriodo = async () => {
    try {
      const inicio = new Date(dataInicio + "T" + horaInicio + ":00");
      const fim = new Date(dataFim + "T" + horaFim + ":59");

      const res = await fetch(`${API_BASE}/api/relatorios/periodo?inicio=${inicio.toISOString()}&fim=${fim.toISOString()}&userId=${userId}`);
      const data = await res.json();

      const total = data.reduce((acc, item) => acc + Number(item.total || 0), 0);
      setTotalPorPeriodo(total);
    } catch (err) {
      console.error('Erro ao buscar finalizados por período:', err);
      setTotalPorPeriodo(null);
    }
  };

  return (
    <ResponsiveLayout title="Relatórios do Sistema">
      {/* Seção de Totais */}
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        border: '2px solid #00ff00',
        borderRadius: '12px',
        padding: '25px',
        marginBottom: '30px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h4 style={{ color: '#00ff00', fontSize: '20px' }}>Comandas</h4>
          <button
            className="btn-secondary"
            onClick={() => {
              if (!mostrarTotais) {
                const senha = prompt('Digite a senha para visualizar os valores:');
                if (senha === 'admin123') {
                  setMostrarTotais(true);
                }
              } else {
                setMostrarTotais(false);
              }
            }}
          >
            {mostrarTotais ? 'Ocultar' : '👁️ Ver'}
          </button>
        </div>

        <div className="responsive-grid">
          <div className="card">
            <h5 style={{ color: '#00ff00', marginBottom: '10px' }}>Hoje</h5>
            <p style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
              R$ {mostrarTotais ? totais.comandas.hoje.toFixed(2) : '••••'}
            </p>
          </div>
          <div className="card">
            <h5 style={{ color: '#00ff00', marginBottom: '10px' }}>Semana</h5>
            <p style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
              R$ {mostrarTotais ? totais.comandas.semana.toFixed(2) : '••••'}
            </p>
          </div>
          <div className="card">
            <h5 style={{ color: '#00ff00', marginBottom: '10px' }}>Mês</h5>
            <p style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
              R$ {mostrarTotais ? totais.comandas.mes.toFixed(2) : '••••'}
            </p>
          </div>
          <div className="card">
            <h5 style={{ color: '#00ff00', marginBottom: '10px' }}>Ano</h5>
            <p style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
              R$ {mostrarTotais ? totais.comandas.ano.toFixed(2) : '••••'}
            </p>
          </div>
        </div>
      </div>

      {/* Seção de Totais - Quartos */}
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        border: '2px solid #00ff00',
        borderRadius: '12px',
        padding: '25px',
        marginBottom: '30px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h4 style={{ color: '#00ff00', fontSize: '20px' }}>Quartos</h4>
          <button
            className="btn-secondary"
            onClick={() => {
              if (!mostrarTotaisQuartos) {
                const senha = prompt('Digite a senha para visualizar os valores:');
                if (senha === 'admin123') {
                  setMostrarTotaisQuartos(true);
                }
              } else {
                setMostrarTotaisQuartos(false);
              }
            }}
          >
            {mostrarTotaisQuartos ? 'Ocultar' : '👁️ Ver'}
          </button>
        </div>

        <div className="responsive-grid">
          <div className="card">
            <h5 style={{ color: '#00ff00', marginBottom: '10px' }}>Hoje</h5>
            <p style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
              R$ {mostrarTotaisQuartos ? totaisQuartos.hoje.toFixed(2) : '••••'}
            </p>
          </div>
          <div className="card">
            <h5 style={{ color: '#00ff00', marginBottom: '10px' }}>Semana</h5>
            <p style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
              R$ {mostrarTotaisQuartos ? totaisQuartos.semana.toFixed(2) : '••••'}
            </p>
          </div>
          <div className="card">
            <h5 style={{ color: '#00ff00', marginBottom: '10px' }}>Mês</h5>
            <p style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
              R$ {mostrarTotaisQuartos ? totaisQuartos.mes.toFixed(2) : '••••'}
            </p>
          </div>
          <div className="card">
            <h5 style={{ color: '#00ff00', marginBottom: '10px' }}>Ano</h5>
            <p style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
              R$ {mostrarTotaisQuartos ? totaisQuartos.ano.toFixed(2) : '••••'}
            </p>
          </div>
        </div>
      </div>

      {/* Seção de Gráficos */}
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        border: '2px solid #00ff00',
        borderRadius: '12px',
        padding: '25px',
        marginBottom: '30px'
      }}>
        <h3 style={{ 
          color: '#00ff00', 
          marginBottom: '25px',
          fontSize: '22px'
        }}>
          Análise Visual
        </h3>

        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '25px'
        }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <h4 style={{ color: '#00ff00', marginBottom: '15px' }}>% Participação por Comanda</h4>
            <PieChart width={300} height={300}>
              <Pie data={ultimas10Comandas} dataKey="total" nameKey="nome" outerRadius={100} label>
                {ultimas10Comandas.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </div>

          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <h4 style={{ color: '#00ff00', marginBottom: '15px' }}>Total por Comanda</h4>
            <BarChart width={350} height={300} data={ultimas10Comandas}>
              <XAxis dataKey="nome" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#8884d8" />
            </BarChart>
          </div>

          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <h4 style={{ color: '#00ff00', marginBottom: '15px' }}>Área Total (Comandas)</h4>
            <AreaChart width={350} height={300} data={ultimas10Comandas}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nome" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="total" stroke="#82ca9d" fill="#82ca9d" />
            </AreaChart>
          </div>
        </div>
      </div>

      {/* Seção de Busca por Período */}
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        border: '2px solid #00ff00',
        borderRadius: '12px',
        padding: '25px'
      }}>
        <h3 style={{ 
          color: '#00ff00', 
          marginBottom: '20px',
          fontSize: '20px'
        }}>
          Buscar Finalizados por Período
        </h3>
        
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '15px',
          alignItems: 'center'
        }}>
          <div>
            <label style={{ color: '#00ff00', fontSize: '14px', marginBottom: '5px', display: 'block' }}>Data Início:</label>
            <input 
              type="date" 
              value={dataInicio} 
              onChange={(e) => setDataInicio(e.target.value)}
              style={{
                 padding: '12px',
                 borderRadius: '8px',
                 border: '2px solid #00ff00',
                 backgroundColor: 'rgba(0, 0, 0, 0.9)',
                 color: '#00ff00',
                 fontSize: '16px',
                 width: '100%',
                 boxShadow: '0 2px 8px rgba(0, 255, 0, 0.2)',
                 transition: 'all 0.3s ease'
               }}
            />
          </div>
          <div>
            <label style={{ color: '#00ff00', fontSize: '14px', marginBottom: '5px', display: 'block' }}>Hora Início:</label>
            <input 
              type="time" 
              value={horaInicio} 
              onChange={(e) => setHoraInicio(e.target.value)}
              style={{
                 padding: '12px',
                 borderRadius: '8px',
                 border: '2px solid #00ff00',
                 backgroundColor: 'rgba(0, 0, 0, 0.9)',
                 color: '#00ff00',
                 fontSize: '16px',
                 width: '100%',
                 boxShadow: '0 2px 8px rgba(0, 255, 0, 0.2)',
                 transition: 'all 0.3s ease'
               }}
            />
          </div>
          <div>
            <label style={{ color: '#00ff00', fontSize: '14px', marginBottom: '5px', display: 'block' }}>Data Fim:</label>
            <input 
              type="date" 
              value={dataFim} 
              onChange={(e) => setDataFim(e.target.value)}
              style={{
                 padding: '12px',
                 borderRadius: '8px',
                 border: '2px solid #00ff00',
                 backgroundColor: 'rgba(0, 0, 0, 0.9)',
                 color: '#00ff00',
                 fontSize: '16px',
                 width: '100%',
                 boxShadow: '0 2px 8px rgba(0, 255, 0, 0.2)',
                 transition: 'all 0.3s ease'
               }}
            />
          </div>
          <div>
            <label style={{ color: '#00ff00', fontSize: '14px', marginBottom: '5px', display: 'block' }}>Hora Fim:</label>
            <input 
              type="time" 
              value={horaFim} 
              onChange={(e) => setHoraFim(e.target.value)}
              style={{
                 padding: '12px',
                 borderRadius: '8px',
                 border: '2px solid #00ff00',
                 backgroundColor: 'rgba(0, 0, 0, 0.9)',
                 color: '#00ff00',
                 fontSize: '16px',
                 width: '100%',
                 boxShadow: '0 2px 8px rgba(0, 255, 0, 0.2)',
                 transition: 'all 0.3s ease'
               }}
            />
          </div>
          <div style={{ alignSelf: 'end' }}>
             <button 
               className="btn-primary"
               onClick={buscarFinalizadosPorPeriodo}
               style={{
                 width: '100%',
                 padding: '15px 20px',
                 marginTop: '24px',
                 backgroundColor: '#00ff00',
                 color: '#000000',
                 border: '3px solid #00ff00',
                 borderRadius: '10px',
                 fontSize: '18px',
                 fontWeight: 'bold',
                 cursor: 'pointer',
                 transition: 'all 0.3s ease',
                 boxShadow: '0 4px 15px rgba(0, 255, 0, 0.3)',
                 textTransform: 'uppercase',
                 letterSpacing: '1px'
               }}
               onMouseEnter={(e) => {
                 e.target.style.backgroundColor = '#00cc00';
                 e.target.style.transform = 'translateY(-2px)';
                 e.target.style.boxShadow = '0 6px 20px rgba(0, 255, 0, 0.5)';
               }}
               onMouseLeave={(e) => {
                 e.target.style.backgroundColor = '#00ff00';
                 e.target.style.transform = 'translateY(0)';
                 e.target.style.boxShadow = '0 4px 15px rgba(0, 255, 0, 0.3)';
               }}
             >
               🔍 Buscar Período
             </button>
           </div>
        </div>
        
        {totalPorPeriodo !== null && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: 'rgba(0, 255, 0, 0.1)',
            border: '1px solid #00ff00',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h4 style={{ color: '#00ff00', margin: 0 }}>
              Período Selecionado: R$ {totalPorPeriodo.toFixed(2)}
            </h4>
          </div>
        )}
      </div>
    </ResponsiveLayout>
  );
}

export default Relatorio;

