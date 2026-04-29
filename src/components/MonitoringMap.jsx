import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix icon Leaflet yang hilang saat pakai bundler seperti Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const onlineIcon = new L.Icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  className: 'marker-online',
})

export default function MonitoringMap({ laptops }) {
  const withLocation = laptops.filter((l) => l.latitude && l.longitude)

  if (withLocation.length === 0) {
    return <p style={{ color: 'gray' }}>Belum ada laptop dengan data lokasi.</p>
  }

  const center = [withLocation[0].latitude, withLocation[0].longitude]

  return (
    <MapContainer
      center={center}
      zoom={10}
      style={{ height: '400px', width: '100%', borderRadius: '4px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {withLocation.map((laptop) => (
        <Marker key={laptop.id} position={[laptop.latitude, laptop.longitude]}>
          <Popup>
            <strong>{laptop.hostname}</strong><br />
            {laptop.brand}<br />
            IP: {laptop.ip_address}<br />
            {laptop.city}, {laptop.country}<br />
            Status: {laptop.is_online ? '● Online' : '○ Offline'}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
