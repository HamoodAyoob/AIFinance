import React, { useState } from 'react';
import {
  Container,
  Paper,
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  InputAdornment,
  IconButton,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Grid,
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  CurrencyExchange as CurrencyExchangeIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from 'hooks/useAuth';
import { useForm } from 'react-hook-form';
import { CreditCard, Shield, Zap } from 'lucide-react';

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
  preferred_currency: string;
}

const steps = ['Account Details', 'Security', 'Preferences', 'Complete'];

const currencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
];

const benefits = [
  { icon: <Zap size={24} />, title: 'AI-Powered Insights', desc: 'Smart predictions' },
  { icon: <CreditCard size={24} />, title: 'Track Everything', desc: 'All accounts in one place' },
  { icon: <Shield size={24} />, title: 'Bank-Level Security', desc: '256-bit encryption' },
  { icon: <TrendingUpIcon />, title: 'Grow Wealth', desc: 'Investment tracking' },
];

const Register: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    trigger,
  } = useForm<RegisterFormData>();

  const password = watch('password');
  const email = watch('email');

  const handleNext = async () => {
    let isValid = false;
    
    switch (activeStep) {
      case 0:
        isValid = await trigger(['full_name', 'email']);
        break;
      case 1:
        isValid = await trigger(['password', 'confirmPassword']);
        break;
      case 2:
        isValid = await trigger(['preferred_currency']);
        break;
    }
    
    if (isValid) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const onSubmit = async (data: RegisterFormData) => {
    setError('');
    setIsLoading(true);
    
    const result = await registerUser({
      email: data.email,
      password: data.password,
      full_name: data.full_name,
      preferred_currency: data.preferred_currency,
    });
    
    if (!result.success) {
      setError(result.error || 'Registration failed');
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background animations */}
      <Box
        component={motion.div}
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 90, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        sx={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          filter: 'blur(30px)',
        }}
      />

      <Container maxWidth="lg">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: 4,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            style={{ width: '100%', maxWidth: 1200 }}
          >
            <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', lg: 'row' } }}>
              {/* Left Side - Benefits */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                style={{ flex: 1 }}
              >
                <Paper
                  elevation={24}
                  sx={{
                    p: 4,
                    height: '100%',
                    borderRadius: 4,
                    backdropFilter: 'blur(20px)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'white',
                  }}
                >
                  <Box sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Box
                        sx={{
                          width: 60,
                          height: 60,
                          borderRadius: 16,
                          background: 'rgba(255, 255, 255, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                        }}
                      >
                        <AccountBalanceWalletIcon sx={{ fontSize: 32 }} />
                      </Box>
                      <Typography variant="h3" fontWeight={900}>
                        Join AI Finance
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ opacity: 0.9 }}>
                      Start managing your finances intelligently
                    </Typography>
                  </Box>

                  <Box sx={{ mt: 6 }}>
                    {benefits.map((benefit, index) => (
                      <motion.div
                        key={benefit.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 + 0.4 }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                          <Box
                            sx={{
                              width: 56,
                              height: 56,
                              borderRadius: 16,
                              background: 'rgba(255, 255, 255, 0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                            }}
                          >
                            {benefit.icon}
                          </Box>
                          <Box>
                            <Typography variant="h6" fontWeight={600}>
                              {benefit.title}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                              {benefit.desc}
                            </Typography>
                          </Box>
                        </Box>
                      </motion.div>
                    ))}
                  </Box>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    <Box
                      sx={{
                        mt: 6,
                        p: 3,
                        borderRadius: 3,
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                      }}
                    >
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        "AI Finance transformed how I manage money. The predictions are incredibly accurate!"
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.7 }}>
                        — Sarah Chen, User since 2024
                      </Typography>
                    </Box>
                  </motion.div>
                </Paper>
              </motion.div>

              {/* Right Side - Registration Form */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                style={{ flex: 1 }}
              >
                <Paper
                  elevation={24}
                  sx={{
                    p: { xs: 3, md: 4 },
                    borderRadius: 4,
                    backdropFilter: 'blur(20px)',
                    background: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  }}
                >
                  <Box sx={{ mb: 4 }}>
                    <Stepper activeStep={activeStep} orientation="vertical" sx={{ mb: 3 }}>
                      {steps.map((label, index) => (
                        <Step key={label} completed={index < activeStep}>
                          <StepLabel
                            StepIconProps={{
                              sx: {
                                '& .MuiStepIcon-root': {
                                  color: index < activeStep ? '#10b981' : '#64748b',
                                },
                                '& .MuiStepIcon-active': {
                                  color: '#6366f1',
                                },
                              },
                            }}
                          >
                            <Typography variant="subtitle1" fontWeight={600}>
                              {label}
                            </Typography>
                          </StepLabel>
                          <StepContent>
                            <Box sx={{ mt: 2 }}>
                              {index === 0 && (
                                <Box>
                                  <TextField
                                    fullWidth
                                    label="Full Name"
                                    {...register('full_name', {
                                      required: 'Full name is required',
                                    })}
                                    error={!!errors.full_name}
                                    helperText={errors.full_name?.message}
                                    InputProps={{
                                      startAdornment: (
                                        <InputAdornment position="start">
                                          <PersonIcon color="primary" />
                                        </InputAdornment>
                                      ),
                                    }}
                                    sx={{ mb: 3 }}
                                  />
                                  <TextField
                                    fullWidth
                                    label="Email Address"
                                    type="email"
                                    {...register('email', {
                                      required: 'Email is required',
                                      pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: 'Invalid email address',
                                      },
                                    })}
                                    error={!!errors.email}
                                    helperText={errors.email?.message}
                                    InputProps={{
                                      startAdornment: (
                                        <InputAdornment position="start">
                                          <EmailIcon color="primary" />
                                        </InputAdornment>
                                      ),
                                    }}
                                  />
                                </Box>
                              )}
                              {index === 1 && (
                                <Box>
                                  <TextField
                                    fullWidth
                                    label="Password"
                                    type={showPassword ? 'text' : 'password'}
                                    {...register('password', {
                                      required: 'Password is required',
                                      minLength: {
                                        value: 8,
                                        message: 'Password must be at least 8 characters',
                                      },
                                      pattern: {
                                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                                        message: 'Must include uppercase, lowercase, and number',
                                      },
                                    })}
                                    error={!!errors.password}
                                    helperText={errors.password?.message}
                                    InputProps={{
                                      startAdornment: (
                                        <InputAdornment position="start">
                                          <LockIcon color="primary" />
                                        </InputAdornment>
                                      ),
                                      endAdornment: (
                                        <InputAdornment position="end">
                                          <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                          >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                          </IconButton>
                                        </InputAdornment>
                                      ),
                                    }}
                                    sx={{ mb: 3 }}
                                  />
                                  <TextField
                                    fullWidth
                                    label="Confirm Password"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    {...register('confirmPassword', {
                                      required: 'Please confirm your password',
                                      validate: (value) =>
                                        value === password || 'Passwords do not match',
                                    })}
                                    error={!!errors.confirmPassword}
                                    helperText={errors.confirmPassword?.message}
                                    InputProps={{
                                      startAdornment: (
                                        <InputAdornment position="start">
                                          <LockIcon color="primary" />
                                        </InputAdornment>
                                      ),
                                      endAdornment: (
                                        <InputAdornment position="end">
                                          <IconButton
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            edge="end"
                                          >
                                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                          </IconButton>
                                        </InputAdornment>
                                      ),
                                    }}
                                  />
                                </Box>
                              )}
                              {index === 2 && (
                                <Box>
                                  <TextField
                                    fullWidth
                                    select
                                    label="Preferred Currency"
                                    {...register('preferred_currency', {
                                      required: 'Currency is required',
                                    })}
                                    error={!!errors.preferred_currency}
                                    helperText={errors.preferred_currency?.message}
                                    defaultValue="USD"
                                    InputProps={{
                                      startAdornment: (
                                        <InputAdornment position="start">
                                          <CurrencyExchangeIcon color="primary" />
                                        </InputAdornment>
                                      ),
                                    }}
                                  >
                                    {currencies.map((currency) => (
                                      <MenuItem key={currency.code} value={currency.code}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                          <Typography variant="body1">{currency.symbol}</Typography>
                                          <Box>
                                            <Typography variant="body2">
                                              {currency.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                              {currency.code}
                                            </Typography>
                                          </Box>
                                        </Box>
                                      </MenuItem>
                                    ))}
                                  </TextField>
                                </Box>
                              )}
                              {index === 3 && (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ duration: 0.6 }}
                                >
                                  <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <Box
                                      sx={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 100,
                                        height: 100,
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                                        mb: 3,
                                      }}
                                    >
                                      <CheckCircleIcon sx={{ fontSize: 60, color: 'white' }} />
                                    </Box>
                                    <Typography variant="h5" fontWeight={700} gutterBottom>
                                      Ready to Go! 🎉
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                      Your AI Finance account is ready. Welcome aboard!
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Email: {email}
                                    </Typography>
                                  </Box>
                                </motion.div>
                              )}
                            </Box>
                          </StepContent>
                        </Step>
                      ))}
                    </Stepper>

                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                        >
                          <Alert 
                            severity="error" 
                            sx={{ 
                              mb: 3,
                              borderRadius: 3,
                            }}
                          >
                            {error}
                          </Alert>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                      <Button
                        onClick={handleBack}
                        disabled={activeStep === 0}
                        sx={{
                          borderRadius: 3,
                          px: 4,
                        }}
                      >
                        Back
                      </Button>
                      
                      {activeStep === steps.length - 1 ? (
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            onClick={handleSubmit(onSubmit)}
                            variant="contained"
                            disabled={isLoading}
                            sx={{
                              borderRadius: 3,
                              px: 4,
                              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                              fontWeight: 700,
                            }}
                          >
                            {isLoading ? 'Creating Account...' : 'Complete Registration'}
                            <ArrowForwardIcon sx={{ ml: 1 }} />
                          </Button>
                        </motion.div>
                      ) : (
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            onClick={handleNext}
                            variant="contained"
                            sx={{
                              borderRadius: 3,
                              px: 4,
                              fontWeight: 700,
                            }}
                          >
                            Next Step
                            <ArrowForwardIcon sx={{ ml: 1 }} />
                          </Button>
                        </motion.div>
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ textAlign: 'center', mt: 4, pt: 3, borderTop: '1px solid rgba(0, 0, 0, 0.1)' }}>
                    <Typography variant="body2" color="text.secondary">
                      Already have an account?{' '}
                      <Link
                        component={RouterLink}
                        to="/login"
                        color="primary"
                        fontWeight={700}
                      >
                        Sign in
                      </Link>
                    </Typography>
                  </Box>
                </Paper>
              </motion.div>
            </Box>
          </motion.div>
        </Box>
      </Container>
    </Box>
  );
};

export default Register;