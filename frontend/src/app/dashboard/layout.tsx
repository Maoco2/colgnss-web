'use client';
import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton, List, ListItem, ListItemIcon, ListItemText,
  Avatar, Menu, MenuItem, Divider, useMediaQuery, Chip, Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard as DashboardIcon, Map as MapIcon,
  Layers as LayersIcon, Calculate as CalculateIcon, History as HistoryIcon,
  Download as DownloadIcon, Settings as SettingsIcon, Person as PersonIcon,
  Info as InfoIcon, DarkMode, LightMode, Logout, AdminPanelSettings,
  WorkspacePremium, Satellite, Transform as TransformIcon,
} from '@mui/icons-material';
import { useThemeMode } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import AdUnit from '@/components/AdUnit';

const DRAWER_WIDTH = 280;

const menuItems = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { label: 'Red Activa GNSS', icon: <Satellite />, path: '/dashboard/active-network' },
  { label: 'Red Pasiva GNSS', icon: <LayersIcon />, path: '/dashboard/passive-network' },
  { label: 'Calcular Tiempo', icon: <CalculateIcon />, path: '/dashboard/calculate' },
  { label: 'Conversión Coord.', icon: <TransformIcon />, path: '/dashboard/coordinate-conversion' },
  { label: 'Analizar RINEX', icon: <Satellite />, path: '/dashboard/rinex-analysis' },
  { label: 'Historial', icon: <HistoryIcon />, path: '/dashboard/history' },
  { label: 'Descargas', icon: <DownloadIcon />, path: '/dashboard/downloads' },
  { label: 'Configuración', icon: <SettingsIcon />, path: '/dashboard/settings' },
  { label: 'Perfil', icon: <PersonIcon />, path: '/dashboard/profile' },
  { label: 'Acerca de', icon: <InfoIcon />, path: '/dashboard/about' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const isMobile = useMediaQuery('(max-width:768px)');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Satellite sx={{ color: '#27ae60', fontSize: 32 }} />
        <Typography variant="h6" fontWeight={700}>ColGNSS</Typography>
      </Box>
      <Divider />

      {user?.isPremium && (
        <Box sx={{ mx: 2, my: 1.5, p: 1.5, borderRadius: 2, background: 'linear-gradient(135deg, #f6d365, #fda085)', textAlign: 'center' }}>
          <Chip icon={<WorkspacePremium />} label="Premium" size="small" sx={{ bgcolor: 'white', fontWeight: 600 }} />
        </Box>
      )}

      <List sx={{ flex: 1, px: 1 }}>
        {menuItems.map(item => {
          const isActive = pathname === item.path;
          return (
            <ListItem key={item.path} onClick={() => { router.push(item.path); setMobileOpen(false); }}
              sx={{
                borderRadius: 2, mb: 0.5, cursor: 'pointer',
                bgcolor: isActive ? 'primary.main' : 'transparent',
                color: isActive ? 'white' : 'inherit',
                '&:hover': { bgcolor: isActive ? 'primary.dark' : 'action.hover' },
                '& .MuiListItemIcon-root': { color: isActive ? 'white' : 'inherit' },
              }}>
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14, fontWeight: isActive ? 600 : 400 }} />
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ px: 2, py: 1 }}>
        <AdUnit slot="SLOT_SIDEBAR" format="rectangle" style={{ minHeight: 250 }} />
      </Box>

      {user?.isAdmin && (
        <Box sx={{ px: 2, pb: 1 }}>
          <ListItem onClick={() => { router.push('/dashboard/admin'); setMobileOpen(false); }}
            sx={{ borderRadius: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
            <ListItemIcon sx={{ minWidth: 40 }}><AdminPanelSettings /></ListItemIcon>
            <ListItemText primary="Administración" primaryTypographyProps={{ fontSize: 14 }} />
          </ListItem>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" elevation={0} sx={{ zIndex: 1201, bgcolor: 'background.paper', color: 'text.primary', borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar>
          <IconButton edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2, display: { md: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Box component="img" src="/icon.png" sx={{ height: 32, width: 32, mr: 1 }} />
          <Typography variant="subtitle1" fontWeight={600} sx={{ flexGrow: 1 }}>
            {menuItems.find(m => m.path === pathname)?.label || 'ColGNSS'}
          </Typography>

          <Tooltip title={mode === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
            <IconButton onClick={toggleTheme} sx={{ mr: 1 }}>
              {mode === 'dark' ? <LightMode /> : <DarkMode />}
            </IconButton>
          </Tooltip>

          <IconButton onClick={e => setAnchorEl(e.currentTarget)}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 34, height: 34 }}>
              {user?.fullName?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>

          <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
            <MenuItem onClick={() => { router.push('/dashboard/profile'); setAnchorEl(null); }}>
              <PersonIcon sx={{ mr: 1 }} /> Perfil
            </MenuItem>
            <MenuItem onClick={() => { router.push('/dashboard/settings'); setAnchorEl(null); }}>
              <SettingsIcon sx={{ mr: 1 }} /> Configuración
            </MenuItem>
            {user?.isAdmin && (
              <MenuItem onClick={() => { router.push('/dashboard/admin'); setAnchorEl(null); }}>
                <AdminPanelSettings sx={{ mr: 1 }} /> Administración
              </MenuItem>
            )}
            <Divider />
            <MenuItem onClick={handleLogout}>
              <Logout sx={{ mr: 1 }} /> Cerrar Sesión
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        {isMobile ? (
          <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{ '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH } }}>
            {drawerContent}
          </Drawer>
        ) : (
          <Drawer variant="permanent" open
            sx={{ '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, borderRight: 1, borderColor: 'divider' } }}>
            {drawerContent}
          </Drawer>
        )}
      </Box>

      <Box component="main" sx={{ flex: 1, pt: '64px', minHeight: '100vh' }}>
        {children}
      </Box>
    </Box>
  );
}
