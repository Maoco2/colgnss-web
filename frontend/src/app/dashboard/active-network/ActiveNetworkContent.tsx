'use client';
import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, Typography, Box, TextField, MenuItem, CircularProgress, Chip, IconButton, Tooltip } from '@mui/material';
import { Search as SearchIcon, MyLocation, ZoomIn, ZoomOut, Layers } from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '@/lib/api';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const activeIcon = L.icon({
  iconUrl: '/marker-active.svg',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const defaultCenter: [number, number] = [4.711, -74.072];

function MapManager({ allStations, department, municipality, mapRef, setSelectedStation }: {
  allStations: any[];
  department: string;
  municipality: string;
  mapRef: React.MutableRefObject<L.Map | null>;
  setSelectedStation: (s: any) => void;
}) {
  const map = useMap();

  useEffect(() => { mapRef.current = map; }, [map]);

  useEffect(() => {
    let target = allStations;
    if (municipality) target = target.filter(s => s.municipality === municipality);
    else if (department) target = target.filter(s => s.department === department);
    else { map.setView(defaultCenter, 6); return; }
    if (target.length === 0) return;
    const bounds = L.latLngBounds(target.map(s => [s.latitude, s.longitude]));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: municipality ? 14 : 10 });
  }, [department, municipality, allStations, map]);

  useEffect(() => {
    const handler = () => setSelectedStation(null);
    map.on('click', handler);
    return () => { map.off('click', handler); };
  }, [map]);

  return null;
}

export default function ActiveNetworkContent() {
  const [stations, setStations] = useState<any[]>([]);
  const [filteredStations, setFilteredStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [departments, setDepartments] = useState<string[]>([]);
  const [municipality, setMunicipality] = useState('');
  const [municipalities, setMunicipalities] = useState<string[]>([]);
  const [showRadius, setShowRadius] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stationsRes, deptsRes] = await Promise.all([
          api.getStations({ type: 'active', limit: 1000 }),
          api.getDepartments(),
        ]);
        if (stationsRes.success) {
          const raw = (stationsRes.data || []).filter((s: any) => s.latitude != null && s.longitude != null);
          setStations(raw);
          setFilteredStations(raw);
          const depts = Array.from(new Set(raw.map((s: any) => s.department).filter(Boolean))) as string[];
          setDepartments(depts.sort());
          const munics = Array.from(new Set(raw.map((s: any) => s.municipality).filter(Boolean))) as string[];
          setMunicipalities(munics.sort());
        }
        if (deptsRes.success) setDepartments(deptsRes.data || []);
      } catch (err) {
        console.error('Failed to load stations', err);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...stations];
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(st =>
        st.name?.toLowerCase().includes(s) ||
        st.code?.toLowerCase().includes(s) ||
        st.municipality?.toLowerCase().includes(s)
      );
    }
    if (department) filtered = filtered.filter(st => st.department === department);
    if (municipality) filtered = filtered.filter(st => st.municipality === municipality);
    setFilteredStations(filtered);
  }, [search, department, municipality, stations]);

  useEffect(() => {
    const munics = Array.from(new Set(stations.filter(s => !department || s.department === department).map(s => s.municipality).filter(Boolean))) as string[];
    setMunicipalities(munics.sort());
    if (municipality && !munics.includes(municipality)) setMunicipality('');
  }, [department, stations]);

  const locateUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(({ coords }) => {
        mapRef.current?.flyTo([coords.latitude, coords.longitude], 12);
      });
    }
  };

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
      <Box sx={{ flex: 1, position: 'relative', minHeight: { xs: '50vh', md: 'auto' } }}>
        <MapContainer center={defaultCenter} zoom={6} style={{ width: '100%', height: '100%', borderRadius: 12 }} zoomControl={false}>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapManager allStations={stations} department={department} municipality={municipality} mapRef={mapRef} setSelectedStation={setSelectedStation} />
          {filteredStations.map(station => (
            <Marker key={station.id} position={[station.latitude, station.longitude]} icon={activeIcon}
              eventHandlers={{ click: () => setSelectedStation(station) }} />
          ))}
          {selectedStation && (
            <Popup position={[selectedStation.latitude, selectedStation.longitude]} eventHandlers={{ remove: () => setSelectedStation(null) }}>
              <Box sx={{ maxWidth: 250, p: 0.5 }}>
                <Typography variant="subtitle2" fontWeight={700}>{selectedStation.code}</Typography>
                <Typography variant="caption" display="block">{selectedStation.name}</Typography>
                <Typography variant="caption" display="block">{selectedStation.department} - {selectedStation.municipality}</Typography>
                <Typography variant="caption" display="block">Receptor: {selectedStation.receiverType || 'N/A'}</Typography>
                <Typography variant="caption" display="block">Antena: {selectedStation.antennaType || 'N/A'}</Typography>
                <Typography variant="caption" display="block">Altura: {selectedStation.height ? `${selectedStation.height} m` : 'N/A'}</Typography>
                {selectedStation.status && <Chip label={selectedStation.status} size="small" color={selectedStation.status === 'active' ? 'success' : 'warning'} sx={{ mt: 0.5 }} />}
              </Box>
            </Popup>
          )}
          {showRadius && selectedStation?.influenceRadius && (
            <Circle center={[selectedStation.latitude, selectedStation.longitude]}
              radius={selectedStation.influenceRadius * 1000}
              pathOptions={{ fillColor: '#1a5276', fillOpacity: 0.1, color: '#1a5276', opacity: 0.3, weight: 1 }} />
          )}
        </MapContainer>

        <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Tooltip title="Acercar"><IconButton size="small" sx={{ bgcolor: 'background.paper', boxShadow: 2 }} onClick={() => mapRef.current?.zoomIn()}><ZoomIn /></IconButton></Tooltip>
          <Tooltip title="Alejar"><IconButton size="small" sx={{ bgcolor: 'background.paper', boxShadow: 2 }} onClick={() => mapRef.current?.zoomOut()}><ZoomOut /></IconButton></Tooltip>
          <Tooltip title="Mi ubicación"><IconButton size="small" sx={{ bgcolor: 'background.paper', boxShadow: 2 }} onClick={locateUser}><MyLocation /></IconButton></Tooltip>
          <Tooltip title="Radio de influencia"><IconButton size="small" sx={{ bgcolor: 'background.paper', boxShadow: 2 }} onClick={() => setShowRadius(!showRadius)}><Layers /></IconButton></Tooltip>
        </Box>

        {loading && <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.3)' }}><CircularProgress color="primary" /></Box>}
      </Box>

      <Box sx={{ width: { xs: '100%', md: 380 }, overflow: 'auto', p: 2, borderLeft: 1, borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>Red Activa GNSS</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{filteredStations.length} estaciones encontradas</Typography>

        <TextField fullWidth size="small" placeholder="Buscar estación..." value={search} onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }} sx={{ mb: 2 }} />

        <TextField fullWidth size="small" select label="Departamento" value={department} onChange={e => setDepartment(e.target.value)} sx={{ mb: 2 }}>
          <MenuItem value="">Todos</MenuItem>
          {departments.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
        </TextField>

        <TextField fullWidth size="small" select label="Municipio" value={municipality} onChange={e => setMunicipality(e.target.value)} sx={{ mb: 2 }}>
          <MenuItem value="">Todos</MenuItem>
          {municipalities.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
        </TextField>

        {filteredStations.map(station => (
          <Card key={station.id} sx={{ mb: 1.5, cursor: 'pointer',
            border: selectedStation?.id === station.id ? '2px solid' : '1px solid',
            borderColor: selectedStation?.id === station.id ? 'primary.main' : 'divider',
            transition: 'all 0.2s', '&:hover': { borderColor: 'primary.main' }
          }} onClick={() => { setSelectedStation(station); mapRef.current?.flyTo([station.latitude, station.longitude], 14); }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box display="flex" justifyContent="space-between" alignItems="start">
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>{station.code}</Typography>
                  <Typography variant="caption" color="text.secondary" display="block">{station.name}</Typography>
                </Box>
                <Chip label={station.status || 'active'} size="small" color={station.status === 'active' ? 'success' : 'warning'} />
              </Box>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                {station.department} - {station.municipality}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {station.latitude?.toFixed(6)}, {station.longitude?.toFixed(6)}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
