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
  Fade,
  Zoom,
  Slide,
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  AccountCircle as AccountCircleIcon,
  Rocket as RocketIcon,
  AutoAwesome as SparklesIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from 'hooks/useAuth';
import { useForm } from 'react-hook-form';
import { Brain, TrendingUp, Shield } from 'lucide-react';

interface LoginFormData {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setError('');
    setIsLoading(true);
    
    const result = await login(data.email, data.password);
    
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
    
    setIsLoading(false);
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const features = [
    { icon: <Brain size={24} />, title: 'AI-Powered Insights', desc: 'Smart expense predictions' },
    { icon: <TrendingUp size={24} />, title: 'Real Analytics', desc: 'Interactive charts & reports' },
    { icon: <Shield size={24} />, title: 'Bank-Level Security', desc: 'Your data is protected' },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated background elements */}
      <Box
        component={motion.div}
        animate={{
          y: [0, -20, 0],
          x: [0, 10, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        sx={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <Box
        component={motion.div}
        animate={{
          y: [0, 20, 0],
          x: [0, -10, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
        sx={{
          position: 'absolute',
          bottom: '10%',
          right: '5%',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
          filter: 'blur(40px)',
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
          <Zoom in={true} style={{ transitionDelay: '200ms' }}>
            <Box sx={{ display: 'flex', width: '100%', maxWidth: 1200 }}>
              {/* Left Side - Features */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
              >
                <Box sx={{ color: 'white', px: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: 16,
                        background: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                      }}
                    >
                      <Brain size={32} color="white" />
                    </Box>
                    <Box>
                      <Typography variant="h3" fontWeight={900} gutterBottom>
                        AI Finance
                      </Typography>
                      <Typography variant="h6" sx={{ opacity: 0.9 }}>
                        Smart Money Management
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="h2" fontWeight={800} gutterBottom sx={{ mb: 4 }}>
                    Take Control of Your
                    <Box component="span" sx={{ display: 'block', color: '#fcd34d' }}>
                      Financial Future
                    </Box>
                  </Typography>

                  <Box sx={{ mt: 6 }}>
                    {features.map((feature, index) => (
                      <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 + 0.5 }}
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
                            {feature.icon}
                          </Box>
                          <Box>
                            <Typography variant="h6" fontWeight={600}>
                              {feature.title}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                              {feature.desc}
                            </Typography>
                          </Box>
                        </Box>
                      </motion.div>
                    ))}
                  </Box>
                </Box>
              </motion.div>

              {/* Right Side - Login Form */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                style={{ flex: 1 }}
              >
                <Paper
                  elevation={24}
                  sx={{
                    p: { xs: 3, md: 5 },
                    width: '100%',
                    borderRadius: 6,
                    backdropFilter: 'blur(20px)',
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Decorative elements */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -100,
                      right: -100,
                      width: 300,
                      height: 300,
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
                      filter: 'blur(20px)',
                    }}
                  />

                  <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                      >
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            mb: 3,
                            boxShadow: '0 20px 40px rgba(99, 102, 241, 0.4)',
                          }}
                        >
                          <AccountCircleIcon sx={{ fontSize: 40, color: 'white' }} />
                        </Box>
                      </motion.div>
                      <Typography variant="h4" fontWeight={900} gutterBottom>
                        Welcome Back
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Sign in to your AI Finance account
                      </Typography>
                    </Box>

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
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                            }}
                          >
                            {error}
                          </Alert>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit(onSubmit)}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
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
                          sx={{ mb: 3 }}
                        />
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
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
                                <IconButton onClick={handleClickShowPassword} edge="end">
                                  {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                          sx={{ mb: 2 }}
                        />
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <Box sx={{ textAlign: 'right', mb: 3 }}>
                          <Link
                            component={RouterLink}
                            to="/forgot-password"
                            variant="body2"
                            color="primary"
                            sx={{ fontWeight: 600 }}
                          >
                            Forgot password?
                          </Link>
                        </Box>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          type="submit"
                          fullWidth
                          variant="contained"
                          size="large"
                          disabled={isLoading}
                          sx={{
                            mb: 3,
                            py: 1.5,
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            fontSize: '1rem',
                            fontWeight: 700,
                            position: 'relative',
                            overflow: 'hidden',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: '-100%',
                              width: '100%',
                              height: '100%',
                              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                              transition: '0.5s',
                            },
                            '&:hover::before': {
                              left: '100%',
                            },
                          }}
                        >
                          {isLoading ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                style={{ marginRight: 8 }}
                              >
                                <RocketIcon />
                              </motion.div>
                              Signing in...
                            </>
                          ) : (
                            <>
                              Sign In
                              <SparklesIcon sx={{ ml: 1 }} />
                            </>
                          )}
                        </Button>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            Don't have an account?{' '}
                            <Link
                              component={RouterLink}
                              to="/register"
                              color="primary"
                              fontWeight={700}
                              sx={{ textDecoration: 'none' }}
                            >
                              Create Account
                            </Link>
                          </Typography>
                        </Box>
                      </motion.div>
                    </form>
                  </Box>
                </Paper>
              </motion.div>
            </Box>
          </Zoom>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;