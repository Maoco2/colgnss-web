'use client';
import React, { useEffect, useState } from 'react';
import { Container, Card, CardContent, Typography, Box, Button, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Pagination } from '@mui/material';
import { Delete, Download, Visibility, DeleteSweep } from '@mui/icons-material';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function HistoryPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.getCalculationHistory(page, 20);
      if (res.success) {
        setHistory(res.data || []);
        setTotalPages(res.meta?.totalPages || 1);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchHistory(); }, [page]);

  const handleDelete = async (id: string) => {
    try {
      await api.deleteCalculation(id);
      setDeleteDialog(null);
      fetchHistory();
    } catch {}
  };

  const handleClearAll = async () => {
    try {
      await api.clearHistory();
      fetchHistory();
    } catch {}
  };

  const handleExport = async (id: string) => {
    setExporting(id);
    try {
      const blob = await api.exportPdf(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `colgnss-report-${id.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
    setExporting(null);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Historial</Typography>
          <Typography variant="body2" color="text.secondary">Cálculos de tiempo de rastreo realizados</Typography>
        </Box>
        {history.length > 0 && (
          <Button startIcon={<DeleteSweep />} color="error" variant="outlined" onClick={handleClearAll}>
            Limpiar Todo
          </Button>
        )}
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      ) : history.length === 0 ? (
        <Card sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">No hay cálculos registrados</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Realice su primer cálculo desde el módulo &quot;Calcular Tiempo de Rastreo&quot;
          </Typography>
        </Card>
      ) : (
        <>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Coordenadas</TableCell>
                  <TableCell>Red</TableCell>
                  <TableCell>Estación 1</TableCell>
                  <TableCell>Distancia</TableCell>
                  <TableCell>Tiempo</TableCell>
                  <TableCell>Método</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((calc: any) => (
                  <TableRow key={calc.id} hover>
                    <TableCell>
                      <Typography variant="caption">
                        {new Date(calc.createdAt).toLocaleDateString('es-CO')}
                        <br />
                        {new Date(calc.createdAt).toLocaleTimeString('es-CO')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {calc.latitude?.toFixed(4)}, {calc.longitude?.toFixed(4)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={calc.networkType} size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{calc.station1Code || calc.station1Name || 'N/A'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{calc.distance1?.toFixed(2)} km</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={`${calc.trackingTime} min`} color="primary" size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{calc.method?.slice(0, 30)}...</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleExport(calc.id)} disabled={exporting === calc.id}>
                        {exporting === calc.id ? <CircularProgress size={18} /> : <Download />}
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => setDeleteDialog(calc.id)}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" sx={{ mt: 3 }}>
              <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
            </Box>
          )}
        </>
      )}

      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
        <DialogTitle>Eliminar cálculo</DialogTitle>
        <DialogContent>¿Está seguro de eliminar este cálculo del historial?</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Cancelar</Button>
          <Button color="error" onClick={() => handleDelete(deleteDialog!)}>Eliminar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
