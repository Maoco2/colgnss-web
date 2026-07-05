'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  AppBar, Toolbar, Typography, Button, Container, Grid, Card, CardContent,
  Box, IconButton, useMediaQuery, Drawer, List, ListItem, ListItemText,
  Fab, Dialog, DialogTitle, DialogContent, TextField, Alert,
  CircularProgress, Snackbar, MenuItem,
} from '@mui/material';
import {
  Menu as MenuIcon, Map as MapIcon, Calculate as CalculateIcon,
  Assessment as AssessmentIcon, Security as SecurityIcon,
  TrendingUp as TrendingUpIcon, Groups as GroupsIcon,
  DarkMode, LightMode, Close,
} from '@mui/icons-material';
import { useThemeMode } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import AdUnit from '@/components/AdUnit';

export default function LandingPage() {
  const router = useRouter();
  const { user, loading, login, register } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const isMobile = useMediaQuery('(max-width:768px)');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regProfession, setRegProfession] = useState('');
  const [regGender, setRegGender] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.getStationStatistics().then(r => {
      if (r.success) setStats(r.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (user && !loading) router.push('/dashboard');
  }, [user, loading, router]);

  const handleLogin = async () => {
    setSubmitting(true);
    setError('');
    try {
      await login(loginEmail, loginPassword);
      setLoginOpen(false);
      router.push('/dashboard');
    } catch (e: any) {
      setError(e.message || 'Error al iniciar sesión');
    }
    setSubmitting(false);
  };

  const handleRegister = async () => {
    setSubmitting(true);
    setError('');
    try {
      await register({
        fullName: regName,
        email: regEmail,
        phone: regPhone || undefined,
        profession: regProfession || undefined,
        gender: regGender || undefined,
        password: regPassword,
        confirmPassword: regConfirmPassword,
      });
      setRegisterOpen(false);
      setSuccess('Registro exitoso. Por favor verifica tu correo electrónico.');
    } catch (e: any) {
      setError(e.message || 'Error al registrarse');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  const navItems = [
    { label: 'Inicio', href: '#' },
    { label: 'Red Activa', href: '#active' },
    { label: 'Red Pasiva', href: '#passive' },
    { label: 'Calculadora', href: '#calculator' },
    { label: 'Contacto', href: '#contact' },
  ];

  return (
    <Box>
      <AppBar position="fixed" elevation={0} sx={{ bgcolor: 'rgba(26,82,118,0.95)', backdropFilter: 'blur(10px)' }}>
        <Toolbar>
          <Box component="img" src="/icon.png" sx={{ height: 32, width: 32, mr: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, flexGrow: 1 }}>
            ColGNSS
          </Typography>
          {!isMobile && navItems.map(item => (
            <Button key={item.label} color="inherit" href={item.href} sx={{ mx: 0.5 }}>
              {item.label}
            </Button>
          ))}
          <IconButton onClick={toggleTheme} color="inherit" sx={{ ml: 1 }}>
            {mode === 'dark' ? <LightMode /> : <DarkMode />}
          </IconButton>
          {!isMobile && (
            <>
              <Button color="inherit" onClick={() => setLoginOpen(true)} sx={{ ml: 1 }}>
                Iniciar Sesión
              </Button>
              <Button variant="contained" color="secondary" onClick={() => setRegisterOpen(true)} sx={{ ml: 1 }}>
                Registrarse
              </Button>
            </>
          )}
          {isMobile && (
            <IconButton color="inherit" onClick={() => setDrawerOpen(true)}>
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 280, pt: 2 }}>
          <IconButton onClick={() => setDrawerOpen(false)} sx={{ ml: 1 }}>
            <Close />
          </IconButton>
          <List>
            {navItems.map(item => (
              <ListItem key={item.label} component="a" href={item.href} onClick={() => setDrawerOpen(false)}>
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
            <ListItem>
              <Button fullWidth variant="outlined" onClick={() => { setLoginOpen(true); setDrawerOpen(false); }}>
                Iniciar Sesión
              </Button>
            </ListItem>
            <ListItem>
              <Button fullWidth variant="contained" color="secondary" onClick={() => { setRegisterOpen(true); setDrawerOpen(false); }}>
                Registrarse
              </Button>
            </ListItem>
          </List>
        </Box>
      </Drawer>

      <Box sx={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #1a5276 0%, #15445f 30%, #1a5276 70%, #27ae60 100%)',
        display: 'flex', alignItems: 'center', pt: 8 
      }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Box component="img" src="/logo-launch.png" sx={{ height: 300, mb: 2 }} />
              <Typography variant="h5" color="rgba(255,255,255,0.9)" sx={{ mt: 2, mb: 4, fontSize: { xs: '1rem', md: '1.5rem' } }}>
                Planificación Profesional de Levantamientos GNSS en Colombia
              </Typography>
              <Typography variant="body1" color="rgba(255,255,255,0.7)" sx={{ mb: 4, maxWidth: 600 }}>
                Consulte las estaciones de la Red Activa y Pasiva del IGAC, calcule automáticamente 
                el tiempo mínimo de rastreo según la Resolución 643 de 2018 y genere informes técnicos profesionales.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button variant="contained" color="secondary" size="large" onClick={() => setRegisterOpen(true)}>
                  Comenzar Gratis
                </Button>
                <Button variant="outlined" size="large" href="#calculator" sx={{ color: 'white', borderColor: 'white', '&:hover': { borderColor: '#27ae60', bgcolor: 'rgba(39,174,96,0.1)' } }}>
                  Calcular Tiempo
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box sx={{ 
                bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 4, p: 4, backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <Typography variant="h6" color="white" gutterBottom>Estadísticas</Typography>
                {stats && (
                  <>
                    <Typography variant="h3" color="#27ae60" fontWeight={700}>{stats.total}</Typography>
                    <Typography color="rgba(255,255,255,0.7)">Estaciones GNSS</Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="rgba(255,255,255,0.7)">
                        • {stats.active} Estaciones Activas
                      </Typography>
                      <Typography variant="body2" color="rgba(255,255,255,0.7)">
                        • {stats.passive} Estaciones Pasivas
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Box sx={{ py: 4, bgcolor: mode === 'dark' ? '#0a0a0a' : '#f8f9fa' }}>
        <Container maxWidth="md">
          <AdUnit slot="SLOT_HERO_FEATURES" format="horizontal" style={{ minHeight: 90 }} />
        </Container>
      </Box>

      <Box sx={{ py: 10, bgcolor: mode === 'dark' ? '#0a0a0a' : '#f8f9fa' }}>
        <Container maxWidth="lg">
          <Typography variant="h3" align="center" fontWeight={700} sx={{ mb: 2 }}>
            Redes GNSS de Colombia
          </Typography>
          <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 6 }}>
            Acceda a las redes activa y pasiva del IGAC para sus levantamientos
          </Typography>
          <Grid container spacing={4}>
            {[
              { icon: <MapIcon sx={{ fontSize: 48, color: '#1a5276' }} />, title: 'Red Activa GNSS', desc: 'Estaciones de monitoreo continuo con datos RINEX disponibles para descarga. Cobertura nacional.' },
              { icon: <AssessmentIcon sx={{ fontSize: 48, color: '#27ae60' }} />, title: 'Red Pasiva GNSS', desc: 'Vértices geodésicos materializados con coordenadas de alta precisión en todo el territorio.' },
              { icon: <CalculateIcon sx={{ fontSize: 48, color: '#1a5276' }} />, title: 'Tiempo de Rastreo', desc: 'Cálculo automático del tiempo mínimo de rastreo según Resolución 643 de 2018 del IGAC.' },
              { icon: <SecurityIcon sx={{ fontSize: 48, color: '#27ae60' }} />, title: 'Informes Técnicos', desc: 'Genere informes profesionales en PDF con mapas, resultados y código QR.' },
              { icon: <TrendingUpIcon sx={{ fontSize: 48, color: '#1a5276' }} />, title: 'Comparación Inteligente', desc: 'Compare redes activa, pasiva y mixta para seleccionar la mejor opción.' },
              { icon: <GroupsIcon sx={{ fontSize: 48, color: '#27ae60' }} />, title: 'Multiplataforma', desc: 'Acceda desde cualquier dispositivo con diseño responsivo y soporte PWA.' },
            ].map((feat, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Card sx={{ height: '100%', textAlign: 'center', p: 3, transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-5px)' } }}>
                  <Box sx={{ mb: 2 }}>{feat.icon}</Box>
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} gutterBottom>{feat.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{feat.desc}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Box sx={{ py: 4, bgcolor: mode === 'dark' ? '#0a0a0a' : '#fff' }}>
        <Container maxWidth="md">
          <AdUnit slot="SLOT_FEATURES_CALC" format="auto" style={{ minHeight: 90 }} />
        </Container>
      </Box>

      <Box id="calculator" sx={{ py: 10 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h3" fontWeight={700} gutterBottom>
                Calcule su Tiempo de Rastreo
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Seleccione un punto en el mapa o ingrese coordenadas para calcular automáticamente 
                el tiempo mínimo de rastreo basado en la Resolución 643 de 2018 del IGAC.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
                {'• Tiempo base: 65 minutos para distancias < 10 km\n• Incremento: 3 min/km entre 10 y 80 km\n• Soporte para receptores L1 y L1/L2\n• Comparación entre redes activa, pasiva y mixta'}
              </Typography>
              <Button variant="contained" size="large" onClick={() => router.push(user ? '/dashboard' : '/register')}>
                Probar Calculadora
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                bgcolor: mode === 'dark' ? '#1e1e1e' : '#e8f0fe', 
                borderRadius: 4, p: 4, textAlign: 'center',
                border: '1px solid', borderColor: mode === 'dark' ? '#333' : '#c5d9f7'
              }}>
                <CalculateIcon sx={{ fontSize: 80, color: '#1a5276', mb: 2 }} />
                <Typography variant="h4" color="primary" fontWeight={700}>
                  T = 65 + 3 × (D - 10)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Algoritmo de Cálculo - Resolución 643 de 2018
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Box sx={{ py: 4, bgcolor: mode === 'dark' ? '#0a0a0a' : '#f8f9fa' }}>
        <Container maxWidth="md">
          <AdUnit slot="SLOT_BEFORE_FOOTER" format="horizontal" style={{ minHeight: 90 }} />
        </Container>
      </Box>

      <Box sx={{ bgcolor: '#1a5276', color: 'white', py: 6 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                <MapIcon sx={{ verticalAlign: 'middle', mr: 1, color: '#27ae60' }} />
                ColGNSS
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Plataforma profesional para la planificación de levantamientos GNSS en Colombia.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>Enlaces</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Acerca de</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Términos de Uso</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Privacidad</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Contacto</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>Contacto</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Desarrollado para ingenieros, topógrafos y geodestas de Colombia.
              </Typography>
            </Grid>
          </Grid>
          <Box sx={{ mt: 4, pt: 4, borderTop: '1px solid rgba(255,255,255,0.2)', textAlign: 'center' }}>
            <Typography variant="body2" sx={{ opacity: 0.6 }}>
              &copy; {new Date().getFullYear()} ColGNSS. Todos los derechos reservados.
            </Typography>
          </Box>
        </Container>
      </Box>

      <Dialog open={loginOpen} onClose={() => setLoginOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Iniciar Sesión</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField fullWidth label="Correo electrónico" type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} sx={{ mb: 2, mt: 1 }} />
          <TextField fullWidth label="Contraseña" type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} sx={{ mb: 2 }} />
          <Button fullWidth variant="contained" onClick={handleLogin} disabled={submitting} sx={{ mb: 1 }}>
            {submitting ? <CircularProgress size={24} /> : 'Iniciar Sesión'}
          </Button>
          <Button fullWidth color="primary" onClick={() => { setLoginOpen(false); setRegisterOpen(true); }}>
            ¿No tienes cuenta? Regístrate
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={registerOpen} onClose={() => setRegisterOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Crear Cuenta</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField fullWidth label="Nombre completo" value={regName} onChange={e => setRegName(e.target.value)} sx={{ mb: 2, mt: 1 }} required />
          <TextField fullWidth label="Correo electrónico" type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} sx={{ mb: 2 }} required />
          <TextField fullWidth label="Teléfono" value={regPhone} onChange={e => setRegPhone(e.target.value)} sx={{ mb: 2 }} placeholder="Opcional" />
          <TextField fullWidth label="Profesión" value={regProfession} onChange={e => setRegProfession(e.target.value)} sx={{ mb: 2 }} placeholder="Opcional" />
          <TextField fullWidth label="Género" select value={regGender} onChange={e => setRegGender(e.target.value)} sx={{ mb: 2 }}>
            <MenuItem value="">Seleccione</MenuItem>
            <MenuItem value="male">Masculino</MenuItem>
            <MenuItem value="female">Femenino</MenuItem>
            <MenuItem value="other">Otro</MenuItem>
          </TextField>
          <TextField fullWidth label="Contraseña" type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} sx={{ mb: 2 }} required />
          <TextField fullWidth label="Confirmar contraseña" type="password" value={regConfirmPassword} onChange={e => setRegConfirmPassword(e.target.value)} sx={{ mb: 2 }} required />
          <Button fullWidth variant="contained" color="secondary" onClick={handleRegister} disabled={submitting}>
            {submitting ? <CircularProgress size={24} /> : 'Registrarse'}
          </Button>
          <Button fullWidth color="primary" onClick={() => { setRegisterOpen(false); setLoginOpen(true); }} sx={{ mt: 1 }}>
            ¿Ya tienes cuenta? Inicia sesión
          </Button>
        </DialogContent>
      </Dialog>

      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess('')} message={success} />
    </Box>
  );
}
