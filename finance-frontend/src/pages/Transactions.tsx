import React, { useState, useEffect } from 'react';
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
  LinearProgress,
  Tooltip,
  alpha,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  ImportExport as ImportExportIcon,
  Search as SearchIcon,
  Receipt as ReceiptIcon,
  ShoppingCart as ShoppingCartIcon,
  DirectionsCar as DirectionsCarIcon,
  Restaurant as RestaurantIcon,
  Home as HomeIcon,
  AttachMoney as AttachMoneyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  MoreVert as MoreVertIcon,
  Download as DownloadIcon,
  Cached as CachedIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from 'services/api';
import { useForm, Controller } from 'react-hook-form';
import { format, subDays, subMonths } from 'date-fns';
import { toast } from 'react-toastify';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker'; // Fixed import
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend, // Add this import
} from 'recharts';

interface Transaction {
  id: number;
  description: string;
  amount: number;
  transaction_type: 'income' | 'expense';
  category: string;
  transaction_date: string;
  account_id: number;
  account?: {
    account_name: string;
    account_type: string;
  };
  created_at: string;
  updated_at: string;
}

interface TransactionFormData {
  description: string;
  amount: number;
  transaction_type: 'income' | 'expense';
  category: string;
  transaction_date: Date;
  account_id: number;
}

interface FilterState {
  type: 'all' | 'income' | 'expense';
  category: string;
  dateRange: 'today' | 'week' | 'month' | 'year' | 'all';
  search: string;
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
  'Investments',
  'Salary',
  'Freelance',
  'Gifts',
  'Other',
];

const COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#0ea5e9',
  '#a855f7', '#d946ef', '#64748b'
];

const Transactions: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState<FilterState>({
    type: 'all',
    category: 'all',
    dateRange: 'month',
    search: '',
  });
  const [bulkSelect, setBulkSelect] = useState<number[]>([]);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const theme = useTheme();
  const queryClient = useQueryClient();

  const { 
    register, 
    handleSubmit, 
    reset, 
    control, 
    watch, // Add watch here
    formState: { errors } 
  } = useForm<TransactionFormData>();

  // Fetch transactions
  const { data: transactionsData, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => {
      const params: any = {};
      if (filters.type !== 'all') params.transaction_type = filters.type;
      if (filters.category !== 'all') params.category = filters.category;
      if (filters.search) params.search = filters.search;
      
      // Calculate date range
      let startDate: string | undefined;
      const now = new Date();
      switch (filters.dateRange) {
        case 'today':
          startDate = format(subDays(now, 1), 'yyyy-MM-dd');
          break;
        case 'week':
          startDate = format(subDays(now, 7), 'yyyy-MM-dd');
          break;
        case 'month':
          startDate = format(subMonths(now, 1), 'yyyy-MM-dd');
          break;
        case 'year':
          startDate = format(subMonths(now, 12), 'yyyy-MM-dd');
          break;
      }
      if (startDate) params.start_date = startDate;
      
      return apiService.getTransactions(params);
    },
  });

  // Fetch accounts for dropdown
  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => apiService.getAccounts(),
  });

  // Fetch transaction summary
  const { data: summaryData } = useQuery({
    queryKey: ['transaction-summary', filters.dateRange],
    queryFn: () => {
      const params: any = {};
      const now = new Date();
      let startDate: string | undefined;
      
      switch (filters.dateRange) {
        case 'today':
          startDate = format(subDays(now, 1), 'yyyy-MM-dd');
          break;
        case 'week':
          startDate = format(subDays(now, 7), 'yyyy-MM-dd');
          break;
        case 'month':
          startDate = format(subMonths(now, 1), 'yyyy-MM-dd');
          break;
        case 'year':
          startDate = format(subMonths(now, 12), 'yyyy-MM-dd');
          break;
      }
      if (startDate) params.start_date = startDate;
      
      return apiService.getTransactionSummary(params);
    },
  });

  // Fetch categories from ML API
  const { data: mlCategories } = useQuery({
    queryKey: ['ml-categories'],
    queryFn: () => apiService.getCategories(),
  });

  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: (data: TransactionFormData) =>
      apiService.createTransaction({
        ...data,
        transaction_date: format(data.transaction_date, 'yyyy-MM-dd'),
      }),
    onSuccess: () => {
      toast.success('Transaction added successfully! 🎉');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-summary'] });
      setOpenDialog(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to add transaction');
    },
  });

  // Update transaction mutation
  const updateTransactionMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TransactionFormData> }) =>
      apiService.updateTransaction(id, {
        ...data,
        transaction_date: data.transaction_date ? format(data.transaction_date, 'yyyy-MM-dd') : undefined,
      }),
    onSuccess: () => {
      toast.success('Transaction updated successfully! ✅');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-summary'] });
      setOpenDialog(false);
      setEditingTransaction(null);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update transaction');
    },
  });

  // Delete transaction mutation
  const deleteTransactionMutation = useMutation({
    mutationFn: (id: number) => apiService.deleteTransaction(id),
    onSuccess: () => {
      toast.success('Transaction deleted successfully! 🗑️');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-summary'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete transaction');
    },
  });

  // Categorize using ML
  const categorizeMutation = useMutation({
    mutationFn: (description: string) => apiService.categorizeExpense(description),
  });

  const transactions = transactionsData?.data || [];
  const accounts = accountsData?.data || [];
  const summary = summaryData?.data || { total_income: 0, total_expenses: 0, net: 0, by_category: {} };
  
  // Watch the category field
  const watchedCategory = watch('category');
  const categorySpending = summary.by_category || {};

  const handleOpenDialog = (transaction?: Transaction) => {
    if (transaction) {
      setEditingTransaction(transaction);
      reset({
        description: transaction.description,
        amount: transaction.amount,
        transaction_type: transaction.transaction_type,
        category: transaction.category,
        transaction_date: new Date(transaction.transaction_date),
        account_id: transaction.account_id,
      });
    } else {
      setEditingTransaction(null);
      reset({
        description: '',
        amount: 0,
        transaction_type: 'expense',
        category: '',
        transaction_date: new Date(),
        account_id: accounts.length > 0 ? accounts[0].id : 0,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTransaction(null);
    reset();
  };

  const onSubmit = (data: TransactionFormData) => {
    if (editingTransaction) {
      updateTransactionMutation.mutate({ id: editingTransaction.id, data });
    } else {
      createTransactionMutation.mutate(data);
    }
  };

  const handleDeleteTransaction = (id: number) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      deleteTransactionMutation.mutate(id);
    }
  };

  const handleBulkDelete = () => {
    if (bulkSelect.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${bulkSelect.length} transactions?`)) {
      // Note: You might want to implement bulk delete in backend
      toast.info('Bulk delete would be implemented with backend support');
      setBulkSelect([]);
    }
  };

  const handleCategorizeWithAI = async (description: string) => {
    if (!description.trim()) return;
    
    try {
      const result = await categorizeMutation.mutateAsync(description);
      if (result.category && result.confidence > 0.6) {
        reset({ ...watch(), category: result.category });
        toast.success(`AI suggested: ${result.category} (${(result.confidence * 100).toFixed(0)}% confidence)`);
      }
    } catch (error) {
      console.error('Categorization failed:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'food':
      case 'food & dining':
        return <RestaurantIcon />;
      case 'transport':
      case 'transportation':
        return <DirectionsCarIcon />;
      case 'shopping':
        return <ShoppingCartIcon />;
      case 'entertainment':
        return <AttachMoneyIcon />;
      case 'bills':
        return <HomeIcon />;
      case 'salary':
      case 'income':
        return <TrendingUpIcon />;
      default:
        return <ReceiptIcon />;
    }
  };

  // Prepare chart data
  const categoryData = Object.entries(summary.by_category || {}).map(([category, amount]) => ({
    category,
    amount,
  }));

  const monthlyTrendData = [
    { month: 'Jan', income: 4500, expenses: 3200 },
    { month: 'Feb', income: 5200, expenses: 3800 },
    { month: 'Mar', income: 4800, expenses: 3500 },
    { month: 'Apr', income: 5100, expenses: 3700 },
    { month: 'May', income: 4900, expenses: 3600 },
    { month: 'Jun', income: 5300, expenses: 3900 },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
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
                Transactions
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Track and categorize all your income and expenses
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outlined"
                  startIcon={<ImportExportIcon />}
                  onClick={() => setImportDialogOpen(true)}
                  sx={{ borderRadius: 3 }}
                >
                  Import
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                  sx={{ borderRadius: 3 }}
                >
                  Add Transaction
                </Button>
              </motion.div>
            </Box>
          </Box>
        </motion.div>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            {
              title: 'Total Income',
              value: `$${summary.total_income.toLocaleString()}`,
              change: '+8.2%',
              trend: 'up',
              color: theme.palette.success.main,
              icon: <TrendingUpIcon />,
            },
            {
              title: 'Total Expenses',
              value: `$${summary.total_expenses.toLocaleString()}`,
              change: '-3.1%',
              trend: 'down',
              color: theme.palette.error.main,
              icon: <TrendingDownIcon />,
            },
            {
              title: 'Net Savings',
              value: `$${summary.net.toLocaleString()}`,
              change: '+15.7%',
              trend: 'up',
              color: theme.palette.primary.main,
              icon: <AttachMoneyIcon />,
            },
            {
              title: 'Transactions',
              value: transactions.length.toString(),
              change: '+24',
              trend: 'up',
              color: theme.palette.info.main,
              icon: <ReceiptIcon />,
            },
          ].map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={stat.title}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 3,
                          background: alpha(stat.color, 0.1),
                          color: stat.color,
                        }}
                      >
                        {stat.icon}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {stat.title}
                        </Typography>
                        <Typography variant="h3" fontWeight={900}>
                          {stat.value}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={stat.change}
                      size="small"
                      color={stat.trend === 'up' ? 'success' : 'error'}
                      sx={{ fontWeight: 600 }}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  placeholder="Search transactions..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={filters.type}
                    label="Type"
                    onChange={(e) => setFilters({ ...filters, type: e.target.value as any })}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="income">Income</MenuItem>
                    <MenuItem value="expense">Expense</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={filters.category}
                    label="Category"
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  >
                    <MenuItem value="all">All Categories</MenuItem>
                    {categories.map((cat) => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Date Range</InputLabel>
                  <Select
                    value={filters.dateRange}
                    label="Date Range"
                    onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as any })}
                  >
                    <MenuItem value="today">Today</MenuItem>
                    <MenuItem value="week">Last 7 Days</MenuItem>
                    <MenuItem value="month">Last 30 Days</MenuItem>
                    <MenuItem value="year">Last Year</MenuItem>
                    <MenuItem value="all">All Time</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<FilterIcon />}
                    onClick={() => setFilters({
                      type: 'all',
                      category: 'all',
                      dateRange: 'month',
                      search: '',
                    })}
                  >
                    Clear Filters
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<CachedIcon />}
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['transactions'] })}
                  >
                    Refresh
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {bulkSelect.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card sx={{ mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography>
                    <strong>{bulkSelect.length}</strong> transactions selected
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={handleBulkDelete}
                    >
                      Delete Selected
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => setBulkSelect([])}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Main Content */}
        <Grid container spacing={3}>
          {/* Transactions List */}
          <Grid item xs={12} md={8}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" fontWeight={700}>
                      Recent Transactions
                    </Typography>
                    <Button
                      startIcon={<DownloadIcon />}
                      size="small"
                      sx={{ borderRadius: 3 }}
                    >
                      Export CSV
                    </Button>
                  </Box>

                  {isLoadingTransactions ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <LinearProgress sx={{ mb: 2 }} />
                      <Typography color="text.secondary">Loading transactions...</Typography>
                    </Box>
                  ) : transactions.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <ReceiptIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        No transactions found
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {filters.search || filters.type !== 'all' || filters.category !== 'all'
                          ? 'Try changing your filters'
                          : 'Add your first transaction to get started'}
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                        sx={{ borderRadius: 3 }}
                      >
                        Add Transaction
                      </Button>
                    </Box>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell padding="checkbox">
                              <input
                                type="checkbox"
                                checked={bulkSelect.length === transactions.length}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setBulkSelect(transactions.map((t: Transaction) => t.id));
                                  } else {
                                    setBulkSelect([]);
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell>Amount</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Account</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <AnimatePresence>
                            {transactions.map((transaction: Transaction) => (
                              <motion.tr
                                key={transaction.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                sx={{
                                  '&:hover': {
                                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                                  },
                                }}
                              >
                                <TableCell padding="checkbox">
                                  <input
                                    type="checkbox"
                                    checked={bulkSelect.includes(transaction.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setBulkSelect([...bulkSelect, transaction.id]);
                                      } else {
                                        setBulkSelect(bulkSelect.filter(id => id !== transaction.id));
                                      }
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box
                                      sx={{
                                        p: 1,
                                        borderRadius: 2,
                                        background: alpha(
                                          transaction.transaction_type === 'income'
                                            ? theme.palette.success.main
                                            : theme.palette.error.main,
                                          0.1
                                        ),
                                        color: transaction.transaction_type === 'income'
                                          ? theme.palette.success.main
                                          : theme.palette.error.main,
                                      }}
                                    >
                                      {getCategoryIcon(transaction.category)}
                                    </Box>
                                    <Box>
                                      <Typography variant="body1" fontWeight={600}>
                                        {transaction.description}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {transaction.transaction_type === 'income' ? 'Income' : 'Expense'}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={transaction.category}
                                    size="small"
                                    icon={<CategoryIcon />}
                                    sx={{
                                      background: alpha(theme.palette.primary.main, 0.1),
                                      color: theme.palette.primary.main,
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Typography
                                    variant="body1"
                                    fontWeight={700}
                                    color={transaction.transaction_type === 'income' ? 'success.main' : 'error.main'}
                                  >
                                    {transaction.transaction_type === 'income' ? '+' : '-'}
                                    ${transaction.amount.toLocaleString()}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {format(new Date(transaction.transaction_date), 'MMM dd, yyyy')}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {transaction.account?.account_name || 'Unknown'}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                    <Tooltip title="Edit">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleOpenDialog(transaction)}
                                        sx={{ color: 'primary.main' }}
                                      >
                                        <EditIcon />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleDeleteTransaction(transaction.id)}
                                        sx={{ color: 'error.main' }}
                                      >
                                        <DeleteIcon />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </TableCell>
                              </motion.tr>
                            ))}
                          </AnimatePresence>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Sidebar - Charts & Summary */}
          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Spending by Category
                  </Typography>
                  <Box sx={{ height: 300, mt: 2 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="amount"
                        >
                          {categoryData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value) => [`$${value}`, 'Amount']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Monthly Trends
                  </Typography>
                  <Box sx={{ height: 250, mt: 2 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={alpha('#000', 0.1)} />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Bar dataKey="income" fill={theme.palette.success.main} name="Income" />
                        <Bar dataKey="expenses" fill={theme.palette.error.main} name="Expenses" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>

                  {/* Quick Stats */}
                  <Box sx={{ mt: 3, pt: 3, borderTop: `1px solid ${alpha('#000', 0.1)}` }}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      Quick Stats
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.success.main, 0.1), borderRadius: 2 }}>
                          <Typography variant="h4" fontWeight={900} color="success.main">
                            ${summary.total_income.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Total Income
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.error.main, 0.1), borderRadius: 2 }}>
                          <Typography variant="h4" fontWeight={900} color="error.main">
                            ${summary.total_expenses.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Total Expenses
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* Add/Edit Transaction Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
          </DialogTitle>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    {...register('description', { required: 'Description is required' })}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                    onBlur={(e) => {
                      if (e.target.value && !editingTransaction) {
                        handleCategorizeWithAI(e.target.value);
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Amount"
                    type="number"
                    {...register('amount', {
                      required: 'Amount is required',
                      valueAsNumber: true,
                      min: { value: 0.01, message: 'Amount must be greater than 0' },
                    })}
                    error={!!errors.amount}
                    helperText={errors.amount?.message}
                    InputProps={{
                      startAdornment: <Typography color="text.secondary">$</Typography>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select
                      label="Type"
                      {...register('transaction_type', { required: 'Transaction type is required' })}
                      error={!!errors.transaction_type}
                      defaultValue="expense"
                    >
                      <MenuItem value="income">Income</MenuItem>
                      <MenuItem value="expense">Expense</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="transaction_date"
                    control={control}
                    rules={{ required: 'Date is required' }}
                    render={({ field }) => (
                      <DatePicker
                        label="Date"
                        value={field.value}
                        onChange={field.onChange}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!errors.transaction_date,
                            helperText: errors.transaction_date?.message,
                          },
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Account</InputLabel>
                    <Select
                      label="Account"
                      {...register('account_id', {
                        required: 'Account is required',
                        valueAsNumber: true,
                      })}
                      error={!!errors.account_id}
                    >
                      {accounts.map((account: any) => (
                        <MenuItem key={account.id} value={account.id}>
                          {account.account_name} (${account.balance.toLocaleString()})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
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
                {watchedCategory && categorySpending[watchedCategory] && (
                  <Grid item xs={12}>
                    <Alert severity="info">
                      Current spending in this category: ${categorySpending[watchedCategory].toLocaleString()}
                    </Alert>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<CategoryIcon />}
                    onClick={() => {
                      const desc = watch('description');
                      if (desc) handleCategorizeWithAI(desc);
                    }}
                    disabled={categorizeMutation.isPending}
                  >
                    {categorizeMutation.isPending ? 'Analyzing...' : 'Suggest Category with AI'}
                  </Button>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={createTransactionMutation.isPending || updateTransactionMutation.isPending}
              >
                {createTransactionMutation.isPending || updateTransactionMutation.isPending
                  ? 'Saving...'
                  : editingTransaction
                  ? 'Update Transaction'
                  : 'Add Transaction'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Import Dialog */}
        <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Import Transactions</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Upload CSV file with your transaction data. The file should include columns for:
            </Typography>
            <ul>
              <li><Typography variant="body2">Date (YYYY-MM-DD)</Typography></li>
              <li><Typography variant="body2">Description</Typography></li>
              <li><Typography variant="body2">Amount</Typography></li>
              <li><Typography variant="body2">Category (optional)</Typography></li>
            </ul>
            <Box sx={{ mt: 3, p: 3, border: `2px dashed ${alpha('#000', 0.2)}`, borderRadius: 2, textAlign: 'center' }}>
              <ImportExportIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography gutterBottom>Drag & drop your CSV file here</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                or
              </Typography>
              <Button variant="contained" component="label">
                Browse Files
                <input type="file" hidden accept=".csv" />
              </Button>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setImportDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" disabled>
              Import
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default Transactions;