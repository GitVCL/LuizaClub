import React, { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  AreaChart, Area, CartesianGrid
} from 'recharts';
import ResponsiveLayout from '../Layout/ResponsiveLayout';
import '../GlobalLayout.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

function Relatorio() {
  const userId = localStorage.getItem('userId');

  const [comandas, setComandas] = useState([]);
  // Quartos
  const [quartos, setQuartos] = useState([]); // eslint-disable-line no-unused-vars
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
  const [comandasPorPeriodo, setComandasPorPeriodo] = useState([]);
  const [relatorioExpandido, setRelatorioExpandido] = useState(null);
  const [topProdutos, setTopProdutos] = useState([]);

  const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#00C49F', '#AA66CC', '#FF8800'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resComandas = await fetch(`${API_BASE}/api/comandas/${userId}`);
        const dadosComandas = await resComandas.json();
        setComandas(dadosComandas);
        calcularTotais(dadosComandas);
        calcularTopProdutos(dadosComandas);

        const resQuartos = await fetch(`${API_BASE}/api/quartos/${userId}`);
        const dadosQuartos = await resQuartos.json();
        setQuartos(dadosQuartos);
        calcularTotaisQuartos(dadosQuartos);
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
      }
    };

    fetchData();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const dadosComandas = Array.isArray(comandas) ? comandas.map((c) => ({ nome: c.nome, total: c.total })) : [];
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

  const calcularTopProdutos = (lista) => {
    try {
      // Considera apenas comandas finalizadas para vendas efetivas
      const finalizadas = Array.isArray(lista) ? lista.filter(c => c.status === 'finalizada') : [];
      const contador = new Map();

      for (const c of finalizadas) {
        const itens = Array.isArray(c.itens) ? c.itens : [];
        for (const item of itens) {
          const nome = item?.descricao || item?.nome || 'Desconhecido';
          const qtd = Number(item?.qtd || 0);
          if (!nome || qtd <= 0) continue;
          contador.set(nome, (contador.get(nome) || 0) + qtd);
        }
      }

      const ordenado = Array.from(contador.entries())
        .map(([nome, qtd]) => ({ nome, qtd }))
        .sort((a, b) => b.qtd - a.qtd)
        .slice(0, 5);

      setTopProdutos(ordenado);
    } catch (e) {
      console.error('Erro ao calcular top produtos:', e);
      setTopProdutos([]);
    }
  };

  const calcularValorFaturadoQuarto = (tempo) => {
    if (tempo === '1 hora') return 100;
    if (tempo === '1 hora gringo') return 150;
    if (tempo === 'pernoite') return 300;
    if (tempo === '30 minutos') return 50;
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

  const exportarPDFFinalizada = (comanda) => {
    if (!comanda) return alert('Comanda não encontrada.');
    const itensLista = Array.isArray(comanda.itens) ? comanda.itens : [];
    const totalValor = Number(comanda.total || 0);

    const printWindow = window.open('', '_blank');

    const printHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Comanda - ${comanda.nome}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 3mm;
            width: 80mm;
            max-width: 80mm;
            font-size: 12px;
            text-align: center;
            color: black;
            background: white;
          }
          .nota-container {
            width: 80mm;
            max-width: 300px;
            margin: 0 auto;
          }
          h3 {
            text-align: center;
            font-size: 16px;
            margin-bottom: 10px;
            font-weight: bold;
          }
          p {
            font-size: 10px;
            margin-bottom: 8px;
            text-align: center;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 5px 0;
            font-size: 14px;
          }
          th, td {
            padding: 2px 3px;
            font-size: 14px;
            line-height: 1.2;
            border: none;
          }
          th:first-child, td:first-child {
            text-align: left;
            width: 40%;
          }
          th:nth-child(2), td:nth-child(2) {
            text-align: center;
            width: 15%;
          }
          th:nth-child(3), td:nth-child(3) {
            text-align: right;
            width: 20%;
          }
          th:last-child, td:last-child {
            text-align: right;
            width: 25%;
          }
          th {
            font-weight: bold;
            border-bottom: 1px solid #000;
          }
          .total {
            margin-top: 8px;
            font-weight: bold;
            font-size: 18px;
            text-align: left;
            border-top: 1px solid #000;
            padding-top: 5px;
            width: 100%;
            display: block;
          }
          .info-line {
            font-size: 10px;
            margin-bottom: 4px;
            text-align: left;
            border-top: 1px dashed #000;
            padding-top: 4px;
            margin-top: 6px;
          }
          .footer {
            font-size: 8px;
            text-align: center;
            margin-top: 10px;
            font-style: italic;
          }
          @media print {
            body { margin: 0; }
            .nota-container { width: 100%; max-width: none; }
          }
        </style>
      </head>
      <body>
        <div class="nota-container">
           <h3>${comanda.nome}</h3>
           ${comanda.dono ? `<p><strong>Dono:</strong> ${comanda.dono}</p>` : ''}
           ${comanda.encerradaEm ? `<p><strong>Encerrada:</strong> ${new Date(comanda.encerradaEm).toLocaleString()}</p>` : ''}
          <table>
            <thead>
              <tr>
                <th>Desc</th>
                <th>Qtd</th>
                <th>V. Unit</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${itensLista.map(item => `
                <tr>
                  <td>${item?.descricao || 'Item'}</td>
                  <td style="text-align: center">${item?.qtd || 0}</td>
                  <td style="text-align: right">R$ ${Number(item?.valorUnit || 0).toFixed(2)}</td>
                  <td style="text-align: right">R$ ${((Number(item?.valorUnit || 0)) * (Number(item?.qtd || 0))).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total">Total: R$ ${totalValor.toFixed(2)}</div>
          ${itensLista.some(i => i?.comissionado) ? '<div class="info-line">* COM = Item comissionado</div>' : ''}
          <div class="footer">Obrigado pela preferência!</div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printHTML);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const buscarFinalizadosPorPeriodo = async () => {
    try {
      const inicio = new Date(dataInicio + "T" + horaInicio + ":00");
      const fim = new Date(dataFim + "T" + horaFim + ":59");

      const res = await fetch(`${API_BASE}/api/relatorios/periodo?inicio=${inicio.toISOString()}&fim=${fim.toISOString()}&userId=${userId}`);
      const data = await res.json();

      const total = data.reduce((acc, item) => acc + Number(item.total || 0), 0);
      setTotalPorPeriodo(total);
      setComandasPorPeriodo(Array.isArray(data) ? data : []);
      setRelatorioExpandido(null);
    } catch (err) {
      console.error('Erro ao buscar finalizados por período:', err);
      setTotalPorPeriodo(null);
      setComandasPorPeriodo([]);
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

      {/* Top 5 Produtos Mais Vendidos */}
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        border: '2px solid #00ff00',
        borderRadius: '12px',
        padding: '25px',
        marginBottom: '30px'
      }}>
        <h3 style={{ color: '#00ff00', marginBottom: '20px', fontSize: '22px' }}>
          Top 5 Produtos Mais Vendidos
        </h3>
        {topProdutos.length === 0 ? (
          <div className="card">Nenhuma venda finalizada registrada</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
            {topProdutos.map((p, idx) => (
              <div key={p.nome} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ color: '#00ff00', fontWeight: 'bold' }}>#{idx + 1}</div>
                <div style={{ color: 'white', fontWeight: 'bold' }}>{p.nome}</div>
                <div style={{ color: '#00ff00' }}>{p.qtd}</div>
              </div>
            ))}
          </div>
        )}
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
          <>
            <div style={{
              marginTop: '20px',
              padding: '15px',
              backgroundColor: 'rgba(0, 255, 0, 0.1)',
              border: '1px solid #00ff00',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <h4 style={{ color: '#00ff00', margin: 0, fontSize: '18px' }}>
                Período Selecionado: R$ {totalPorPeriodo.toFixed(2)}
              </h4>
              <p style={{ color: 'white', margin: '8px 0 0', fontSize: '14px' }}>
                {comandasPorPeriodo.length} comanda(s) finalizada(s) no período
              </p>
            </div>

            {comandasPorPeriodo.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ color: '#00ff00', marginBottom: '12px', fontSize: '16px' }}>
                  Detalhamento por Comanda
                </h4>
                <div className="responsive-grid">
                  {comandasPorPeriodo.map((c) => {
                    const isExpanded = relatorioExpandido === c.id;
                    const itensLista = Array.isArray(c.itens) ? c.itens : [];

                    return (
                      <div key={c.id} className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h5 style={{ margin: 0, color: 'white' }}>{c.nome}</h5>
                            {c.dono && (
                              <p style={{ margin: 0, color: '#aaa', fontSize: '13px' }}>Dono: {c.dono}</p>
                            )}
                          </div>
                          <span style={{
                            backgroundColor: '#28a745',
                            color: 'white',
                            fontSize: '11px',
                            padding: '3px 8px',
                            borderRadius: '10px'
                          }}>
                            finalizada
                          </span>
                        </div>

                        <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                          <div>
                            <p style={{ margin: 0 }}>Itens: <strong>{itensLista.length}</strong></p>
                            <p style={{ margin: 0 }}>Total: <strong style={{ color: '#00ff00' }}>R$ {(c.total || 0).toFixed(2)}</strong></p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ margin: 0, color: '#aaa' }}>Encerrada:</p>
                            <p style={{ margin: 0, fontWeight: 'bold' }}>{new Date(c.encerradaEm).toLocaleString()}</p>
                          </div>
                        </div>

                        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <button
                            className="btn-secondary"
                            style={{ padding: '8px 10px', fontSize: '12px' }}
                            onClick={() => setRelatorioExpandido(isExpanded ? null : c.id)}
                          >
                            {isExpanded ? '▲ Ocultar' : '▼ Ver Itens'}
                          </button>
                          <button
                            onClick={() => exportarPDFFinalizada(c)}
                            style={{
                              padding: '8px 10px',
                              backgroundColor: '#6f42c1',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => { e.target.style.backgroundColor = '#5a32a3'; }}
                            onMouseLeave={(e) => { e.target.style.backgroundColor = '#6f42c1'; }}
                          >
                            🖨 Imprimir
                          </button>
                        </div>

                        {isExpanded && (
                          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(0, 255, 0, 0.3)' }}>
                            <div style={{
                              overflowX: 'auto',
                              backgroundColor: 'rgba(0, 0, 0, 0.3)',
                              borderRadius: '6px',
                              border: '1px solid rgba(0, 255, 0, 0.2)'
                            }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                <thead>
                                  <tr style={{ backgroundColor: 'rgba(0, 255, 0, 0.08)' }}>
                                    <th style={{ padding: '6px 8px', color: '#00ff00', fontWeight: 'bold', textAlign: 'left', borderBottom: '1px solid rgba(0, 255, 0, 0.3)' }}>Descrição</th>
                                    <th style={{ padding: '6px 8px', color: '#00ff00', fontWeight: 'bold', textAlign: 'center', borderBottom: '1px solid rgba(0, 255, 0, 0.3)' }}>Qtd</th>
                                    <th style={{ padding: '6px 8px', color: '#00ff00', fontWeight: 'bold', textAlign: 'right', borderBottom: '1px solid rgba(0, 255, 0, 0.3)' }}>Unit</th>
                                    <th style={{ padding: '6px 8px', color: '#00ff00', fontWeight: 'bold', textAlign: 'right', borderBottom: '1px solid rgba(0, 255, 0, 0.3)' }}>Sub</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {itensLista.length === 0 ? (
                                    <tr>
                                      <td colSpan="4" style={{ padding: '12px', color: '#888', textAlign: 'center' }}>
                                        Sem itens
                                      </td>
                                    </tr>
                                  ) : (
                                    itensLista.map((item, idx) => {
                                      const unit = Number(item?.valorUnit || 0);
                                      const qtd = Number(item?.qtd || 0);
                                      return (
                                        <tr key={idx} style={{ borderBottom: '1px solid rgba(0, 255, 0, 0.1)' }}>
                                          <td style={{ padding: '6px 8px', color: 'white' }}>
                                            {item?.descricao || 'Item'}
                                            {item?.comissionado && (
                                              <span style={{ fontSize: '9px', backgroundColor: '#ffc107', color: '#000', padding: '1px 4px', borderRadius: '3px', marginLeft: '4px' }}>COM</span>
                                            )}
                                          </td>
                                          <td style={{ padding: '6px 8px', color: 'white', textAlign: 'center' }}>{qtd}</td>
                                          <td style={{ padding: '6px 8px', color: 'white', textAlign: 'right' }}>{unit.toFixed(2)}</td>
                                          <td style={{ padding: '6px 8px', color: '#00ff00', fontWeight: 'bold', textAlign: 'right' }}>{(unit * qtd).toFixed(2)}</td>
                                        </tr>
                                      );
                                    })
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ResponsiveLayout>
  );
}

export default Relatorio;

