import React, { useEffect, useState, useRef } from 'react';
import ResponsiveLayout from '../Layout/ResponsiveLayout';
import '../GlobalLayout.css';

function Cronometro({ inicio, tempo, status }) {
  const [segundos, setSegundos] = useState(0);
  const intervalRef = useRef(null);

  const mapTempoParaSegundos = (tempoStr) => {
    switch (tempoStr) {
      case '25 minutos': return 25 * 60;
      case '40 minutos': return 40 * 60;
      case '1 hora': return 60 * 60;
      case 'tempo livre': return null; // sem limite
      default: return 0;
    }
  };

  useEffect(() => {
    const limite = mapTempoParaSegundos(tempo);
    const inicioDate = inicio ? new Date(inicio) : new Date();

    intervalRef.current = setInterval(() => {
      const agora = new Date();
      const diff = Math.floor((agora - inicioDate) / 1000);
      setSegundos(diff);
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [inicio, tempo]);

  const limite = mapTempoParaSegundos(tempo);
  const formatar = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const progresso = limite ? Math.min(100, Math.round((segundos / limite) * 100)) : 0;
  const estourado = limite && segundos > limite;

  return (
    <div>
      <div className="progress-bar-container">
        {limite ? (
          <div className="progress-bar" style={{ width: `${progresso}%`, backgroundColor: estourado ? '#ff4d4f' : '#00ff00' }} />
        ) : (
          <div style={{ color: '#00ff00', fontWeight: 'bold' }}>Tempo Livre</div>
        )}
      </div>
      <div style={{ marginTop: 6, color: estourado ? '#ff4d4f' : '#00ff00', fontWeight: 'bold' }}>
        {formatar(segundos)} {limite ? ` / ${formatar(limite)}` : ''}
      </div>
    </div>
  );
}

function Quartos() {
  const [quartos, setQuartos] = useState([]);
  const [form, setForm] = useState({ nome: '', tempo: '25 minutos', formaPagamento: '', quarto: '' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showFinalizados, setShowFinalizados] = useState(true);
  const [filtroInicio, setFiltroInicio] = useState('');
  const [filtroFim, setFiltroFim] = useState('');
  const [filtroNome, setFiltroNome] = useState('');

  const userId = localStorage.getItem('userId');
  const API = `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/quartos`;

  const carregar = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API}/${userId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setQuartos(data);
    } catch (err) {
      console.error('Erro ao carregar quartos:', err);
      setErrorMsg('Falha ao carregar quartos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const criar = async () => {
    try {
      const payload = { ...form, userId };
      const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Erro ao criar');
      await carregar();
      setForm({ nome: '', tempo: '25 minutos', formaPagamento: '', quarto: '' });
    } catch (err) {
      console.error(err);
      alert('Erro ao criar quarto');
    }
  };

  const finalizar = async (id) => {
    try {
      const res = await fetch(`${API}/${id}/finalizar`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Erro ao finalizar');
      await carregar();
    } catch (err) {
      console.error(err);
      alert('Erro ao finalizar quarto');
    }
  };

  function formatDuration(start, end) {
    if (!start || !end) return '-';
    const s = Math.floor((new Date(end) - new Date(start)) / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  // Filtro por data para itens finalizados
  const finalizados = quartos.filter(q => q.status === 'finalizado');
  const porData = (!filtroInicio && !filtroFim) ? finalizados : finalizados.filter(q => {
    if (!q.encerradoEm) return false;
    const encerrado = new Date(q.encerradoEm);
    const inicio = filtroInicio ? new Date(`${filtroInicio}T00:00:00`) : null;
    const fim = filtroFim ? new Date(`${filtroFim}T23:59:59`) : null;
    if (inicio && encerrado < inicio) return false;
    if (fim && encerrado > fim) return false;
    return true;
  });
  const finalizadosFiltrados = (!filtroNome ? porData : porData.filter(q => {
    const nome = (q.nome || '').toLowerCase();
    return nome.includes(filtroNome.trim().toLowerCase());
  }));

  return (
    <ResponsiveLayout>
      <div className="page-header">
        <div>
          <h2 className="page-title">🛏️ Quartos</h2>
          <p className="page-subtitle">Gerencie hóspedes e tempo de uso por quarto</p>
        </div>
      </div>

      {/* Formulário de criação */}
      <div className="card">
        <h3>Registrar Hóspede</h3>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Nome</label>
            <input className="form-input" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Nome do hóspede" />
          </div>
          <div className="form-group">
            <label className="form-label">Tempo</label>
            <select className="form-input" value={form.tempo} onChange={e => setForm({ ...form, tempo: e.target.value })}>
              <option>25 minutos</option>
              <option>40 minutos</option>
              <option>1 hora</option>
              <option>tempo livre</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Forma de Pagamento</label>
            <select className="form-input" value={form.formaPagamento} onChange={e => setForm({ ...form, formaPagamento: e.target.value })}>
              <option value="">Selecione</option>
              <option>Dinheiro</option>
              <option>Cartão</option>
              <option>Pix</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Quarto</label>
            <select className="form-input" value={form.quarto} onChange={e => setForm({ ...form, quarto: e.target.value })}>
              <option value="">Selecione</option>
              {[...Array(10)].map((_, idx) => {
                const label = `Quarto ${idx + 1}`;
                return (<option key={idx + 1} value={label}>{label}</option>);
              })}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <button className="btn-primary" onClick={criar}>Criar Card</button>
        </div>
      </div>

      {errorMsg && (
        <div className="card" style={{ borderColor: '#ff4d4f', color: '#ff4d4f' }}>{errorMsg}</div>
      )}

      {/* Lista de cards ativos */}
      <div className="responsive-grid" style={{ marginTop: 16 }}>
        {loading ? (
          <div>Carregando...</div>
        ) : quartos.filter(q => q.status === 'ativo').length === 0 ? (
          <div className="card">Nenhum quarto ativo</div>
        ) : (
          quartos.filter(q => q.status === 'ativo').map((q) => (
            <div key={q.id} className="card fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{q.nome}</h3>
                  <p style={{ margin: 0, color: '#aaa' }}>{q.quarto || 'Sem quarto'}</p>
                </div>
                <span className="badge" style={{ backgroundColor: '#00ff00' }}>ativo</span>
              </div>

              <div style={{ marginTop: 12 }}>
                <Cronometro inicio={q.criadaEm} tempo={q.tempo} status={q.status} />
              </div>

              <div style={{ marginTop: 12 }} className="grid-2">
                <div>
                  <p style={{ margin: 0 }}>Tempo: <strong>{q.tempo}</strong></p>
                  <p style={{ margin: 0 }}>Forma de Pagamento: <strong>{q.formaPagamento || '-'}</strong></p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <button className="btn-danger" onClick={() => finalizar(q.id)}>Finalizar</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Aba/Seção de Finalizados */}
      <div className="card" style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0 }}>Finalizados</h3>
          <button className="btn-secondary" onClick={() => setShowFinalizados(v => !v)}>
            {showFinalizados ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        {showFinalizados && (
          <>
            <div className="form-grid" style={{ marginTop: 12 }}>
              <div className="form-group">
                <label className="form-label">Data Início</label>
                <input type="date" className="form-input" value={filtroInicio} onChange={e => setFiltroInicio(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Data Fim</label>
                <input type="date" className="form-input" value={filtroFim} onChange={e => setFiltroFim(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Buscar por Nome</label>
                <input type="text" className="form-input" placeholder="Ex: Maria" value={filtroNome} onChange={e => setFiltroNome(e.target.value)} />
              </div>
              <div className="form-group" style={{ alignSelf: 'end' }}>
                <button className="btn-secondary" onClick={() => { setFiltroInicio(''); setFiltroFim(''); setFiltroNome(''); }}>Limpar Filtro</button>
              </div>
            </div>

            <div style={{ marginTop: 8, color: '#00ff00', fontWeight: 'bold' }}>
              Total encontrados: {finalizadosFiltrados.length}
            </div>

            <div className="responsive-grid" style={{ marginTop: 12 }}>
              {finalizadosFiltrados.length === 0 ? (
                <div className="card">Nenhum quarto finalizado</div>
              ) : (
                finalizadosFiltrados.map((q) => (
                  <div key={q.id} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ margin: 0 }}>{q.nome}</h3>
                        <p style={{ margin: 0, color: '#aaa' }}>{q.quarto || 'Sem quarto'}</p>
                      </div>
                      <span className="badge" style={{ backgroundColor: '#888' }}>finalizado</span>
                    </div>

                    <div style={{ marginTop: 8 }} className="grid-2">
                      <div>
                        <p style={{ margin: 0 }}>Tempo: <strong>{q.tempo}</strong></p>
                        <p style={{ margin: 0 }}>Forma de Pagamento: <strong>{q.formaPagamento || '-'}</strong></p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0 }}>Duração: <strong>{formatDuration(q.criadaEm, q.encerradoEm)}</strong></p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </ResponsiveLayout>
  );
}

export default Quartos;