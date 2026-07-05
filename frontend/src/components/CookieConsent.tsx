'use client';
import { useState, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('adsense-consent');
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem('adsense-consent', 'accepted');
    setVisible(false);
  };

  const reject = () => {
    localStorage.setItem('adsense-consent', 'rejected');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <Box sx={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      bgcolor: '#1a5276', color: 'white', px: { xs: 2, md: 4 }, py: 2,
      boxShadow: '0 -4px 20px rgba(0,0,0,0.2)',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, flexWrap: 'wrap', maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="body2" sx={{ flex: 1, minWidth: 250 }}>
          Usamos cookies propias y de terceros para mostrar anuncios relevantes. Al continuar navegando aceptas su uso.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" onClick={reject} sx={{ color: 'white', borderColor: 'white', '&:hover': { borderColor: '#27ae60' } }}>
            Solo necesarias
          </Button>
          <Button variant="contained" size="small" color="secondary" onClick={accept}>
            Aceptar
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
