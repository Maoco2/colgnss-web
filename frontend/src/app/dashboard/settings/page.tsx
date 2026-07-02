'use client';
import React, { useState } from 'react';
import { Container, Card, CardContent, Typography, Box, Switch, FormControlLabel, Button, Divider, Alert, TextField } from '@mui/material';
import { useThemeMode } from '@/contexts/ThemeContext';

export default function SettingsPage() {
  const { mode, toggleTheme } = useThemeMode();
  const [saved, setSaved] = useState(false);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>Configuración</Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>Apariencia</Typography>
          <FormControlLabel control={<Switch checked={mode === 'dark'} onChange={toggleTheme} />} label="Modo oscuro" />
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>Preferencias de mapa</Typography>
          <FormControlLabel control={<Switch defaultChecked />} label="Mostrar radio de influencia" />
          <FormControlLabel control={<Switch defaultChecked />} label="Centrar en mi ubicación al iniciar" />
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>Notificaciones</Typography>
          <FormControlLabel control={<Switch defaultChecked />} label="Notificaciones por correo electrónico" />
          <FormControlLabel control={<Switch />} label="Notificaciones de novedades" />
        </CardContent>
      </Card>

      {saved && <Alert severity="success" sx={{ mb: 2 }}>Configuración guardada</Alert>}
      <Button variant="contained" onClick={() => setSaved(true)}>Guardar Cambios</Button>
    </Container>
  );
}
