'use client';
import React from 'react';
import { Container, Card, CardContent, Typography, Box, Grid } from '@mui/material';
import { Info, Map, Calculate, Security, Groups, TrendingUp } from '@mui/icons-material';

export default function AboutPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>Acerca de ColGNSS</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        ColGNSS es una plataforma web profesional desarrollada para apoyar a ingenieros, topógrafos, 
        geodestas y profesionales de la geomática en la planificación de levantamientos GNSS en Colombia.
      </Typography>

      <Grid container spacing={3}>
        {[
          { icon: <Map sx={{ fontSize: 40 }} />, title: 'Redes GNSS', desc: 'Consulta de estaciones activas y pasivas del IGAC con visualización en mapas interactivos.' },
          { icon: <Calculate sx={{ fontSize: 40 }} />, title: 'Tiempo de Rastreo', desc: 'Cálculo automático del tiempo mínimo de rastreo basado en la Resolución 643 de 2018 del IGAC.' },
          { icon: <Security sx={{ fontSize: 40 }} />, title: 'Informes Técnicos', desc: 'Generación de informes profesionales en PDF con mapas, resultados y código QR.' },
          { icon: <TrendingUp sx={{ fontSize: 40 }} />, title: 'Comparación Inteligente', desc: 'Comparación entre redes activa, pasiva y mixta para seleccionar la mejor alternativa.' },
          { icon: <Groups sx={{ fontSize: 40 }} />, title: 'Multiplataforma', desc: 'Funciona en computadores, tabletas y dispositivos móviles con diseño responsivo.' },
          { icon: <Info sx={{ fontSize: 40 }} />, title: 'Resolución 643/2018', desc: 'Implementación oficial de la metodología del IGAC para tiempos de rastreo GNSS.' },
        ].map((item, i) => (
          <Grid item xs={12} sm={6} key={i}>
            <Card sx={{ p: 3, display: 'flex', gap: 2 }}>
              <Box sx={{ color: 'primary.main' }}>{item.icon}</Box>
              <Box>
                <Typography variant="h6" fontWeight={600}>{item.title}</Typography>
                <Typography variant="body2" color="text.secondary">{item.desc}</Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mt: 4, p: 3, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>Tecnologías</Typography>
        <Typography variant="body2">
          Next.js · TypeScript · Material UI · Tailwind CSS · Google Maps API · 
          NestJS · PostgreSQL/PostGIS · Firebase Auth · JWT · PDFKit
        </Typography>
        <Typography variant="caption" sx={{ mt: 2, display: 'block', opacity: 0.8 }}>
          Versión 1.0.0 &copy; {new Date().getFullYear()} ColGNSS
        </Typography>
      </Card>
    </Container>
  );
}
