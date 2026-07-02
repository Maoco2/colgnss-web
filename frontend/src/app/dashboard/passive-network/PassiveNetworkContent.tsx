'use client';
import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, Typography, Box, TextField, MenuItem, CircularProgress, Chip } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css';
import api from '@/lib/api';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const passiveIcon = L.icon({
  iconUrl: '/marker-passive.svg',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const defaultCenter: [number, number] = [4.711, -74.072];

function MapBounds({ allStations, department, municipality }: {
  allStations: any[];
  department: string;
  municipality: string;
}) {
  const map = useMap();

  useEffect(() => {
    let target = allStations;
    if (municipality) target = target.filter(s => s.municipality === municipality);
    else if (department) target = target.filter(s => s.department === department);
    else { map.setView(defaultCenter, 6); return; }
    if (target.length === 0) return;
    const bounds = L.latLngBounds(target.map(s => [s.latitude, s.longitude]));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: municipality ? 14 : 10 });
  }, [department, municipality, allStations, map]);

  return null;
}

export default function PassiveNetworkContent() {
  const [stations, setStations] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [departments, setDepartments] = useState<string[]>([]);
  const [municipality, setMunicipality] = useState('');
  const [municipalities, setMunicipalities] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      api.getStations({ type: 'passive', limit: 20000 }),
      api.getDepartments(),
    ]).then(([sRes, dRes]) => {
      if (sRes.success) {
        const raw = (sRes.data || []).filter((s: any) => s.latitude != null && s.longitude != null);
        setStations(raw);
        setFiltered(raw);
        const depts = Array.from(new Set(raw.map((s: any) => s.department).filter(Boolean))) as string[];
        setDepartments(depts.sort());
        const munics = Array.from(new Set(raw.map((s: any) => s.municipality).filter(Boolean))) as string[];
        setMunicipalities(munics.sort());
      }
      if (dRes.success) setDepartments(dRes.data || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let f = [...stations];
    if (search) {
      const s = search.toLowerCase();
      f = f.filter(st => st.name?.toLowerCase().includes(s) || st.code?.toLowerCase().includes(s) || st.municipality?.toLowerCase().includes(s));
    }
    if (department) f = f.filter(st => st.department === department);
    if (municipality) f = f.filter(st => st.municipality === municipality);
    setFiltered(f);
  }, [search, department, municipality, stations]);

  useEffect(() => {
    const munics = Array.from(new Set(stations.filter(s => !department || s.department === department).map(s => s.municipality).filter(Boolean))) as string[];
    setMunicipalities(munics.sort());
    if (municipality && !munics.includes(municipality)) setMunicipality('');
  }, [department, stations]);

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
      <Box sx={{ flex: 1, minHeight: { xs: '50vh', md: 'auto' }, position: 'relative' }}>
        <MapContainer center={defaultCenter} zoom={6} style={{ width: '100%', height: '100%', borderRadius: 12 }}>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapBounds allStations={stations} department={department} municipality={municipality} />
          <MarkerClusterGroup chunkedLoading>
            {filtered.map(st => (
              <Marker key={st.id} position={[st.latitude, st.longitude]} icon={passiveIcon}
                eventHandlers={{ click: () => setSelected(st) }} />
            ))}
          </MarkerClusterGroup>
          {selected && (
            <Popup position={[selected.latitude, selected.longitude]} eventHandlers={{ remove: () => setSelected(null) }}>
              <Box sx={{ maxWidth: 250, p: 0.5 }}>
                <Typography variant="subtitle2" fontWeight={700}>{selected.code}</Typography>
                <Typography variant="caption" display="block">{selected.name}</Typography>
                <Typography variant="caption" display="block">{selected.department} - {selected.municipality}</Typography>
                <Typography variant="caption" display="block">Monumentación: {selected.monumentationType || 'N/A'}</Typography>
                <Typography variant="caption" display="block">Material: {selected.materialType || 'N/A'}</Typography>
                <Typography variant="caption" display="block">Altura: {selected.height ? `${selected.height} m` : 'N/A'}</Typography>
                {selected.observations && <Typography variant="caption" display="block" sx={{ mt: 0.5, fontStyle: 'italic' }}>{selected.observations}</Typography>}
                <Chip label={selected.status || 'active'} size="small" color="primary" sx={{ mt: 0.5 }} />
              </Box>
            </Popup>
          )}
        </MapContainer>
        {loading && <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.3)' }}><CircularProgress /></Box>}
      </Box>

      <Box sx={{ width: { xs: '100%', md: 380 }, overflow: 'auto', p: 2 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>Red Pasiva GNSS</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{filtered.length} vértices</Typography>
        <TextField fullWidth size="small" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }} sx={{ mb: 2 }} />
        <TextField fullWidth size="small" select label="Departamento" value={department} onChange={e => setDepartment(e.target.value)} sx={{ mb: 2 }}>
          <MenuItem value="">Todos</MenuItem>
          {departments.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
        </TextField>
        <TextField fullWidth size="small" select label="Municipio" value={municipality} onChange={e => setMunicipality(e.target.value)} sx={{ mb: 2 }}>
          <MenuItem value="">Todos</MenuItem>
          {municipalities.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
        </TextField>
        {filtered.map(st => (
          <Card key={st.id} sx={{ mb: 1.5, cursor: 'pointer', border: selected?.id === st.id ? '2px solid' : '1px solid', borderColor: selected?.id === st.id ? 'secondary.main' : 'divider' }}
            onClick={() => { setSelected(st); }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="subtitle2" fontWeight={600}>{st.code}</Typography>
              <Typography variant="caption" color="text.secondary" display="block">{st.name}</Typography>
              <Typography variant="caption" color="text.secondary" display="block">{st.department} - {st.municipality}</Typography>
              <Typography variant="caption" color="text.secondary" display="block">{st.latitude?.toFixed(6)}, {st.longitude?.toFixed(6)}</Typography>
              {st.monumentationType && <Chip label={st.monumentationType} size="small" variant="outlined" sx={{ mt: 0.5 }} />}
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
