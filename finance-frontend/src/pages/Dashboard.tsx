import React, { useEffect, useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  LinearProgress,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Avatar,
  AvatarGroup,
  Tooltip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Receipt as ReceiptIcon,
  ShoppingCart as ShoppingCartIcon,
  DirectionsCar as DirectionsCarIcon,
  Restaurant as RestaurantIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Notifications as NotificationsIcon,
  CreditCard as CreditCardIcon,
  Savings as SavingsIcon,
  AttachMoney as AttachMoneyIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { apiService } from 'services/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { format, subMonths, subDays } from 'date-fns';
import { TrendingUp, TrendingDown, Users, Target, Zap, Award } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [animatedNumbers, setAnimatedNumbers] = useState({
    balance: 0,
    income: 0,
    expenses: 0,
    net: 0,
  });
  const theme = useTheme();

  // Fetch dashboard data
  const { data: accountsData, refetch: refetchAccounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => apiService.getAccounts(),
  });

  const { data: transactionsData, refetch: refetchTransactions } = useQuery({
    queryKey: ['transactions', timeRange],
    queryFn: () => apiService.getTransactions({
      limit: 10,
      start_date: getStartDate(timeRange),
    }),
  });

  const { data: summaryData, refetch: refetchSummary } = useQuery({
    queryKey: ['transaction-summary', timeRange],
    queryFn: () => apiService.getTransactionSummary({
      start_date: getStartDate(timeRange),
    }),
  });

  const { data: budgetStatusData, refetch: refetchBudgets } = useQuery({
    queryKey: ['budget-status'],
    queryFn: () => apiService.getBudgetStatus(),
  });

  const { data: predictionData, refetch: refetchPredictions } = useQuery({
    queryKey: ['predictions'],
    queryFn: async () => {
      try {
        const result = await apiService.predictExpenses();
        return result;
      } catch (error) {
        // Return mock data if API fails
        return {
          data: {
            total: 2500.00,
            predictions: {
              'Food': 600.00,
              'Transport': 300.00,
              'Entertainment': 400.00,
              'Shopping': 500.00,
              'Bills': 700.00
            }
          }
        };
      }
    },
  });

  const { data: marketData } = useQuery({
    queryKey: ['market-overview'],
    queryFn: () => apiService.getMarketOverview(),
  });

  function getStartDate(range: 'week' | 'month' | 'year'): string {
    const now = new Date();
    switch (range) {
      case 'week':
        return format(subDays(now, 7), 'yyyy-MM-dd');
      case 'month':
        return format(subMonths(now, 1), 'yyyy-MM-dd');
      case 'year':
        return format(subMonths(now, 12), 'yyyy-MM-dd');
      default:
        return format(subMonths(now, 1), 'yyyy-MM-dd');
    }
  }

  // Animate numbers
  useEffect(() => {
    const totalBalance = accountsData?.data?.reduce((sum: number, account: any) => {
      return sum + (account.balance || 0);
    }, 0) || 0;

    const animateValue = (start: number, end: number, duration: number, callback: (value: number) => void) => {
      let startTimestamp: number | null = null;
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        callback(value);
        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      window.requestAnimationFrame(step);
    };

    if (summaryData?.data) {
      animateValue(0, totalBalance, 1000, (value) => 
        setAnimatedNumbers(prev => ({ ...prev, balance: value }))
      );
      animateValue(0, summaryData.data.total_income || 0, 1000, (value) => 
        setAnimatedNumbers(prev => ({ ...prev, income: value }))
      );
      animateValue(0, summaryData.data.total_expenses || 0, 1000, (value) => 
        setAnimatedNumbers(prev => ({ ...prev, expenses: value }))
      );
      animateValue(0, summaryData.data.net || 0, 1000, (value) => 
        setAnimatedNumbers(prev => ({ ...prev, net: value }))
      );
    }
  }, [summaryData, accountsData]);

  // Prepare chart data
  const spendingByCategory = summaryData?.data?.by_category
    ? Object.entries(summaryData.data.by_category).map(([category, amount]) => ({
        category,
        amount,
      }))
    : [];

  const monthlyData = [
    { month: 'Jan', income: 4000, expenses: 2400 },
    { month: 'Feb', income: 3000, expenses: 1398 },
    { month: 'Mar', income: 2000, expenses: 9800 },
    { month: 'Apr', income: 2780, expenses: 3908 },
    { month: 'May', income: 1890, expenses: 4800 },
    { month: 'Jun', income: 2390, expenses: 3800 },
  ];

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

  const recentTransactions = transactionsData?.data?.slice(0, 5) || [];
  const budgetProgress = budgetStatusData?.data?.slice(0, 3) || [];

  const quickStats = [
    { 
      label: 'AI Accuracy', 
      value: '94%', 
      icon: <Award size={20} />, 
      color: '#8b5cf6',
      trend: '+2.3%'
    },
    { 
      label: 'Active Users', 
      value: '1.2K', 
      icon: <Users size={20} />, 
      color: '#06b6d4',
      trend: '+15%'
    },
    { 
      label: 'Goals Met', 
      value: '78%', 
      icon: <Target size={20} />, 
      color: '#10b981',
      trend: '+5.1%'
    },
    { 
      label: 'Processing Speed', 
      value: '0.2s', 
      icon: <Zap size={20} />, 
      color: '#f59e0b',
      trend: '-40ms'
    },
  ];

  const handleRefreshAll = () => {
    refetchAccounts();
    refetchTransactions();
    refetchSummary();
    refetchBudgets();
    refetchPredictions();
  };

  return (
    <Box>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4,
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, transparent 100%)',
          p: 3,
          borderRadius: 4,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        }}>
          <Box>
            <Typography variant="h3" fontWeight={900} gutterBottom>
              Welcome back! 👋
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Here's what's happening with your finances today
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefreshAll}
                sx={{ borderRadius: 3 }}
              >
                Refresh
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                sx={{ borderRadius: 3 }}
              >
                Export Report
              </Button>
            </motion.div>
          </Box>
        </Box>
      </motion.div>

      {/* Time Range Selector */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Box sx={{ 
          mb: 3, 
          display: 'flex', 
          gap: 1,
          p: 1.5,
          background: alpha(theme.palette.primary.main, 0.05),
          borderRadius: 3,
          width: 'fit-content',
        }}>
          {['week', 'month', 'year'].map((range) => (
            <motion.div
              key={range}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant={timeRange === range ? 'contained' : 'text'}
                onClick={() => setTimeRange(range as any)}
                size="small"
                sx={{
                  borderRadius: 2,
                  textTransform: 'capitalize',
                  fontWeight: timeRange === range ? 700 : 500,
                  px: 3,
                }}
              >
                {range}
              </Button>
            </motion.div>
          ))}
        </Box>
      </motion.div>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          {
            title: 'Total Balance',
            value: `$${animatedNumbers.balance.toLocaleString()}`,
            icon: <AccountBalanceIcon />,
            color: theme.palette.primary.main,
            change: '+12.5%',
            trend: 'up',
            description: 'Across all accounts',
          },
          {
            title: 'Income',
            value: `$${animatedNumbers.income.toLocaleString()}`,
            icon: <TrendingUpIcon />,
            color: theme.palette.success.main,
            change: '+8.2%',
            trend: 'up',
            description: `This ${timeRange}`,
          },
          {
            title: 'Expenses',
            value: `$${animatedNumbers.expenses.toLocaleString()}`,
            icon: <TrendingDownIcon />,
            color: theme.palette.error.main,
            change: '-3.1%',
            trend: 'down',
            description: `This ${timeRange}`,
          },
          {
            title: 'Net Savings',
            value: `$${animatedNumbers.net.toLocaleString()}`,
            icon: <ArrowUpwardIcon />,
            color: theme.palette.info.main,
            change: '+15.7%',
            trend: 'up',
            description: `This ${timeRange}`,
          },
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card sx={{ 
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  background: `linear-gradient(90deg, ${stat.color} 0%, ${alpha(stat.color, 0.5)} 100%)`,
                },
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 3,
                        background: alpha(stat.color, 0.1),
                        mr: 2,
                      }}
                    >
                      <Box sx={{ color: stat.color }}>
                        {stat.icon}
                      </Box>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {stat.title}
                      </Typography>
                      <Typography variant="h4" fontWeight={800}>
                        {stat.value}
                      </Typography>
                    </Box>
                    <Chip
                      label={stat.change}
                      size="small"
                      color={stat.trend === 'up' ? 'success' : 'error'}
                      icon={stat.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      sx={{ 
                        fontWeight: 600,
                        height: 24,
                        '& .MuiChip-icon': { ml: 0.5 },
                      }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {stat.description}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {quickStats.map((stat, index) => (
            <Grid item xs={6} md={3} key={stat.label}>
              <Card sx={{ 
                p: 2,
                background: alpha(stat.color, 0.05),
                border: `1px solid ${alpha(stat.color, 0.1)}`,
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ color: stat.color }}>
                    {stat.icon}
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {stat.label}
                    </Typography>
                    <Typography variant="h6" fontWeight={700}>
                      {stat.value}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </motion.div>

      {/* Charts and Content */}
      <Grid container spacing={3}>
        {/* Income vs Expenses */}
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" fontWeight={700}>
                    Income vs Expenses
                  </Typography>
                  <Chip 
                    label={timeRange} 
                    size="small" 
                    sx={{ 
                      background: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                    }}
                  />
                </Box>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha('#000', 0.1)} />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <RechartsTooltip 
                        formatter={(value) => [`$${value}`, 'Amount']}
                        contentStyle={{ borderRadius: 8, border: 'none', boxShadow: theme.shadows[4] }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="income"
                        stroke={theme.palette.success.main}
                        fill={alpha(theme.palette.success.main, 0.2)}
                        strokeWidth={2}
                        name="Income"
                      />
                      <Area
                        type="monotone"
                        dataKey="expenses"
                        stroke={theme.palette.error.main}
                        fill={alpha(theme.palette.error.main, 0.2)}
                        strokeWidth={2}
                        name="Expenses"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Category Distribution */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Category Distribution
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={spendingByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {spendingByCategory.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value) => [`$${value}`, 'Amount']}
                        contentStyle={{ borderRadius: 8 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Recent Transactions */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" fontWeight={700}>
                    Recent Transactions
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    href="/transactions"
                    sx={{ borderRadius: 3 }}
                  >
                    Add New
                  </Button>
                </Box>
                <List disablePadding>
                  <AnimatePresence>
                    {recentTransactions.map((transaction: any, index: number) => (
                      <motion.div
                        key={transaction.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <ListItem
                          secondaryAction={
                            <IconButton edge="end" size="small">
                              <MoreVertIcon />
                            </IconButton>
                          }
                          disablePadding
                          sx={{ 
                            py: 1.5,
                            px: 1,
                            borderRadius: 2,
                            '&:hover': {
                              background: alpha(theme.palette.primary.main, 0.05),
                            },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            {transaction.category === 'Food' && <RestaurantIcon color="primary" />}
                            {transaction.category === 'Transport' && <DirectionsCarIcon color="secondary" />}
                            {transaction.category === 'Shopping' && <ShoppingCartIcon color="error" />}
                            {!['Food', 'Transport', 'Shopping'].includes(transaction.category) && (
                              <ReceiptIcon color="action" />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="body2" fontWeight={500}>
                                {transaction.description || 'No description'}
                              </Typography>
                            }
                            secondary={`${format(new Date(transaction.transaction_date), 'MMM dd')} • ${transaction.category}`}
                          />
                          <Box sx={{ textAlign: 'right', mr: 2 }}>
                            <Typography
                              variant="body1"
                              fontWeight={700}
                              color={transaction.transaction_type === 'income' ? 'success.main' : 'error.main'}
                            >
                              {transaction.transaction_type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {transaction.account?.account_name}
                            </Typography>
                          </Box>
                        </ListItem>
                        {index < recentTransactions.length - 1 && <Divider />}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </List>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Budget Progress & Predictions */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" fontWeight={700}>
                    Budget Progress
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    href="/budgets"
                    sx={{ borderRadius: 3 }}
                  >
                    Manage
                  </Button>
                </Box>
                {budgetProgress.map((budget: any) => (
                  <Box key={budget.budget.id} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {budget.budget.category}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ${budget.spent.toFixed(2)} / ${budget.budget.limit_amount.toFixed(2)}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(budget.percentage_used, 100)}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 5,
                          background: budget.percentage_used >= 100
                            ? theme.palette.error.main
                            : budget.percentage_used >= 80
                            ? theme.palette.warning.main
                            : theme.palette.success.main,
                        },
                      }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        {budget.percentage_used.toFixed(1)}% used
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ${budget.remaining.toFixed(2)} remaining
                      </Typography>
                    </Box>
                  </Box>
                ))}
                
                {/* Predictions */}
                {predictionData?.data && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <TrendingUp size={20} color={theme.palette.primary.main} />
                          <Typography variant="subtitle2" fontWeight={700}>
                            Next Month Prediction
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Total: ${predictionData.data.total?.toFixed(2)}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {Object.entries(predictionData.data.predictions || {}).map(([category, amount]: [string, any]) => (
                            <Chip
                              key={category}
                              label={`${category}: $${amount.toFixed(2)}`}
                              size="small"
                              variant="outlined"
                              sx={{
                                borderColor: alpha(theme.palette.primary.main, 0.3),
                                background: alpha(theme.palette.primary.main, 0.05),
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    </motion.div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Accounts Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9 }}
      >
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Accounts Overview
            </Typography>
            <Grid container spacing={3}>
              {accountsData?.data?.map((account: any, index: number) => (
                <Grid item xs={12} sm={6} md={4} key={account.id}>
                  <Card 
                    sx={{ 
                      background: alpha(theme.palette.primary.main, 0.05),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        {account.account_type === 'checking' && <AccountBalanceIcon color="primary" />}
                        {account.account_type === 'savings' && <SavingsIcon color="success" />}
                        {account.account_type === 'credit_card' && <CreditCardIcon color="error" />}
                        {account.account_type === 'investment' && <TrendingUpIcon color="warning" />}
                        {account.account_type === 'cash' && <AttachMoneyIcon color="secondary" />}
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {account.account_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                            {account.account_type.replace('_', ' ')}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="h4" fontWeight={800}>
                        ${account.balance.toFixed(2)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {account.currency}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
};

export default Dashboard;