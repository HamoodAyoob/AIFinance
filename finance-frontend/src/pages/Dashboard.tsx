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

  // Build monthly data from actual transactions
  const monthlyData = transactionsData?.data?.length ? 
    // Group transactions by date and calculate income/expenses
    Object.values(
      (transactionsData?.data || []).reduce((acc: any, transaction: any) => {
        const date = new Date(transaction.transaction_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!acc[date]) {
          acc[date] = { date, income: 0, expenses: 0 };
        }
        if (transaction.transaction_type === 'income') {
          acc[date].income += transaction.amount;
        } else {
          acc[date].expenses += transaction.amount;
        }
        return acc;
      }, {})
    )
    : [];

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

  const recentTransactions = transactionsData?.data?.slice(0, 5) || [];
  const budgetProgress = budgetStatusData?.data?.slice(0, 3) || [];

  const quickStats = [
    { 
      label: 'Total Transactions', 
      value: recentTransactions.length.toString(), 
      icon: <Award size={20} />, 
      color: '#8b5cf6',
      trend: '0'
    },
    { 
      label: 'Total Income', 
      value: `$${animatedNumbers.income.toLocaleString()}`, 
      icon: <Users size={20} />, 
      color: '#06b6d4',
      trend: '0'
    },
    { 
      label: 'Total Expenses', 
      value: `$${animatedNumbers.expenses.toLocaleString()}`, 
      icon: <Target size={20} />, 
      color: '#10b981',
      trend: '0'
    },
    { 
      label: 'Net Balance', 
      value: `$${animatedNumbers.net.toLocaleString()}`, 
      icon: <Zap size={20} />, 
      color: '#f59e0b',
      trend: '0'
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

        

        {/* Recent Transactions */}
        <Grid item xs={12}>
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