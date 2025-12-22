import React, { useEffect, useState } from 'react';
import PosHome from './pages/pos/PosHome';
import Tables from './pages/pos/Tables';
import Order from './pages/pos/Order';
import Payment from './pages/pos/Payment';
import Invoice from './pages/pos/Invoice';
import Validator from './pages/pos/Validator';
import JarvisAssistant from './pages/pos/JarvisAssistant';
import PosAssistant from './components/PosAssistant';

function App() {
  const [activePanel, setActivePanel] = useState('pos');
  const [routePath, setRoutePath] = useState(window.location.pathname || '/');
  const [assistantOpen, setAssistantOpen] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname || '/';
      setRoutePath(path);
      if (path.startsWith('/jarvis')) {
        setActivePanel('jarvis');
      } else {
        setActivePanel('pos');
      }
    };

    if (routePath.startsWith('/jarvis')) {
      setActivePanel('jarvis');
    } else {
      setActivePanel('pos');
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [routePath]);

  const navigateTo = (path) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setRoutePath(path);
    if (path.startsWith('/jarvis')) {
      setActivePanel('jarvis');
    } else {
      setActivePanel('pos');
    }
  };

  const renderPosRoute = () => {
    if (
      routePath === '/' ||
      routePath === '/pos' ||
      routePath.startsWith('/pos/tables')
    ) {
      return <Tables onNavigate={navigateTo} />;
    }
    if (routePath.startsWith('/pos/order')) {
      return <Order onNavigate={navigateTo} />;
    }
    if (routePath.startsWith('/pos/payment')) {
      return <Payment onNavigate={navigateTo} />;
    }
    if (routePath.startsWith('/pos/invoice')) {
      return <Invoice onNavigate={navigateTo} />;
    }
    if (routePath.startsWith('/pos/validator')) {
      return <Validator onNavigate={navigateTo} />;
    }
    return <PosHome onNavigate={navigateTo} />;
  };

  const isPosRoute = routePath === '/' || routePath.startsWith('/pos');

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-4xl">POS</div>
            <div>
              <h1 className="text-2xl font-bold">POS</h1>
              <p className="text-xs text-gray-400">Sistema de ventas</p>
            </div>
          </div>
          {!isPosRoute && (
            <button
              onClick={() => navigateTo('/')}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            >
              Volver a POS
            </button>
          )}
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700 shadow">
        <div className="container mx-auto p-2 flex gap-2">
          <button
            onClick={() => navigateTo('/')}
            className={`px-4 py-2 rounded transition-colors ${
              activePanel === 'pos'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            POS
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto p-6 pb-16">
        {activePanel === 'pos' && renderPosRoute()}
        {activePanel === 'jarvis' && <JarvisAssistant />}
      </main>

      {isPosRoute && (
        <button
          onClick={() => setAssistantOpen(true)}
          className="fixed bottom-6 right-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-full text-sm shadow-lg"
        >
          Asistente
        </button>
      )}

      {assistantOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50">
          <div className="w-full md:max-w-xl mx-4 mb-6 md:mb-0">
            <PosAssistant onClose={() => setAssistantOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
