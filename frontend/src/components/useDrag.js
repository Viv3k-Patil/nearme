import { useRef } from 'react';

export default function useDrag(chatPanels, setChatPanels, room, minimized) {
  const dragState = useRef({});

  const handleDragStart = (e) => {
    e.preventDefault();
    console.log('Drag start for room:', room);
    dragState.current = {
      isDragging: true,
      initialX: e.clientX - (chatPanels[room]?.position?.x || 0),
      initialY: e.clientY - (chatPanels[room]?.position?.y || 0)
    };
  };

  const handleDragMove = (e) => {
    if (dragState.current.isDragging) {
      const newX = e.clientX - dragState.current.initialX;
      const newY = e.clientY - dragState.current.initialY;
      const maxX = window.innerWidth - 320; // Panel width
      const maxY = window.innerHeight - (minimized ? 50 : 400); // Adjust for minimized height
      setChatPanels((prev) => ({
        ...prev,
        [room]: {
          ...prev[room],
          position: {
            x: Math.max(0, Math.min(newX, maxX)),
            y: Math.max(0, Math.min(newY, maxY))
          }
        }
      }));
    }
  };

  const handleDragEnd = () => {
    console.log('Drag end for room:', room);
    dragState.current = { isDragging: false };
  };

  return { handleDragStart, handleDragMove, handleDragEnd };
}