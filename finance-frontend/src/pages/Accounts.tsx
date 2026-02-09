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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccountBalance as AccountBalanceIcon,
  Savings as SavingsIcon,
  CreditCard as CreditCardIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as AttachMoneyIcon,
  MoreVert as MoreVertIcon,
  Download as DownloadIcon,
  QrCode as QrCodeIcon,
  SwapHoriz as SwapHorizIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from 'services/api';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Area } from 'recharts';

interface Account {
  id: number;
  account_name: string;
  account_type: 'checking' | 'savings' | 'credit_card' | 'investment' | 'cash' | 'loan';
  balance: number;
  currency: string;
  institution?: string;
  account_number?: string;
  interest_rate?: number;
  credit_limit?: number;
  created_at: string;
  updated_at: string;
}

interface AccountFormData {
  account_name: string;
  account_type: string;
  balance: number;
  currency: string;
  institution?: string;
  account_number?: string;
  interest_rate?: number;
  credit_limit?: number;
}

const accountTypes = [
  { value: 'checking', label: 'Checking Account', icon: <AccountBalanceIcon />, color: '#6366f1' },
  { value: 'savings', label: 'Savings Account', icon: <SavingsIcon />, color: '#10b981' },
  { value: 'credit_card', label: 'Credit Card', icon: <CreditCardIcon />, color: '#ef4444' },
  { value: 'investment', label: 'Investment', icon: <TrendingUpIcon />, color: '#f59e0b' },
  { value: 'cash', label: 'Cash', icon: <AttachMoneyIcon />, color: '#8b5cf6' },
  { value: 'loan', label: 'Loan', icon: <SwapHorizIcon />, color: '#ec4899' },
];

const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CNY', 'INR'];

const Accounts: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);
  const theme = useTheme();
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AccountFormData>();

  // Fetch accounts
  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => apiService.getAccounts(),
  });

  // Fetch exchange rates
  const { data: exchangeRates } = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: () => apiService.getExchangeRates('USD'),
  });

  // Fetch transaction summary
  const { data: transactionSummary } = useQuery({
    queryKey: ['account-transaction-summary'],
    queryFn: () => apiService.getTransactionSummary(),
  });

  // Create account mutation
  const createAccountMutation = useMutation({
    mutationFn: (data: AccountFormData) => apiService.createAccount(data),
    onSuccess: () => {
      toast.success('Account created successfully! 🎉');
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setOpenDialog(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create account');
    },
  });

  // Update account mutation
  const updateAccountMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AccountFormData> }) =>
      apiService.updateAccount(id, data),
    onSuccess: () => {
      toast.success('Account updated successfully! ✅');
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setOpenDialog(false);
      setEditingAccount(null);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update account');
    },
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: (id: number) => apiService.deleteAccount(id),
    onSuccess: () => {
      toast.success('Account deleted successfully! 🗑️');
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete account');
    },
  });

  const accounts = accountsData?.data || [];
  const totalBalance = accounts.reduce((sum: number, account: Account) => sum + account.balance, 0);

  const handleOpenDialog = (account?: Account) => {
    if (account) {
      setEditingAccount(account);
      reset({
        account_name: account.account_name,
        account_type: account.account_type,
        balance: account.balance,
        currency: account.currency,
        institution: account.institution,
        account_number: account.account_number,
        interest_rate: account.interest_rate,
        credit_limit: account.credit_limit,
      });
    } else {
      setEditingAccount(null);
      reset({
        account_name: '',
        account_type: 'checking',
        balance: 0,
        currency: 'USD',
        institution: '',
        account_number: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAccount(null);
    reset();
  };

  const onSubmit = (data: AccountFormData) => {
    if (editingAccount) {
      updateAccountMutation.mutate({ id: editingAccount.id, data });
    } else {
      createAccountMutation.mutate(data);
    }
  };

  const handleDeleteAccount = (id: number) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      deleteAccountMutation.mutate(id);
    }
  };

  const handleSelectAccount = (id: number) => {
    setSelectedAccounts(prev =>
      prev.includes(id) ? prev.filter(accountId => accountId !== id) : [...prev, id]
    );
  };

  const getAccountIcon = (type: string) => {
    return accountTypes.find(t => t.value === type)?.icon || <AccountBalanceIcon />;
  };

  const getAccountColor = (type: string) => {
    return accountTypes.find(t => t.value === type)?.color || '#6366f1';
  };

  // Prepare data for charts
  const balanceHistory = accounts.length ? 
    accounts.map((account, index) => ({
      date: `${account.account_name?.substring(0, 3) || 'Acc'} ${index + 1}`,
      balance: account.balance || 0
    }))
    : [];

  const typeDistribution: Record<string, number> = accounts.reduce((acc: Record<string, number>, account: Account) => {
    acc[account.account_type] = (acc[account.account_type] || 0) + account.balance;
    return acc;
  }, {});

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
              Accounts Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage all your bank accounts, cards, and investments in one place
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                sx={{ borderRadius: 3 }}
              >
                Export
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
                sx={{ borderRadius: 3 }}
              >
                Add Account
              </Button>
            </motion.div>
          </Box>
        </Box>
      </motion.div>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          {
            title: 'Total Balance',
            value: `$${totalBalance.toLocaleString()}`,
            change: '+12.5%',
            trend: 'up',
            description: 'Across all accounts',
            color: theme.palette.primary.main,
          },
          {
            title: 'Active Accounts',
            value: accounts.length.toString(),
            change: '+2',
            trend: 'up',
            description: 'Total accounts',
            color: theme.palette.success.main,
          },
          {
            title: 'Monthly Change',
            value: '$0',
            change: '0%',
            trend: 'neutral' as const,
            description: 'Last 30 days',
            color: theme.palette.info.main,
          },
          {
            title: 'Debt',
            value: '$0',
            change: '0%',
            trend: 'neutral' as const,
            description: 'Credit cards & loans',
            color: theme.palette.error.main,
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
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {stat.title}
                  </Typography>
                  <Typography variant="h3" fontWeight={900}>
                    {stat.value}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <Chip
                      label={stat.change}
                      size="small"
                      color={stat.trend === 'up' ? 'success' : 'error'}
                      sx={{ fontWeight: 600 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {stat.description}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="All Accounts" />
          <Tab label="Bank Accounts" />
          <Tab label="Credit Cards" />
          <Tab label="Investments" />
        </Tabs>
      </Box>

      {/* Content */}
      <Grid container spacing={3}>
        {/* Accounts List */}
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
                    All Accounts
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {accounts.length} accounts
                  </Typography>
                </Box>

                {isLoadingAccounts ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <LinearProgress sx={{ mb: 2 }} />
                    <Typography color="text.secondary">Loading accounts...</Typography>
                  </Box>
                ) : accounts.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <AccountBalanceIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      No accounts yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Add your first account to get started
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => handleOpenDialog()}
                      sx={{ borderRadius: 3 }}
                    >
                      Add Account
                    </Button>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Account</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Balance</TableCell>
                          <TableCell>Currency</TableCell>
                          <TableCell>Last Updated</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <AnimatePresence>
                          {accounts.map((account: Account) => (
                            <motion.tr
                              key={account.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                            >
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Box
                                    sx={{
                                      p: 1,
                                      borderRadius: 2,
                                      background: alpha(getAccountColor(account.account_type), 0.1),
                                      color: getAccountColor(account.account_type),
                                    }}
                                  >
                                    {getAccountIcon(account.account_type)}
                                  </Box>
                                  <Box>
                                    <Typography variant="body1" fontWeight={600}>
                                      {account.account_name}
                                    </Typography>
                                    {account.institution && (
                                      <Typography variant="caption" color="text.secondary">
                                        {account.institution}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={account.account_type.replace('_', ' ')}
                                  size="small"
                                  sx={{
                                    textTransform: 'capitalize',
                                    background: alpha(getAccountColor(account.account_type), 0.1),
                                    color: getAccountColor(account.account_type),
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography
                                  variant="body1"
                                  fontWeight={700}
                                  color={account.balance >= 0 ? 'success.main' : 'error.main'}
                                >
                                  ${account.balance.toLocaleString()}
                                </Typography>
                                {account.credit_limit && (
                                  <Typography variant="caption" color="text.secondary">
                                    Limit: ${account.credit_limit.toLocaleString()}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Chip label={account.currency} size="small" variant="outlined" />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {format(new Date(account.updated_at), 'MMM dd, yyyy')}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenDialog(account)}
                                    sx={{ color: 'primary.main' }}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteAccount(account.id)}
                                    sx={{ color: 'error.main' }}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
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
                  Balance History
                </Typography>
                <Box sx={{ height: 200, mt: 2 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={balanceHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha('#000', 0.1)} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <RechartsTooltip
                        formatter={(value) => [`$${value}`, 'Balance']}
                      />
                      <Line
                        type="monotone"
                        dataKey="balance"
                        stroke={theme.palette.primary.main}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Account Distribution
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {Object.entries(typeDistribution).map(([type, balance]: [string, number]) => {
                    const percentage = (balance / totalBalance) * 100;
                    const color = getAccountColor(type);
                    return (
                      <Box key={type} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {type.replace('_', ' ')}
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            ${balance.toLocaleString()}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={percentage}
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
                        <Typography variant="caption" color="text.secondary">
                          {percentage.toFixed(1)}%
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>

                {/* Quick Actions */}
                <Box sx={{ mt: 4, pt: 3, borderTop: `1px solid ${alpha('#000', 0.1)}` }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Quick Actions
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<SwapHorizIcon />}
                        size="small"
                        sx={{ borderRadius: 2 }}
                      >
                        Transfer
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<QrCodeIcon />}
                        size="small"
                        sx={{ borderRadius: 2 }}
                      >
                        Pay
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Add/Edit Account Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAccount ? 'Edit Account' : 'Add New Account'}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Account Name"
                  {...register('account_name', { required: 'Account name is required' })}
                  error={!!errors.account_name}
                  helperText={errors.account_name?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Account Type"
                  {...register('account_type', { required: 'Account type is required' })}
                  error={!!errors.account_type}
                  helperText={errors.account_type?.message}
                >
                  {accountTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {type.icon}
                        {type.label}
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Currency"
                  {...register('currency', { required: 'Currency is required' })}
                  error={!!errors.currency}
                  helperText={errors.currency?.message}
                  defaultValue="USD"
                >
                  {currencies.map((currency) => (
                    <MenuItem key={currency} value={currency}>
                      {currency}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Balance"
                  type="number"
                  {...register('balance', {
                    required: 'Balance is required',
                    valueAsNumber: true,
                  })}
                  error={!!errors.balance}
                  helperText={errors.balance?.message}
                  InputProps={{
                    startAdornment: <Typography color="text.secondary">$</Typography>,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Institution (Optional)"
                  {...register('institution')}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Account Number (Optional)"
                  {...register('account_number')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Interest Rate % (Optional)"
                  type="number"
                  {...register('interest_rate', { valueAsNumber: true })}
                  InputProps={{
                    endAdornment: <Typography color="text.secondary">%</Typography>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Credit Limit (Optional)"
                  type="number"
                  {...register('credit_limit', { valueAsNumber: true })}
                  InputProps={{
                    startAdornment: <Typography color="text.secondary">$</Typography>,
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createAccountMutation.isPending || updateAccountMutation.isPending}
            >
              {createAccountMutation.isPending || updateAccountMutation.isPending
                ? 'Saving...'
                : editingAccount
                ? 'Update Account'
                : 'Create Account'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Accounts;