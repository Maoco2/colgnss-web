'use client';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box, Stepper, Step, StepLabel, Button, Typography, Paper, Alert, AlertTitle, LinearProgress,
  Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Grid,
  Radio, RadioGroup, FormControlLabel, FormControl, FormLabel, Tooltip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Tabs, Tab, Divider,
} from '@mui/material';
import {
  CloudUpload, CheckCircle, Error as ErrorIcon, Warning as WarningIcon,
  Assessment, PictureAsPdf, ArrowBack, ArrowForward, Cancel, Info,
  SatelliteAlt, Map as MapIcon, Speed, Devices, Timeline, Storage,
  Satellite, LocationOn, Verified,
} from '@mui/icons-material';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import dynamic from 'next/dynamic';
import api from '@/lib/api';

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });

const steps = ['Cargar archivo', 'Analizando', 'Resultados'];

// --- Types ---
interface Detection {
  format: string; version: string; category: string; categoryLabel: string;
  compression: string; satelliteSystem: string; satelliteLabel: string;
  constellations: string[]; isCompact: boolean; isCompressed: boolean; needsDecompression: boolean;
}

interface ZipContents { files: { fileName: string; size: number; isObservable: boolean }[]; }

interface AnalysisData {
  id: string; complies: boolean; qualityIndex: number; qualityLabel: string;
  qualityBreakdown: string; rinexVersion: string; fileType: string;
  satelliteSystem: string; markerName: string; markerNumber: string; markerType: string;
  observer: string; receiverBrand: string; receiverModel: string;
  receiverSerial: string; receiverFirmware: string;
  antennaModel: string; antennaType: string; antennaSerial: string;
  antennaHeight: number; antennaDeltaN: number; antennaDeltaE: number; antennaDeltaH: number;
  approxX: number; approxY: number; approxZ: number;
  latitude: number; longitude: number; height: number; coordSystem: string;
  startTime: string; endTime: string;
  observedDuration: number; effectiveDuration: number;
  intervalNominal: number; intervalAvg: number; intervalMin: number; intervalMax: number;
  intervalStdDev: number; numEpochs: number; continuityPercent: number;
  gaps: number; lostEpochs: number; constellations: string[];
  numSatellitesAvg: number; maxSatellites: number; minSatellites: number;
  standardDevSatellites: number; uniqueSatellites: number;
  totalObservations: number;
  satelliteDetails: string;
  station1Name: string; station1Code: string;
  station2Name: string; station2Code: string;
  distance1: number; distance2: number; usedDistance: number; usedStationName: string;
  requiredTime: number; technicalConcept: string; recommendations: string;
  networkType: string; isDualFrequency: boolean; method: string;
  processingTimeMs: number; epochsAnalyzed: number;
  receiverCatalogInfo: string; antennaCatalogInfo: string;
  frequencyDetected: string; signalUnit: string; leapSeconds: number;
  glonassSlot: string; comments: string;
  continuityLabel: string; validationScore: number;
  validationIssues: string;
  expectedEpochs: number;
  totalFileLines: number;
  warnings: string[];
  durationFormatted: string;
  effectiveFormatted: string;
  headerConsistent: boolean;
  created_at: string;
}

interface Summary {
  id: string; complies: boolean; qualityIndex: number; qualityLabel: string;
  observedMinutes: number; requiredTime: number; usedDistance: number;
  usedStationName: string; networkType: string; receiverBrand: string; receiverModel: string;
  antennaModel: string; constellations: string[]; frequency: string;
  rinexVersion: string; numEpochs: number; continuityPercent: number;
  gaps: number; numSatellitesAvg: number; maxSatellites: number; minSatellites: number; uniqueSatellites: number; intervalAvg: number;
  continuityLabel: string; validationScore: number;
}

interface HeaderInfo {
  version: string; fileType: string; satelliteSystem: string;
  constellations: string[]; lines: number; totalLines: number; fileSize: number;
}

export default function RinexAnalysisContent() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [detection, setDetection] = useState<Detection | null>(null);
  const [headerInfo, setHeaderInfo] = useState<HeaderInfo | null>(null);
  const [zipContents, setZipContents] = useState<ZipContents | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [networkType, setNetworkType] = useState('active');
  const [isDualFreq, setIsDualFreq] = useState(true);
  const [showConceptDialog, setShowConceptDialog] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [resultTab, setResultTab] = useState(0);
  const [progress, setProgress] = useState({ percent: 0, message: '' });
  const [showZipDialog, setShowZipDialog] = useState(false);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => { if (unsubscribe) unsubscribe(); };
  }, [unsubscribe]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setSelectedFile(file); setError(null); }
  };

  const startAnalysis = async (sid: string) => {
    setAnalyzing(true);
    setError(null);
    setActiveStep(1);
    setProgress({ percent: 0, message: 'Iniciando análisis...' });

    const unsub = api.subscribeRinexProgress(sid, {
      onProgress: (ev) => setProgress(ev),
      onComplete: () => {},
      onError: () => {},
    });
    setUnsubscribe(unsub);

    try {
      const res = await api.analyzeRinex(sid, { networkType, isDualFrequency: isDualFreq });
      setAnalysis(res.data);
      setSummary(res.summary);
      setProgress({ percent: 100, message: 'Análisis completado' });
      setActiveStep(2);
    } catch (err: any) {
      setError(err.message || 'Error al analizar');
      setActiveStep(0);
    } finally {
      setAnalyzing(false);
      if (unsub) unsub();
      setUnsubscribe(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) { setError('Seleccione un archivo RINEX'); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await api.uploadRinexFile(selectedFile);
      setSessionId(res.sessionId);
      setDetection(res.detection);

      if (res.zipContents && res.needsFileSelection) {
        setZipContents(res.zipContents);
        setShowZipDialog(true);
      } else {
        setHeaderInfo(res.headerPreview);
        await startAnalysis(res.sessionId);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar archivo');
    } finally {
      setLoading(false);
    }
  };

  const handleZipSelect = async (fileName: string) => {
    if (!sessionId) return;
    setShowZipDialog(false);
    setLoading(true);
    try {
      const res = await api.selectZipFile(sessionId, fileName);
      setDetection(res.detection);
      setHeaderInfo({
        version: res.detection.version,
        fileType: res.detection.categoryLabel,
        satelliteSystem: res.detection.satelliteLabel,
        constellations: res.detection.constellations,
        lines: 0,
        totalLines: 0,
        fileSize: 0,
      });
      await startAnalysis(sessionId);
    } catch (err: any) {
      setError(err.message || 'Error al seleccionar archivo ZIP');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!sessionId) return;
    try { await api.cancelRinexAnalysis(sessionId); } catch {}
    setAnalyzing(false);
    setError('Análisis cancelado');
    setActiveStep(0);
    if (unsubscribe) { unsubscribe(); setUnsubscribe(null); }
  };

  const handleExportPdf = async () => {
    if (!summary?.id) return;
    setExportingPdf(true);
    try {
      const blob = await api.downloadRinexPdf(summary.id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err: any) {
      setError(err.message || 'Error al exportar PDF');
    } finally {
      setExportingPdf(false);
    }
  };

  const handleReset = () => {
    setActiveStep(0); setSelectedFile(null); setSessionId(null);
    setDetection(null); setHeaderInfo(null); setZipContents(null);
    setAnalysis(null); setSummary(null); setError(null);
    setProgress({ percent: 0, message: '' }); setResultTab(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatBytes = (b: number) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;

  const formatKm = (km: number) => `${km?.toFixed(3)} km`;

  const getQualityColor = (idx: number) => idx >= 90 ? '#27ae60' : idx >= 70 ? '#2ecc71' : idx >= 50 ? '#f39c12' : idx >= 30 ? '#e67e22' : '#e74c3c';

  const getConstellationColor = (c: string) => {
    const colors: Record<string, string> = {
      GPS: '#2ecc71', GLONASS: '#3498db', Galileo: '#9b59b6', GALILEO: '#9b59b6',
      BeiDou: '#e74c3c', BEIDOU: '#e74c3c', QZSS: '#f39c12', IRNSS: '#1abc9c', SBAS: '#95a5a6',
    };
    return colors[c] || '#95a5a6';
  };

  // --- Map ---
  const MapView = useCallback(() => {
    if (!analysis) return null;
    const lat = analysis.latitude;
    const lng = analysis.longitude;
    if (lat == null || lng == null) return <Typography color="text.secondary">Coordenadas no disponibles</Typography>;
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });
    return (
      <Box sx={{ height: 300, width: '100%', borderRadius: 2, overflow: 'hidden' }}>
        <MapContainer center={[lat, lng]} zoom={10} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[lat, lng]}>
            <Popup>Punto analizado<br />Lat: {lat?.toFixed(6)}<br />Lng: {lng?.toFixed(6)}</Popup>
          </Marker>
          {analysis.station1Name && (
            <Marker position={[lat + 0.02, lng + 0.02]}>
              <Popup>{analysis.station1Name} - {formatKm(analysis.distance1)}</Popup>
            </Marker>
          )}
          {analysis.station2Name && (
            <Marker position={[lat - 0.02, lng - 0.02]}>
              <Popup>{analysis.station2Name} - {formatKm(analysis.distance2)}</Popup>
            </Marker>
          )}
        </MapContainer>
      </Box>
    );
  }, [analysis]);

  // --- Tabs for results ---
  const renderResultTab = () => {
    if (!analysis || !summary) return null;
    switch (resultTab) {
      case 0: return renderSummaryTab();
      case 1: return renderHeaderTab();
      case 2: return renderEquipmentTab();
      case 3: return renderSatellitesTab();
      case 4: return renderCronologiaTab();
      case 5: return renderStationsTab();
      case 6: return renderConceptTab();
      case 7: return renderCalidadTab();
      case 8: return renderExportTab();
      default: return null;
    }
  };

  const renderSummaryTab = () => (
    <Box>
      <Alert severity={summary!.complies ? 'success' : 'error'} sx={{ mb: 3 }}>
        <AlertTitle>{summary!.complies ? 'CUMPLE con el tiempo mínimo' : 'NO CUMPLE con el tiempo mínimo'}</AlertTitle>
      </Alert>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={2}>
          <Card><CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h4" color={summary!.complies ? '#27ae60' : '#e74c3c'} fontWeight={700}>{summary!.qualityIndex}</Typography>
            <Typography variant="caption">Calidad</Typography>
            <Chip label={summary!.qualityLabel} size="small" sx={{ mt: 0.5, bgcolor: getQualityColor(summary!.qualityIndex), color: 'white', fontWeight: 600 }} />
          </CardContent></Card>
        </Grid>
        <Grid item xs={6} md={2}>
          <Card><CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h4" fontWeight={700}>{summary!.observedMinutes}</Typography>
            <Typography variant="caption">Min observados</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={6} md={2}>
          <Card><CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h4" fontWeight={700}>{summary!.requiredTime}</Typography>
            <Typography variant="caption">Min requeridos</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={6} md={2}>
          <Card><CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h4" fontWeight={700}>{summary!.usedDistance?.toFixed(1)}</Typography>
            <Typography variant="caption">Distancia (km)</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={6} md={2}>
          <Card><CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h4" fontWeight={700}>{summary!.numEpochs}</Typography>
            <Typography variant="caption">Épocas</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={6} md={2}>
          <Card><CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h4" fontWeight={700}>{summary!.numSatellitesAvg}</Typography>
            <Typography variant="caption">Sat promedio</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      <MapView />

      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>Equipo y configuración</Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}><Typography variant="body2">Receptor: {analysis!.receiverBrand} {analysis!.receiverModel}</Typography></Grid>
          <Grid item xs={6}><Typography variant="body2">Antena: {analysis!.antennaType || analysis!.antennaModel}</Typography></Grid>
          <Grid item xs={6}><Typography variant="body2">Frecuencia: {analysis!.frequencyDetected}</Typography></Grid>
          <Grid item xs={6}><Typography variant="body2">Versión RINEX: {analysis!.rinexVersion}</Typography></Grid>
        </Grid>
        <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {(analysis!.constellations || []).map(c => <Chip key={c} label={c} size="small" sx={{ bgcolor: getConstellationColor(c), color: 'white' }} />)}
        </Box>
      </Paper>
    </Box>
  );

  const renderHeaderTab = () => {
    const rows: [string, any][] = [
      ['Versión RINEX', analysis!.rinexVersion],
      ['Tipo', analysis!.fileType === 'O' ? 'Observación' : analysis!.fileType],
      ['Sistema satelital', analysis!.satelliteSystem],
      ['Nombre del marcador', analysis!.markerName],
      ['Número del marcador', analysis!.markerNumber],
      ['Tipo del marcador', analysis!.markerType],
      ['Observador', analysis!.observer],
      ['Programa', ''],
      ['Marca del receptor', analysis!.receiverBrand],
      ['Modelo del receptor', analysis!.receiverModel],
      ['Serial del receptor', analysis!.receiverSerial],
      ['Firmware', analysis!.receiverFirmware],
      ['Marca de antena', analysis!.antennaModel],
      ['Modelo de antena', analysis!.antennaType],
      ['Serial de antena', analysis!.antennaSerial],
      ['Altura de antena', analysis!.antennaHeight ? `${analysis!.antennaHeight} m` : 'N/A'],
      ['Delta H/E/N', `${analysis!.antennaDeltaH}/${analysis!.antennaDeltaE}/${analysis!.antennaDeltaN}`],
      ['X aproximado', analysis!.approxX],
      ['Y aproximado', analysis!.approxY],
      ['Z aproximado', analysis!.approxZ],
      ['Latitud', analysis!.latitude?.toFixed(6)],
      ['Longitud', analysis!.longitude?.toFixed(6)],
      ['Altura', analysis!.height?.toFixed(2)],
      ['Sistema de referencia', analysis!.coordSystem],
      ['Intervalo nominal', `${analysis!.intervalNominal} s`],
      ['Unidad de señal', analysis!.signalUnit],
      ['Segundos intercalares', analysis!.leapSeconds],
      ['Inicio', analysis!.startTime ? new Date(analysis!.startTime).toLocaleString('es-CO') : 'N/A'],
      ['Fin', analysis!.endTime ? new Date(analysis!.endTime).toLocaleString('es-CO') : 'N/A'],
    ];
    return (
      <TableContainer component={Paper}>
        <Table size="small">
          <TableBody>
            {rows.map(([label, val]) => (
              <TableRow key={label}>
                <TableCell sx={{ fontWeight: 600, width: 250 }}>{label}</TableCell>
                <TableCell>{val || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderEquipmentTab = () => (
    <Box>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>Receptor</Typography>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={1}>
          <Grid item xs={6}><Typography variant="body2"><strong>Marca:</strong> {analysis!.receiverBrand}</Typography></Grid>
          <Grid item xs={6}><Typography variant="body2"><strong>Modelo:</strong> {analysis!.receiverModel}</Typography></Grid>
          <Grid item xs={6}><Typography variant="body2"><strong>Serial:</strong> {analysis!.receiverSerial || 'N/A'}</Typography></Grid>
          <Grid item xs={6}><Typography variant="body2"><strong>Firmware:</strong> {analysis!.receiverFirmware || 'N/A'}</Typography></Grid>
        </Grid>
        {analysis!.receiverCatalogInfo && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <AlertTitle>Información del catálogo</AlertTitle>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{analysis!.receiverCatalogInfo}</Typography>
          </Alert>
        )}
      </Paper>

      <Typography variant="subtitle1" fontWeight={600} gutterBottom>Antena</Typography>
      <Paper sx={{ p: 2 }}>
        <Grid container spacing={1}>
          <Grid item xs={6}><Typography variant="body2"><strong>Marca:</strong> {analysis!.antennaModel}</Typography></Grid>
          <Grid item xs={6}><Typography variant="body2"><strong>Modelo:</strong> {analysis!.antennaType || 'N/A'}</Typography></Grid>
          <Grid item xs={6}><Typography variant="body2"><strong>Serial:</strong> {analysis!.antennaSerial || 'N/A'}</Typography></Grid>
          <Grid item xs={6}><Typography variant="body2"><strong>Altura:</strong> {analysis!.antennaHeight ? `${analysis!.antennaHeight} m` : 'N/A'}</Typography></Grid>
        </Grid>
        {analysis!.antennaCatalogInfo && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <AlertTitle>Información del catálogo</AlertTitle>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{analysis!.antennaCatalogInfo}</Typography>
          </Alert>
        )}
      </Paper>
    </Box>
  );

  const renderSatellitesTab = () => (
    <Grid container spacing={2}>
      <Grid item xs={6} md={3}>
        <Card><CardContent sx={{ textAlign: 'center' }}>
          <Typography variant="h5" fontWeight={700}>{analysis!.numSatellitesAvg}</Typography>
          <Typography variant="caption">Promedio satélites</Typography>
        </CardContent></Card>
      </Grid>
      <Grid item xs={6} md={3}>
        <Card><CardContent sx={{ textAlign: 'center' }}>
          <Typography variant="h5" fontWeight={700}>{analysis!.maxSatellites}</Typography>
          <Typography variant="caption">Máximo simultáneo</Typography>
        </CardContent></Card>
      </Grid>
      <Grid item xs={6} md={3}>
        <Card><CardContent sx={{ textAlign: 'center' }}>
          <Typography variant="h5" fontWeight={700}>{analysis!.totalObservations}</Typography>
          <Typography variant="caption">Observaciones totales</Typography>
        </CardContent></Card>
      </Grid>
      <Grid item xs={6} md={3}>
        <Card><CardContent sx={{ textAlign: 'center' }}>
          <Typography variant="h5" fontWeight={700}>{(analysis!.constellations || []).length}</Typography>
          <Typography variant="caption">Constelaciones</Typography>
        </CardContent></Card>
      </Grid>
      <Grid item xs={6} md={3}>
        <Card><CardContent sx={{ textAlign: 'center' }}>
          <Typography variant="h5" fontWeight={700}>{analysis!.minSatellites ?? 0}</Typography>
          <Typography variant="caption">Mínimo simultáneo</Typography>
        </CardContent></Card>
      </Grid>
      <Grid item xs={6} md={3}>
        <Card><CardContent sx={{ textAlign: 'center' }}>
          <Typography variant="h5" fontWeight={700}>{analysis!.standardDevSatellites ?? 0}</Typography>
          <Typography variant="caption">Desviación estándar</Typography>
        </CardContent></Card>
      </Grid>
      <Grid item xs={6} md={3}>
        <Card><CardContent sx={{ textAlign: 'center' }}>
          <Typography variant="h5" fontWeight={700}>{analysis!.uniqueSatellites ?? 0}</Typography>
          <Typography variant="caption">Satélites únicos</Typography>
        </CardContent></Card>
      </Grid>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {(analysis!.constellations || []).map(c => (
            <Chip key={c} icon={<SatelliteAlt />} label={c} sx={{ bgcolor: getConstellationColor(c), color: 'white', fontWeight: 600 }} />
          ))}
        </Box>
      </Grid>
    </Grid>
  );

  const renderCronologiaTab = () => {
    const a = analysis!;
    const continuityColor = (pct: number) => pct >= 99.9 ? '#27ae60' : pct >= 99 ? '#2ecc71' : pct >= 95 ? '#f39c12' : '#e74c3c';
    return (
      <Box>
        <Paper sx={{ p: 3, mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>Resumen Temporal del Archivo</Typography>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: 220 }}>Primera época</TableCell>
                <TableCell>{a.startTime ? new Date(a.startTime).toLocaleString('es-CO') : 'N/A'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Última época</TableCell>
                <TableCell>{a.endTime ? new Date(a.endTime).toLocaleString('es-CO') : 'N/A'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Total de épocas</TableCell>
                <TableCell><strong>{a.numEpochs}</strong></TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Intervalo nominal</TableCell>
                <TableCell>{a.intervalNominal} s</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Intervalo promedio</TableCell>
                <TableCell>{a.intervalAvg?.toFixed(2)} s</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Intervalo mínimo</TableCell>
                <TableCell>{a.intervalMin?.toFixed(2)} s</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Intervalo máximo</TableCell>
                <TableCell>{a.intervalMax?.toFixed(2)} s</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Duración total</TableCell>
                <TableCell><strong>{a.durationFormatted || `${a.observedDuration?.toFixed(1)} min`}</strong></TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Tiempo efectivo</TableCell>
                <TableCell><strong>{a.effectiveFormatted || `${a.effectiveDuration?.toFixed(1)} min`}</strong></TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Estado de continuidad</TableCell>
                <TableCell>
                  <Chip label={a.continuityLabel || 'N/A'} size="small"
                    sx={{ bgcolor: continuityColor(a.continuityPercent), color: 'white', fontWeight: 600 }} />
                  <Typography variant="caption" sx={{ ml: 1 }}>{a.continuityPercent?.toFixed(1)}%</Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Paper>

        {!a.headerConsistent && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <AlertTitle>Inconsistencia en encabezado</AlertTitle>
            <Typography variant="body2">Las horas del encabezado no coinciden con las épocas calculadas del archivo.</Typography>
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6} md={3}>
            <Card><CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h5" fontWeight={700}>{a.gaps}</Typography>
              <Typography variant="caption">Interrupciones</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card><CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h5" fontWeight={700}>{a.lostEpochs || 0}</Typography>
              <Typography variant="caption">Épocas perdidas</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card><CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h5" fontWeight={700}>{a.expectedEpochs || 0}</Typography>
              <Typography variant="caption">Épocas esperadas</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card><CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h5" fontWeight={700}>{a.totalFileLines}</Typography>
              <Typography variant="caption">Líneas totales</Typography>
            </CardContent></Card>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderStationsTab = () => (
    <Box>
      <MapView />
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table size="small">
          <TableBody>
            <TableRow><TableCell sx={{ fontWeight: 600 }}>Estación 1</TableCell>
              <TableCell>{analysis!.station1Name} ({analysis!.station1Code}) - {formatKm(analysis!.distance1)}</TableCell></TableRow>
            {analysis!.station2Name && (<TableRow><TableCell sx={{ fontWeight: 600 }}>Estación 2</TableCell>
              <TableCell>{analysis!.station2Name} ({analysis!.station2Code}) - {formatKm(analysis!.distance2)}</TableCell></TableRow>)}
            <TableRow><TableCell sx={{ fontWeight: 600 }}>Estación utilizada</TableCell><TableCell>{analysis!.usedStationName} - {formatKm(analysis!.usedDistance)}</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 600 }}>Tiempo requerido</TableCell><TableCell>{analysis!.requiredTime} min</TableCell></TableRow>
            <TableRow><TableCell sx={{ fontWeight: 600 }}>Método</TableCell><TableCell>{analysis!.method}</TableCell></TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderConceptTab = () => (
    <Box>
      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>Concepto Técnico</Typography>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{analysis!.technicalConcept}</Typography>
      </Paper>
      {analysis!.recommendations && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Recomendaciones</Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{analysis!.recommendations}</Typography>
        </Paper>
      )}
    </Box>
  );

  const renderCalidadTab = () => {
    const validationScore = analysis!.validationScore || 0;
    const issues = analysis!.validationIssues ? JSON.parse(analysis!.validationIssues) : [];
    const getScoreColor = (score: number) => score >= 80 ? '#27ae60' : score >= 60 ? '#f39c12' : '#e74c3c';
    const getIssueColor = (level: string) => level === 'error' ? '#e74c3c' : level === 'warning' ? '#f39c12' : '#3498db';
    return (
      <Box>
        <Paper sx={{ p: 3, mb: 2, textAlign: 'center', bgcolor: getScoreColor(validationScore) + '15' }}>
          <Typography variant="h5" fontWeight={700} sx={{ color: getScoreColor(validationScore) }} gutterBottom>
            {validationScore}/100
          </Typography>
          <Typography variant="body2" color="text.secondary">Puntaje de validación</Typography>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Chip label={`Épocas: ${analysis!.numEpochs}`} size="small" variant="outlined" />
            <Chip label={`Continuidad: ${analysis!.continuityPercent?.toFixed(1)}%`} size="small" variant="outlined" />
            <Chip label={`Interrupciones: ${analysis!.gaps}`} size="small" variant="outlined" />
            <Chip label={`Etiqueta: ${analysis!.continuityLabel || 'N/A'}`} size="small"
              sx={{ bgcolor: getScoreColor(validationScore), color: 'white' }} />
          </Box>
        </Paper>

        {(issues.length > 0 || analysis!.warnings?.length > 0) && (
          <Paper sx={{ p: 3, mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>Incidencias detectadas</Typography>
            {issues.map((issue: { level: string; message: string; code?: string }, i: number) => (
              <Box key={i} sx={{ display: 'flex', gap: 1, mb: 0.5, alignItems: 'center' }}>
                <Chip label={issue.level} size="small" sx={{ bgcolor: getIssueColor(issue.level), color: 'white', width: 70 }} />
                <Typography variant="body2" color={issue.level === 'error' ? 'error' : 'text.primary'}>
                  {issue.message} {issue.code ? `(${issue.code})` : ''}
                </Typography>
              </Box>
            ))}
            {(analysis!.warnings || []).map((w: string, i: number) => (
              <Box key={`warn-${i}`} sx={{ display: 'flex', gap: 1, mb: 0.5, alignItems: 'center' }}>
                <Chip label="warning" size="small" sx={{ bgcolor: '#f39c12', color: 'white', width: 70 }} />
                <Typography variant="body2">{w}</Typography>
              </Box>
            ))}
          </Paper>
        )}

        <Paper sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Resumen de validación</Typography>
          <Table size="small">
            <TableBody>
              <TableRow><TableCell sx={{ fontWeight: 600 }}>Puntaje</TableCell><TableCell>{validationScore}/100</TableCell></TableRow>
              <TableRow><TableCell sx={{ fontWeight: 600 }}>Problemas</TableCell><TableCell>{issues.length}</TableCell></TableRow>
              <TableRow><TableCell sx={{ fontWeight: 600 }}>Épocas esperadas</TableCell><TableCell>{analysis!.expectedEpochs}</TableCell></TableRow>
              <TableRow><TableCell sx={{ fontWeight: 600 }}>Líneas totales</TableCell><TableCell>{analysis!.totalFileLines}</TableCell></TableRow>
              <TableRow><TableCell sx={{ fontWeight: 600 }}>Continuidad</TableCell><TableCell>{analysis!.continuityPercent?.toFixed(1)}%</TableCell></TableRow>
              <TableRow><TableCell sx={{ fontWeight: 600 }}>Etiqueta</TableCell><TableCell>{analysis!.continuityLabel || 'N/A'}</TableCell></TableRow>
            </TableBody>
          </Table>
        </Paper>
      </Box>
    );
  };

  const renderExportTab = () => (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <PictureAsPdf sx={{ fontSize: 64, color: '#e74c3c', mb: 2 }} />
      <Typography variant="h6" gutterBottom>Exportar Informe PDF</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
        Descargue el informe completo con todos los detalles del análisis RINEX, incluyendo las tablas de equipos, observables, épocas, estaciones y el concepto técnico completo.
      </Typography>
      <Button variant="contained" color="error" onClick={handleExportPdf} disabled={exportingPdf} startIcon={exportingPdf ? <CircularProgress size={20} /> : <PictureAsPdf />} size="large">
        {exportingPdf ? 'Generando...' : 'Descargar PDF'}
      </Button>
    </Box>
  );

  // --- Steps ---
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".obs,.rnx,.yo,.yoo,.crx,.crx.gz,.zip,.gz" hidden />
            <Paper variant="outlined" sx={{ p: 6, borderStyle: 'dashed', cursor: 'pointer', maxWidth: 550, mx: 'auto' }}
              onClick={() => fileInputRef.current?.click()}>
              <CloudUpload sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>Cargar Archivo RINEX</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Formatos: .obs, .rnx, .yyO, .crx (Compact RINEX), .zip, .gz
              </Typography>
              {selectedFile && (
                <Chip label={`${selectedFile.name} (${formatBytes(selectedFile.size)})`} color="primary" onDelete={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} />
              )}
            </Paper>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button variant="contained" onClick={handleUpload} disabled={!selectedFile || loading} startIcon={loading ? <CircularProgress size={20} /> : <CloudUpload />}>
                {loading ? 'Cargando...' : 'Cargar y Detectar'}
              </Button>
            </Box>
            {detection && !showZipDialog && (
              <Paper sx={{ p: 2, mt: 3, maxWidth: 550, mx: 'auto' }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>Archivo detectado</Typography>
                <Grid container spacing={1}>
                  <Grid item xs={4}><Typography variant="caption">Versión: <strong>{detection.version}</strong></Typography></Grid>
                  <Grid item xs={4}><Typography variant="caption">Tipo: <strong>{detection.categoryLabel}</strong></Typography></Grid>
                  <Grid item xs={4}><Typography variant="caption">Sistema: <strong>{detection.satelliteLabel}</strong></Typography></Grid>
                  <Grid item xs={4}><Typography variant="caption">Compact: <strong>{detection.isCompact ? 'Sí' : 'No'}</strong></Typography></Grid>
                  <Grid item xs={4}><Typography variant="caption">Comprimido: <strong>{detection.isCompressed ? 'Sí' : 'No'}</strong></Typography></Grid>
                  <Grid item xs={4}><Typography variant="caption">Constelaciones: <strong>{(detection.constellations || []).join(', ')}</strong></Typography></Grid>
                </Grid>
              </Paper>
            )}
          </Box>
        );

      case 1:
        return (
          <Box sx={{ py: 4, maxWidth: 500, mx: 'auto' }}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>Analizando archivo RINEX</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <CircularProgress size={24} />
                <Typography variant="body2" color="text.secondary">{progress.message}</Typography>
              </Box>
              <LinearProgress variant="determinate" value={progress.percent} sx={{ height: 8, borderRadius: 4 }} />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'right' }}>
                {progress.percent}%
              </Typography>
            </Paper>
            <Button variant="outlined" color="error" onClick={handleCancel} startIcon={<Cancel />} fullWidth>
              Cancelar
            </Button>
          </Box>
        );

      case 2:
        if (!analysis) return null;
        return (
          <Box>
            <Alert severity={summary!.complies ? 'success' : 'error'} sx={{ mb: 2 }}>
              <AlertTitle>{summary!.complies ? 'CUMPLE' : 'NO CUMPLE'} con el tiempo mínimo requerido</AlertTitle>
            </Alert>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs value={resultTab} onChange={(_, v) => setResultTab(v)} variant="scrollable" scrollButtons="auto">
                <Tab icon={<Speed />} label="Resumen" />
                <Tab icon={<Info />} label="Header" />
                <Tab icon={<Devices />} label="Equipo" />
                <Tab icon={<SatelliteAlt />} label="Satélites" />
                <Tab icon={<Timeline />} label="Cronología" />
                <Tab icon={<LocationOn />} label="Estaciones" />
                <Tab icon={<Assessment />} label="Concepto" />
                <Tab icon={<Verified />} label="Calidad" />
                <Tab icon={<PictureAsPdf />} label="PDF" />
              </Tabs>
            </Box>

            {renderResultTab()}

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="outlined" onClick={handleReset} startIcon={<ArrowBack />}>Nuevo análisis</Button>
            </Box>
          </Box>
        );

      default: return null;
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <Typography variant="h5" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SatelliteAlt /> Analizar Archivo RINEX
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4, overflowX: 'auto' }}>
        {steps.map((label, i) => (
          <Step key={label} completed={i < activeStep}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {renderStepContent(activeStep)}

      {/* ZIP file selection dialog */}
      <Dialog open={showZipDialog} onClose={() => setShowZipDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Seleccionar archivo del ZIP</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            El archivo ZIP contiene múltiples archivos. Seleccione cuál desea analizar:
          </Typography>
          {zipContents?.files.map(f => (
            <Paper key={f.fileName} sx={{ p: 2, mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
              onClick={() => handleZipSelect(f.fileName)}>
              <Box>
                <Typography variant="body2" fontWeight={600}>{f.fileName}</Typography>
                <Typography variant="caption" color="text.secondary">{formatBytes(f.size)}</Typography>
              </Box>
              <Chip label={f.isObservable ? 'Observación' : 'Otro'} size="small" color={f.isObservable ? 'primary' : 'default'} />
            </Paper>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShowZipDialog(false); setActiveStep(0); }}>Cancelar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
