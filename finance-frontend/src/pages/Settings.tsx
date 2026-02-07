import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  IconButton,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Avatar,
  Chip,
  Alert,
  LinearProgress,
  Tooltip,
  alpha,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  AccountCircle as AccountCircleIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Language as LanguageIcon,
  Palette as PaletteIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Logout as LogoutIcon,
  VerifiedUser as VerifiedUserIcon,
  Backup as BackupIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  QrCode as QrCodeIcon,
  VpnKey as VpnKeyIcon,
  Devices as DevicesIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from 'services/api';
import { useAuth } from 'hooks/useAuth';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

interface UserSettings {
  email: string;
  full_name: string;
  preferred_currency: string;
  timezone: string;
  date_format: string;
  notification_email: boolean;
  notification_push: boolean;
  notification_sms: boolean;
  theme_mode: 'light' | 'dark' | 'auto';
  two_factor_enabled: boolean;
  data_export_enabled: boolean;
  privacy_public: boolean;
}

interface SecurityLog {
  id: number;
  action: string;
  device: string;
  location: string;
  ip_address: string;
  timestamp: string;
  status: 'success' | 'failed' | 'warning';
}

const currencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
];

const timezones = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Australia/Sydney',
];

const dateFormats = [
  'MM/DD/YYYY',
  'DD/MM/YYYY',
  'YYYY-MM-DD',
  'MMMM DD, YYYY',
];

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [twoFactorStep, setTwoFactorStep] = useState(0);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { user, updateUser, logout } = useAuth();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserSettings>({
    defaultValues: {
      email: user?.email || '',
      full_name: user?.full_name || '',
      preferred_currency: user?.preferred_currency || 'USD',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      date_format: 'MM/DD/YYYY',
      notification_email: true,
      notification_push: true,
      notification_sms: false,
      theme_mode: 'light',
      two_factor_enabled: false,
      data_export_enabled: true,
      privacy_public: false,
    },
  });

  // Fetch security logs
  const { data: securityLogs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['security-logs'],
    queryFn: () => Promise.resolve([] as SecurityLog[]), // Mock for now
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<UserSettings>) => updateUser(data),
    onSuccess: () => {
      toast.success('Settings updated successfully! ✅');
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update settings');
    },
  });

  const handleEditField = (field: string, value: string) => {
    setEditingField(field);
    setEditValue(value);
  };

  const handleSaveField = (field: string) => {
    if (field === 'full_name' || field === 'preferred_currency') {
      updateSettingsMutation.mutate({ [field]: editValue });
    }
    setEditingField(null);
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const handleChangePassword = () => {
    setShowChangePassword(true);
    // In a real app, you would show a password change form
    toast.info('Password change feature would be implemented here');
  };

  const handleEnableTwoFactor = () => {
    setTwoFactorStep(1);
    toast.info('Two-factor authentication setup would begin here');
  };

  const handleExportData = () => {
    setExportDialogOpen(true);
  };

  const handleDeleteAccount = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDeleteAccount = async () => {
    try {
      // await apiService.deleteUser();
      toast.success('Account deletion request submitted');
      logout();
    } catch (error) {
      toast.error('Failed to delete account');
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const securityLogsData: SecurityLog[] = securityLogs || [
    {
      id: 1,
      action: 'Login',
      device: 'Chrome on Windows',
      location: 'New York, US',
      ip_address: '192.168.1.1',
      timestamp: '2024-01-15T10:30:00Z',
      status: 'success',
    },
    {
      id: 2,
      action: 'Password Change',
      device: 'Safari on iPhone',
      location: 'London, UK',
      ip_address: '203.0.113.1',
      timestamp: '2024-01-14T15:45:00Z',
      status: 'success',
    },
    {
      id: 3,
      action: 'Failed Login',
      device: 'Firefox on Linux',
      location: 'Tokyo, JP',
      ip_address: '198.51.100.1',
      timestamp: '2024-01-13T22:10:00Z',
      status: 'failed',
    },
  ];

  return (
    <Box>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h3" fontWeight={900} gutterBottom>
              Settings
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your account preferences and security settings
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outlined"
                startIcon={<BackupIcon />}
                onClick={handleExportData}
                sx={{ borderRadius: 3 }}
              >
                Backup Data
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSubmit((data) => updateSettingsMutation.mutate(data))}
                sx={{ borderRadius: 3 }}
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </motion.div>
          </Box>
        </Box>
      </motion.div>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Account" />
          <Tab label="Preferences" />
          <Tab label="Security" />
          <Tab label="Notifications" />
          <Tab label="Privacy" />
        </Tabs>
      </Box>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Left Column - Settings Forms */}
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Account Settings */}
            {activeTab === 0 && (
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <AccountCircleIcon color="primary" />
                    <Typography variant="h6" fontWeight={700}>
                      Account Information
                    </Typography>
                  </Box>

                  <Grid container spacing={3}>
                    {/* Profile Picture */}
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                        <Avatar
                          sx={{
                            width: 100,
                            height: 100,
                            bgcolor: theme.palette.primary.main,
                            fontSize: '2.5rem',
                            border: `3px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                          }}
                        >
                          {user?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
                        </Avatar>
                        <Box>
                          <Button
                            variant="outlined"
                            sx={{ mr: 2, borderRadius: 2 }}
                          >
                            Upload Photo
                          </Button>
                          <Button
                            variant="text"
                            color="error"
                            sx={{ borderRadius: 2 }}
                          >
                            Remove
                          </Button>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                            Recommended: 500x500px, max 2MB
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    {/* Full Name */}
                    <Grid item xs={12} md={6}>
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Full Name
                        </Typography>
                        {editingField === 'full_name' ? (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                              fullWidth
                              size="small"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                            />
                            <IconButton onClick={() => handleSaveField('full_name')} color="success">
                              <SaveIcon />
                            </IconButton>
                            <IconButton onClick={handleCancelEdit} color="error">
                              <CancelIcon />
                            </IconButton>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" fontWeight={600}>
                              {user?.full_name || 'Not set'}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleEditField('full_name', user?.full_name || '')}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                      </Box>
                    </Grid>

                    {/* Email */}
                    <Grid item xs={12} md={6}>
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Email Address
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EmailIcon fontSize="small" color="action" />
                          <Typography variant="body1" fontWeight={600}>
                            {user?.email}
                          </Typography>
                          <Chip label="Verified" size="small" color="success" icon={<VerifiedUserIcon />} />
                        </Box>
                      </Box>
                    </Grid>

                    {/* Currency */}
                    <Grid item xs={12} md={6}>
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Preferred Currency
                        </Typography>
                        {editingField === 'preferred_currency' ? (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Select
                              fullWidth
                              size="small"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                            >
                              {currencies.map((currency) => (
                                <MenuItem key={currency.code} value={currency.code}>
                                  {currency.symbol} {currency.name} ({currency.code})
                                </MenuItem>
                              ))}
                            </Select>
                            <IconButton onClick={() => handleSaveField('preferred_currency')} color="success">
                              <SaveIcon />
                            </IconButton>
                            <IconButton onClick={handleCancelEdit} color="error">
                              <CancelIcon />
                            </IconButton>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" fontWeight={600}>
                              {currencies.find(c => c.code === user?.preferred_currency)?.symbol || '$'} 
                              {' '}
                              {user?.preferred_currency || 'USD'}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleEditField('preferred_currency', user?.preferred_currency || 'USD')}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                      </Box>
                    </Grid>

                    {/* Member Since */}
                    <Grid item xs={12} md={6}>
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Member Since
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>

                    {/* Account Type */}
                    <Grid item xs={12}>
                      <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600}>
                              AI Finance Pro
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Unlimited accounts, advanced analytics, priority support
                            </Typography>
                          </Box>
                          <Button
                            variant="contained"
                            sx={{ borderRadius: 2 }}
                          >
                            Upgrade Plan
                          </Button>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Preferences */}
            {activeTab === 1 && (
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <PaletteIcon color="primary" />
                    <Typography variant="h6" fontWeight={700}>
                      Preferences
                    </Typography>
                  </Box>

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Timezone</InputLabel>
                        <Select
                          label="Timezone"
                          {...register('timezone')}
                          defaultValue={Intl.DateTimeFormat().resolvedOptions().timeZone}
                        >
                          {timezones.map((tz) => (
                            <MenuItem key={tz} value={tz}>{tz}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Date Format</InputLabel>
                        <Select
                          label="Date Format"
                          {...register('date_format')}
                          defaultValue="MM/DD/YYYY"
                        >
                          {dateFormats.map((format) => (
                            <MenuItem key={format} value={format}>{format}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <FormControlLabel
                        control={<Switch {...register('theme_mode')} />}
                        label="Dark Mode"
                        sx={{ mb: 2 }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Display Options
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <FormControlLabel
                            control={<Switch defaultChecked />}
                            label="Show Currency Symbols"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControlLabel
                            control={<Switch defaultChecked />}
                            label="Animate Charts"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControlLabel
                            control={<Switch defaultChecked />}
                            label="Compact View"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControlLabel
                            control={<Switch />}
                            label="Reduced Motion"
                          />
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Security */}
            {activeTab === 2 && (
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <SecurityIcon color="primary" />
                    <Typography variant="h6" fontWeight={700}>
                      Security
                    </Typography>
                  </Box>

                  <Grid container spacing={3}>
                    {/* Password */}
                    <Grid item xs={12}>
                      <Card variant="outlined" sx={{ mb: 2 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="subtitle1" fontWeight={600}>
                                Password
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Last changed 30 days ago
                              </Typography>
                            </Box>
                            <Button
                              variant="outlined"
                              startIcon={<VpnKeyIcon />}
                              onClick={handleChangePassword}
                              sx={{ borderRadius: 2 }}
                            >
                              Change Password
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Two-Factor Authentication */}
                    <Grid item xs={12}>
                      <Card variant="outlined" sx={{ mb: 2 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="subtitle1" fontWeight={600}>
                                Two-Factor Authentication
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Add an extra layer of security to your account
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={twoFactorStep > 0}
                                    onChange={handleEnableTwoFactor}
                                  />
                                }
                                label=""
                              />
                              <Chip
                                label={twoFactorStep > 0 ? "Enabled" : "Disabled"}
                                color={twoFactorStep > 0 ? "success" : "default"}
                                size="small"
                              />
                            </Box>
                          </Box>

                          {twoFactorStep === 1 && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              transition={{ duration: 0.3 }}
                            >
                              <Box sx={{ mt: 3, pt: 3, borderTop: `1px solid ${alpha('#000', 0.1)}` }}>
                                <Stepper activeStep={twoFactorStep} sx={{ mb: 3 }}>
                                  <Step>
                                    <StepLabel>Scan QR Code</StepLabel>
                                  </Step>
                                  <Step>
                                    <StepLabel>Enter Code</StepLabel>
                                  </Step>
                                  <Step>
                                    <StepLabel>Complete</StepLabel>
                                  </Step>
                                </Stepper>
                                <Box sx={{ textAlign: 'center', p: 3 }}>
                                  <QrCodeIcon sx={{ fontSize: 100, mb: 2, color: 'text.secondary' }} />
                                  <Typography variant="body1" gutterBottom>
                                    Scan this QR code with your authenticator app
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
                                    We recommend Google Authenticator or Authy
                                  </Typography>
                                  <Button
                                    variant="contained"
                                    onClick={() => setTwoFactorStep(2)}
                                    sx={{ borderRadius: 2 }}
                                  >
                                    I've Scanned the QR Code
                                  </Button>
                                </Box>
                              </Box>
                            </motion.div>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Active Sessions */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        Active Sessions
                      </Typography>
                      <List>
                        <ListItem>
                          <ListItemIcon>
                            <DevicesIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary="Chrome on Windows"
                            secondary="New York, US • Last active: Now"
                          />
                          <ListItemSecondaryAction>
                            <Button size="small" color="error">
                              Revoke
                            </Button>
                          </ListItemSecondaryAction>
                        </ListItem>
                        <Divider />
                        <ListItem>
                          <ListItemIcon>
                            <DevicesIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary="Safari on iPhone"
                            secondary="London, UK • Last active: 2 hours ago"
                          />
                          <ListItemSecondaryAction>
                            <Button size="small" color="error">
                              Revoke
                            </Button>
                          </ListItemSecondaryAction>
                        </ListItem>
                      </List>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Notifications */}
            {activeTab === 3 && (
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <NotificationsIcon color="primary" />
                    <Typography variant="h6" fontWeight={700}>
                      Notifications
                    </Typography>
                  </Box>

                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Notification Channels
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <FormControlLabel
                            control={<Switch {...register('notification_email')} defaultChecked />}
                            label="Email Notifications"
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
                            Receive important updates via email
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <FormControlLabel
                            control={<Switch {...register('notification_push')} defaultChecked />}
                            label="Push Notifications"
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
                            Get real-time alerts in your browser
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <FormControlLabel
                            control={<Switch {...register('notification_sms')} />}
                            label="SMS Notifications"
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
                            Receive text messages for critical alerts
                          </Typography>
                        </Grid>
                      </Grid>
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Alert Types
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <FormControlLabel
                            control={<Switch defaultChecked />}
                            label="Budget Alerts"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControlLabel
                            control={<Switch defaultChecked />}
                            label="Payment Reminders"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControlLabel
                            control={<Switch defaultChecked />}
                            label="Security Alerts"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControlLabel
                            control={<Switch />}
                            label="Marketing Updates"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControlLabel
                            control={<Switch defaultChecked />}
                            label="Account Activity"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControlLabel
                            control={<Switch defaultChecked />}
                            label="System Updates"
                          />
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Privacy */}
            {activeTab === 4 && (
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <VerifiedUserIcon color="primary" />
                    <Typography variant="h6" fontWeight={700}>
                      Privacy & Data
                    </Typography>
                  </Box>

                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={<Switch {...register('privacy_public')} />}
                        label="Make Profile Public"
                        sx={{ mb: 2 }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
                        When enabled, your public profile will be visible to other users
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <FormControlLabel
                        control={<Switch {...register('data_export_enabled')} defaultChecked />}
                        label="Allow Data Export"
                        sx={{ mb: 2 }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
                        Enable this to download your data in standard formats
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Data Retention
                      </Typography>
                      <FormControl fullWidth sx={{ mb: 3 }}>
                        <InputLabel>Delete Data After</InputLabel>
                        <Select label="Delete Data After" defaultValue="365">
                          <MenuItem value="30">30 days of inactivity</MenuItem>
                          <MenuItem value="90">90 days of inactivity</MenuItem>
                          <MenuItem value="180">6 months of inactivity</MenuItem>
                          <MenuItem value="365">1 year of inactivity</MenuItem>
                          <MenuItem value="never">Never delete</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <Alert severity="info" sx={{ borderRadius: 2, mb: 3 }}>
                        <Typography variant="body2">
                          Your data is encrypted and stored securely. We never share your personal information with third parties.
                        </Typography>
                      </Alert>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </Grid>

        {/* Right Column - Quick Actions & Security Logs */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {/* Quick Actions */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Quick Actions
                </Typography>
                <List>
                  <ListItem button onClick={handleExportData}>
                    <ListItemIcon>
                      <DownloadIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Export All Data" />
                  </ListItem>
                  <Divider />
                  <ListItem button onClick={() => toast.info('Support contacted')}>
                    <ListItemIcon>
                      <SettingsIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Contact Support" />
                  </ListItem>
                  <Divider />
                  <ListItem button onClick={() => window.open('/terms', '_blank')}>
                    <ListItemIcon>
                      <LanguageIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Terms & Conditions" />
                  </ListItem>
                  <Divider />
                  <ListItem button onClick={() => window.open('/privacy', '_blank')}>
                    <ListItemIcon>
                      <VerifiedUserIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Privacy Policy" />
                  </ListItem>
                  <Divider />
                  <ListItem button onClick={logout}>
                    <ListItemIcon>
                      <LogoutIcon color="error" />
                    </ListItemIcon>
                    <ListItemText primary="Logout" />
                  </ListItem>
                  <Divider />
                  <ListItem button onClick={handleDeleteAccount} sx={{ color: 'error.main' }}>
                    <ListItemIcon>
                      <DeleteIcon color="error" />
                    </ListItemIcon>
                    <ListItemText primary="Delete Account" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            {/* Security Logs */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <HistoryIcon color="primary" />
                  <Typography variant="h6" fontWeight={700}>
                    Recent Security Activity
                  </Typography>
                </Box>

                {isLoadingLogs ? (
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <LinearProgress sx={{ mb: 2 }} />
                    <Typography color="text.secondary">Loading logs...</Typography>
                  </Box>
                ) : (
                  <List dense>
                    {securityLogsData.slice(0, 5).map((log) => (
                      <ListItem key={log.id}>
                        <ListItemIcon>
                          {log.status === 'success' ? (
                            <VerifiedUserIcon color="success" />
                          ) : log.status === 'failed' ? (
                            <SecurityIcon color="error" />
                          ) : (
                            <SecurityIcon color="warning" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={log.action}
                          secondary={`${log.device} • ${new Date(log.timestamp).toLocaleDateString()}`}
                        />
                        <Chip
                          label={log.status}
                          size="small"
                          color={log.status === 'success' ? 'success' : log.status === 'failed' ? 'error' : 'warning'}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  sx={{ mt: 2, borderRadius: 2 }}
                >
                  View All Activity
                </Button>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  System Status
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" fontWeight={900} color="success.main">
                        99.9%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Uptime
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" fontWeight={900} color="info.main">
                        256-bit
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Encryption
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>
                  <Typography variant="body2">
                    All systems operational. Last checked: Just now
                  </Typography>
                </Alert>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Export Data Dialog */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Export Your Data</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Choose what data you want to export:
          </Typography>
          <List>
            <ListItem>
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Transaction History"
              />
            </ListItem>
            <ListItem>
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Account Information"
              />
            </ListItem>
            <ListItem>
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Budget Data"
              />
            </ListItem>
            <ListItem>
              <FormControlLabel
                control={<Switch />}
                label="Analytics Reports"
              />
            </ListItem>
            <ListItem>
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="User Settings"
              />
            </ListItem>
          </List>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Format</InputLabel>
            <Select label="Format" defaultValue="csv">
              <MenuItem value="csv">CSV (Excel compatible)</MenuItem>
              <MenuItem value="json">JSON (Machine readable)</MenuItem>
              <MenuItem value="pdf">PDF (Human readable)</MenuItem>
            </Select>
          </FormControl>
          <Alert severity="info" sx={{ mt: 3, borderRadius: 2 }}>
            <Typography variant="body2">
              Large exports may take several minutes to prepare. You will receive an email when your export is ready.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              setExportDialogOpen(false);
              toast.success('Export started. You will receive an email shortly.');
            }}
          >
            Start Export
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle color="error">Delete Account</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            <Typography variant="body2">
              This action cannot be undone. All your data will be permanently deleted.
            </Typography>
          </Alert>
          <Typography variant="body2" gutterBottom>
            Please confirm by typing your email address:
          </Typography>
          <TextField
            fullWidth
            placeholder={user?.email}
            sx={{ mt: 2 }}
          />
          <FormControlLabel
            control={<Switch />}
            label="I understand that all my data will be deleted"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmDeleteAccount}
            disabled // Disabled for safety - remove in production
          >
            Delete Account Permanently
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;