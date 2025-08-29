import { useEffect } from 'react';
import useDrag from './useDrag';

export default function ChatPanel({
  room,
  panel,
  index,
  users,
  selfId,
  chatInput,
  setChatInput,
  typingUser,
  clearChat,
  toggleMinimize,
  closeChat,
  sendMessage,
  chatPanels,
  setChatPanels,
  socket
}) {
  const { handleDragStart, handleDragMove, handleDragEnd } = useDrag(chatPanels, setChatPanels, room, panel.minimized);

  // Auto-scroll chat messages
  useEffect(() => {
    const chatContainer = document.getElementById(`chat-${room}`);
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [panel.messages]);

  // Log chat panel visibility
  useEffect(() => {
    const panelElement = document.getElementById(`chat-panel-${room}`);
    if (panelElement) {
      const styles = window.getComputedStyle(panelElement);
      console.log(`Chat panel ${room} styles:`, {
        display: styles.display,
        visibility: styles.visibility,
        position: styles.position,
        left: styles.left,
        top: styles.top,
        zIndex: styles.zIndex
      });
    }
  }, [panel, room]);

  return (
    <div
      id={`chat-panel-${room}`}
      className={`fixed w-80 bg-white border border-gray-200 rounded-lg shadow-lg flex flex-col select-none ${
        panel.minimized ? 'minimized h-[50px]' : 'h-[400px]'
      }`}
      style={{
        left: `${panel.position?.x || 20}px`,
        top: `${panel.position?.y || 20 + index * 50}px`,
        zIndex: 10000 + index
      }}
      onMouseMove={(e) => handleDragMove(e)}
      onMouseUp={() => handleDragEnd()}
      onMouseLeave={() => handleDragEnd()}
    >
      <div
        className="bg-blue-500 text-white p-3 rounded-t-lg font-semibold flex justify-between items-center cursor-move"
        onMouseDown={(e) => handleDragStart(e)}
      >
        <span>Chat with {users.find((u) => u.id === room.split('_').find((id) => id !== selfId))?.username || 'User'}</span>
        <div className="flex space-x-2">
          <button
            className="text-white hover:text-gray-200"
            onClick={() => clearChat(room)}
            title="Clear Chat"
          >
            🗑️
          </button>
          <button
            className="text-white hover:text-gray-200"
            onClick={() => toggleMinimize(room)}
            title={panel.minimized ? 'Maximize' : 'Minimize'}
          >
            {panel.minimized ? '+' : '−'}
          </button>
          <button
            className="text-white hover:text-gray-200"
            onClick={() => closeChat(room)}
            title="Close"
          >
            ×
          </button>
        </div>
      </div>
      {!panel.minimized && (
        <>
          <div className="flex-1 h-[300px] overflow-y-auto p-3 bg-gray-50" id={`chat-${room}`}>
            {panel.messages.map((m, i) => (
              <div
                key={i}
                className={`mb-2 p-2 rounded ${m.from === selfId ? 'bg-blue-100 ml-auto text-right' : 'bg-gray-200 mr-auto'}`}
                style={{ maxWidth: '80%' }}
              >
                <strong>{users.find((u) => u.id === m.from)?.username || 'Unknown'}:</strong> {m.text}
                <div className="text-xs text-gray-500 mt-1">{new Date(m.timestamp).toLocaleTimeString()}</div>
              </div>
            ))}
            {typingUser && typingUser !== selfId && (
              <div className="text-sm italic text-gray-600 p-2">
                {users.find((u) => u.id === typingUser)?.username || 'User'} is typing...
              </div>
            )}
          </div>
          <div className="p-3 border-t border-gray-200 flex">
            <input
              className="flex-1 p-2 border border-gray-300 rounded-l focus:outline-none focus:border-blue-500"
              value={chatInput}
              onChange={(e) => {
                setChatInput((prev) => ({ ...prev, [room]: e.target.value }));
                socket.emit('typing', { room });
              }}
              placeholder="Type a message..."
              onKeyPress={(e) => e.key === 'Enter' && sendMessage(room)}
            />
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded-r hover:bg-blue-600"
              onClick={() => sendMessage(room)}
            >
              Send
            </button>
          </div>
        </>
      )}
    </div>
  );
}