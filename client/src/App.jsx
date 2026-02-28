// Componente principal de la aplicación
// Integra mapa, chat, perfiles y autenticación
// Orquesta la navegación entre todas las vistas
import { useState, useCallback, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import MapView from './components/Map/MapView';
import ChatDrawer from './components/Chat/ChatDrawer';
import ChatList from './components/Chat/ChatList';
import ProfileCard from './components/Profile/ProfileCard';
import ProfileSetup from './components/Profile/ProfileSetup';
import ProfileEdit from './components/Profile/ProfileEdit';
import AuthModal from './components/Auth/AuthModal';
import AccountSettings from './components/Auth/AccountSettings';
import useChat from './hooks/useChat';

// Componente interno que usa los contextos
const AppContent = () => {
  const { user, isAnonymous, loading } = useAuth();

  // Estado de vistas/modales
  const [selectedUser, setSelectedUser] = useState(null);  // Usuario cuyo perfil se ve
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showChatList, setShowChatList] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [conversationCount, setConversationCount] = useState(0);

  // Chat hook
  const {
    activeConversation,
    messages,
    conversations,
    setConversations,
    unreadTotal,
    setUnreadTotal,
    typingUsers,
    loadingMessages,
    initiateChat,
    sendMessage,
    sendTyping,
    loadMoreMessages,
    openConversation,
    closeChat
  } = useChat();

  // Target user para el chat drawer
  const [chatTarget, setChatTarget] = useState(null);

  // Click en un pin del mapa → mostrar perfil o abrir chat
  const handlePinClick = useCallback((nearbyUser) => {
    setSelectedUser(nearbyUser);
  }, []);

  // Abrir chat desde ProfileCard
  const handleOpenChat = useCallback((targetUser) => {
    setSelectedUser(null);
    setChatTarget(targetUser);
    initiateChat(targetUser.id);
  }, [initiateChat]);

  // Seleccionar conversación desde ChatList
  const handleSelectConversation = useCallback((conv) => {
    setShowChatList(false);
    setChatTarget({
      id: conv.otherUser?.id,
      displayName: conv.otherUser?.displayName,
      isOnline: conv.otherUser?.isOnline
    });
    openConversation(conv.id);
  }, [openConversation]);

  // Cerrar chat
  const handleCloseChat = useCallback(() => {
    closeChat();
    setChatTarget(null);
  }, [closeChat]);

  // Prompt de perfil después de 3 conversaciones
  useEffect(() => {
    if (conversations.length >= 3 && !user?.isProfileComplete && !showProfileSetup) {
      // Solo mostrar una vez por sesión
      const shown = sessionStorage.getItem('profile_prompt_shown');
      if (!shown) {
        sessionStorage.setItem('profile_prompt_shown', 'true');
        setShowProfileSetup(true);
      }
    }
  }, [conversations.length, user?.isProfileComplete, showProfileSetup]);

  // Pantalla de carga
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-dark-400">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 mt-4 text-sm">Conectando...</p>
        </div>
      </div>
    );
  }

  // Calcular mapa de no leídos por usuario (para badges en los pins)
  const chatUnreadMap = {};
  conversations.forEach(conv => {
    if (conv.unreadCount > 0 && conv.otherUser?.id) {
      chatUnreadMap[conv.otherUser.id] = conv.unreadCount;
    }
  });

  return (
    <div className="h-full w-full relative">
      {/* Mapa principal — siempre visible */}
      <MapView onPinClick={handlePinClick} chatUnreadMap={chatUnreadMap} />

      {/* Botones de navegación (esquina inferior) */}
      <div className="absolute bottom-6 left-4 flex gap-3 z-20">
        {/* Botón: Lista de chats */}
        <button
          onClick={() => setShowChatList(true)}
          className="relative w-12 h-12 bg-dark-200/90 backdrop-blur-sm rounded-full flex items-center justify-center
                     border border-dark-100 shadow-lg hover:bg-dark-100 transition-colors"
          title="Mensajes"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          {/* Badge de no leídos */}
          {unreadTotal > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {unreadTotal > 99 ? '99+' : unreadTotal}
            </span>
          )}
        </button>
      </div>

      {/* Botón: Menú (esquina inferior derecha) */}
      <div className="absolute bottom-6 right-4 z-20">
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-12 h-12 bg-dark-200/90 backdrop-blur-sm rounded-full flex items-center justify-center
                       border border-dark-100 shadow-lg hover:bg-dark-100 transition-colors"
            title="Menú"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
            </svg>
          </button>

          {/* Menú desplegable */}
          {showMenu && (
            <div className="absolute bottom-14 right-0 bg-dark-200 border border-dark-100 rounded-xl shadow-xl overflow-hidden min-w-[180px] animate-fade-in">
              <button
                onClick={() => { setShowMenu(false); setShowProfileEdit(true); }}
                className="w-full px-4 py-3 text-left text-sm hover:bg-dark-100 transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Editar perfil
              </button>

              {!user?.isProfileComplete && (
                <button
                  onClick={() => { setShowMenu(false); setShowProfileSetup(true); }}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-dark-100 transition-colors flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Completar perfil
                </button>
              )}

              <button
                onClick={() => { setShowMenu(false); setShowAccountSettings(true); }}
                className="w-full px-4 py-3 text-left text-sm hover:bg-dark-100 transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
                Cuenta
              </button>

              {isAnonymous && (
                <button
                  onClick={() => { setShowMenu(false); setShowAuthModal(true); }}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-dark-100 transition-colors flex items-center gap-2 text-primary-400"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
                  </svg>
                  Iniciar sesión
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cerrar menú al tocar fuera */}
      {showMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
      )}

      {/* Modales y Drawers */}
      <ProfileCard
        user={selectedUser}
        onMessage={handleOpenChat}
        onClose={() => setSelectedUser(null)}
        distance={selectedUser?.distance}
      />

      <ChatDrawer
        isOpen={!!activeConversation}
        onClose={handleCloseChat}
        targetUser={chatTarget}
        messages={messages}
        onSendMessage={sendMessage}
        onTyping={sendTyping}
        isTyping={!!typingUsers[activeConversation]}
        onLoadMore={loadMoreMessages}
        loadingMore={loadingMessages}
        currentUserId={user?.id}
      />

      <ChatList
        isOpen={showChatList}
        onClose={() => setShowChatList(false)}
        onSelectConversation={handleSelectConversation}
        conversations={conversations}
        setConversations={setConversations}
        unreadTotal={unreadTotal}
      />

      <ProfileSetup
        isOpen={showProfileSetup}
        onClose={() => setShowProfileSetup(false)}
        onComplete={() => setShowProfileSetup(false)}
      />

      <ProfileEdit
        isOpen={showProfileEdit}
        onClose={() => setShowProfileEdit(false)}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      <AccountSettings
        isOpen={showAccountSettings}
        onClose={() => setShowAccountSettings(false)}
        onOpenAuth={() => setShowAuthModal(true)}
      />
    </div>
  );
};

// App con Providers
const App = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
