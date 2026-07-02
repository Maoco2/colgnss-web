'use client';
import React, { useState, useRef } from 'react';
import {
  Box, Container, Grid, Card, CardContent, Typography, Button, TextField, MenuItem,
  CircularProgress, Alert, Stepper, Step, StepLabel, Divider, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Chip, IconButton,
} from '@mui/material';
import { MyLocation, Download, CloudUpload, Transform, PictureAsPdf } from '@mui/icons-material';
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

const originIcon = L.divIcon({
  className: '',
  html: '<div style="width:16px;height:16px;background:#e74c3c;border:2px solid #fff;border-radius:50%;box-shadow:0 0 4px rgba(0,0,0,0.4);"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const convertedIcon = L.divIcon({
  className: '',
  html: '<div style="width:16px;height:16px;background:#27ae60;border:2px solid #fff;border-radius:50%;box-shadow:0 0 4px rgba(0,0,0,0.4);"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const defaultCenter: [number, number] = [4.711, -74.072];

const steps = [
  'Tipo de Conversión', 'Sistema Origen', 'Tipo Coord. Origen', 'Origen (opcional)',
  'Sistema Destino', 'Tipo Coord. Destino', 'Origen Destino', 'Ingresar Datos', 'Resultados'
];
const coordKeyLabels: Record<string, string> = {
  north: 'NORTE', east: 'ESTE', lat: 'Latitud', lon: 'Longitud',
  x: 'X', y: 'Y', z: 'Z', h: 'Altura',
};
const labelKey = (k: string) => coordKeyLabels[k] || k;
export default function CoordinateConversionContent() {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<'point' | 'file' | null>(null);
  const [srcSystemId, setSrcSystemId] = useState<number | null>(null);
  const [srcCoordType, setSrcCoordType] = useState<string | null>(null);
  const [srcOriginId, setSrcOriginId] = useState<number | null>(null);
  const [srcOriginName, setSrcOriginName] = useState('');
  const [tgtSystemId, setTgtSystemId] = useState<number | null>(null);
  const [tgtCoordType, setTgtCoordType] = useState<string | null>(null);
  const [tgtOriginId, setTgtOriginId] = useState<number | null>(null);
  const [tgtOriginName, setTgtOriginName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [batchResult, setBatchResult] = useState<any>(null);
  const [coordTypes, setCoordTypes] = useState<any[]>([]);
  const [tgtCoordTypes, setTgtCoordTypes] = useState<any[]>([]);
  const [systems, setSystems] = useState<any[]>([]);
  const [gaussZones, setGaussZones] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [municipalities, setMunicipalities] = useState<any[]>([]);
  const [origins, setOrigins] = useState<any[]>([]);
  const [deptId, setDeptId] = useState<number | null>(null);
  const [munPk, setMunPk] = useState<number | null>(null);
  const [tgtDeptId, setTgtDeptId] = useState<number | null>(null);
  const [tgtMunPk, setTgtMunPk] = useState<number | null>(null);
  const [tgtGaussZones, setTgtGaussZones] = useState<any[]>([]);
  const [tgtOrigins, setTgtOrigins] = useState<any[]>([]);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Point input fields
  const [pointLat, setPointLat] = useState('');
  const [pointLon, setPointLon] = useState('');
  const [pointH, setPointH] = useState('');
  const [pointX, setPointX] = useState('');
  const [pointY, setPointY] = useState('');
  const [pointZ, setPointZ] = useState('');
  const [pointNorth, setPointNorth] = useState('');
  const [pointEast, setPointEast] = useState('');

  // File input
  const [file, setFile] = useState<File | null>(null);
  const [columnMapping, setColumnMapping] = useState<any>({});
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);

  const mapRef = useRef<L.Map | null>(null);

  React.useEffect(() => {
    api.getReferenceSystems().then(r => r.success && setSystems(r.data));
  }, []);

  const loadCoordTypes = async (systemId: number, isTarget = false) => {
    try {
      const r = await api.getCoordinateTypes(systemId);
      if (r.success) {
        if (isTarget) setTgtCoordTypes(r.data);
        else setCoordTypes(r.data);
      }
    } catch { setError('No se pudieron cargar los tipos de coordenada'); }
  };

  const loadGaussZones = async (systemId: number, isTarget = false) => {
    try {
      const r = await api.getGaussZones(systemId);
      if (r.success) {
        if (isTarget) setTgtGaussZones(r.data);
        else setGaussZones(r.data);
      }
    } catch {}
  };

  const loadDepartments = async () => {
    try {
      const r = await api.getCoordinateDepartments();
      if (r.success) setDepartments(r.data);
    } catch {}
  };

  const loadMunicipalities = async (dId: number, isTarget = false) => {
    try {
      const r = await api.getCoordinateMunicipalities(dId);
      if (r.success) {
        if (isTarget) setMunicipalities(r.data);
        else setMunicipalities(r.data);
      }
    } catch {}
  };

  const loadOrigins = async (systemId: number, mPk: number, isTarget = false) => {
    try {
      const r = await api.getOrigins(systemId, mPk);
      if (r.success) {
        if (isTarget) setTgtOrigins(r.data);
        else setOrigins(r.data);
      }
    } catch {}
  };

  const handleSelectMode = (m: 'point' | 'file') => {
    setMode(m);
    setStep(1);
  };

  const handleSelectSrcSystem = (id: number) => {
    setSrcSystemId(id);
    setSrcOriginId(null);
    setSrcOriginName('');
    setGaussZones([]);
    setOrigins([]);
    loadCoordTypes(id);
    setStep(2);
  };

  const handleSelectSrcCoordType = (t: string, requiresOrigin: boolean) => {
    setSrcCoordType(t);
    if (requiresOrigin) {
      if (t === 'gauss_kruger') loadGaussZones(srcSystemId!);
      else loadDepartments();
      setStep(3);
    } else {
      goToTargetSystem();
    }
  };

  const handleSelectSrcOrigin = () => {
    goToTargetSystem();
  };

  const goBack = () => {
    if (step === 1) { setStep(0); return; }
    if (step === 2) { setStep(1); return; }
    if (step === 3) { setStep(2); return; }
    if (step === 4) {
      // Back from target system: skip source origin if it wasn't needed
      if (srcCoordType && !['gauss_kruger', 'local_cartesian'].includes(srcCoordType)) setStep(1);
      else setStep(3);
      return;
    }
    if (step === 5) { setStep(4); return; }
    if (step === 6) { setStep(5); return; }
    if (step === 7) {
      // Back from data input: skip target origin if it wasn't needed
      if (tgtCoordType && !['gauss_kruger', 'local_cartesian'].includes(tgtCoordType)) setStep(5);
      else setStep(6);
      return;
    }
    if (step === 8) { setStep(7); return; }
  };

  const goToTargetSystem = () => {
    setStep(4);
  };

  const handleSelectTgtSystem = (id: number) => {
    setTgtSystemId(id);
    setTgtOriginId(null);
    setTgtOriginName('');
    setTgtGaussZones([]);
    setTgtOrigins([]);
    loadCoordTypes(id, true);
    setStep(5);
  };

  const handleSelectTgtCoordType = (t: string, requiresOrigin: boolean) => {
    setTgtCoordType(t);
    if (requiresOrigin) {
      if (t === 'gauss_kruger') loadGaussZones(tgtSystemId!, true);
      else {
        setTgtDeptId(null); setTgtMunPk(null);
      }
      setStep(6);
    } else {
      setStep(7);
    }
  };

  const handleSelectTgtOrigin = () => {
    setStep(7);
  };

  const handleConvertPoint = async () => {
    setLoading(true);
    setError('');
    try {
      const body: any = {
        sourceSystemId: srcSystemId,
        sourceCoordType: srcCoordType,
        targetSystemId: tgtSystemId,
        targetCoordType: tgtCoordType,
      };
      if (srcOriginId && srcCoordType?.match(/gauss_kruger|local_cartesian/)) body.sourceOriginId = srcOriginId;
      if (tgtOriginId && tgtCoordType?.match(/gauss_kruger|local_cartesian/)) body.targetOriginId = tgtOriginId;

      if (srcCoordType === 'geographic') { body.lat = parseFloat(pointLat); body.lon = parseFloat(pointLon); if (pointH) body.h = parseFloat(pointH); }
      else if (srcCoordType === 'geocentric_xyz') { body.x = parseFloat(pointX); body.y = parseFloat(pointY); body.z = parseFloat(pointZ); }
      else { body.north = parseFloat(pointNorth); body.east = parseFloat(pointEast); }

      const res = await api.convertCoordinate(body);
      if (res.success) { setResult(res.data); setStep(8); }
      else setError(res.message || 'Error en la conversión');
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const handleBatchConvert = async () => {
    if (!file) { setError('Seleccione un archivo'); return; }
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sourceSystemId', String(srcSystemId));
      formData.append('sourceCoordType', srcCoordType!);
      formData.append('targetSystemId', String(tgtSystemId));
      formData.append('targetCoordType', tgtCoordType!);
      if (srcOriginId) formData.append('sourceOriginId', String(srcOriginId));
      if (tgtOriginId) formData.append('targetOriginId', String(tgtOriginId));
      if (Object.keys(columnMapping).length > 0) formData.append('columnMapping', JSON.stringify(columnMapping));

      const res = await api.batchConvertCoordinate(formData);
      if (res.success) { setBatchResult(res.data); setStep(8); }
      else setError(res.message || 'Error en la conversión masiva');
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    // Try to read headers for mapping
    try {
      if (f.name.endsWith('.csv')) {
        const text = await f.text();
        const headers = text.split(/\r?\n/)[0].split(',').map(h => h.trim().replace(/"/g, ''));
        setParsedHeaders(headers);
        autoMapColumns(headers);
      } else if (f.name.endsWith('.xlsx')) {
        const XLSX = require('xlsx');
        const buf = await f.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][];
        if (rows.length > 0) {
          const headers = rows[0].map((h: any) => String(h));
          setParsedHeaders(headers);
          autoMapColumns(headers);
        }
      } else {
        const text = await f.text();
        const separators = ['\t', ';', ','];
        const sep = separators.find(s => text.includes(s)) || ',';
        const headers = text.split(/\r?\n/)[0].split(sep).map(h => h.trim());
        setParsedHeaders(headers);
        autoMapColumns(headers);
      }
    } catch {}
  };

  const autoMapColumns = (headers: string[]) => {
    const mapping: any = {};
    headers.forEach(h => {
      const hl = h.toLowerCase();
      if (/lat/i.test(hl) && !/long/i.test(hl)) mapping.latCol = h;
      else if (/lon|long|lng/i.test(hl)) mapping.lonCol = h;
      else if (/alt|height|h/i.test(hl) && !/north/i.test(hl)) mapping.hCol = h;
      else if (/north|norte|n/i.test(hl)) mapping.northCol = h;
      else if (/east|este|e/i.test(hl) && !/north/i.test(hl)) mapping.eastCol = h;
      else if (/^x$/i.test(hl)) mapping.xCol = h;
      else if (/^y$/i.test(hl)) mapping.yCol = h;
      else if (/^z$/i.test(hl)) mapping.zCol = h;
    });
    setColumnMapping(mapping);
  };

  const sendToCalculate = () => {
    const { intermediate } = result;
    window.location.href = `/dashboard/calculate?lat=${intermediate.lat}&lng=${intermediate.lon}`;
  };

  const downloadPdf = async () => {
    if (!result) return;
    const { jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageW = 190;
    let y = 20;

    pdf.setFontSize(16);
    pdf.text('Conversión de Coordenadas', pageW / 2, y, { align: 'center' });
    y += 12;

    pdf.setFontSize(11);
    pdf.text(`Origen: ${currentSystem(result.source?.system)?.name} - ${coordTypeLabel(result.source?.type)}${result.source?.origin ? ` (${result.source.origin})` : ''}`, 10, y);
    y += 6;
    Object.entries(result.source?.coords || {}).forEach(([k, v]) => {
      pdf.text(`  ${labelKey(k)}: ${typeof v === 'number' ? (['north','east'].includes(k) ? v.toFixed(3) : v.toFixed(6)) : v}`, 10, y);
      y += 5;
    });
    y += 4;

    pdf.text(`Destino: ${currentSystem(result.target?.system)?.name} - ${coordTypeLabel(result.target?.type)}${result.target?.origin ? ` (${result.target.origin})` : ''}`, 10, y);
    y += 6;
    Object.entries(result.target?.coords || {}).forEach(([k, v]) => {
      pdf.text(`  ${labelKey(k)}: ${typeof v === 'number' ? (['north','east'].includes(k) ? v.toFixed(3) : v.toFixed(6)) : v}`, 10, y);
      y += 5;
    });
    y += 4;

    pdf.setFontSize(10);
    pdf.text(`Datum origen: ${result.source?.system}`, 10, y); y += 5;
    pdf.text(`Datum destino: ${result.target?.system}`, 10, y); y += 5;
    pdf.text(`Convergencia: ${result.convergence?.toFixed(6) ?? 'N/A'}°`, 10, y); y += 5;
    pdf.text(`Factor de escala: ${result.scale?.toFixed(9) ?? 'N/A'}`, 10, y); y += 5;
    pdf.text(`Tiempo: ${result.processingTimeMs} ms`, 10, y); y += 8;

    if (mapContainerRef.current) {
      try {
        const canvas = await html2canvas(mapContainerRef.current, { useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const imgW = pageW;
        const imgH = (canvas.height / canvas.width) * imgW;
        if (y + imgH < 280) {
          pdf.addImage(imgData, 'PNG', 10, y, imgW, imgH);
        } else {
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 10, 10, imgW, imgH > 270 ? 270 : imgH);
        }
      } catch {}
    }

    pdf.save('conversion_coordenadas.pdf');
  };

  const downloadCsv = () => {
    if (!batchResult) return;
    const headers = Object.keys(batchResult.results[0] || {}).filter(h => h !== 'converted' && h !== 'error');
    headers.push('NORTE', 'ESTE', 'Observaciones');
    const csvRows = [headers.join(',')];
    batchResult.results.forEach((r: any) => {
      const row = headers.map(h => {
        if (h === 'NORTE') return r.converted?.north !== undefined ? r.converted.north.toFixed(3) : r.converted?.lat !== undefined ? r.converted.lat.toFixed(6) : r.converted?.x?.toFixed(3) ?? '';
        if (h === 'ESTE') return r.converted?.east !== undefined ? r.converted.east.toFixed(3) : r.converted?.lon !== undefined ? r.converted.lon.toFixed(6) : r.converted?.y?.toFixed(3) ?? '';
        if (h === 'Observaciones') return r.error || 'OK';
        const val = r[h];
        return String(val ?? '');
      });
      csvRows.push(row.join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'convertidas.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadExcel = () => {
    if (!batchResult) return;
    try {
      const XLSX = require('xlsx');
      const data = batchResult.results.map((r: any) => {
        const row: any = { ...r };
        row.NORTE = r.converted?.north !== undefined ? r.converted.north.toFixed(3) : r.converted?.lat !== undefined ? r.converted.lat.toFixed(6) : r.converted?.x?.toFixed(3) ?? '';
        row.ESTE = r.converted?.east !== undefined ? r.converted.east.toFixed(3) : r.converted?.lon !== undefined ? r.converted.lon.toFixed(6) : r.converted?.y?.toFixed(3) ?? '';
        row.Observaciones = r.error || 'OK';
        delete row.converted; delete row.error;
        return row;
      });
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Convertidas');
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([buf], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'convertidas.xlsx'; a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  const currentSystem = (id: number | null) => systems.find((s: any) => s.id === id);
  const coordTypeLabel = (t: string) => {
    const labels: any = { geographic: 'Coordenadas Geográficas', geocentric_xyz: 'Geocéntricas XYZ', gauss_kruger: 'Gauss-Krüger', origen_nacional: 'Origen Nacional', local_cartesian: 'Planas Cartesianas (Origen Local)' };
    return labels[t] || t;
  };

  const resetAll = () => {
    setStep(0); setMode(null); setSrcSystemId(null); setSrcCoordType(null);
    setSrcOriginId(null); setSrcOriginName(''); setTgtSystemId(null);
    setTgtCoordType(null); setTgtOriginId(null); setTgtOriginName('');
    setResult(null); setBatchResult(null); setError('');
    setPointLat(''); setPointLon(''); setPointH(''); setPointX(''); setPointY(''); setPointZ('');
    setPointNorth(''); setPointEast(''); setFile(null); setColumnMapping({}); setParsedHeaders([]);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>Conversión de Coordenadas</Typography>

      <Stepper activeStep={step} sx={{ mb: 4, '& .MuiStepLabel-root .Mui-completed': { color: '#27ae60' } }}>
        {steps.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
      </Stepper>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Step 0: Type selection */}
      {step === 0 && (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 4, textAlign: 'center', cursor: 'pointer', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }, transition: 'all 0.3s' }} onClick={() => handleSelectMode('point')}>
              <Typography variant="h2" sx={{ mb: 2 }}>📍</Typography>
              <Typography variant="h5" fontWeight={600}>Punto Individual</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Convierte un único punto entre sistemas de referencia oficiales</Typography>
              <Button variant="contained" sx={{ mt: 3 }}>Continuar</Button>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 4, textAlign: 'center', cursor: 'pointer', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }, transition: 'all 0.3s' }} onClick={() => handleSelectMode('file')}>
              <Typography variant="h2" sx={{ mb: 2 }}>📄</Typography>
              <Typography variant="h5" fontWeight={600}>Archivo</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Convierte miles de coordenadas desde CSV, Excel (.xlsx) o TXT</Typography>
              <Button variant="contained" sx={{ mt: 3 }}>Continuar</Button>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Step 1: Source Reference System */}
      {step === 1 && (
        <Box>
          <Button size="small" onClick={goBack} sx={{ mb: 1 }}>{'<'} Atrás</Button>
          <Typography variant="h6" fontWeight={600} gutterBottom>Sistema de Referencia de Partida</Typography>
          <Grid container spacing={3}>
            {systems.map((sys: any) => (
              <Grid item xs={12} md={6} key={sys.id}>
                <Card sx={{ p: 3, textAlign: 'center', cursor: 'pointer', '&:hover': { boxShadow: 4 }, border: srcSystemId === sys.id ? '2px solid #1a5276' : '1px solid transparent' }}
                  onClick={() => handleSelectSrcSystem(sys.id)}>
                  <Typography variant="h5" fontWeight={700}>{sys.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{sys.name === 'MAGNA-SIRGAS' ? 'GRS80' : 'Hayford (Internacional 1924)'}</Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Step 2: Source Coordinate Type */}
      {step === 2 && (
        <Box>
          <Button size="small" onClick={goBack} sx={{ mb: 1 }}>{'<'} Atrás</Button>
          <Typography variant="h6" fontWeight={600} gutterBottom>Tipo de Coordenadas de Origen</Typography>
          <Grid container spacing={2}>
            {coordTypes.map((ct: any) => (
              <Grid item xs={12} sm={6} key={ct.type}>
                <Card sx={{ p: 2, cursor: 'pointer', '&:hover': { boxShadow: 4 }, border: srcCoordType === ct.type ? '2px solid #1a5276' : '1px solid transparent' }}
                  onClick={() => handleSelectSrcCoordType(ct.type, ct.requiresOrigin)}>
                  <Typography fontWeight={600}>{ct.label}</Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Step 3: Source Origin */}
      {step === 3 && (
        <Box>
          <Button size="small" onClick={goBack} sx={{ mb: 1 }}>{'<'} Atrás</Button>
          <Typography variant="h6" fontWeight={600} gutterBottom>Origen Cartográfico de Origen</Typography>
          {srcCoordType === 'gauss_kruger' ? (
            <Grid container spacing={2}>
              {gaussZones.map((z: any) => (
                <Grid item xs={12} sm={6} md={4} key={z.PK_ORIGENES_GAUSS}>
                  <Card sx={{ p: 2, cursor: 'pointer', '&:hover': { boxShadow: 4 }, border: srcOriginId === z.PK_ORIGENES_GAUSS ? '2px solid #1a5276' : '1px solid transparent' }}
                    onClick={() => { setSrcOriginId(z.PK_ORIGENES_GAUSS); setSrcOriginName(z.NOMBRE); }}>
                    <Typography fontWeight={600}>{z.NOMBRE}</Typography>
                    <Typography variant="caption" color="text.secondary">Meridiano: {z.LONGITUD}°</Typography>
                  </Card>
                </Grid>
              ))}
              {gaussZones.length > 0 && (
                <Grid item xs={12}>
                  <Button variant="contained" onClick={handleSelectSrcOrigin} disabled={!srcOriginId}>Continuar</Button>
                </Grid>
              )}
            </Grid>
          ) : (
            <Box>
              <TextField select fullWidth size="small" label="Departamento" value={deptId || ''} onChange={e => { const v = Number(e.target.value); setDeptId(v); loadMunicipalities(v); }} sx={{ mb: 2 }}>
                <MenuItem value="">Seleccione...</MenuItem>
                {departments.map((d: any) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </TextField>
              <TextField select fullWidth size="small" label="Municipio" value={munPk || ''} onChange={e => { const v = Number(e.target.value); setMunPk(v); loadOrigins(srcSystemId!, v); }} sx={{ mb: 2 }}>
                <MenuItem value="">Seleccione...</MenuItem>
                {municipalities.map((m: any) => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
              </TextField>
              <TextField select fullWidth size="small" label="Origen" value={srcOriginId || ''} onChange={e => { const v = Number(e.target.value); const o = origins.find((o: any) => o.id === v); setSrcOriginId(v); setSrcOriginName(o?.name || ''); }} sx={{ mb: 2 }}>
                <MenuItem value="">Seleccione...</MenuItem>
                {origins.map((o: any) => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
              </TextField>
              <Button variant="contained" onClick={handleSelectSrcOrigin} disabled={!srcOriginId}>Continuar</Button>
            </Box>
          )}
        </Box>
      )}

      {/* Step 4: Target Reference System */}
      {step === 4 && (
        <Box>
          <Button size="small" onClick={goBack} sx={{ mb: 1 }}>{'<'} Atrás</Button>
          <Typography variant="h6" fontWeight={600} gutterBottom>Sistema de Referencia de Destino</Typography>
          <Grid container spacing={3}>
            {systems.map((sys: any) => (
              <Grid item xs={12} md={6} key={sys.id}>
                <Card sx={{ p: 3, textAlign: 'center', cursor: 'pointer', '&:hover': { boxShadow: 4 }, border: tgtSystemId === sys.id ? '2px solid #27ae60' : '1px solid transparent' }}
                  onClick={() => handleSelectTgtSystem(sys.id)}>
                  <Typography variant="h5" fontWeight={700}>{sys.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{sys.name === 'MAGNA-SIRGAS' ? 'GRS80' : 'Hayford (Internacional 1924)'}</Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Step 5: Target Coordinate Type */}
      {step === 5 && (
        <Box>
          <Button size="small" onClick={goBack} sx={{ mb: 1 }}>{'<'} Atrás</Button>
          <Typography variant="h6" fontWeight={600} gutterBottom>Tipo de Coordenadas de Destino</Typography>
          <Grid container spacing={2}>
            {tgtCoordTypes.map((ct: any) => (
              <Grid item xs={12} sm={6} key={ct.type}>
                <Card sx={{ p: 2, cursor: 'pointer', '&:hover': { boxShadow: 4 }, border: tgtCoordType === ct.type ? '2px solid #27ae60' : '1px solid transparent' }}
                  onClick={() => handleSelectTgtCoordType(ct.type, ct.requiresOrigin)}>
                  <Typography fontWeight={600}>{ct.label}</Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Step 6: Target Origin */}
      {step === 6 && (
        <Box>
          <Button size="small" onClick={goBack} sx={{ mb: 1 }}>{'<'} Atrás</Button>
          <Typography variant="h6" fontWeight={600} gutterBottom>Origen Cartográfico de Destino</Typography>
          {tgtCoordType === 'gauss_kruger' ? (
            <Grid container spacing={2}>
              {tgtGaussZones.map((z: any) => (
                <Grid item xs={12} sm={6} md={4} key={z.PK_ORIGENES_GAUSS}>
                  <Card sx={{ p: 2, cursor: 'pointer', '&:hover': { boxShadow: 4 }, border: tgtOriginId === z.PK_ORIGENES_GAUSS ? '2px solid #27ae60' : '1px solid transparent' }}
                    onClick={() => { setTgtOriginId(z.PK_ORIGENES_GAUSS); setTgtOriginName(z.NOMBRE); }}>
                    <Typography fontWeight={600}>{z.NOMBRE}</Typography>
                    <Typography variant="caption" color="text.secondary">Meridiano: {z.LONGITUD}°</Typography>
                  </Card>
                </Grid>
              ))}
              {tgtGaussZones.length > 0 && (
                <Grid item xs={12}>
                  <Button variant="contained" onClick={handleSelectTgtOrigin} disabled={!tgtOriginId}>Continuar</Button>
                </Grid>
              )}
            </Grid>
          ) : (
            <Box>
              <TextField select fullWidth size="small" label="Departamento" value={tgtDeptId || ''} onChange={e => { const v = Number(e.target.value); setTgtDeptId(v); loadMunicipalities(v, true).then(() => { const ms = municipalities; }); }} sx={{ mb: 2 }}>
                <MenuItem value="">Seleccione...</MenuItem>
                {departments.map((d: any) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </TextField>
              <TextField select fullWidth size="small" label="Municipio" value={tgtMunPk || ''} onChange={e => { const v = Number(e.target.value); setTgtMunPk(v); loadOrigins(tgtSystemId!, v, true); }} sx={{ mb: 2 }}>
                <MenuItem value="">Seleccione...</MenuItem>
                {municipalities.map((m: any) => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
              </TextField>
              <TextField select fullWidth size="small" label="Origen" value={tgtOriginId || ''} onChange={e => { const v = Number(e.target.value); const o = tgtOrigins.find((o: any) => o.id === v); setTgtOriginId(v); setTgtOriginName(o?.name || ''); }} sx={{ mb: 2 }}>
                <MenuItem value="">Seleccione...</MenuItem>
                {tgtOrigins.map((o: any) => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
              </TextField>
              <Button variant="contained" onClick={handleSelectTgtOrigin} disabled={!tgtOriginId}>Continuar</Button>
            </Box>
          )}
        </Box>
      )}

      {/* Step 7: Data input */}
      {step === 7 && (
        <Box>
          <Button size="small" onClick={goBack} sx={{ mb: 1 }}>{'<'} Atrás</Button>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            {mode === 'point' ? 'Ingrese las Coordenadas' : 'Cargue el Archivo'}
          </Typography>

          {mode === 'point' ? (
            <Grid container spacing={2} maxWidth={600}>
              {srcCoordType === 'geographic' && (
                <>
                  <Grid item xs={6}><TextField fullWidth size="small" label="Latitud" type="number" value={pointLat} onChange={e => setPointLat(e.target.value)} /></Grid>
                  <Grid item xs={6}><TextField fullWidth size="small" label="Longitud" type="number" value={pointLon} onChange={e => setPointLon(e.target.value)} /></Grid>
                  <Grid item xs={6}><TextField fullWidth size="small" label="Altura (opcional)" type="number" value={pointH} onChange={e => setPointH(e.target.value)} /></Grid>
                </>
              )}
              {srcCoordType === 'geocentric_xyz' && (
                <>
                  <Grid item xs={4}><TextField fullWidth size="small" label="X" type="number" value={pointX} onChange={e => setPointX(e.target.value)} /></Grid>
                  <Grid item xs={4}><TextField fullWidth size="small" label="Y" type="number" value={pointY} onChange={e => setPointY(e.target.value)} /></Grid>
                  <Grid item xs={4}><TextField fullWidth size="small" label="Z" type="number" value={pointZ} onChange={e => setPointZ(e.target.value)} /></Grid>
                </>
              )}
              {(srcCoordType === 'gauss_kruger' || srcCoordType === 'origen_nacional' || srcCoordType === 'local_cartesian') && (
                <>
                  <Grid item xs={6}><TextField fullWidth size="small" label={srcCoordType === 'origen_nacional' ? 'Norte (Origen Nacional)' : 'Norte'} type="number" value={pointNorth} onChange={e => setPointNorth(e.target.value)} /></Grid>
                  <Grid item xs={6}><TextField fullWidth size="small" label={srcCoordType === 'origen_nacional' ? 'Este (Origen Nacional)' : 'Este'} type="number" value={pointEast} onChange={e => setPointEast(e.target.value)} /></Grid>
                </>
              )}
              <Grid item xs={12}>
                <Button variant="contained" size="large" startIcon={<Transform />} onClick={handleConvertPoint} disabled={loading}>
                  {loading ? <CircularProgress size={24} /> : 'Convertir Coordenadas'}
                </Button>
              </Grid>
            </Grid>
          ) : (
            <Box>
              <Button variant="outlined" component="label" startIcon={<CloudUpload />} sx={{ mb: 2 }}>
                Seleccionar Archivo (CSV, XLSX, TXT)
                <input type="file" hidden accept=".csv,.xlsx,.txt" onChange={handleFileChange} />
              </Button>
              {file && <Typography variant="body2" sx={{ mb: 2 }}>{file.name} ({(file.size / 1024).toFixed(1)} KB)</Typography>}
              {parsedHeaders.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Asignación de Columnas</Typography>
                  {srcCoordType === 'geographic' && (
                    <Grid container spacing={2} maxWidth={600}>
                      <Grid item xs={4}><TextField select fullWidth size="small" label="Latitud" value={columnMapping.latCol || ''} onChange={e => setColumnMapping({ ...columnMapping, latCol: e.target.value })}>{parsedHeaders.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}</TextField></Grid>
                      <Grid item xs={4}><TextField select fullWidth size="small" label="Longitud" value={columnMapping.lonCol || ''} onChange={e => setColumnMapping({ ...columnMapping, lonCol: e.target.value })}>{parsedHeaders.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}</TextField></Grid>
                      <Grid item xs={4}><TextField select fullWidth size="small" label="Altura" value={columnMapping.hCol || ''} onChange={e => setColumnMapping({ ...columnMapping, hCol: e.target.value })}>{parsedHeaders.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}</TextField></Grid>
                    </Grid>
                  )}
              {(srcCoordType === 'gauss_kruger' || srcCoordType === 'origen_nacional' || srcCoordType === 'local_cartesian') && (
                    <Grid container spacing={2} maxWidth={600}>
                      <Grid item xs={6}><TextField select fullWidth size="small" label={srcCoordType === 'origen_nacional' ? 'Norte (ON)' : 'Norte'} value={columnMapping.northCol || ''} onChange={e => setColumnMapping({ ...columnMapping, northCol: e.target.value })}>{parsedHeaders.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}</TextField></Grid>
                      <Grid item xs={6}><TextField select fullWidth size="small" label={srcCoordType === 'origen_nacional' ? 'Este (ON)' : 'Este'} value={columnMapping.eastCol || ''} onChange={e => setColumnMapping({ ...columnMapping, eastCol: e.target.value })}>{parsedHeaders.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}</TextField></Grid>
                    </Grid>
                  )}
                  {srcCoordType === 'geocentric_xyz' && (
                    <Grid container spacing={2} maxWidth={600}>
                      <Grid item xs={4}><TextField select fullWidth size="small" label="X" value={columnMapping.xCol || ''} onChange={e => setColumnMapping({ ...columnMapping, xCol: e.target.value })}>{parsedHeaders.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}</TextField></Grid>
                      <Grid item xs={4}><TextField select fullWidth size="small" label="Y" value={columnMapping.yCol || ''} onChange={e => setColumnMapping({ ...columnMapping, yCol: e.target.value })}>{parsedHeaders.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}</TextField></Grid>
                      <Grid item xs={4}><TextField select fullWidth size="small" label="Z" value={columnMapping.zCol || ''} onChange={e => setColumnMapping({ ...columnMapping, zCol: e.target.value })}>{parsedHeaders.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}</TextField></Grid>
                    </Grid>
                  )}
                </Box>
              )}
              <Button variant="contained" size="large" startIcon={<Transform />} onClick={handleBatchConvert} disabled={loading || !file}>
                {loading ? <CircularProgress size={24} /> : 'Convertir Coordenadas'}
              </Button>
            </Box>
          )}
        </Box>
      )}

      {/* Step 8: Results */}
      {step === 8 && (
        <Box>
          <Button size="small" onClick={goBack} sx={{ mb: 1 }}>{'<'} Atrás</Button>
          {result && !batchResult && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 3 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>Coordenadas Originales</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {currentSystem(result.source?.system)?.name} - {coordTypeLabel(result.source?.type)}
                    {result.source?.origin && ` (${result.source.origin})`}
                  </Typography>
                  {Object.entries(result.source?.coords || {}).map(([k, v]) => (
                    <Typography key={k} variant="body2"><strong>{labelKey(k)}:</strong> {typeof v === 'number' ? (['north','east'].includes(k) ? v.toFixed(3) : v.toFixed(6)) : String(v ?? '')}</Typography>
                  ))}
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 3, border: '2px solid #27ae60' }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>Coordenadas Convertidas</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {currentSystem(result.target?.system)?.name} - {coordTypeLabel(result.target?.type)}
                    {result.target?.origin && ` (${result.target.origin})`}
                  </Typography>
                  {Object.entries(result.target?.coords || {}).map(([k, v]) => (
                    <Typography key={k} variant="body2"><strong>{labelKey(k)}:</strong> {typeof v === 'number' ? (['north','east'].includes(k) ? v.toFixed(3) : v.toFixed(6)) : String(v ?? '')}</Typography>
                  ))}
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card sx={{ p: 3 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>Parámetros Técnicos</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} md={3}>
                      <Typography variant="caption" color="text.secondary">Datum origen</Typography>
                      <Typography variant="body2">{result.source?.system}</Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="caption" color="text.secondary">Datum destino</Typography>
                      <Typography variant="body2">{result.target?.system}</Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="caption" color="text.secondary">Convergencia</Typography>
                      <Typography variant="body2">{result.convergence?.toFixed(6) ?? 'N/A'}°</Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="caption" color="text.secondary">Factor de escala</Typography>
                      <Typography variant="body2">{result.scale?.toFixed(9) ?? 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="caption" color="text.secondary">Tiempo</Typography>
                      <Typography variant="body2">{result.processingTimeMs} ms</Typography>
                    </Grid>
                  </Grid>
                </Card>
              </Grid>
              {result.intermediate?.lat && (
                <Grid item xs={12}>
                  <Card sx={{ p: 2, height: 400 }}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>Vista en Mapa</Typography>
                    <Box ref={mapContainerRef} sx={{ height: 340, borderRadius: 2, overflow: 'hidden' }}>
                      <MapContainer center={[result.intermediate.lat, result.intermediate.lon]} zoom={10} style={{ width: '100%', height: '100%' }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={[result.intermediate.lat, result.intermediate.lon]} icon={originIcon}>
                          <Popup>Punto original</Popup>
                        </Marker>
                        <Marker position={[result.intermediate.lat, result.intermediate.lon]} icon={convertedIcon}>
                          <Popup>Punto convertido</Popup>
                        </Marker>
                      </MapContainer>
                    </Box>
                  </Card>
                </Grid>
              )}
              <Grid item xs={12}>
                <Box display="flex" gap={2}>
                  <Button variant="contained" onClick={sendToCalculate}>
                    Enviar a Calcular Tiempo de Rastreo
                  </Button>
                  <Button variant="contained" startIcon={<PictureAsPdf />} onClick={downloadPdf}>
                    Exportar PDF
                  </Button>
                  <Button variant="outlined" onClick={resetAll}>Nueva Conversión</Button>
                </Box>
              </Grid>
            </Grid>
          )}

          {batchResult && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={4}><Card sx={{ p: 2, textAlign: 'center' }}><Typography variant="h5" fontWeight={700}>{batchResult.totalRecords}</Typography><Typography variant="caption">Total Registros</Typography></Card></Grid>
                <Grid item xs={4}><Card sx={{ p: 2, textAlign: 'center', border: '1px solid #27ae60' }}><Typography variant="h5" fontWeight={700} color="success.main">{batchResult.successCount}</Typography><Typography variant="caption">Convertidos</Typography></Card></Grid>
                <Grid item xs={4}><Card sx={{ p: 2, textAlign: 'center', border: '1px solid #e74c3c' }}><Typography variant="h5" fontWeight={700} color="error.main">{batchResult.errorCount}</Typography><Typography variant="caption">Errores</Typography></Card></Grid>
              </Grid>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Tiempo: {batchResult.processingTimeMs} ms</Typography>

              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400, mb: 3 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      {batchResult.results?.length > 0 && Object.keys(batchResult.results[0]).filter(k => k !== 'converted' && k !== 'error').map((h: string) => <TableCell key={h}><strong>{labelKey(h)}</strong></TableCell>)}
                      <TableCell><strong>NORTE</strong></TableCell>
                      <TableCell><strong>ESTE</strong></TableCell>
                      <TableCell><strong>Observaciones</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {batchResult.results?.map((r: any, i: number) => (
                      <TableRow key={i} sx={{ bgcolor: r.error ? 'rgba(231,76,60,0.05)' : 'inherit' }}>
                        {Object.keys(r).filter(k => k !== 'converted' && k !== 'error').map((k: string) => <TableCell key={k}>{typeof r[k] === 'number' ? (['north','east'].includes(k) ? r[k].toFixed(3) : r[k].toFixed(6)) : String(r[k] ?? '')}</TableCell>)}
                        <TableCell>{r.converted?.north !== undefined ? r.converted.north.toFixed(3) : r.converted?.lat !== undefined ? r.converted.lat.toFixed(6) : r.converted?.x?.toFixed(3) ?? ''}</TableCell>
                        <TableCell>{r.converted?.east !== undefined ? r.converted.east.toFixed(3) : r.converted?.lon !== undefined ? r.converted.lon.toFixed(6) : r.converted?.y?.toFixed(3) ?? ''}</TableCell>
                        <TableCell><Typography variant="caption" color={r.error ? 'error' : 'success.main'}>{r.error || 'OK'}</Typography></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box display="flex" gap={2}>
                <Button variant="contained" startIcon={<Download />} onClick={downloadCsv}>Descargar CSV</Button>
                <Button variant="contained" startIcon={<Download />} onClick={downloadExcel}>Descargar Excel</Button>
                <Button variant="outlined" onClick={resetAll}>Nueva Conversión</Button>
              </Box>
            </Box>
          )}
        </Box>
      )}

      {loading && step === 7 && <Box sx={{ mt: 2 }}><CircularProgress /></Box>}
    </Container>
  );
}
