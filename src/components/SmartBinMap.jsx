import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { binOverallStatus, STATUS_COLOR } from '../utils/priority'

// Leaflet's default marker assets don't resolve correctly under Vite bundling,
// so we build lightweight colored divIcons instead of relying on the PNG assets.
function makeIcon(color, pulsing = false) {
  return L.divIcon({
    className: '',
    html: `<span style="
        display:block;width:16px;height:16px;border-radius:50%;
        background:${color};border:2px solid white;
        box-shadow:0 0 0 2px ${color}55${pulsing ? ', 0 0 0 6px ' + color + '33' : ''};
      "></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  })
}

function ClickCapture({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick?.(e.latlng.lat, e.latlng.lng)
    }
  })
  return null
}

export default function SmartBinMap({
  bins = {},
  center = [11.86, 79.76],
  zoom = 13,
  height = 320,
  onMapClick,
  selectedPosition,
  onMarkerClick,
  vehicles = {},
  vendors = {}
}) {
  return (
    <div style={{ height }} className="rounded-lg overflow-hidden border border-slate-200">
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {onMapClick && <ClickCapture onMapClick={onMapClick} />}

        {Object.values(bins).map((bin) => (
          <Marker
            key={bin.binId}
            position={[bin.latitude, bin.longitude]}
            icon={makeIcon(STATUS_COLOR[binOverallStatus(bin.compartments)])}
            eventHandlers={{ click: () => onMarkerClick?.(bin) }}
          >
            <Popup>
              <div className="text-xs space-y-1">
                <p className="font-bold">{bin.binName}</p>
                <p className="text-slate-500">{bin.region}</p>
                <p>Status: <strong>{binOverallStatus(bin.compartments)}</strong></p>
              </div>
            </Popup>
          </Marker>
        ))}

        {Object.values(vehicles).filter((vehicle) => vehicle.latitude && vehicle.longitude).map((vehicle) => (
          <Marker
            key={`vehicle-${vehicle.vehicleId}`}
            position={[vehicle.latitude, vehicle.longitude]}
            icon={makeIcon('#233457', true)}
          >
            <Popup>
              <div className="text-xs space-y-1">
                <p className="font-bold">{vehicle.vehicleName || vehicle.vehicleId}</p>
                <p>Status: <strong>{vehicle.status}</strong></p>
                <p>Load: <strong>{Number(vehicle.currentLoad || 0).toFixed(1)} / {vehicle.capacity || '—'} kg</strong></p>
              </div>
            </Popup>
          </Marker>
        ))}

        {Object.values(vendors).filter((vendor) => vendor.latitude && vendor.longitude).map((vendor) => (
          <Marker key={`vendor-${vendor.vendorId}`} position={[vendor.latitude, vendor.longitude]} icon={makeIcon('#D98E28')}>
            <Popup>
              <div className="text-xs space-y-1">
                <p className="font-bold">{vendor.businessName}</p>
                <p className="text-slate-500">{vendor.location || 'Industry location'}</p>
                <p>Processes: <strong>{(vendor.wasteTypes || []).join(', ')}</strong></p>
              </div>
            </Popup>
          </Marker>
        ))}

        {selectedPosition && <Marker position={selectedPosition} icon={makeIcon('#233457', true)} />}
      </MapContainer>
    </div>
  )
}
