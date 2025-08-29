import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const offsetMarkers = (users) => {
  console.log('Offsetting markers for users:', users);
  const grouped = {};
  users.forEach((user) => {
    const key = `${user.lat.toFixed(5)},${user.lng.toFixed(5)}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(user);
  });

  const adjusted = [];
  Object.values(grouped).forEach((group) => {
    if (group.length === 1) adjusted.push(group[0]);
    else {
      const step = (2 * Math.PI) / group.length;
      group.forEach((user, i) => adjusted.push({
        ...user,
        lat: user.lat + 0.0001 * Math.cos(i * step),
        lng: user.lng + 0.0001 * Math.sin(i * step)
      }));
    }
  });
  return adjusted;
};

export default function useSocket(setChatPanels, setChatInput, setTypingUsers) {
  const [users, setUsers] = useState([]);
  const [selfId, setSelfId] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    console.log('Initializing socket connection');
    const s = io('http://localhost:3000');
    socketRef.current = s;

    s.on('connect', () => {
      console.log('Socket connected, ID:', s.id);
      setSelfId(s.id);
    });

    s.on('nearbyUsers', (data) => {
      console.log('Received nearbyUsers:', data);
      setUsers(offsetMarkers(data));
    });

    s.on('chatRequest', ({ room, from }) => {
      console.log('Received chatRequest:', { room, from });
      setChatPanels((prev) => ({
        ...prev,
        [room]: prev[room] ? { ...prev[room], open: true, minimized: false } : { messages: [], open: true, minimized: false, position: { x: 20, y: 20 } }
      }));
      setChatInput((prev) => ({ ...prev, [room]: '' }));
      s.emit('joinRoom', { room });
      console.log('Joined room:', room);
    });

    s.on('receiveMessage', ({ from, text, timestamp, room }) => {
      console.log('Received message:', { from, text, timestamp, room });
      setChatPanels((prev) => {
        const roomState = prev[room] || { messages: [], open: true, minimized: false, position: { x: 20, y: 20 } };
        return {
          ...prev,
          [room]: {
            ...roomState,
            messages: [...roomState.messages, { from, text, timestamp }],
            open: true
          }
        };
      });
    });

    s.on('userTyping', ({ from, room }) => {
      console.log('User typing:', { from, room });
      setTypingUsers((prev) => ({ ...prev, [room]: from }));
      setTimeout(() => {
        setTypingUsers((prev) => ({ ...prev, [room]: null }));
      }, 2000);
    });

    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (pos) => {
          console.log('Sending location:', { lat: pos.coords.latitude, lng: pos.coords.longitude });
          s.emit('updateLocation', {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Unable to access location. Please enable geolocation to use the app.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }

    return () => {
      console.log('Disconnecting socket');
      s.disconnect();
    };
  }, [setChatPanels, setChatInput, setTypingUsers]);

  const startChat = (toUserId) => {
    console.log('startChat called with toUserId:', toUserId, 'selfId:', selfId);
    if (!socketRef.current) {
      console.error('Socket not initialized');
      return;
    }
    if (toUserId === selfId) {
      console.log('Cannot start chat with self');
      return;
    }
    setChatPanels((prev) => {
      const openPanels = Object.values(prev).filter((p) => p.open).length;
      if (openPanels >= 3) {
        console.log('Maximum chat panels reached');
        alert('Maximum 3 chat panels allowed. Close an existing panel to start a new chat.');
        return prev;
      }
      const room = [selfId, toUserId].sort().join('_');
      console.log('Creating chat room:', room);
      socketRef.current.emit('startChat', { toUserId });
      const newPanels = {
        ...prev,
        [room]: prev[room] ? { ...prev[room], open: true, minimized: false } : { messages: [], open: true, minimized: false, position: { x: 20, y: 20 } }
      };
      console.log('Updated chatPanels:', newPanels);
      return newPanels;
    });
  };

  return { users, selfId, startChat, socket: socketRef.current };
}