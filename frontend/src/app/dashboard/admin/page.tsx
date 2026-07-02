'use client';
import React, { useEffect, useState } from 'react';
import { Container, Grid, Card, CardContent, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Chip, Button } from '@mui/material';
import { People, Satellite, Calculate, AdminPanelSettings } from '@mui/icons-material';
import api from '@/lib/api';

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminDashboard().then(res => {
      if (res.success) setStats(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box display="flex" alignItems="center" gap={1} sx={{ mb: 3 }}>
        <AdminPanelSettings color="error" />
        <Typography variant="h4" fontWeight={700}>Panel de Administración</Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, borderLeft: '4px solid #1a5276' }}>
            <Box display="flex" alignItems="center" gap={2}>
              <People sx={{ fontSize: 36, color: '#1a5276' }} />
              <Box>
                <Typography variant="h4" fontWeight={700}>{stats?.users?.total || 0}</Typography>
                <Typography variant="body2">Usuarios</Typography>
                <Typography variant="caption" color="text.secondary">Premium: {stats?.users?.premium || 0}</Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, borderLeft: '4px solid #27ae60' }}>
            <Box display="flex" alignItems="center" gap={2}>
              <Satellite sx={{ fontSize: 36, color: '#27ae60' }} />
              <Box>
                <Typography variant="h4" fontWeight={700}>{stats?.stations?.total || 0}</Typography>
                <Typography variant="body2">Estaciones</Typography>
                <Typography variant="caption" color="text.secondary">Activas: {stats?.stations?.active || 0} | Pasivas: {stats?.stations?.passive || 0}</Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, borderLeft: '4px solid #e67e22' }}>
            <Box display="flex" alignItems="center" gap={2}>
              <Calculate sx={{ fontSize: 36, color: '#e67e22' }} />
              <Box>
                <Typography variant="h4" fontWeight={700}>{stats?.calculations?.total || 0}</Typography>
                <Typography variant="body2">Cálculos Totales</Typography>
                <Typography variant="caption" color="text.secondary">Hoy: {stats?.calculations?.today || 0}</Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, borderLeft: '4px solid #8e44ad' }}>
            <Box display="flex" alignItems="center" gap={2}>
              <People sx={{ fontSize: 36, color: '#8e44ad' }} />
              <Box>
                <Typography variant="h4" fontWeight={700}>{stats?.users?.admin || 0}</Typography>
                <Typography variant="body2">Administradores</Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Usuarios Recientes</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Rol</TableCell>
                      <TableCell>Registro</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats?.recentUsers?.map((u: any) => (
                      <TableRow key={u.id}>
                        <TableCell>{u.fullName}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell><Chip label={u.role} size="small" /></TableCell>
                        <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Cálculos Recientes</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Usuario</TableCell>
                      <TableCell>Red</TableCell>
                      <TableCell>Tiempo</TableCell>
                      <TableCell>Fecha</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats?.recentCalculations?.map((c: any) => (
                      <TableRow key={c.id}>
                        <TableCell>{c.userEmail}</TableCell>
                        <TableCell><Chip label={c.networkType} size="small" /></TableCell>
                        <TableCell>{c.trackingTime} min</TableCell>
                        <TableCell>{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
