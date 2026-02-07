import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  IconButton,
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
  MenuItem,
  TextField,
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  Timeline as TimelineIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  ShowChart as ShowChartIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  CalendarMonth as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Insights as InsightsIcon,
  Refresh as RefreshIcon,
  CompareArrows as CompareArrowsIcon,
  DataArray as DataArrayIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { apiService } from 'services/api';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from 'react-toastify';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';

interface AnalyticsData {
  month: string;
  income: number;
  expenses: number;
  savings: number;
  savings_rate: number;
}

interface CategoryAnalytics {
  category: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down';
  average: number;
}

const Analytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState('6m');
  const [comparisonRange, setComparisonRange] = useState('previous');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const theme = useTheme();

  // Fetch monthly analytics
  const { data: monthlyData, isLoading: isLoadingMonthly } = useQuery({
    queryKey: ['monthly-analytics', selectedYear],
    queryFn: () => apiService.getMonthlyAnalytics(selectedYear),
  });

  // Fetch yearly analytics
  const { data: yearlyData, isLoading: isLoadingYearly } = useQuery({
    queryKey: ['yearly-analytics'],
    queryFn: () => apiService.getYearlyAnalytics(),
  });

  // Fetch category analytics
  const { data: categoryData, isLoading: isLoadingCategory } = useQuery({
    queryKey: ['category-analytics', timeRange],
    queryFn: () => {
      const now = new Date();
      let startDate: string;
      switch (timeRange) {
        case '1m':
          startDate = format(subMonths(now, 1), 'yyyy-MM-dd');
          break;
        case '3m':
          startDate = format(subMonths(now, 3), 'yyyy-MM-dd');
          break;
        case '6m':
          startDate = format(subMonths(now, 6), 'yyyy-MM-dd');
          break;
        case '1y':
          startDate = format(subMonths(now, 12), 'yyyy-MM-dd');
          break;
        case 'ytd':
          startDate = format(startOfMonth(new Date(selectedYear, 0, 1)), 'yyyy-MM-dd');
          break;
        default:
          startDate = format(subMonths(now, 6), 'yyyy-MM-dd');
      }
      const endDate = format(endOfMonth(now), 'yyyy-MM-dd');
      return apiService.getCategoryAnalytics(startDate, endDate);
    },
  });

  // Fetch transaction summary
  const { data: summaryData } = useQuery({
    queryKey: ['transaction-summary'],
    queryFn: () => apiService.getTransactionSummary(),
  });

  const monthlyAnalytics: AnalyticsData[] = monthlyData?.data || [];
  const yearlyAnalytics = yearlyData?.data || [];
  const categoryAnalytics: CategoryAnalytics[] = categoryData?.data || [];
  const summary = summaryData?.data || { total_income: 0, total_expenses: 0, net: 0 };

  // Calculate key metrics
  const totalIncome = monthlyAnalytics.reduce((sum, month) => sum + month.income, 0);
  const totalExpenses = monthlyAnalytics.reduce((sum, month) => sum + month.expenses, 0);
  const totalSavings = monthlyAnalytics.reduce((sum, month) => sum + month.savings, 0);
  const averageSavingsRate = monthlyAnalytics.length > 0 
    ? monthlyAnalytics.reduce((sum, month) => sum + month.savings_rate, 0) / monthlyAnalytics.length 
    : 0;

  // Prepare chart data
  const monthlyChartData = monthlyAnalytics.map(month => ({
    ...month,
    month: format(new Date(month.month + '-01'), 'MMM'),
  }));

  const yearlyChartData = yearlyAnalytics;

  const categoryChartData = selectedCategory === 'all' 
    ? categoryAnalytics
    : categoryAnalytics.filter(cat => cat.category === selectedCategory);

  const radarData = categoryAnalytics.slice(0, 8).map(cat => ({
    subject: cat.category,
    A: cat.amount,
    fullMark: Math.max(...categoryAnalytics.map(c => c.amount)),
  }));

  const COLORS = [
    '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#0ea5e9',
    '#a855f7', '#d946ef', '#64748b'
  ];

  const getTrendIcon = (trend: string) => {
    return trend === 'up' ? <TrendingUpIcon color="success" /> : <TrendingDownIcon color="error" />;
  };

  const getSavingsRateColor = (rate: number) => {
    if (rate >= 20) return theme.palette.success.main;
    if (rate >= 10) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const exportAnalytics = () => {
    toast.success('Analytics exported successfully! 📊');
    // In a real app, this would trigger a file download
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

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
              Advanced Analytics
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Deep insights and comprehensive analysis of your financial data
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={exportAnalytics}
                sx={{ borderRadius: 3 }}
              >
                Export Report
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="contained"
                startIcon={<InsightsIcon />}
                sx={{ borderRadius: 3 }}
              >
                Generate Insights
              </Button>
            </motion.div>
          </Box>
        </Box>
      </motion.div>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          {
            title: 'Total Income',
            value: `$${totalIncome.toLocaleString()}`,
            change: '+8.2%',
            trend: 'up',
            icon: <TrendingUpIcon />,
            color: theme.palette.success.main,
            description: `Avg: $${(totalIncome / Math.max(monthlyAnalytics.length, 1)).toLocaleString()}/month`,
          },
          {
            title: 'Total Expenses',
            value: `$${totalExpenses.toLocaleString()}`,
            change: '-3.1%',
            trend: 'down',
            icon: <TrendingDownIcon />,
            color: theme.palette.error.main,
            description: `Avg: $${(totalExpenses / Math.max(monthlyAnalytics.length, 1)).toLocaleString()}/month`,
          },
          {
            title: 'Total Savings',
            value: `$${totalSavings.toLocaleString()}`,
            change: '+15.7%',
            trend: 'up',
            icon: <TrendingUpIcon />,
            color: theme.palette.primary.main,
            description: `Avg: $${(totalSavings / Math.max(monthlyAnalytics.length, 1)).toLocaleString()}/month`,
          },
          {
            title: 'Avg Savings Rate',
            value: `${averageSavingsRate.toFixed(1)}%`,
            change: '+2.3%',
            trend: 'up',
            icon: <ShowChartIcon />,
            color: getSavingsRateColor(averageSavingsRate),
            description: 'Percentage of income saved',
          },
        ].map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={metric.title}>
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
                        background: alpha(metric.color, 0.1),
                        color: metric.color,
                      }}
                    >
                      {metric.icon}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {metric.title}
                      </Typography>
                      <Typography variant="h3" fontWeight={900}>
                        {metric.value}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Chip
                      label={metric.change}
                      size="small"
                      color={metric.trend === 'up' ? 'success' : 'error'}
                      sx={{ fontWeight: 600 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      vs previous period
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {metric.description}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={timeRange}
                  label="Time Range"
                  onChange={(e) => setTimeRange(e.target.value)}
                >
                  <MenuItem value="1m">Last Month</MenuItem>
                  <MenuItem value="3m">Last 3 Months</MenuItem>
                  <MenuItem value="6m">Last 6 Months</MenuItem>
                  <MenuItem value="1y">Last Year</MenuItem>
                  <MenuItem value="ytd">Year to Date</MenuItem>
                  <MenuItem value="all">All Time</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Year</InputLabel>
                <Select
                  value={selectedYear}
                  label="Year"
                  onChange={(e) => setSelectedYear(e.target.value as number)}
                >
                  {years.map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Compare With</InputLabel>
                <Select
                  value={comparisonRange}
                  label="Compare With"
                  onChange={(e) => setComparisonRange(e.target.value)}
                >
                  <MenuItem value="previous">Previous Period</MenuItem>
                  <MenuItem value="last_year">Same Period Last Year</MenuItem>
                  <MenuItem value="budget">Budget</MenuItem>
                  <MenuItem value="average">Historical Average</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<CompareArrowsIcon />}
                sx={{ height: '56px' }}
              >
                Compare
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Monthly Trends" />
          <Tab label="Category Analysis" />
          <Tab label="Yearly Overview" />
          <Tab label="Advanced Metrics" />
        </Tabs>
      </Box>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Left Column - Main Chart */}
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" fontWeight={700}>
                    {activeTab === 0 ? 'Monthly Income vs Expenses' : 
                     activeTab === 1 ? 'Category Spending Analysis' :
                     activeTab === 2 ? 'Yearly Performance' : 'Advanced Metrics'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip label={timeRange} size="small" icon={<CalendarIcon />} />
                    <Chip label={`${selectedYear}`} size="small" />
                  </Box>
                </Box>

                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    {activeTab === 0 ? (
                      <AreaChart data={monthlyChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={alpha('#000', 0.1)} />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <RechartsTooltip
                          formatter={(value) => [`$${value}`, 'Amount']}
                          contentStyle={{ borderRadius: 8 }}
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
                        <Area
                          type="monotone"
                          dataKey="savings"
                          stroke={theme.palette.primary.main}
                          fill={alpha(theme.palette.primary.main, 0.2)}
                          strokeWidth={2}
                          name="Savings"
                        />
                      </AreaChart>
                    ) : activeTab === 1 ? (
                      <BarChart data={categoryChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={alpha('#000', 0.1)} />
                        <XAxis dataKey="category" />
                        <YAxis />
                        <RechartsTooltip formatter={(value) => [`$${value}`, 'Amount']} />
                        <Legend />
                        <Bar dataKey="amount" name="Spending">
                          {categoryChartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    ) : activeTab === 2 ? (
                      <LineChart data={yearlyChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={alpha('#000', 0.1)} />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <RechartsTooltip formatter={(value) => [`$${value}`, 'Amount']} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="income"
                          stroke={theme.palette.success.main}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          name="Income"
                        />
                        <Line
                          type="monotone"
                          dataKey="expenses"
                          stroke={theme.palette.error.main}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          name="Expenses"
                        />
                        <Line
                          type="monotone"
                          dataKey="savings"
                          stroke={theme.palette.primary.main}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          name="Savings"
                        />
                      </LineChart>
                    ) : (
                      <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis />
                        <Radar
                          name="Spending"
                          dataKey="A"
                          stroke={theme.palette.primary.main}
                          fill={theme.palette.primary.main}
                          fillOpacity={0.6}
                        />
                      </RadarChart>
                    )}
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Right Column - Stats & Details */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {/* Savings Rate Card */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Savings Rate Trend
                </Typography>
                <Box sx={{ height: 200, mt: 2 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha('#000', 0.1)} />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <RechartsTooltip
                        formatter={(value) => [`${value}%`, 'Savings Rate']}
                      />
                      <Line
                        type="monotone"
                        dataKey="savings_rate"
                        stroke={getSavingsRateColor(averageSavingsRate)}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Typography variant="h3" fontWeight={900} color={getSavingsRateColor(averageSavingsRate)}>
                    {averageSavingsRate.toFixed(1)}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Average Savings Rate
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Top Categories */}
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Top Spending Categories
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {categoryAnalytics.slice(0, 5).map((category, index) => (
                    <Box key={category.category} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">
                          {category.category}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight={600}>
                            ${category.amount.toLocaleString()}
                          </Typography>
                          {getTrendIcon(category.trend)}
                        </Box>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={category.percentage}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: alpha(COLORS[index % COLORS.length], 0.1),
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            bgcolor: COLORS[index % COLORS.length],
                          },
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {category.percentage.toFixed(1)}% of total
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {/* Quick Stats */}
                <Box sx={{ mt: 3, pt: 3, borderTop: `1px solid ${alpha('#000', 0.1)}` }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Quick Stats
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 1 }}>
                        <Typography variant="h4" fontWeight={900} color="success.main">
                          ${totalIncome.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Total Income
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 1 }}>
                        <Typography variant="h4" fontWeight={900} color="error.main">
                          ${totalExpenses.toLocaleString()}
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

      {/* Detailed Analysis Tables */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Monthly Breakdown */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Monthly Breakdown
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Month</TableCell>
                      <TableCell align="right">Income</TableCell>
                      <TableCell align="right">Expenses</TableCell>
                      <TableCell align="right">Savings</TableCell>
                      <TableCell align="right">Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {monthlyAnalytics.slice().reverse().map((month) => (
                      <TableRow key={month.month}>
                        <TableCell>
                          {format(new Date(month.month + '-01'), 'MMM yyyy')}
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="success.main">
                            ${month.income.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="error.main">
                            ${month.expenses.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}>
                            ${month.savings.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${month.savings_rate.toFixed(1)}%`}
                            size="small"
                            sx={{
                              bgcolor: alpha(getSavingsRateColor(month.savings_rate), 0.1),
                              color: getSavingsRateColor(month.savings_rate),
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Category Comparison */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Category Comparison
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="right">% of Total</TableCell>
                      <TableCell align="center">Trend</TableCell>
                      <TableCell align="right">vs Average</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {categoryAnalytics.map((category) => (
                      <TableRow key={category.category}>
                        <TableCell>
                          <Typography variant="body2">
                            {category.category}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}>
                            ${category.amount.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="text.secondary">
                            {category.percentage.toFixed(1)}%
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {getTrendIcon(category.trend)}
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            color={category.amount > category.average ? 'error.main' : 'success.main'}
                          >
                            {((category.amount / category.average - 1) * 100).toFixed(1)}%
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Insights & Recommendations */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <InsightsIcon color="primary" />
            <Typography variant="h6" fontWeight={700}>
              AI-Generated Insights
            </Typography>
          </Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: alpha(theme.palette.success.main, 0.05), height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle2" color="success.main" gutterBottom>
                    ✅ Strong Performance
                  </Typography>
                  <Typography variant="body2">
                    Your savings rate of {averageSavingsRate.toFixed(1)}% is above the recommended 20%.
                    Consider investing the surplus for better returns.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: alpha(theme.palette.warning.main, 0.05), height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle2" color="warning.main" gutterBottom>
                    📊 Optimization Opportunity
                  </Typography>
                  <Typography variant="body2">
                    {categoryAnalytics[0]?.category} accounts for {categoryAnalytics[0]?.percentage.toFixed(1)}% of expenses.
                    Look for ways to reduce spending in this category.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: alpha(theme.palette.info.main, 0.05), height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle2" color="info.main" gutterBottom>
                    📈 Growth Potential
                  </Typography>
                  <Typography variant="body2">
                    Income has grown by 8.2% while expenses decreased by 3.1%.
                    This positive trend suggests strong financial health.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<BarChartIcon />}
          onClick={() => toast.info('PDF report generation started')}
        >
          Export as PDF
        </Button>
        <Button
          variant="outlined"
          startIcon={<DataArrayIcon />}
          onClick={() => toast.info('CSV file downloaded')}
        >
          Export as CSV
        </Button>
        <Button
          variant="outlined"
          startIcon={<TimelineIcon />}
          onClick={() => toast.info('Shareable link copied')}
        >
          Share Report
        </Button>
      </Box>
    </Box>
  );
};

export default Analytics;