'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Card, CardContent, Typography, TextField, Button, Alert, Box, CircularProgress, MenuItem } from '@mui/material';
import { Satellite } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';

interface FieldErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  profession?: string;
  gender?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading, register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profession, setProfession] = useState('');
  const [gender, setGender] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && !loading) router.push('/dashboard');
  }, [user, loading, router]);

  const validate = (): boolean => {
    const errs: FieldErrors = {};

    if (!fullName || fullName.trim().length < 3) {
      errs.fullName = 'El nombre debe tener al menos 3 caracteres';
    }
    if (!email) {
      errs.email = 'El correo electrónico es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Ingrese un correo electrónico válido';
    }
    if (phone && !/^\+?[\d\s\-().]{7,20}$/.test(phone)) {
      errs.phone = 'Ingrese un número de teléfono válido';
    }
    if (!password) {
      errs.password = 'La contraseña es requerida';
    } else if (password.length < 8) {
      errs.password = 'La contraseña debe tener al menos 8 caracteres';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      errs.password = 'Debe contener mayúscula, minúscula y número';
    }
    if (!confirmPassword) {
      errs.confirmPassword = 'Confirme su contraseña';
    } else if (password !== confirmPassword) {
      errs.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setServerError('');
    try {
      const data = {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        profession: profession.trim() || undefined,
        gender: gender || undefined,
        password,
        confirmPassword,
      };
      await register(data);
      router.push('/dashboard');
    } catch (err: any) {
      setServerError(err.message || 'Error al registrarse');
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
              <Typography variant="body2" color="text.secondary">Crear cuenta</Typography>
            </Box>
            {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}
            <form onSubmit={handleSubmit} noValidate>
              <TextField fullWidth label="Nombre completo" value={fullName} onChange={e => { setFullName(e.target.value); setErrors(prev => ({ ...prev, fullName: undefined })); }} error={!!errors.fullName} helperText={errors.fullName} required sx={{ mb: 2 }} />
              <TextField fullWidth label="Correo electrónico" type="email" value={email} onChange={e => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })); }} error={!!errors.email} helperText={errors.email} required sx={{ mb: 2 }} />
              <TextField fullWidth label="Teléfono" value={phone} onChange={e => { setPhone(e.target.value); setErrors(prev => ({ ...prev, phone: undefined })); }} error={!!errors.phone} helperText={errors.phone || 'Opcional'} sx={{ mb: 2 }} />
              <TextField fullWidth label="Profesión" value={profession} onChange={e => { setProfession(e.target.value); setErrors(prev => ({ ...prev, profession: undefined })); }} error={!!errors.profession} helperText={errors.profession || 'Opcional'} sx={{ mb: 2 }} />
              <TextField fullWidth label="Género" select value={gender} onChange={e => { setGender(e.target.value); setErrors(prev => ({ ...prev, gender: undefined })); }} error={!!errors.gender} helperText={errors.gender} sx={{ mb: 2 }}>
                <MenuItem value="">Seleccione</MenuItem>
                <MenuItem value="male">Masculino</MenuItem>
                <MenuItem value="female">Femenino</MenuItem>
                <MenuItem value="other">Otro</MenuItem>
              </TextField>
              <TextField fullWidth label="Contraseña" type="password" value={password} onChange={e => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined })); }} error={!!errors.password} helperText={errors.password} required sx={{ mb: 2 }} />
              <TextField fullWidth label="Confirmar contraseña" type="password" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setErrors(prev => ({ ...prev, confirmPassword: undefined })); }} error={!!errors.confirmPassword} helperText={errors.confirmPassword} required sx={{ mb: 3 }} />
              <Button fullWidth type="submit" variant="contained" color="secondary" size="large" disabled={submitting}>
                {submitting ? <CircularProgress size={24} /> : 'Registrarse'}
              </Button>
            </form>
            <Box textAlign="center" sx={{ mt: 2 }}>
              <Button href="/login">¿Ya tienes cuenta? Inicia sesión</Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
