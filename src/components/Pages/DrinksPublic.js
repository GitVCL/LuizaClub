import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import '../Layout/GlobalLayout.css';

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
}

function DrinksPublic() {
  const [searchParams] = useSearchParams();
  const urlUserId = searchParams.get('u');
  const filterFuncionario = searchParams.get('f');
  const inicio = searchParams.get('inicio');
  const fim = searchParams.get('fim');

  const ownerId = useMemo(() => {
    return urlUserId || process.env.REACT_APP_PUBLIC_USER_ID || '';
  }, [urlUserId]);

  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function carregar() {
      if (!ownerId) {
        setErrorMsg('Link inválido: usuário não informado.');
        setLista([]);
        return;
      }
      try {
        setErrorMsg('');
        setLoading(true);
        const base = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
        const url = new URL(`${base}/api/drinks/${ownerId}`);
        if (inicio && fim) {
          url.searchParams.set('inicio', inicio);
          url.searchParams.set('fim', fim);
        }
        const res = await fetch(url.toString());
        if (!res.ok) {
          const text = await res.text();
          console.error('Falha ao carregar drinks públicos:', res.status, res.statusText, text);
          setErrorMsg(`Falha ao carregar (HTTP ${res.status}).`);
          setLista([]);
          return;
        }
        const data = await res.json();
        setLista(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Erro ao carregar drinks públicos:', err);
        setErrorMsg('Erro de conexão com o servidor.');
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [ownerId, inicio, fim]);

  const filtrada = useMemo(() => {
    if (!filterFuncionario) return lista;
    return lista.filter((d) =>
      (d.funcionaria || '').toLowerCase().includes(filterFuncionario.toLowerCase())
    );
  }, [lista, filterFuncionario]);

  // Removido total de drinks da visualização pública conforme solicitação

  return (
    <div className="app-container">
      <div className="app-content" style={{ padding: 20 }}>
        <div className="page-header">
          <div className="page-title">🍹 Drinks (Visualização Pública)</div>
          <div className="header-actions">
            <button
              className="btn-secondary"
              onClick={() => {
                try {
                  window.location.reload();
                } catch {
                  // fallback silencioso
                }
              }}
            >
              Atualizar
            </button>
            {/* Sem ações de alteração */}
            <span className="badge" style={{ background: 'rgba(0,255,0,0.15)', border: '1px solid rgba(0,255,0,0.35)', color: '#00ff00' }}>
              Somente leitura
            </span>
          </div>
        </div>

        {/* Card de Total de Drinks removido da visualização pública */}

        {errorMsg && (
          <div className="card fade-in" style={{ borderColor: 'rgba(255,0,0,0.4)', marginTop: 20 }}>
            <div style={{ color: '#ff5c5c' }}>{errorMsg}</div>
          </div>
        )}

        {loading && (
          <div className="card fade-in" style={{ marginTop: 20 }}>
            <div style={{ color: '#aaa' }}>Carregando...</div>
          </div>
        )}

        <div className="responsive-grid" style={{ marginTop: 20 }}>
          {filtrada.map((d) => (
            <div key={d.id} className="card fade-in" style={{ borderColor: 'rgba(0,255,0,0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>{d.funcionaria || '—'}</div>
                <div style={{ color: '#aaa', fontSize: 12 }}>
                  {formatDate(d.periodoInicio)} — {formatDate(d.periodoFim)}
                </div>
              </div>

              <div style={{ marginTop: 8, color: '#00ff00', fontWeight: 'bold' }}>Quantidade</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'white', fontSize: 22, fontWeight: 'bold' }}>{d.quantidade}</span>
                <span style={{ color: '#aaa', fontSize: 12 }}>(meta {d.meta})</span>
              </div>

              <div style={{ marginTop: 10 }}>
                <div style={{ height: 10, background: 'rgba(0,255,0,0.1)', borderRadius: 999, overflow: 'hidden', border: '1px solid rgba(0,255,0,0.3)' }}>
                  <div style={{
                    width: `${Math.min(100, Math.round((d.quantidade / Math.max(1, d.meta)) * 100))}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #00ff00, #00cc00)'
                  }} />
                </div>
                <div style={{ color: '#00ff00', marginTop: 6, fontSize: 12 }}>Progresso: {Math.min(100, Math.round((d.quantidade / Math.max(1, d.meta)) * 100))}%</div>
              </div>

              <div style={{ marginTop: 10, color: '#aaa', fontSize: 12 }}>
                Comissão estimada: R$ {Math.max(0, (d.quantidade - (d.meta || 20))) * 5}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DrinksPublic;