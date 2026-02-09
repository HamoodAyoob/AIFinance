import React, { ReactNode, useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  Badge,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  ShowChart as ShowChartIcon,
  MonetizationOn as MonetizationOnIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountCircleIcon,
  Notifications as NotificationsIcon,
  Home as HomeIcon,
  Analytics as AnalyticsIcon,
  Wallet as WalletIcon,
  PieChart as PieChartIcon,
  CalendarToday as CalendarIcon,
  BarChart as BarChartIcon,
  Chat as ChatIcon,
  Help as HelpIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from 'hooks/useAuth';
import { Brain, Sparkles } from 'lucide-react';

const drawerWidth = 320;

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { user, logout } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const menuItems = [
    { 
      text: 'Dashboard', 
      icon: <DashboardIcon />, 
      path: '/dashboard',
      color: theme.palette.primary.main,
      description: 'Overview & Insights'
    },
    { 
      text: 'Accounts', 
      icon: <AccountBalanceIcon />, 
      path: '/accounts',
      color: theme.palette.success.main,
      description: 'Manage Accounts'
    },
    { 
      text: 'Transactions', 
      icon: <ReceiptIcon />, 
      path: '/transactions',
      color: theme.palette.info.main,
      description: 'Track & Categorize'
    },
    { 
      text: 'Budgets', 
      icon: <TrendingUpIcon />, 
      path: '/budget',
      color: theme.palette.warning.main,
      description: 'Spending Limits'
    },
    { 
      text: 'Predictions', 
      icon: <ShowChartIcon />, 
      path: '/predictions',
      color: theme.palette.error.main,
      description: 'AI Forecasting'
    },
    { 
      text: 'Market Data', 
      icon: <MonetizationOnIcon />, 
      path: '/market',
      color: '#8b5cf6',
      description: 'Stocks & Crypto'
    },
    { 
      text: 'Analytics', 
      icon: <AnalyticsIcon />, 
      path: '/analytics',
      color: '#06b6d4',
      description: 'Advanced Reports'
    },
    { 
      text: 'Settings', 
      icon: <SettingsIcon />, 
      path: '/settings',
      color: '#64748b',
      description: 'Preferences'
    },
  ];

  const notifications = [
    { id: 1, text: 'Budget limit reached for Food category', time: '10 min ago', type: 'warning' },
    { id: 2, text: 'New expense prediction available', time: '1 hour ago', type: 'info' },
    { id: 3, text: 'Investment portfolio up 5.2%', time: '2 hours ago', type: 'success' },
  ];

  const drawer = (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 100%)`,
      }}>
        {/* Logo Header */}
        <Toolbar sx={{ 
          px: 3, 
          py: 2,
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, transparent 100%)',
          borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        }}>
          <Box 
            component={motion.div}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              cursor: 'pointer',
            }}
            onClick={() => navigate('/dashboard')}
          >
            <Box
              sx={{
                position: 'relative',
                width: 48,
                height: 48,
                borderRadius: 14,
                background: theme.palette.gradient.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 30px rgba(99, 102, 241, 0.3)',
              }}
            >
              <Brain style={{ color: 'white', width: 24, height: 24 }} />
              <Sparkles 
                style={{ 
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  color: '#fcd34d',
                  width: 16,
                  height: 16,
                }} 
              />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={900} color="primary">
                AI Finance
              </Typography>
              <Typography variant="caption" sx={{ 
                color: theme.palette.text.secondary,
                background: alpha(theme.palette.primary.main, 0.1),
                px: 1,
                py: 0.25,
                borderRadius: 4,
                fontSize: '0.7rem',
              }}>
                Smart Money Management
              </Typography>
            </Box>
          </Box>
        </Toolbar>
        
        {/* User Profile */}
        <Box sx={{ 
          p: 3, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          background: alpha(theme.palette.primary.main, 0.03),
          borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        }}>
          <Avatar
            sx={{
              width: 52,
              height: 52,
              background: theme.palette.gradient.primary,
              boxShadow: '0 8px 25px rgba(99, 102, 241, 0.4)',
              border: `2px solid ${alpha('#ffffff', 0.2)}`,
            }}
          >
            {user?.full_name?.charAt(0) || user?.email?.split('@')[0]?.charAt(0).toUpperCase() || 'U'}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={600} noWrap>
              {user?.full_name || user?.email?.split('@')[0] || 'User'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user?.email || 'No email'}
            </Typography>
            <Chip 
              label="PRO" 
              size="small" 
              sx={{ 
                mt: 0.5,
                background: theme.palette.gradient.secondary,
                color: 'white',
                fontSize: '0.6rem',
                height: 20,
              }}
            />
          </Box>
        </Box>
        
        {/* Navigation Menu */}
        <List sx={{ 
          p: 2, 
          flex: 1,
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        }}>
          {menuItems.map((item, index) => (
            <motion.div
              key={item.text}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <ListItem disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => {
                    navigate(item.path);
                    if (mobileOpen) setMobileOpen(false);
                  }}
                  sx={{
                    borderRadius: 3,
                    py: 1.5,
                    px: 2,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      height: '100%',
                      width: location.pathname === item.path ? '4px' : '0',
                      background: item.color,
                      transition: 'width 0.3s ease',
                      borderTopRightRadius: 4,
                      borderBottomRightRadius: 4,
                    },
                    '&.Mui-selected': {
                      background: alpha(item.color, 0.1),
                      '&:hover': {
                        background: alpha(item.color, 0.15),
                      },
                      '& .MuiListItemIcon-root': {
                        color: item.color,
                      },
                      '& .MuiListItemText-primary': {
                        color: theme.palette.text.primary,
                        fontWeight: 600,
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ 
                    minWidth: 40,
                    color: location.pathname === item.path ? item.color : theme.palette.text.secondary,
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text}
                    secondary={item.description}
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: location.pathname === item.path ? 600 : 500,
                    }}
                    secondaryTypographyProps={{
                      variant: 'caption',
                      color: 'text.secondary',
                    }}
                  />
                  {location.pathname === item.path && (
                    <Box
                      component={motion.div}
                      layoutId="activeTab"
                      sx={{
                        position: 'absolute',
                        right: 8,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: item.color,
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            </motion.div>
          ))}
        </List>
        
        {/* Footer Actions */}
        <Box sx={{ p: 2, borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 3,
              color: theme.palette.error.main,
              '&:hover': {
                background: alpha(theme.palette.error.main, 0.1),
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Logout" 
              primaryTypographyProps={{
                fontWeight: 600,
              }}
            />
          </ListItemButton>
        </Box>
      </Box>
    </motion.div>
  );

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh',
      background: `radial-gradient(circle at 20% 50%, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 50%),
                  radial-gradient(circle at 80% 20%, ${alpha(theme.palette.secondary.main, 0.05)} 0%, transparent 50%)`,
    }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { sm: 'none' },
              background: alpha(theme.palette.primary.main, 0.1),
              '&:hover': {
                background: alpha(theme.palette.primary.main, 0.2),
              },
            }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 700,
              background: theme.palette.gradient.primary,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {menuItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton 
              onClick={toggleDarkMode}
              sx={{
                background: alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  background: alpha(theme.palette.primary.main, 0.2),
                },
              }}
            >
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
            
            <IconButton 
              onClick={handleNotificationsOpen}
              sx={{
                background: alpha(theme.palette.warning.main, 0.1),
                '&:hover': {
                  background: alpha(theme.palette.warning.main, 0.2),
                },
              }}
            >
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            
            <Box 
              component={motion.div}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                p: 0.75,
                borderRadius: 3,
                background: alpha(theme.palette.primary.main, 0.1),
                cursor: 'pointer',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              }}
              onClick={handleMenuOpen}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  background: theme.palette.gradient.primary,
                }}
              >
                {user?.full_name?.charAt(0) || user?.email?.split('@')[0]?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Typography variant="body2" fontWeight={600}>
                  {user?.full_name?.split(' ')[0] || user?.email?.split('@')[0]}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Premium User
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: {
                mt: 1.5,
                minWidth: 200,
                borderRadius: 3,
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(20px)',
              },
            }}
          >
            <MenuItem onClick={() => { handleMenuClose(); navigate('/settings'); }}>
              <AccountCircleIcon sx={{ mr: 2 }} />
              Profile Settings
            </MenuItem>
            <MenuItem onClick={handleMenuClose}>
              <HelpIcon sx={{ mr: 2 }} />
              Help & Support
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
              <LogoutIcon sx={{ mr: 2 }} />
              Logout
            </MenuItem>
          </Menu>
          
          <Menu
            anchorEl={notificationsAnchorEl}
            open={Boolean(notificationsAnchorEl)}
            onClose={handleNotificationsClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: {
                mt: 1.5,
                width: 320,
                borderRadius: 3,
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(20px)',
              },
            }}
          >
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Notifications
              </Typography>
            </Box>
            <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
              {notifications.map((notification) => (
                <MenuItem 
                  key={notification.id}
                  sx={{ 
                    py: 2,
                    borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                    '&:last-child': { borderBottom: 'none' },
                  }}
                >
                  <Box sx={{ width: '100%' }}>
                    <Typography variant="body2">
                      {notification.text}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {notification.time}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Box>
          </Menu>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: 'none',
              boxShadow: '20px 0 60px rgba(0, 0, 0, 0.1)',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: 'none',
              boxShadow: '20px 0 60px rgba(0, 0, 0, 0.1)',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: '64px',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </Box>
    </Box>
  );
};

export default MainLayout;