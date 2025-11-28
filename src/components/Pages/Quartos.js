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
      case '1 hora gringo': return 60 * 60;
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
        <div className="progress-bar" style={{ width: `${limite ? progresso : 0}%`, backgroundColor: estourado ? '#ff4d4f' : '#00ff00' }} />
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
  const [showFinalizados, setShowFinalizados] = useState(false);
  const [filtroInicio, setFiltroInicio] = useState('');
  const [filtroFim, setFiltroFim] = useState('');
  const [filtroNome, setFiltroNome] = useState('');

  // Fallback de userId para ambiente de desenvolvimento
  const userId = localStorage.getItem('userId') || 'dev-user';
  // Base da API configurável por env, com fallback para localhost
  // Protege contra apontar acidentalmente para a porta do frontend (3001)
  const API_BASE = (() => {
    const base = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
    try {
      const u = new URL(base);
      if (u.port === '3001') {
        return 'http://localhost:5000';
      }
      return base;
    } catch {
      return 'http://localhost:5000';
    }
  })();
  const API = `${API_BASE}/api/quartos`;

  const calcularValorFaturado = (tempo) => {
    if (tempo === '1 hora') return 100;
    if (tempo === '1 hora gringo') return 150;
    if (tempo === '25 minutos' || tempo === '40 minutos') return 50;
    return 0;
  };

  const valorDoQuarto = (q) => {
    // Itens finalizados:
    // - Se valor > 0, usa diretamente
    // - Se valor === 0 e observacoes contém 'cancelado', mantém 0
    // - Se valor === 0 e NÃO contém 'cancelado', usa fallback pelo tempo (dados legados)
    if (q?.status === 'finalizado') {
      const v = typeof q?.valor === 'number' ? q.valor : null;
      if (v !== null && v > 0) return v;
      const obs = (q?.observacoes || '').toLowerCase();
      if (v === 0 && obs.includes('cancelado')) return 0;
      return calcularValorFaturado(q?.tempo);
    }
    // Itens ativos não contribuem para faturamento
    return 0;
  };

  const carregar = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const url = `${API}/${encodeURIComponent(userId)}`;
      console.log('Carregando quartos de URL:', url);
      const res = await fetch(url);
      const contentType = res.headers.get('Content-Type') || '';
      if (!res.ok) {
        let detalhe = '';
        if (contentType.includes('application/json')) {
          try {
            const payload = await res.json();
            detalhe = payload?.error || payload?.message || JSON.stringify(payload);
          } catch (e) {
            console.warn('Falha ao ler JSON de erro do GET /quartos:', e);
          }
        } else {
          try {
            const texto = await res.text();
            detalhe = (texto || '').slice(0, 200);
            console.warn('Resposta não-JSON do GET /quartos (parcial):', detalhe);
          } catch (e) {
            console.warn('Falha ao ler texto de erro do GET /quartos:', e);
          }
        }
        console.error('Falha ao carregar quartos:', { url, status: res.status, contentType, detalhe });
        setErrorMsg(`Falha ao carregar (HTTP ${res.status}). ${detalhe ? 'Detalhe: ' + detalhe : ''}`);
        setQuartos([]);
        return;
      }
      const data = contentType.includes('application/json') ? await res.json() : [];
      const lista = Array.isArray(data) ? data : [];
      setQuartos(lista);
    } catch (err) {
      console.error('Erro ao carregar quartos:', err);
      setErrorMsg('Erro de conexão com o servidor.');
      setQuartos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const criar = async () => {
    try {
      // Bloqueio de quarto já em uso
      const ativosEmUso = new Set(
        quartos.filter(q => q.status === 'ativo' && q.quarto).map(q => q.quarto)
      );
      if (!form.quarto) {
        alert('Selecione um quarto');
        return;
      }
      if (ativosEmUso.has(form.quarto)) {
        alert('Este quarto está em uso. Selecione outro.');
        return;
      }

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

  const cancelar = async (item) => {
    const confirmar = window.confirm('Deseja cancelar este quarto finalizado? O faturamento será zerado.');
    if (!confirmar) return;
    try {
      const id = item?.id || item?._id;
      if (!id) {
        console.error('Cancelar chamado sem id válido', item);
        alert('ID do quarto inválido. Atualize a página e tente novamente.');
        return;
      }
      const url = `${API}/${encodeURIComponent(id)}/cancelar`;
      console.log('Enviando PATCH cancelar para:', url);
      // Snapshot para possível rollback se falhar
      const alvo = quartos.find(q => (q.id === id) || (q._id === id));
      const prevValor = alvo?.valor;
      const prevObs = alvo?.observacoes || '';
      // Atualização otimista: zera apenas o valor, mantém demais informações
      setQuartos(prev => prev.map(q => {
        const match = (q.id === id) || (q._id === id);
        if (!match) return q;
        return { ...q, valor: 0 };
      }));
      let res = await fetch(url, { method: 'PATCH' });
      if (!res.ok) {
        const contentType = res.headers.get('Content-Type') || '';
        const text = await res.text();
        console.warn('Primeira tentativa falhou:', { status: res.status, contentType, preview: text.slice(0, 120) });
        // Fallback: se recebeu 404 em HTML (tipicamente vindo do dev-server do frontend), tenta direto no backend
        const shouldRetryToBackend = res.status === 404 && contentType.includes('text/html') || (text || '').toLowerCase().includes('cannot patch');
        if (shouldRetryToBackend) {
          const fallbackUrl = `http://localhost:5000/api/quartos/${encodeURIComponent(id)}/cancelar`;
          console.log('Tentando fallback para backend:', fallbackUrl);
          res = await fetch(fallbackUrl, { method: 'PATCH' });
        }
        if (!res.ok) {
          const text2 = await res.text();
          console.error('Erro ao cancelar quarto (após fallback):', res.status, text2);
          alert(`Erro ao cancelar quarto (HTTP ${res.status}). ${(text2 || text).slice(0, 200)}\nA operação falhou e os valores anteriores foram restaurados.`);
          // Rollback: restaura valores anteriores no card
          setQuartos(prev => prev.map(q => {
            const match = (q.id === id) || (q._id === id);
            if (!match) return q;
            return { ...q, valor: prevValor };
          }));
          return;
        }
      }
      await carregar();
    } catch (err) {
      console.error('Falha ao cancelar quarto:', err);
      alert('Falha ao cancelar quarto. Os valores anteriores foram restaurados.');
      // Em erro inesperado, força recarregar para garantir consistência
      await carregar();
    }
  };

  const excluir = async (id) => {
    const confirmar = window.confirm('Tem certeza que deseja excluir este quarto? Esta ação é permanente.');
    if (!confirmar) return;
    if (!id) {
      console.error('Excluir chamado sem id válido');
      alert('ID do quarto inválido. Atualize a página e tente novamente.');
      return;
    }
    try {
      const alvo = quartos.find(q => (q.id === id) || (q._id === id));
      const quartoParam = alvo?.quarto ? `&quarto=${encodeURIComponent(alvo.quarto)}` : '';
      const url = `${API}/${id}?userId=${encodeURIComponent(userId || '')}${quartoParam}`;
      console.log('Enviando DELETE para:', url);
      const res = await fetch(url, { method: 'DELETE' });
      if (!res.ok) {
        const contentType = res.headers.get('Content-Type') || '';
        let mensagem = `Erro ao excluir (HTTP ${res.status})`;
        if (contentType.includes('application/json')) {
          try {
            const erro = await res.json();
            mensagem = erro?.error ? `${mensagem}: ${erro.error}` : mensagem;
          } catch (e) {
            console.warn('Falha ao ler corpo de erro JSON do DELETE /quartos:', e);
          }
        } else {
          try {
            const texto = await res.text();
            console.warn('Resposta não-JSON do DELETE /quartos (parcial):', texto.slice(0, 200));
            mensagem = `${mensagem} — resposta não-JSON`;
          } catch (e) {
            console.warn('Falha ao ler corpo de erro (texto) do DELETE /quartos:', e);
          }
        }
        console.error('Falha DELETE /quartos:', { url, status: res.status, contentType, mensagem });
        alert(mensagem);
        return;
      }
      console.log('Quarto excluído com sucesso:', id);
      // Remoção imediata do card no frontend
      setQuartos(prev => prev.filter(q => (q.id !== id) && (q._id !== id)));
    } catch (err) {
      console.error('Erro ao excluir quarto:', err);
      alert(`Falha ao excluir quarto: ${err?.message || 'Tente novamente.'}`);
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

  function formatDateTime(dt) {
    try {
      const d = new Date(dt);
      return d.toLocaleString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dt || '-';
    }
  }

  function imprimirQuarto(q) {
    const criadoEm = formatDateTime(q.criadaEm);
    const numeroQuarto = (q.quarto || '').match(/(\d+)/)?.[1] || (q.quarto || '-');

    const printWin = window.open('', '', 'width=700,height=900');
    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Impressão do Quarto</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; font-size: 14px; }
            .title { font-size: 18px; font-weight: bold; margin-bottom: 12px; }
            .line { margin-bottom: 8px; }
          </style>
        </head>
        <body>
          <div class="title">${q.nome || '-'} (${q.status || '-'})</div>
          <div class="line">Quarto: ${numeroQuarto}</div>
          <div class="line">Tempo: ${q.tempo || '-'}</div>
          <div class="line">Forma de Pagamento: ${q.formaPagamento || '-'}</div>
          <div class="line">Criado em: ${criadoEm}</div>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>`;
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
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

  const totalFaturadoFinalizados = finalizadosFiltrados.reduce((acc, q) => acc + valorDoQuarto(q), 0);

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
              <option>1 hora gringo</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Forma de Pagamento</label>
            <select className="form-input" value={form.formaPagamento} onChange={e => setForm({ ...form, formaPagamento: e.target.value })}>
              <option value="">Selecione</option>
              <option>Dinheiro</option>
              <option>Cartão</option>
              <option>Pix</option>
              <option>Pix pra ela</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Quarto</label>
            <select className="form-input" value={form.quarto} onChange={e => setForm({ ...form, quarto: e.target.value })}>
              <option value="">Selecione</option>
              {[...Array(7)].map((_, idx) => {
                const label = `Quarto ${idx + 1}`;
                const emUso = quartos.some(q => q.status === 'ativo' && q.quarto === label);
                return (
                  <option key={idx + 1} value={label} disabled={emUso}>
                    {emUso ? `${label} (em uso)` : label}
                  </option>
                );
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
                <div className="actions-row">
                  <button className="btn-secondary" style={{ marginRight: 8, fontSize: '0.8rem', padding: '4px 8px' }} onClick={() => imprimirQuarto(q)}>Imprimir</button>
                  <button className="btn-blue" style={{ fontSize: '0.8rem', padding: '4px 8px' }} onClick={() => finalizar(q.id)}>Finalizar</button>
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
          <div>
            <button className="btn-secondary" onClick={() => setShowFinalizados(v => !v)}>
              {showFinalizados ? 'Ocultar' : 'Mostrar'}
            </button>
            {showFinalizados && (
              <button className="btn-secondary" style={{ marginLeft: 8 }} onClick={carregar}>
                Atualizar Lista
              </button>
            )}
          </div>
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
            <div style={{ marginTop: 4, color: '#00ff00', fontWeight: 'bold' }}>
              Total faturado: R$ {totalFaturadoFinalizados.toFixed(2)}
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
                      <span className="badge" style={{ backgroundColor: '#888' }}>
                        finalizado
                      </span>
                    </div>

                    <div style={{ marginTop: 8 }} className="grid-2">
                      <div>
                        <p style={{ margin: 0 }}>Tempo: <strong>{q.tempo}</strong></p>
                        <p style={{ margin: 0 }}>Forma de Pagamento: <strong>{q.formaPagamento || '-'}</strong></p>
                        <p style={{ margin: 0 }}>Valor faturado: <strong>R$ {valorDoQuarto(q).toFixed(2)}</strong></p>
                        <p style={{ margin: 0 }}>Criado em: <strong>{formatDateTime(q.criadaEm)}</strong></p>
                        <p style={{ margin: 0 }}>Finalizado em: <strong>{formatDateTime(q.encerradoEm)}</strong></p>
                      </div>
                       <div style={{ textAlign: 'right' }}>
                         <p style={{ margin: 0 }}>Duração: <strong>{formatDuration(q.criadaEm, q.encerradoEm)}</strong></p>
                         <div className="actions-row">
                           <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '4px 8px' }} onClick={() => imprimirQuarto(q)}>Imprimir</button>
                           <button className="btn-danger" style={{ marginLeft: 8, fontSize: '0.8rem', padding: '4px 8px' }} onClick={() => cancelar(q)}>Cancelar</button>
                         </div>
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
