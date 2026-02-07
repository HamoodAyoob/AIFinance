import React, { useState, useEffect } from 'react';
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
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Autocomplete,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ShowChart as ShowChartIcon,
  MonetizationOn as MonetizationOnIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Notifications as NotificationsIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { apiService } from 'services/api';
import { format } from 'date-fns';
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

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_percent: number;
  volume: number;
  market_cap?: number;
  last_updated: string;
  sector?: string;
}

interface Crypto {
  symbol: string;
  name: string;
  price: number;
  change_24h: number;
  change_percent_24h: number;
  volume_24h: number;
  market_cap: number;
  last_updated: string;
}

interface MarketOverview {
  stocks: Stock[];
  cryptocurrencies: Crypto[];
  indices?: Array<{
    name: string;
    value: number;
    change: number;
  }>;
  timestamp: string;
}

const Market: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [watchlist, setWatchlist] = useState<string[]>(['AAPL', 'GOOGL', 'MSFT', 'BTC', 'ETH']);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D');
  const [showAllStocks, setShowAllStocks] = useState(false);
  const [showAllCrypto, setShowAllCrypto] = useState(false);
  const theme = useTheme();

  // Fetch market overview
  const { data: marketData, isLoading: isLoadingMarket, refetch: refetchMarket } = useQuery({
    queryKey: ['market-overview'],
    queryFn: () => apiService.getMarketOverview(),
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch individual stock data (if selected)
  const { data: stockData } = useQuery({
    queryKey: ['stock', selectedStock?.symbol],
    queryFn: () => selectedStock ? apiService.getStockPrice(selectedStock.symbol) : null,
    enabled: !!selectedStock,
  });

  // Fetch individual crypto data
  const { data: cryptoData } = useQuery({
    queryKey: ['crypto', selectedStock?.symbol],
    queryFn: () => selectedStock ? apiService.getCryptoPrice(selectedStock.symbol) : null,
    enabled: !!selectedStock && selectedStock.symbol.length <= 4, // Simple heuristic for crypto
  });

  const market: MarketOverview = marketData || {
    stocks: [],
    cryptocurrencies: [],
    timestamp: new Date().toISOString(),
  };

  const stocks = market.stocks || [];
  const cryptos = market.cryptocurrencies || [];
  const indices = market.indices || [
    { name: 'S&P 500', value: 4850.43, change: 0.68 },
    { name: 'NASDAQ', value: 15282.01, change: 1.12 },
    { name: 'DOW JONES', value: 37592.98, change: 0.34 },
  ];

  const filteredStocks = stocks.filter(stock =>
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCryptos = cryptos.filter(crypto =>
    crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    crypto.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedStocks = showAllStocks ? filteredStocks : filteredStocks.slice(0, 5);
  const displayedCryptos = showAllCrypto ? filteredCryptos : filteredCryptos.slice(0, 5);

  const handleAddToWatchlist = (symbol: string) => {
    if (watchlist.includes(symbol)) {
      setWatchlist(watchlist.filter(s => s !== symbol));
      toast.info(`Removed ${symbol} from watchlist`);
    } else {
      setWatchlist([...watchlist, symbol]);
      toast.success(`Added ${symbol} to watchlist`);
    }
  };

  const handleSelectAsset = (asset: Stock | Crypto) => {
    setSelectedStock(asset as Stock);
  };

  const getPriceColor = (change: number) => {
    return change >= 0 ? theme.palette.success.main : theme.palette.error.main;
  };

  const getPriceIcon = (change: number) => {
    return change >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />;
  };

  // Generate historical data for charts
  const generateHistoricalData = (basePrice: number, volatility: number) => {
    const data = [];
    let price = basePrice;
    const timeframes = ['9:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'];
    
    for (let i = 0; i < timeframes.length; i++) {
      const change = (Math.random() - 0.5) * 2 * volatility;
      price = price * (1 + change / 100);
      data.push({
        time: timeframes[i],
        price: price,
        volume: Math.random() * 1000000,
      });
    }
    return data;
  };

  const stockHistoricalData = selectedStock ? generateHistoricalData(selectedStock.price, 2) : [];
  const cryptoHistoricalData = selectedStock ? generateHistoricalData(selectedStock.price, 5) : [];

  // Portfolio value calculation (mock data)
  const portfolioValue = watchlist.reduce((total, symbol) => {
    const stock = stocks.find(s => s.symbol === symbol);
    const crypto = cryptos.find(c => c.symbol === symbol);
    const price = stock?.price || crypto?.price || 0;
    const quantity = Math.floor(Math.random() * 100) + 1; // Mock quantity
    return total + (price * quantity);
  }, 0);

  const portfolioChange = watchlist.reduce((total, symbol) => {
    const stock = stocks.find(s => s.symbol === symbol);
    const crypto = cryptos.find(c => c.symbol === symbol);
    const change = stock?.change || crypto?.change_24h || 0;
    const quantity = Math.floor(Math.random() * 100) + 1;
    return total + (change * quantity);
  }, 0);

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
              Market Data
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Real-time stocks, cryptocurrencies, and market indices
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                sx={{ borderRadius: 3 }}
              >
                Export Data
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={() => refetchMarket()}
                sx={{ borderRadius: 3 }}
                disabled={isLoadingMarket}
              >
                {isLoadingMarket ? 'Refreshing...' : 'Refresh'}
              </Button>
            </motion.div>
          </Box>
        </Box>
      </motion.div>

      {/* Market Indices */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {indices.map((index, idx) => (
          <Grid item xs={12} sm={6} md={4} key={index.name}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 3,
                        background: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                      }}
                    >
                      <ShowChartIcon />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {index.name}
                      </Typography>
                      <Typography variant="h3" fontWeight={900}>
                        {index.value.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getPriceIcon(index.change)}
                    <Typography
                      variant="body1"
                      fontWeight={600}
                      color={getPriceColor(index.change)}
                    >
                      {index.change >= 0 ? '+' : ''}{index.change.toFixed(2)}%
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Portfolio Summary */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Watchlist Portfolio Value
                </Typography>
                <Typography variant="h2" fontWeight={900}>
                  ${portfolioValue.toLocaleString()}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  {getPriceIcon(portfolioChange)}
                  <Typography
                    variant="h6"
                    fontWeight={600}
                    color={getPriceColor(portfolioChange)}
                  >
                    {portfolioChange >= 0 ? '+' : ''}${Math.abs(portfolioChange).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Today
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Assets in Watchlist
                </Typography>
                <Typography variant="h1" fontWeight={900} color="primary.main">
                  {watchlist.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stocks.filter(s => watchlist.includes(s.symbol)).length} stocks •{' '}
                  {cryptos.filter(c => watchlist.includes(c.symbol)).length} crypto
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Last Updated
                </Typography>
                <Typography variant="h5" fontWeight={600}>
                  {format(new Date(market.timestamp), 'HH:mm:ss')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {format(new Date(market.timestamp), 'MMM dd, yyyy')}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search stocks, crypto, or indices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Timeframe</InputLabel>
                <Select
                  value={selectedTimeframe}
                  label="Timeframe"
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                >
                  <MenuItem value="1D">1 Day</MenuItem>
                  <MenuItem value="1W">1 Week</MenuItem>
                  <MenuItem value="1M">1 Month</MenuItem>
                  <MenuItem value="3M">3 Months</MenuItem>
                  <MenuItem value="1Y">1 Year</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterIcon />}
                sx={{ height: '56px' }}
              >
                Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Stocks" />
          <Tab label="Cryptocurrency" />
          <Tab label="Watchlist" />
          <Tab label="Market News" />
        </Tabs>
      </Box>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Left Column - Asset List */}
        <Grid item xs={12} md={activeTab === 2 ? 12 : 6}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" fontWeight={700}>
                    {activeTab === 0 ? 'Top Stocks' : activeTab === 1 ? 'Top Cryptocurrencies' : 'Your Watchlist'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {activeTab === 2 
                      ? `${watchlist.length} assets`
                      : activeTab === 0 
                        ? `${stocks.length} stocks`
                        : `${cryptos.length} cryptocurrencies`}
                  </Typography>
                </Box>

                {isLoadingMarket ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <LinearProgress sx={{ mb: 2 }} />
                    <Typography color="text.secondary">Loading market data...</Typography>
                  </Box>
                ) : (
                  <>
                    {/* Stocks Table */}
                    {(activeTab === 0 || activeTab === 2) && (
                      <TableContainer sx={{ mb: 3 }}>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Symbol</TableCell>
                              <TableCell>Name</TableCell>
                              <TableCell align="right">Price</TableCell>
                              <TableCell align="right">Change</TableCell>
                              <TableCell align="center">Watch</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            <AnimatePresence>
                              {(activeTab === 2 
                                ? stocks.filter(s => watchlist.includes(s.symbol))
                                : displayedStocks
                              ).map((stock, index) => (
                                <motion.tr
                                  key={stock.symbol}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  onClick={() => handleSelectAsset(stock)}
                                  sx={{
                                    cursor: 'pointer',
                                    '&:hover': {
                                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                                    },
                                    ...(selectedStock?.symbol === stock.symbol && {
                                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                                      borderLeft: `4px solid ${theme.palette.primary.main}`,
                                    }),
                                  }}
                                >
                                  <TableCell>
                                    <Typography variant="body1" fontWeight={600}>
                                      {stock.symbol}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" color="text.secondary">
                                      {stock.name}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography variant="body1" fontWeight={700}>
                                      ${stock.price.toLocaleString()}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                      {getPriceIcon(stock.change)}
                                      <Typography
                                        variant="body1"
                                        fontWeight={600}
                                        color={getPriceColor(stock.change)}
                                      >
                                        {stock.change >= 0 ? '+' : ''}{stock.change_percent.toFixed(2)}%
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                  <TableCell align="center">
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddToWatchlist(stock.symbol);
                                      }}
                                    >
                                      {watchlist.includes(stock.symbol) ? (
                                        <StarIcon sx={{ color: theme.palette.warning.main }} />
                                      ) : (
                                        <StarBorderIcon />
                                      )}
                                    </IconButton>
                                  </TableCell>
                                </motion.tr>
                              ))}
                            </AnimatePresence>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}

                    {/* Cryptocurrencies Table */}
                    {(activeTab === 1 || activeTab === 2) && (
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Symbol</TableCell>
                              <TableCell>Name</TableCell>
                              <TableCell align="right">Price</TableCell>
                              <TableCell align="right">24h Change</TableCell>
                              <TableCell align="center">Watch</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            <AnimatePresence>
                              {(activeTab === 2 
                                ? cryptos.filter(c => watchlist.includes(c.symbol))
                                : displayedCryptos
                              ).map((crypto, index) => (
                                <motion.tr
                                  key={crypto.symbol}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  onClick={() => handleSelectAsset(crypto)}
                                  sx={{
                                    cursor: 'pointer',
                                    '&:hover': {
                                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                                    },
                                    ...(selectedStock?.symbol === crypto.symbol && {
                                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                                      borderLeft: `4px solid ${theme.palette.primary.main}`,
                                    }),
                                  }}
                                >
                                  <TableCell>
                                    <Typography variant="body1" fontWeight={600}>
                                      {crypto.symbol}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" color="text.secondary">
                                      {crypto.name}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography variant="body1" fontWeight={700}>
                                      ${crypto.price.toLocaleString()}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                      {getPriceIcon(crypto.change_24h)}
                                      <Typography
                                        variant="body1"
                                        fontWeight={600}
                                        color={getPriceColor(crypto.change_24h)}
                                      >
                                        {crypto.change_24h >= 0 ? '+' : ''}{crypto.change_percent_24h.toFixed(2)}%
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                  <TableCell align="center">
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddToWatchlist(crypto.symbol);
                                      }}
                                    >
                                      {watchlist.includes(crypto.symbol) ? (
                                        <StarIcon sx={{ color: theme.palette.warning.main }} />
                                      ) : (
                                        <StarBorderIcon />
                                      )}
                                    </IconButton>
                                  </TableCell>
                                </motion.tr>
                              ))}
                            </AnimatePresence>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}

                    {/* Show More/Less Buttons */}
                    {(activeTab === 0 || activeTab === 1) && (
                      <Box sx={{ textAlign: 'center', mt: 2 }}>
                        <Button
                          onClick={() => activeTab === 0 ? setShowAllStocks(!showAllStocks) : setShowAllCrypto(!showAllCrypto)}
                          endIcon={activeTab === 0 ? (showAllStocks ? <RemoveIcon /> : <AddIcon />) : (showAllCrypto ? <RemoveIcon /> : <AddIcon />)}
                        >
                          {activeTab === 0
                            ? showAllStocks ? 'Show Less Stocks' : `Show All ${stocks.length} Stocks`
                            : showAllCrypto ? 'Show Less Cryptos' : `Show All ${cryptos.length} Cryptos`}
                        </Button>
                      </Box>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Right Column - Charts & Details */}
        {activeTab !== 2 && (
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {selectedStock ? (
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Box>
                        <Typography variant="h4" fontWeight={900}>
                          {selectedStock.symbol}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedStock.name}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton
                          onClick={() => handleAddToWatchlist(selectedStock.symbol)}
                        >
                          {watchlist.includes(selectedStock.symbol) ? (
                            <StarIcon sx={{ color: theme.palette.warning.main }} />
                          ) : (
                            <StarBorderIcon />
                          )}
                        </IconButton>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<NotificationsIcon />}
                        >
                          Alert
                        </Button>
                      </Box>
                    </Box>

                    {/* Price Display */}
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h1" fontWeight={900} sx={{ mb: 1 }}>
                        ${selectedStock.price.toLocaleString()}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip
                          label={`${selectedStock.change >= 0 ? '+' : ''}${selectedStock.change_percent.toFixed(2)}%`}
                          color={selectedStock.change >= 0 ? 'success' : 'error'}
                          icon={getPriceIcon(selectedStock.change)}
                          sx={{ fontSize: '1rem', fontWeight: 600 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          ${Math.abs(selectedStock.change).toFixed(2)} today
                        </Typography>
                      </Box>
                    </Box>

                    {/* Price Chart */}
                    <Box sx={{ height: 300, mb: 4 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stockHistoricalData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={alpha('#000', 0.1)} />
                          <XAxis dataKey="time" />
                          <YAxis />
                          <RechartsTooltip
                            formatter={(value) => [`$${value}`, 'Price']}
                            contentStyle={{ borderRadius: 8 }}
                          />
                          <Area
                            type="monotone"
                            dataKey="price"
                            stroke={getPriceColor(selectedStock.change)}
                            fill={alpha(getPriceColor(selectedStock.change), 0.2)}
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>

                    {/* Asset Details */}
                    <Grid container spacing={3}>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Volume
                          </Typography>
                          <Typography variant="h5" fontWeight={700}>
                            {selectedStock.volume.toLocaleString()}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Market Cap
                          </Typography>
                          <Typography variant="h5" fontWeight={700}>
                            ${(selectedStock.market_cap || selectedStock.price * selectedStock.volume).toLocaleString()}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Button
                          fullWidth
                          variant="contained"
                          sx={{ borderRadius: 2, py: 1.5 }}
                        >
                          Trade {selectedStock.symbol}
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ) : (
                <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <ShowChartIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Select an asset to view details
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Click on any stock or cryptocurrency to see its chart and detailed information
                    </Typography>
                  </Box>
                </Card>
              )}
            </motion.div>
          </Grid>
        )}

        {/* Market News Section */}
        {activeTab === 3 && (
          <Grid item xs={12}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Latest Market News
                  </Typography>
                  <Grid container spacing={3}>
                    {[
                      {
                        title: 'Tech Stocks Rally on AI Optimism',
                        source: 'Financial Times',
                        time: '2 hours ago',
                        sentiment: 'positive',
                        impact: 'High',
                      },
                      {
                        title: 'Fed Holds Rates Steady, Signals Caution',
                        source: 'Bloomberg',
                        time: '4 hours ago',
                        sentiment: 'neutral',
                        impact: 'Medium',
                      },
                      {
                        title: 'Cryptocurrency Market Sees Volatility',
                        source: 'CoinDesk',
                        time: '6 hours ago',
                        sentiment: 'negative',
                        impact: 'High',
                      },
                      {
                        title: 'Earnings Season Kicks Off Strong',
                        source: 'CNBC',
                        time: '1 day ago',
                        sentiment: 'positive',
                        impact: 'Medium',
                      },
                    ].map((news, index) => (
                      <Grid item xs={12} md={6} key={news.title}>
                        <Card 
                          sx={{ 
                            height: '100%',
                            borderLeft: `4px solid ${
                              news.sentiment === 'positive' ? theme.palette.success.main :
                              news.sentiment === 'negative' ? theme.palette.error.main :
                              theme.palette.warning.main
                            }`,
                          }}
                        >
                          <CardContent>
                            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                              {news.title}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                              <Typography variant="caption" color="text.secondary">
                                {news.source} • {news.time}
                              </Typography>
                              <Chip
                                label={news.impact}
                                size="small"
                                color={
                                  news.impact === 'High' ? 'error' :
                                  news.impact === 'Medium' ? 'warning' : 'success'
                                }
                              />
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        )}
      </Grid>

      {/* Market Summary */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Market Summary
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Market Value
                </Typography>
                <Typography variant="h3" fontWeight={900}>
                  $125.4T
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Advancing Stocks
                </Typography>
                <Typography variant="h3" fontWeight={900} color="success.main">
                  {stocks.filter(s => s.change >= 0).length}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Declining Stocks
                </Typography>
                <Typography variant="h3" fontWeight={900} color="error.main">
                  {stocks.filter(s => s.change < 0).length}
                </Typography>
              </Box>
            </Grid>
          </Grid>
          <Alert severity="info" sx={{ mt: 3, borderRadius: 2 }}>
            <Typography variant="body2">
              Market data is updated in real-time. Prices may be delayed by up to 15 minutes.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Market;