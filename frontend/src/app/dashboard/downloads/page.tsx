'use client';
import React, { useState } from 'react';
import { Container, Card, CardContent, Typography, Box, Button, Grid, Chip, Alert } from '@mui/material';
import { Download, FileDownload, InsertDriveFile } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';

export default function DownloadsPage() {
  const { user } = useAuth();
  const [downloading, setDownloading] = useState(false);

  const handleExportData = () => {
    setDownloading(true);
    setTimeout(() => setDownloading(false), 2000);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>Descargas</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Descargue datos de estaciones GNSS y exportaciones de sus cálculos
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <InsertDriveFile sx={{ fontSize: 48, color: '#1a5276', mb: 2 }} />
            <Typography variant="h6" fontWeight={600}>Datos Red Activa</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Descargue el catálogo completo de estaciones activas GNSS
            </Typography>
            <Button variant="outlined" startIcon={<FileDownload />} fullWidth onClick={handleExportData}>
              Descargar CSV
            </Button>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <InsertDriveFile sx={{ fontSize: 48, color: '#27ae60', mb: 2 }} />
            <Typography variant="h6" fontWeight={600}>Datos Red Pasiva</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Descargue el catálogo de vértices geodésicos
            </Typography>
            <Button variant="outlined" startIcon={<FileDownload />} fullWidth onClick={handleExportData}>
              Descargar CSV
            </Button>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>Exportar Historial</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Descargue todos sus cálculos en formatos CSV o PDF
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="contained" startIcon={<Download />} onClick={handleExportData}>
                {downloading ? 'Descargando...' : 'Exportar CSV'}
              </Button>
              <Button variant="outlined" onClick={handleExportData}>
                Exportar Todos (PDF)
              </Button>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {!user?.isPremium && (
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            Con la suscripción Premium obtendrá descargas ilimitadas y exportaciones avanzadas.{' '}
            <Button size="small" href="/dashboard/settings">Ver planes</Button>
          </Typography>
        </Alert>
      )}
    </Container>
  );
}
