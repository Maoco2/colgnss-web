'use client';
import React, { useEffect, useState } from 'react';
import { Container, Card, CardContent, Typography, Box, TextField, Button, Avatar, CircularProgress, Alert, Grid, Chip } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

export default function ProfilePage() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      api.getProfile().then(res => {
        if (res.success && res.data) {
          setCompany(res.data.company || '');
          setPhone(res.data.phone || '');
        }
      }).catch(() => {});
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateProfile({ fullName, company, phone });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
    setSaving(false);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>Perfil</Typography>
      
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={3} sx={{ mb: 4 }}>
            <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: 32 }}>
              {user?.fullName?.charAt(0) || 'U'}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={600}>{user?.fullName}</Typography>
              <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
              <Box sx={{ mt: 1 }}>
                {user?.isPremium && <Chip label="Premium" size="small" color="warning" sx={{ mr: 1 }} />}
                {user?.isAdmin && <Chip label="Admin" size="small" color="error" />}
                {!user?.isPremium && !user?.isAdmin && <Chip label="Usuario" size="small" />}
              </Box>
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Nombre completo" value={fullName} onChange={e => setFullName(e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Correo electrónico" value={user?.email || ''} disabled />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Empresa" value={company} onChange={e => setCompany(e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Teléfono" value={phone} onChange={e => setPhone(e.target.value)} />
            </Grid>
          </Grid>

          {saved && <Alert severity="success" sx={{ mt: 2 }}>Perfil actualizado</Alert>}
          <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ mt: 3 }}>
            {saving ? <CircularProgress size={24} /> : 'Guardar Cambios'}
          </Button>
        </CardContent>
      </Card>
    </Container>
  );
}
