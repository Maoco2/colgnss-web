'use client';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Box, Container, Grid, Card, CardContent, Typography, Button, TextField, MenuItem, CircularProgress, Alert, Stepper, Step, StepLabel, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Divider, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { MyLocation, Map as MapIcon, Calculate, Download, CompareArrows, Info } from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '@/lib/api';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const selectedIcon = L.divIcon({
  className: '',
  html: '<div style="width:20px;height:20px;background:#e74c3c;border:3px solid #fff;border-radius:50%;box-shadow:0 0 8px rgba(0,0,0,0.4);"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const stationIcon = (label: string, color: string) => L.divIcon({
  className: '',
  html: `<div style="width:28px;height:28px;background:${color};color:#fff;border:2px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;box-shadow:0 0 8px rgba(0,0,0,0.4);">${label}</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const defaultCenter: [number, number] = [4.711, -74.072];

function ClickHandler({ activeStep, onPointSelected }: { activeStep: number; onPointSelected: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (activeStep === 1) {
        onPointSelected(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

const steps = ['Seleccionar Red', 'Seleccionar Punto', 'Ver Resultados'];

export default function CalculateContent() {
  const searchParams = useSearchParams();
  const [activeStep, setActiveStep] = useState(0);
  const [networkType, setNetworkType] = useState('active');
  const [isDualFreq, setIsDualFreq] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState<{ lat: number; lng: number } | null>(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    if (lat && lng) return { lat: parseFloat(lat), lng: parseFloat(lng) };
    return null;
  });
  const [coordInput, setCoordInput] = useState(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    if (lat && lng) return `${parseFloat(lat).toFixed(6)}, ${parseFloat(lng).toFixed(6)}`;
    return '';
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    if (lat && lng) setActiveStep(1);
  }, [searchParams]);

  const handlePointSelected = useCallback((lat: number, lng: number) => {
    setSelectedPoint({ lat, lng });
    setCoordInput(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
  }, []);

  const locateUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(({ coords }) => {
        setSelectedPoint({ lat: coords.latitude, lng: coords.longitude });
        setCoordInput(`${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
        mapRef.current?.flyTo([coords.latitude, coords.longitude], 14);
      });
    }
  };

  const handleCoordInput = () => {
    const parts = coordInput.split(',').map(s => parseFloat(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      setSelectedPoint({ lat: parts[0], lng: parts[1] });
      mapRef.current?.flyTo([parts[0], parts[1]], 14);
    } else {
      setError('Formato inválido. Use: latitud, longitud');
    }
  };

  const handleCalculate = async () => {
    if (!selectedPoint) { setError('Seleccione un punto en el mapa'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api.calculateTrackingTime({
        latitude: selectedPoint.lat,
        longitude: selectedPoint.lng,
        networkType,
        isDualFrequency: isDualFreq,
      });
      if (res.success) {
        setResult(res.data);
        setActiveStep(2);
      } else {
        setError(res.message || 'Error en el cálculo');
      }
    } catch (e: any) {
      setError(e.message || 'Error al conectar con el servidor');
    }
    setLoading(false);
  };

  const handleExport = async () => {
    if (!result?.id) return;
    try {
      const blob = await api.exportPdf(result.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `colgnss-report-${result.id.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError('Error al exportar PDF');
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Calcular Tiempo de Rastreo
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4, '& .MuiStepLabel-root .Mui-completed': { color: '#27ae60' } }}>
        {steps.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
      </Stepper>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '60vh', minHeight: 400, position: 'relative' }}>
            <MapContainer center={defaultCenter} zoom={6} style={{ width: '100%', height: '100%', borderRadius: 12 }}
              ref={mapRef as any}>
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <ClickHandler activeStep={activeStep} onPointSelected={handlePointSelected} />

              {selectedPoint && <Marker position={[selectedPoint.lat, selectedPoint.lng]} icon={selectedIcon} />}

              {result?.station1 && (
                <>
                  <Marker position={[result.station1.latitude, result.station1.longitude]} icon={stationIcon('1', '#1a5276')} />
                  <Polyline positions={[[selectedPoint!.lat, selectedPoint!.lng], [result.station1.latitude, result.station1.longitude]]}
                    pathOptions={{ color: '#1a5276', weight: 2, opacity: 0.7 }} />
                </>
              )}
              {result?.station2 && (
                <>
                  <Marker position={[result.station2.latitude, result.station2.longitude]} icon={stationIcon('2', '#27ae60')} />
                  <Polyline positions={[[selectedPoint!.lat, selectedPoint!.lng], [result.station2.latitude, result.station2.longitude]]}
                    pathOptions={{ color: '#27ae60', weight: 2, opacity: 0.7 }} />
                </>
              )}
            </MapContainer>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, height: '100%' }}>
            {activeStep === 0 && (
              <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>Paso 1: Seleccionar Red</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Seleccione el tipo de red GNSS para el cálculo
                </Typography>
                <ToggleButtonGroup exclusive value={networkType} onChange={(_, v) => v && setNetworkType(v)} orientation="vertical" fullWidth sx={{ mb: 3 }}>
                  <ToggleButton value="active" sx={{ justifyContent: 'flex-start', py: 1.5 }}>
                    <Box><Typography variant="subtitle2">Red Activa</Typography><Typography variant="caption" color="text.secondary">Estaciones de monitoreo continuo</Typography></Box>
                  </ToggleButton>
                  <ToggleButton value="passive" sx={{ justifyContent: 'flex-start', py: 1.5 }}>
                    <Box><Typography variant="subtitle2">Red Pasiva</Typography><Typography variant="caption" color="text.secondary">Vértices geodésicos</Typography></Box>
                  </ToggleButton>
                  <ToggleButton value="mixed" sx={{ justifyContent: 'flex-start', py: 1.5 }}>
                    <Box><Typography variant="subtitle2">Red Mixta</Typography><Typography variant="caption" color="text.secondary">Activa + Pasiva</Typography></Box>
                  </ToggleButton>
                  <ToggleButton value="comparison" sx={{ justifyContent: 'flex-start', py: 1.5 }}>
                    <Box><Typography variant="subtitle2">Comparación Automática</Typography><Typography variant="caption" color="text.secondary">Compara todas las redes</Typography></Box>
                  </ToggleButton>
                </ToggleButtonGroup>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>Receptor</Typography>
                  <ToggleButtonGroup exclusive value={isDualFreq ? 'dual' : 'single'} onChange={(_, v) => v && setIsDualFreq(v === 'dual')} fullWidth size="small">
                    <ToggleButton value="dual">Dual Frecuencia (L1/L2)</ToggleButton>
                    <ToggleButton value="single">Simple Frecuencia (L1)</ToggleButton>
                  </ToggleButtonGroup>
                  {!isDualFreq && <Alert severity="warning" sx={{ mt: 1 }}>El tiempo de rastreo se duplicará para receptores L1</Alert>}
                </Box>

                <Button fullWidth variant="contained" size="large" onClick={() => setActiveStep(1)}>
                  Siguiente: Seleccionar Punto
                </Button>
              </Box>
            )}

            {activeStep === 1 && (
              <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>Paso 2: Seleccionar Punto</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Haga clic en el mapa o ingrese coordenadas
                </Typography>

                <TextField fullWidth size="small" label="O haga clic en el mapa" placeholder="latitud, longitud" value={coordInput}
                  onChange={e => setCoordInput(e.target.value)} sx={{ mb: 2 }}
                  onKeyDown={e => e.key === 'Enter' && handleCoordInput()}
                />

                <Button fullWidth variant="outlined" startIcon={<MyLocation />} onClick={locateUser} sx={{ mb: 2 }}>
                  Usar mi ubicación
                </Button>

                {selectedPoint && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Punto seleccionado: {selectedPoint.lat.toFixed(6)}, {selectedPoint.lng.toFixed(6)}
                  </Alert>
                )}

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="outlined" onClick={() => setActiveStep(0)}>Atrás</Button>
                  <Button fullWidth variant="contained" onClick={handleCalculate} disabled={!selectedPoint || loading}>
                    {loading ? <CircularProgress size={24} /> : 'Calcular Tiempo'}
                  </Button>
                </Box>
              </Box>
            )}

            {activeStep === 2 && result && (
              <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>Resultados</Typography>

                <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.main', color: 'white', borderRadius: 2, textAlign: 'center' }}>
                  <Typography variant="h3" fontWeight={700}>{result.trackingTime}</Typography>
                  <Typography variant="body2">minutos de rastreo mínimo</Typography>
                </Box>

                <Typography variant="subtitle2" gutterBottom>Punto Seleccionado</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Lat: {result.selectedPoint?.lat?.toFixed(6) || result.latitude?.toFixed(6)} | 
                  Lng: {result.selectedPoint?.lng?.toFixed(6) || result.longitude?.toFixed(6)}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>Estaciones</Typography>
                <Box sx={{ mb: 1 }}>
                  <Chip label="1" size="small" color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body2" display="inline">{result.station1?.code || result.station1?.name} - {result.station1?.distance?.toFixed(2)} km</Typography>
                </Box>
                {result.station2 && (
                  <Box sx={{ mb: 2 }}>
                    <Chip label="2" size="small" color="secondary" sx={{ mr: 1 }} />
                    <Typography variant="body2" display="inline">{result.station2?.code || result.station2.name} - {result.station2.distance?.toFixed(2)} km</Typography>
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>Detalles</Typography>
                <Typography variant="body2" color="text.secondary">Red: {result.networkType}</Typography>
                <Typography variant="body2" color="text.secondary">Método: {result.method}</Typography>
                <Typography variant="body2" color="text.secondary">Frecuencia: {result.isDualFrequency ? 'Dual (L1/L2)' : 'Simple (L1)'}</Typography>

                {result.observations && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="caption">{result.observations}</Typography>
                  </Alert>
                )}

                {result.comparisonData && Array.isArray(result.comparisonData) && result.comparisonData.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      <CompareArrows sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                      Comparación de Redes
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Red</TableCell>
                            <TableCell>Distancia</TableCell>
                            <TableCell>Tiempo</TableCell>
                            <TableCell>Recomendada</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {result.comparisonData.map((item: any, i: number) => (
                            <TableRow key={i} sx={{ bgcolor: item.isRecommended ? 'rgba(39,174,96,0.08)' : 'inherit' }}>
                              <TableCell>{item.networkType}</TableCell>
                              <TableCell>{item.distance?.toFixed(2)} km</TableCell>
                              <TableCell><strong>{item.trackingTime} min</strong></TableCell>
                              <TableCell>{item.isRecommended ? <Chip label="Recomendada" size="small" color="success" /> : ''}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}

                <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                  <Button variant="outlined" onClick={() => { setActiveStep(1); setResult(null); }}>
                    Nuevo Cálculo
                  </Button>
                  <Button variant="contained" startIcon={<Download />} onClick={handleExport}>
                    Exportar PDF
                  </Button>
                </Box>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
