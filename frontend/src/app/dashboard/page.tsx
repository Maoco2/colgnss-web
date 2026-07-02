'use client';
import React, { useEffect, useState } from 'react';
import { Container, Grid, Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';
import { Map as MapIcon, Calculate as CalculateIcon, History as HistoryIcon, Satellite, Transform as TransformIcon } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getStationStatistics().catch(() => null),
      api.getCalculationHistory(1, 5).catch(() => null),
      api.getCoordinateHistory(1).catch(() => null),
      api.getRinexHistory(1, 1).catch(() => null),
    ]).then(([stationStats, calcHistory, coordHistory, rinexHistory]) => {
      const calcTotal = (calcHistory?.meta?.total || 0) + (coordHistory?.meta?.total || 0) + (rinexHistory?.meta?.total || 0);
      setStats({ stations: stationStats?.data, history: calcHistory?.data, calcTotal });
      setLoading(false);
    });
  }, []);

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" height="80vh"><CircularProgress /></Box>;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Bienvenido, {user?.fullName?.split(' ')[0] || 'Usuario'}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Panel de control de la plataforma de planificación GNSS
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, borderLeft: '4px solid #1a5276' }}>
            <Box display="flex" alignItems="center" gap={2}>
              <Satellite sx={{ fontSize: 40, color: '#1a5276' }} />
              <Box>
                <Typography variant="h4" fontWeight={700}>{stats?.stations?.total || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Estaciones GNSS</Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, borderLeft: '4px solid #27ae60' }}>
            <Box display="flex" alignItems="center" gap={2}>
              <CalculateIcon sx={{ fontSize: 40, color: '#27ae60' }} />
              <Box>
                <Typography variant="h4" fontWeight={700}>{stats?.calcTotal || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Cálculos Realizados</Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, borderLeft: '4px solid #e67e22' }}>
            <Box display="flex" alignItems="center" gap={2}>
              <MapIcon sx={{ fontSize: 40, color: '#e67e22' }} />
              <Box>
                <Typography variant="h4" fontWeight={700}>{stats?.stations?.active || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Estaciones Activas</Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, borderLeft: '4px solid #8e44ad' }}>
            <Box display="flex" alignItems="center" gap={2}>
              <HistoryIcon sx={{ fontSize: 40, color: '#8e44ad' }} />
              <Box>
                <Typography variant="h4" fontWeight={700}>{stats?.stations?.passive || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Estaciones Pasivas</Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h5" fontWeight={600} sx={{ mt: 6, mb: 3 }}>
        Acciones Rápidas
      </Typography>
      <Grid container spacing={3}>
        {[
          { title: 'Red Activa GNSS', desc: 'Consultar estaciones activas del IGAC', icon: <Satellite sx={{ fontSize: 48 }} />, path: '/dashboard/active-network', color: '#1a5276' },
          { title: 'Red Pasiva GNSS', desc: 'Consultar estaciones pasivas', icon: <MapIcon sx={{ fontSize: 48 }} />, path: '/dashboard/passive-network', color: '#27ae60' },
          { title: 'Calcular Tiempo', desc: 'Calcular tiempo mínimo de rastreo', icon: <CalculateIcon sx={{ fontSize: 48 }} />, path: '/dashboard/calculate', color: '#e67e22' },
          { title: 'Conversión Coord.', desc: 'Convertir coordenadas geográficas', icon: <TransformIcon sx={{ fontSize: 48 }} />, path: '/dashboard/coordinate-conversion', color: '#2980b9' },
          { title: 'Analizar RINEX', desc: 'Validar archivos y generar concepto técnico', icon: <Satellite sx={{ fontSize: 48 }} />, path: '/dashboard/rinex-analysis', color: '#16a085' },
          { title: 'Historial', desc: 'Ver cálculos anteriores', icon: <HistoryIcon sx={{ fontSize: 48 }} />, path: '/dashboard/history', color: '#8e44ad' },
        ].map((item, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ p: 3, textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }}
              onClick={() => { window.location.href = item.path; }}>
              <Box sx={{ color: item.color, mb: 2 }}>{item.icon}</Box>
              <Typography variant="h6" fontWeight={600}>{item.title}</Typography>
              <Typography variant="body2" color="text.secondary">{item.desc}</Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {stats?.history?.length > 0 && (
        <>
          <Typography variant="h5" fontWeight={600} sx={{ mt: 6, mb: 3 }}>
            Cálculos Recientes
          </Typography>
          <Grid container spacing={2}>
            {stats.history.slice(0, 5).map((calc: any) => (
              <Grid item xs={12} key={calc.id}>
                <Card sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {calc.station1Code || calc.station1Name} - {calc.trackingTime} min
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(calc.createdAt).toLocaleString('es-CO')} | Red: {calc.networkType} | Distancia: {calc.distance1?.toFixed(2)} km
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="primary" fontWeight={600}>
                    {calc.method}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Container>
  );
}
