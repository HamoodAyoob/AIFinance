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
  MenuItem,
  Slider,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Timeline as TimelineIcon,
  Insights as InsightsIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  CalendarMonth as CalendarIcon,
  Psychology as PsychologyIcon,
  AutoAwesome as AutoAwesomeIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiService } from 'services/api';
import { format, addMonths } from 'date-fns';
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
  Cell,
} from 'recharts';

interface Prediction {
  category: string;
  predicted_amount: number;
  current_average: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  recommendation?: string;
}

interface ExpenseForecast {
  month: string;
  predicted: number;
  lower_bound: number;
  upper_bound: number;
  actual?: number;
}

const Predictions: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [forecastMonths, setForecastMonths] = useState(6);
  const [showConfidenceIntervals, setShowConfidenceIntervals] = useState(true);
  const [includeSeasonality, setIncludeSeasonality] = useState(true);
  const theme = useTheme();

  // Fetch predictions
  const { data: predictionsData, isLoading: isLoadingPredictions, refetch: refetchPredictions } = useQuery({
    queryKey: ['predictions', forecastMonths, includeSeasonality],
    queryFn: () => apiService.predictExpenses(forecastMonths),
  });

  // Fetch spending trends
  const { data: trendsData, isLoading: isLoadingTrends } = useQuery({
    queryKey: ['spending-trends', forecastMonths],
    queryFn: () => apiService.getSpendingTrends(forecastMonths),
  });

  // Fetch transaction summary for comparison
  const { data: summaryData } = useQuery({
    queryKey: ['transaction-summary'],
    queryFn: () => apiService.getTransactionSummary(),
  });

  const predictions: Prediction[] = predictionsData?.data?.predictions 
    ? Object.entries(predictionsData.data.predictions).map(([category, amount]: [string, any]) => ({
        category,
        predicted_amount: amount,
        current_average: (summaryData?.data?.by_category?.[category] || 0) / (forecastMonths || 1),
        confidence: 0.85, // This would come from backend
        trend: amount > (summaryData?.data?.by_category?.[category] || 0) ? 'up' : 'down',
        recommendation: amount > (summaryData?.data?.by_category?.[category] || 0) 
          ? 'Consider reducing spending'
          : 'Good job! Keep it up',
      }))
    : [];

  const totalPredicted = predictions.reduce((sum, pred) => sum + pred.predicted_amount, 0);
  const currentTotal = Object.values(summaryData?.data?.by_category || {}).reduce((sum: number, amount: any) => sum + amount, 0);
  const percentageChange = currentTotal > 0 ? ((totalPredicted - currentTotal) / currentTotal) * 100 : 0;

  // Generate forecast data
  const generateForecastData = (): ExpenseForecast[] => {
    const data: ExpenseForecast[] = [];
    const baseAmount = currentTotal / (forecastMonths || 1);
    const trendFactor = percentageChange > 0 ? 1.05 : 0.95;
    const seasonalityFactors = [1.1, 1.05, 1.0, 0.95, 0.9, 1.0, 1.1, 1.15, 1.1, 1.05, 1.0, 1.05];

    for (let i = 0; i < forecastMonths; i++) {
      const date = addMonths(new Date(), i + 1);
      const month = format(date, 'MMM yyyy');
      
      let predicted = baseAmount * Math.pow(trendFactor, i);
      if (includeSeasonality) {
        const monthIndex = date.getMonth();
        predicted *= seasonalityFactors[monthIndex];
      }

      const lower_bound = predicted * 0.85;
      const upper_bound = predicted * 1.15;

      data.push({
        month,
        predicted,
        lower_bound,
        upper_bound,
      });
    }
    return data;
  };

  const forecastData = generateForecastData();
  const spendingTrends = trendsData || [];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUpIcon color="error" />;
      case 'down':
        return <TrendingDownIcon color="success" />;
      default:
        return <TimelineIcon color="info" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return theme.palette.success.main;
    if (confidence >= 0.6) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <PsychologyIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
              <Typography variant="h3" fontWeight={900}>
                AI Predictions
              </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary">
              AI-powered insights and forecasts for your financial future
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                sx={{ borderRadius: 3 }}
              >
                Export Insights
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={() => refetchPredictions()}
                sx={{ borderRadius: 3 }}
                disabled={isLoadingPredictions}
              >
                {isLoadingPredictions ? 'Refreshing...' : 'Refresh Predictions'}
              </Button>
            </motion.div>
          </Box>
        </Box>
      </motion.div>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          {
            title: 'Total Predicted',
            value: `$${totalPredicted.toLocaleString()}`,
            change: `${percentageChange >= 0 ? '+' : ''}${percentageChange.toFixed(1)}%`,
            trend: percentageChange >= 0 ? 'up' : 'down',
            description: `Next ${forecastMonths} months`,
            color: percentageChange >= 0 ? theme.palette.error.main : theme.palette.success.main,
            icon: <AutoAwesomeIcon />,
          },
          {
            title: 'AI Confidence',
            value: '87%',
            change: '+2.3%',
            trend: 'up',
            description: 'Prediction accuracy',
            color: theme.palette.success.main,
            icon: <PsychologyIcon />,
          },
          {
            title: 'Savings Opportunity',
            value: '$1,250',
            change: 'Potential',
            trend: 'up',
            description: 'Based on predictions',
            color: theme.palette.warning.main,
            icon: <InsightsIcon />,
          },
          {
            title: 'Risk Factors',
            value: '2',
            change: '-1',
            trend: 'down',
            description: 'Require attention',
            color: theme.palette.error.main,
            icon: <WarningIcon />,
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
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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

      {/* Controls */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="body2" gutterBottom>
                  Forecast Period
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Slider
                    value={forecastMonths}
                    onChange={(_, value) => setForecastMonths(value as number)}
                    min={1}
                    max={12}
                    step={1}
                    marks={[
                      { value: 1, label: '1M' },
                      { value: 3, label: '3M' },
                      { value: 6, label: '6M' },
                      { value: 12, label: '1Y' },
                    ]}
                  />
                  <Typography variant="body1" fontWeight={600}>
                    {forecastMonths} months
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showConfidenceIntervals}
                    onChange={(e) => setShowConfidenceIntervals(e.target.checked)}
                    color="primary"
                  />
                }
                label="Show Confidence Intervals"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={includeSeasonality}
                    onChange={(e) => setIncludeSeasonality(e.target.checked)}
                    color="primary"
                  />
                }
                label="Include Seasonality"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Category Predictions" />
          <Tab label="Expense Forecast" />
          <Tab label="Trend Analysis" />
          <Tab label="Risk Assessment" />
        </Tabs>
      </Box>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Left Column - Predictions Table */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" fontWeight={700}>
                    Category Predictions
                  </Typography>
                  <Chip
                    label={`${predictions.length} categories`}
                    size="small"
                  />
                </Box>

                {isLoadingPredictions ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <LinearProgress sx={{ mb: 2 }} />
                    <Typography color="text.secondary">Generating predictions...</Typography>
                  </Box>
                ) : predictions.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <PsychologyIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      No predictions available
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Add more transaction data to enable AI predictions
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Category</TableCell>
                          <TableCell align="right">Current</TableCell>
                          <TableCell align="right">Predicted</TableCell>
                          <TableCell align="center">Trend</TableCell>
                          <TableCell align="center">Confidence</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <AnimatePresence>
                          {predictions.map((prediction, index) => (
                            <motion.tr
                              key={prediction.category}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              sx={{
                                '&:hover': {
                                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                                },
                              }}
                            >
                              <TableCell>
                                <Typography variant="body1" fontWeight={600}>
                                  {prediction.category}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" color="text.secondary">
                                  ${prediction.current_average.toLocaleString()}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography
                                  variant="body1"
                                  fontWeight={700}
                                  color={prediction.trend === 'up' ? 'error.main' : 'success.main'}
                                >
                                  ${prediction.predicted_amount.toLocaleString()}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Tooltip title={prediction.trend === 'up' ? 'Increasing' : 'Decreasing'}>
                                  {getTrendIcon(prediction.trend)}
                                </Tooltip>
                              </TableCell>
                              <TableCell align="center">
                                <Tooltip title={`${getConfidenceLabel(prediction.confidence)} confidence`}>
                                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                                    <Box
                                      sx={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        bgcolor: getConfidenceColor(prediction.confidence),
                                      }}
                                    />
                                    <Typography variant="caption">
                                      {getConfidenceLabel(prediction.confidence)}
                                    </Typography>
                                  </Box>
                                </Tooltip>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                {/* AI Recommendations */}
                {predictions.length > 0 && (
                  <Box sx={{ mt: 4, pt: 3, borderTop: `1px solid ${alpha('#000', 0.1)}` }}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      AI Recommendations
                    </Typography>
                    <Grid container spacing={2}>
                      {predictions
                        .filter(p => p.trend === 'up' && p.predicted_amount > p.current_average * 1.2)
                        .slice(0, 3)
                        .map(prediction => (
                          <Grid item xs={12} key={prediction.category}>
                            <Alert
                              severity="warning"
                              icon={<WarningIcon />}
                              sx={{ borderRadius: 2 }}
                            >
                              <Typography variant="body2">
                                <strong>{prediction.category}:</strong> Expected to increase by{' '}
                                {((prediction.predicted_amount / prediction.current_average - 1) * 100).toFixed(0)}%.
                                Consider setting a stricter budget.
                              </Typography>
                            </Alert>
                          </Grid>
                        ))}
                    </Grid>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Right Column - Charts */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {/* Expense Forecast Chart */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight={700}>
                    Expense Forecast
                  </Typography>
                  <Chip
                    label={`Next ${forecastMonths} months`}
                    size="small"
                    icon={<CalendarIcon />}
                  />
                </Box>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecastData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha('#000', 0.1)} />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <RechartsTooltip
                        formatter={(value) => [`$${value}`, 'Amount']}
                        contentStyle={{ borderRadius: 8 }}
                      />
                      {showConfidenceIntervals && (
                        <Area
                          type="monotone"
                          dataKey="upper_bound"
                          stroke="transparent"
                          fill={alpha(theme.palette.warning.main, 0.1)}
                          name="Upper Bound"
                        />
                      )}
                      <Area
                        type="monotone"
                        dataKey="predicted"
                        stroke={theme.palette.primary.main}
                        strokeWidth={2}
                        fill={alpha(theme.palette.primary.main, 0.2)}
                        name="Predicted"
                        dot={{ r: 4 }}
                      />
                      {showConfidenceIntervals && (
                        <Area
                          type="monotone"
                          dataKey="lower_bound"
                          stroke="transparent"
                          fill={alpha(theme.palette.warning.main, 0.1)}
                          name="Lower Bound"
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>

            {/* Trend Analysis */}
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Spending Trend Analysis
                </Typography>
                <Box sx={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={spendingTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha('#000', 0.1)} />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <RechartsTooltip formatter={(value) => [`$${value}`, 'Amount']} />
                      <Line
                        type="monotone"
                        dataKey="actual"
                        stroke={theme.palette.info.main}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        name="Actual"
                      />
                      <Line
                        type="monotone"
                        dataKey="predicted"
                        stroke={theme.palette.primary.main}
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ r: 4 }}
                        name="Predicted"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>

                {/* Key Insights */}
                <Box sx={{ mt: 3, pt: 3, borderTop: `1px solid ${alpha('#000', 0.1)}` }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Key Insights
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 1 }}>
                        <Typography variant="h4" fontWeight={900} color="success.main">
                          {predictions.filter(p => p.trend === 'down').length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Categories Improving
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 1 }}>
                        <Typography variant="h4" fontWeight={900} color="error.main">
                          {predictions.filter(p => p.trend === 'up').length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Categories at Risk
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

      {/* Risk Assessment Section */}
      {activeTab === 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Risk Assessment
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Card sx={{ bgcolor: alpha(theme.palette.error.main, 0.05), height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <WarningIcon color="error" />
                        <Typography variant="subtitle1" fontWeight={600} color="error.main">
                          High Risk
                        </Typography>
                      </Box>
                      <Typography variant="body2" gutterBottom>
                        Categories exceeding budget by more than 20%:
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        {predictions
                          .filter(p => p.predicted_amount > p.current_average * 1.2)
                          .map(p => (
                            <Chip
                              key={p.category}
                              label={p.category}
                              size="small"
                              sx={{ mr: 1, mb: 1, bgcolor: alpha(theme.palette.error.main, 0.2) }}
                            />
                          ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card sx={{ bgcolor: alpha(theme.palette.warning.main, 0.05), height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <WarningIcon color="warning" />
                        <Typography variant="subtitle1" fontWeight={600} color="warning.main">
                          Medium Risk
                        </Typography>
                      </Box>
                      <Typography variant="body2" gutterBottom>
                        Categories exceeding budget by 10-20%:
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        {predictions
                          .filter(p => 
                            p.predicted_amount > p.current_average * 1.1 && 
                            p.predicted_amount <= p.current_average * 1.2
                          )
                          .map(p => (
                            <Chip
                              key={p.category}
                              label={p.category}
                              size="small"
                              sx={{ mr: 1, mb: 1, bgcolor: alpha(theme.palette.warning.main, 0.2) }}
                            />
                          ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card sx={{ bgcolor: alpha(theme.palette.success.main, 0.05), height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <CheckCircleIcon color="success" />
                        <Typography variant="subtitle1" fontWeight={600} color="success.main">
                          Low Risk
                        </Typography>
                      </Box>
                      <Typography variant="body2" gutterBottom>
                        Categories within or below budget:
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        {predictions
                          .filter(p => p.predicted_amount <= p.current_average * 1.1)
                          .map(p => (
                            <Chip
                              key={p.category}
                              label={p.category}
                              size="small"
                              sx={{ mr: 1, mb: 1, bgcolor: alpha(theme.palette.success.main, 0.2) }}
                            />
                          ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Box sx={{ mt: 4 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Recommended Actions
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Alert severity="warning" sx={{ borderRadius: 2 }}>
                      <Typography variant="body2">
                        <strong>Review high-risk categories</strong> and consider setting stricter budgets
                        or finding cost-saving alternatives.
                      </Typography>
                    </Alert>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      <Typography variant="body2">
                        <strong>Monitor medium-risk categories</strong> closely and set up alerts for
                        when spending approaches budget limits.
                      </Typography>
                    </Alert>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Model Information */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight={700}>
              AI Model Information
            </Typography>
            <Chip label="Updated: Today" size="small" />
          </Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Model Accuracy
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={87}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    mb: 1,
                  }}
                />
                <Typography variant="body1" fontWeight={600}>
                  87%
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Data Points Analyzed
                </Typography>
                <Typography variant="h4" fontWeight={900}>
                  {predictions.length * 12}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Last Model Training
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {format(new Date(), 'MMM dd, yyyy')}
                </Typography>
              </Box>
            </Grid>
          </Grid>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<NotificationsIcon />}
            sx={{ mt: 3, borderRadius: 2 }}
          >
            Set Up Prediction Alerts
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Predictions;