import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Alert,
  Tooltip,
  alpha,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  Slider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Category as CategoryIcon,
  CalendarMonth as CalendarIcon,
  Notifications as NotificationsIcon,
  MoreVert as MoreVertIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Insights as InsightsIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from 'services/api';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';

interface Budget {
  id: number;
  category: string;
  limit_amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  created_at: string;
  updated_at: string;
}

interface BudgetStatus {
  budget: Budget;
  spent: number;
  remaining: number;
  percentage_used: number;
  daily_average?: number;
  days_remaining?: number;
}

interface BudgetFormData {
  category: string;
  limit_amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
}

const categories = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Groceries',
  'Dining Out',
  'Coffee',
  'Subscriptions',
  'Other',
];

const periods = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const Budget: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [notificationThreshold, setNotificationThreshold] = useState(80);
  const theme = useTheme();
  const queryClient = useQueryClient();

  // Add 'watch' to useForm destructuring
  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm<BudgetFormData>();

  // Watch the category field
  const watchedCategory = watch('category');

  // Fetch budgets
  const { data: budgetsData, isLoading: isLoadingBudgets } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => apiService.getBudgets(),
  });

  // Fetch budget status
  const { data: budgetStatusData, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['budget-status'],
    queryFn: () => apiService.getBudgetStatus(),
  });

  // Fetch transaction summary for insights
  const { data: transactionSummary } = useQuery({
    queryKey: ['transaction-summary'],
    queryFn: () => apiService.getTransactionSummary(),
  });

  // Create budget mutation
  const createBudgetMutation = useMutation({
    mutationFn: (data: BudgetFormData) => apiService.createBudget(data),
    onSuccess: () => {
      toast.success('Budget created successfully! 🎉');
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget-status'] });
      setOpenDialog(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create budget');
    },
  });

  // Update budget mutation
  const updateBudgetMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<BudgetFormData> }) =>
      apiService.updateBudget(id, data),
    onSuccess: () => {
      toast.success('Budget updated successfully! ✅');
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget-status'] });
      setOpenDialog(false);
      setEditingBudget(null);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update budget');
    },
  });

  // Delete budget mutation
  const deleteBudgetMutation = useMutation({
    mutationFn: (id: number) => apiService.deleteBudget(id),
    onSuccess: () => {
      toast.success('Budget deleted successfully! 🗑️');
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget-status'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete budget');
    },
  });

  const budgets = budgetsData?.data || [];
  const budgetStatuses: BudgetStatus[] = budgetStatusData?.data || [];

  const totalBudget = budgets.reduce((sum: number, budget: Budget) => sum + budget.limit_amount, 0);
  const totalSpent = budgetStatuses.reduce((sum: number, status: BudgetStatus) => sum + status.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const handleOpenDialog = (budget?: Budget) => {
    if (budget) {
      setEditingBudget(budget);
      reset({
        category: budget.category,
        limit_amount: budget.limit_amount,
        period: budget.period,
      });
    } else {
      setEditingBudget(null);
      reset({
        category: '',
        limit_amount: 100,
        period: 'monthly',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingBudget(null);
    reset();
  };

  const onSubmit = (data: BudgetFormData) => {
    if (editingBudget) {
      updateBudgetMutation.mutate({ id: editingBudget.id, data });
    } else {
      createBudgetMutation.mutate(data);
    }
  };

  const handleDeleteBudget = (id: number) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      deleteBudgetMutation.mutate(id);
    }
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 100) return theme.palette.error.main;
    if (percentage >= notificationThreshold) return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 100) return <WarningIcon color="error" />;
    if (percentage >= notificationThreshold) return <WarningIcon color="warning" />;
    return <CheckCircleIcon color="success" />;
  };

  // Prepare chart data
  const budgetComparisonData = budgetStatuses.map((status: BudgetStatus) => ({
    category: status.budget.category,
    limit: status.budget.limit_amount,
    spent: status.spent,
    remaining: status.remaining,
  }));

  const monthlyTrendData = [
    { month: 'Jan', budget: 3000, actual: 2800 },
    { month: 'Feb', budget: 3000, actual: 3200 },
    { month: 'Mar', budget: 3000, actual: 2900 },
    { month: 'Apr', budget: 3000, actual: 3100 },
    { month: 'May', budget: 3000, actual: 2950 },
    { month: 'Jun', budget: 3000, actual: 3050 },
  ];

  const categorySpending = transactionSummary?.data?.by_category || {};

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
              Budget Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Set spending limits and track your budget progress
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                sx={{ borderRadius: 3 }}
              >
                Export Report
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
                sx={{ borderRadius: 3 }}
              >
                Create Budget
              </Button>
            </motion.div>
          </Box>
        </Box>
      </motion.div>

      {/* Overall Budget Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>
                  Overall Budget Status
                </Typography>
                <Chip
                  label={`${overallPercentage.toFixed(1)}% used`}
                  color={overallPercentage >= 100 ? 'error' : overallPercentage >= 80 ? 'warning' : 'success'}
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(overallPercentage, 100)}
                sx={{
                  height: 20,
                  borderRadius: 10,
                  mb: 1,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 10,
                    background: overallPercentage >= 100
                      ? theme.palette.error.main
                      : overallPercentage >= notificationThreshold
                      ? theme.palette.warning.main
                      : theme.palette.success.main,
                  },
                }}
              />
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h3" fontWeight={900} color="primary.main">
                      ${totalBudget.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Budget
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h3" fontWeight={900} color="error.main">
                      ${totalSpent.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Spent
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h3" fontWeight={900} color="success.main">
                      ${totalRemaining.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Remaining
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="All Budgets" />
          <Tab label="Active" />
          <Tab label="Overspent" />
          <Tab label="Insights" />
        </Tabs>
      </Box>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Budgets List */}
        <Grid item xs={12} md={7}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" fontWeight={700}>
                    Budget Categories
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {budgets.length} budgets
                  </Typography>
                </Box>

                {isLoadingBudgets || isLoadingStatus ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <LinearProgress sx={{ mb: 2 }} />
                    <Typography color="text.secondary">Loading budgets...</Typography>
                  </Box>
                ) : budgets.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <TrendingUpIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      No budgets yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Create your first budget to start tracking your spending
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => handleOpenDialog()}
                      sx={{ borderRadius: 3 }}
                    >
                      Create Budget
                    </Button>
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    {budgetStatuses.map((status: BudgetStatus) => {
                      const percentage = status.percentage_used;
                      const color = getStatusColor(percentage);
                      return (
                        <Grid item xs={12} key={status.budget.id}>
                          <motion.div
                            whileHover={{ scale: 1.01 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Card
                              sx={{
                                borderLeft: `4px solid ${color}`,
                                '&:hover': {
                                  boxShadow: theme.shadows[4],
                                },
                              }}
                            >
                              <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                      <CategoryIcon sx={{ color }} />
                                      <Typography variant="h6" fontWeight={600}>
                                        {status.budget.category}
                                      </Typography>
                                      <Chip
                                        label={status.budget.period}
                                        size="small"
                                        sx={{ textTransform: 'capitalize' }}
                                      />
                                      {getStatusIcon(percentage)}
                                    </Box>

                                    <Box sx={{ mb: 1 }}>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="body2" color="text.secondary">
                                          ${status.spent.toLocaleString()} / ${status.budget.limit_amount.toLocaleString()}
                                        </Typography>
                                        <Typography variant="body2" fontWeight={600} sx={{ color }}>
                                          {percentage.toFixed(1)}%
                                        </Typography>
                                      </Box>
                                      <LinearProgress
                                        variant="determinate"
                                        value={Math.min(percentage, 100)}
                                        sx={{
                                          height: 8,
                                          borderRadius: 4,
                                          bgcolor: alpha(color, 0.1),
                                          '& .MuiLinearProgress-bar': {
                                            borderRadius: 4,
                                            bgcolor: color,
                                          },
                                        }}
                                      />
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <Typography variant="caption" color="text.secondary">
                                        Remaining: ${status.remaining.toLocaleString()}
                                      </Typography>
                                      {status.daily_average && (
                                        <Typography variant="caption" color="text.secondary">
                                          Daily avg: ${status.daily_average.toFixed(2)}
                                        </Typography>
                                      )}
                                    </Box>
                                  </Box>

                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Tooltip title="Edit">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleOpenDialog(status.budget)}
                                        sx={{ color: 'primary.main' }}
                                      >
                                        <EditIcon />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleDeleteBudget(status.budget.id)}
                                        sx={{ color: 'error.main' }}
                                      >
                                        <DeleteIcon />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </Box>
                              </CardContent>
                            </Card>
                          </motion.div>
                        </Grid>
                      );
                    })}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Sidebar - Charts & Settings */}
        <Grid item xs={12} md={5}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Budget vs Actual
                </Typography>
                <Box sx={{ height: 250, mt: 2 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={budgetComparisonData.slice(0, 5)}>
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha('#000', 0.1)} />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <RechartsTooltip formatter={(value) => [`$${value}`, 'Amount']} />
                      <Legend />
                      <Bar dataKey="limit" fill={alpha(theme.palette.primary.main, 0.6)} name="Budget Limit" />
                      <Bar dataKey="spent" fill={theme.palette.error.main} name="Amount Spent" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Monthly Trends
                </Typography>
                <Box sx={{ height: 200, mt: 2 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha('#000', 0.1)} />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <RechartsTooltip formatter={(value) => [`$${value}`, 'Amount']} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="budget"
                        stroke={theme.palette.primary.main}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        name="Budget"
                      />
                      <Line
                        type="monotone"
                        dataKey="actual"
                        stroke={theme.palette.error.main}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        name="Actual Spending"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Budget Settings
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Notification Threshold
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Slider
                      value={notificationThreshold}
                      onChange={(_, value) => setNotificationThreshold(value as number)}
                      min={50}
                      max={100}
                      step={5}
                      marks={[
                        { value: 50, label: '50%' },
                        { value: 75, label: '75%' },
                        { value: 100, label: '100%' },
                      ]}
                    />
                    <Typography variant="body1" fontWeight={600}>
                      {notificationThreshold}%
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    Receive notifications when budgets reach this percentage
                  </Typography>

                  <Box sx={{ mt: 3 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<NotificationsIcon />}
                      sx={{ borderRadius: 2 }}
                    >
                      Configure Alerts
                    </Button>
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<InsightsIcon />}
                      sx={{ borderRadius: 2 }}
                    >
                      Generate Insights
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Insights Section */}
      {activeTab === 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Budget Insights
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.1), borderRadius: 2 }}>
                    <Typography variant="subtitle2" color="info.main" gutterBottom>
                      💡 Top Overspending Category
                    </Typography>
                    <Typography variant="h4" fontWeight={900}>
                      {budgetStatuses.length > 0
                        ? budgetStatuses.sort((a: BudgetStatus, b: BudgetStatus) => b.percentage_used - a.percentage_used)[0]?.budget.category
                        : 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Consider adjusting your budget for this category
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.1), borderRadius: 2 }}>
                    <Typography variant="subtitle2" color="success.main" gutterBottom>
                      ✅ Best Performing Category
                    </Typography>
                    <Typography variant="h4" fontWeight={900}>
                      {budgetStatuses.length > 0
                        ? budgetStatuses.sort((a: BudgetStatus, b: BudgetStatus) => a.percentage_used - b.percentage_used)[0]?.budget.category
                        : 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      You're staying well within budget here
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, bgcolor: alpha(theme.palette.warning.main, 0.1), borderRadius: 2 }}>
                    <Typography variant="subtitle2" color="warning.main" gutterBottom>
                      📊 Average Spending
                    </Typography>
                    <Typography variant="h4" fontWeight={900}>
                      ${(totalSpent / budgets.length || 0).toFixed(0)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Per category this period
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ mt: 4 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Recommendations
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                      <CardContent>
                        <Typography variant="body2" gutterBottom>
                          <strong>Increase budget for:</strong> {budgetStatuses.filter((s: BudgetStatus) => s.percentage_used >= 90).map(s => s.budget.category).join(', ') || 'None'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                      <CardContent>
                        <Typography variant="body2" gutterBottom>
                          <strong>Potential savings in:</strong> {budgetStatuses.filter((s: BudgetStatus) => s.percentage_used <= 50).map(s => s.budget.category).join(', ') || 'None'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Add/Edit Budget Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingBudget ? 'Edit Budget' : 'Create New Budget'}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    label="Category"
                    {...register('category', { required: 'Category is required' })}
                    error={!!errors.category}
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Budget Limit"
                  type="number"
                  {...register('limit_amount', {
                    required: 'Budget limit is required',
                    valueAsNumber: true,
                    min: { value: 1, message: 'Budget must be greater than 0' },
                  })}
                  error={!!errors.limit_amount}
                  helperText={errors.limit_amount?.message}
                  InputProps={{
                    startAdornment: <Typography color="text.secondary">$</Typography>,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Period</InputLabel>
                  <Select
                    label="Period"
                    {...register('period', { required: 'Period is required' })}
                    error={!!errors.period}
                    defaultValue="monthly"
                  >
                    {periods.map((period) => (
                      <MenuItem key={period.value} value={period.value}>
                        {period.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              {/* Use watchedCategory instead of watch('category') */}
              {categorySpending[watchedCategory] !== undefined && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    Current spending in this category: ${categorySpending[watchedCategory].toLocaleString()}
                  </Alert>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createBudgetMutation.isPending || updateBudgetMutation.isPending}
            >
              {createBudgetMutation.isPending || updateBudgetMutation.isPending
                ? 'Saving...'
                : editingBudget
                ? 'Update Budget'
                : 'Create Budget'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Budget;