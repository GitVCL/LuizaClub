import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  AreaChart, Area, CartesianGrid
} from 'recharts';
import './Relatorio.css';

function Relatorio() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  const [comandas, setComandas] = useState([]);
  const [totais, setTotais] = useState({
    comandas: { hoje: 0, semana: 0, mes: 0, ano: 0 },
  });
  const [mostrarTotais, setMostrarTotais] = useState(false);

  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');


  const [totalPorPeriodo, setTotalPorPeriodo] = useState(null);



  const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#00C49F', '#AA66CC', '#FF8800'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resComandas = await fetch(`https://luizaclubbackend-production.up.railway.app/api/comandas/${userId}`);
        const dadosComandas = await resComandas.json();
        setComandas(dadosComandas);
        calcularTotais(dadosComandas);
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
      }
    };

    fetchData();
  }, []);

  const dadosComandas = comandas.map((c) => ({ nome: c.nome, total: c.total }));

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
    if (!item.createdAt) return true;
    return new Date(item.createdAt) >= data;
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

  const buscarFinalizadosPorPeriodo = async () => {
  try {
    const inicio = new Date(dataInicio + "T00:00:00");
    const fim = new Date(dataFim + "T23:59:59");

const res = await fetch(`https://luizaclubbackend-production.up.railway.app/api/relatorios/periodo?inicio=${inicio.toISOString()}&fim=${fim.toISOString()}&userId=${userId}`);
    const data = await res.json();

    console.log("Finalizados filtrados:", data);

    const total = data.reduce((acc, item) => acc + Number(item.total || 0), 0);
    setTotalPorPeriodo(total);
  } catch (err) {
    console.error('Erro ao buscar finalizados por período:', err);
    setTotalPorPeriodo(null);
  }
};

  return (
    <div className="RELATORIO-container">
      <div className="RELATORIO-sidebar">
        <button onClick={() => navigate('/comandas')}>Comandas</button>
        <button onClick={() => navigate('/cardapio')}>Cardápio</button>
        <button onClick={() => navigate('/relatorio')}>Relatório</button>
        <button onClick={() => navigate('/finalizados')}>Finalizados</button>
        <button onClick={() => navigate('/')}>Logout</button>
        <button onClick={() => window.location.reload()} title="Atualizar" className="botao-atualizar">🔄</button>
      </div>

      <div className="RELATORIO-content">
        <h2 className="RELATORIO-titulo">Relatórios do Sistema</h2>

        <div className="RELATORIO-totais">
          <div>
            <h4 style={{ color: 'lime' }}>Comandas</h4>
            <div className="RELATORIO-card">Hoje: R$ {mostrarTotais ? totais.comandas.hoje.toFixed(2) : '••••'}</div>
            <div className="RELATORIO-card">Semana: R$ {mostrarTotais ? totais.comandas.semana.toFixed(2) : '••••'}</div>
            <div className="RELATORIO-card">Mês: R$ {mostrarTotais ? totais.comandas.mes.toFixed(2) : '••••'}</div>
            <div className="RELATORIO-card">Ano: R$ {mostrarTotais ? totais.comandas.ano.toFixed(2) : '••••'}</div>
          </div>

          <button
            className="botao-olho"
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
            style={{ marginLeft: '5px' }}
          >
            {mostrarTotais ? 'Ocultar' : '👁️ Ver'}
          </button>
        </div>

        <div className="RELATORIO-graficos" style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1 }}>
            <div className="RELATORIO-grafico">
              <h4>% Participação por Comanda</h4>
              <PieChart width={300} height={300}>
                <Pie data={dadosComandas} dataKey="total" nameKey="nome" outerRadius={100} label>
                  {dadosComandas.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </div>

            <div className="RELATORIO-grafico">
              <h4>Total por Comanda</h4>
              <BarChart width={350} height={300} data={dadosComandas}>
                <XAxis dataKey="nome" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#8884d8" />
              </BarChart>
            </div>

            <div className="RELATORIO-grafico">
              <h4>Área Total (Comandas)</h4>
              <AreaChart width={350} height={300} data={dadosComandas}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="total" stroke="#82ca9d" fill="#82ca9d" />
              </AreaChart>
            </div>
          </div>
        </div>

        {/* 🔽 NOVA SEÇÃO - FILTRO POR PERÍODO 🔽 */}
        <div className="RELATORIO-periodo">
          <h3>Buscar Finalizados por Período</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
            <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
            <button onClick={buscarFinalizadosPorPeriodo}>Buscar</button>
            {totalPorPeriodo !== null && (
              <div className="RELATORIO-card">
                Período Selecionado: R$ {totalPorPeriodo.toFixed(2)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Relatorio;
