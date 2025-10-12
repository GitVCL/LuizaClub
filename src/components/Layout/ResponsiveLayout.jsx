import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../GlobalLayout.css';

const ResponsiveLayout = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [notifySupported, setNotifySupported] = useState(false);
  const [notifyPermission, setNotifyPermission] = useState('default');
  const navigate = useNavigate();
  const location = useLocation();

  // Detectar se é mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fechar sidebar ao navegar (mobile)
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location, isMobile]);

  // Checar suporte e status de permissão de Notificações
  useEffect(() => {
    const supported = 'Notification' in window;
    setNotifySupported(supported);
    if (supported) {
      setNotifyPermission(Notification.permission);
    }
  }, []);

  const requestNotifications = async () => {
    try {
      if (!('Notification' in window)) return;
      const result = await Notification.requestPermission();
      setNotifyPermission(result);
      if (result === 'granted') {
        try {
          new Notification('Notificações ativadas', { body: 'Você receberá alertas das Comandas.' });
        } catch (err) {
          console.warn('Notificação de teste falhou:', err);
        }
      }
    } catch (err) {
      console.error('Erro ao solicitar permissões de notificação:', err);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const navigationItems = [
    { path: '/comandas', label: 'Comandas', icon: '📋' },
    { path: '/cardapio', label: 'Cardápio', icon: '🍽️' },
    { path: '/relatorio', label: 'Relatório', icon: '📊' },
    // { path: '/finalizados', label: 'Finalizados', icon: '✅' }, // removido
    { path: '/drinks', label: 'Drinks', icon: '🍹' },
    { path: '/quartos', label: 'Quartos', icon: '🛏️' },
    { path: '/', label: 'Logout', icon: '🚪' }
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  const isActivePage = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="app-container responsive-layout-container">
      {/* Botão Atualizar Mobile */}
      {isMobile && (
        <button 
          className="mobile-menu-btn" 
          onClick={() => window.location.reload()}
          aria-label="Atualizar página"
          title="Atualizar"
        >
          🔄
        </button>
      )}

      {/* Sidebar */}
      <nav className="app-sidebar">
        {/* Header do Sidebar */}
        <div style={{ 
          marginBottom: '30px', 
          textAlign: 'center',
          borderBottom: '2px solid #00ff00',
          paddingBottom: '15px'
        }}>
          <h2 style={{ 
            color: '#00ff00', 
            fontSize: '18px',
            fontWeight: 'bold'
          }}>
            🚀 LUIZA CLUB
          </h2>
        </div>

        {/* Navegação Desktop */}
        {!isMobile && navigationItems.map((item) => (
          <button
            key={item.path}
            onClick={() => handleNavigation(item.path)}
            style={{
              backgroundColor: isActivePage(item.path) ? '#00ff00' : '#333',
              color: isActivePage(item.path) ? '#000' : 'white',
            }}
          >
            {item.icon} {item.label}
          </button>
        ))}

        {/* Navegação Mobile */}
        {isMobile && navigationItems.map((item) => (
          <button
            key={item.path}
            onClick={() => handleNavigation(item.path)}
            style={{
              backgroundColor: isActivePage(item.path) ? '#00ff00' : '#333',
              color: isActivePage(item.path) ? '#000' : 'white',
              fontSize: '16px',
              padding: '15px'
            }}
          >
            {item.icon} {item.label}
          </button>
        ))}

        {/* Botão de Atualizar */}
        <button 
          onClick={() => window.location.reload()} 
          title="Atualizar"
          style={{
            marginTop: 'auto',
            backgroundColor: '#444',
            fontSize: '20px'
          }}
        >
          🔄
        </button>
      </nav>

      {/* Conteúdo Principal */}
      <main className="app-content">
        {title && (
          <header style={{ 
            marginBottom: '30px',
            borderBottom: '2px solid #00ff00',
            paddingBottom: '15px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <h1 style={{ 
                color: '#00ff00', 
                fontSize: isMobile ? '24px' : '32px',
                textAlign: isMobile ? 'center' : 'left',
                margin: 0
              }}>
                {title}
              </h1>
              {notifySupported && notifyPermission === 'default' && (
                <button 
                  className="btn-secondary" 
                  onClick={requestNotifications}
                  title="Ativar notificações do navegador"
                >
                  Ativar Notificações
                </button>
              )}
            </div>
          </header>
        )}
        
        {children}
      </main>

      {/* Footer Mobile */}
      {isMobile && (
        <footer className="mobile-footer">
          <nav className="mobile-footer-nav">
            {navigationItems.map((item) => (
              <button
                key={item.path}
                className={`mobile-footer-btn ${isActivePage(item.path) ? 'active' : ''}`}
                onClick={() => handleNavigation(item.path)}
              >
                <div>{item.icon}</div>
                <div>{item.label}</div>
              </button>
            ))}
          </nav>
        </footer>
      )}
    </div>
  );
};

export default ResponsiveLayout;
