import { useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './Map.css';
import useSocket from './useSocket';
import UserMarker from './UserMarker';
import ChatPanel from './ChatPanel';

export default function Map() {
  const [chatPanels, setChatPanels] = useState({}); // key: room, value: {messages: [], open: true, minimized: false, position: {x, y}}
  const [chatInput, setChatInput] = useState({});
  const [typingUsers, setTypingUsers] = useState({});

  const { users, selfId, startChat, socket } = useSocket(setChatPanels, setChatInput, setTypingUsers);

  // Clear chat messages
  const clearChat = (room) => {
    console.log('Clearing chat for room:', room);
    setChatPanels((prev) => ({
      ...prev,
      [room]: { ...prev[room], messages: [] }
    }));
  };

  // Send message
  const sendMessage = (room) => {
    if (socket && chatInput[room]?.trim()) {
      console.log('Sending message to room:', room, 'Message:', chatInput[room]);
      socket.emit('sendMessage', { room, message: chatInput[room] });
      setChatInput((prev) => ({ ...prev, [room]: '' }));
    }
  };

  // Minimize/maximize chat
  const toggleMinimize = (room) => {
    console.log('Toggling minimize for room:', room);
    setChatPanels((prev) => {
      const newPanels = {
        ...prev,
        [room]: { ...prev[room], minimized: !prev[room].minimized }
      };
      console.log('Updated chatPanels after minimize:', newPanels);
      return newPanels;
    });
  };

  // Close chat
  const closeChat = (room) => {
    console.log('Closing chat panel for room:', room);
    setChatPanels((prev) => {
      const newPanels = { ...prev };
      delete newPanels[room];
      console.log('Updated chatPanels after close:', newPanels);
      return newPanels;
    });
  };

  return (
    <div className="w-full h-full">
      <MapContainer center={[18.628, 73.806]} zoom={15} style={{ height: '100vh', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {users.map((user) => (
          <UserMarker
            key={user.id}
            user={user}
            selfId={selfId}
            startChat={startChat}
          />
        ))}
      </MapContainer>

      {/* Render chat panels */}
      {Object.entries(chatPanels).map(([room, panel], index) => (
        panel.open && (
          <ChatPanel
            key={room}
            room={room}
            panel={panel}
            index={index}
            users={users}
            selfId={selfId}
            chatInput={chatInput[room] || ''}
            setChatInput={setChatInput}
            typingUser={typingUsers[room]}
            clearChat={clearChat}
            toggleMinimize={toggleMinimize}
            closeChat={closeChat}
            sendMessage={sendMessage}
            chatPanels={chatPanels}
            setChatPanels={setChatPanels}
            socket={socket}
          />
        )
      ))}
    </div>
  );
}