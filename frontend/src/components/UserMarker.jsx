import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';

// Colored markers
const createIcon = (color) => L.divIcon({
  className: 'custom-icon',
  html: `<div style="
      background-color: ${color};
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 0 3px rgba(0,0,0,0.5);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const GREEN_ICON = createIcon('#4CAF50'); // Self
const BLUE_ICON = createIcon('#2196F3');  // Others

export default function UserMarker({ user, selfId, startChat }) {
  return (
    <Marker
      position={[user.lat, user.lng]}
      icon={user.id === selfId ? GREEN_ICON : BLUE_ICON}
      eventHandlers={{
        click: () => {
          console.log('Marker clicked for user:', user.id);
          startChat(user.id);
        }
      }}
    >
      <Tooltip>{user.username || 'Anonymous'}</Tooltip>
    </Marker>
  );
}