'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Card, CardContent, Typography, TextField, Button, Alert, Box, CircularProgress } from '@mui/material';
import { Satellite } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && !loading) router.push('/dashboard');
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Credenciales inválidas');
    }
    setSubmitting(false);
  };

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh"><CircularProgress /></Box>;
  if (user) return null;

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg, #1a5276, #15445f)' }}>
      <Container maxWidth="sm">
        <Card sx={{ p: 3 }}>
          <CardContent>
            <Box textAlign="center" sx={{ mb: 3 }}>
              <Satellite sx={{ fontSize: 48, color: '#27ae60' }} />
              <Typography variant="h4" fontWeight={700}>ColGNSS</Typography>
              <Typography variant="body2" color="text.secondary">Iniciar sesión</Typography>
            </Box>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <form onSubmit={handleSubmit}>
              <TextField fullWidth label="Correo electrónico" type="email" value={email} onChange={e => setEmail(e.target.value)} required sx={{ mb: 2 }} />
              <TextField fullWidth label="Contraseña" type="password" value={password} onChange={e => setPassword(e.target.value)} required sx={{ mb: 3 }} />
              <Button fullWidth type="submit" variant="contained" size="large" disabled={submitting}>
                {submitting ? <CircularProgress size={24} /> : 'Iniciar Sesión'}
              </Button>
            </form>
            <Box textAlign="center" sx={{ mt: 2 }}>
              <Button href="/register">¿No tienes cuenta? Regístrate</Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
