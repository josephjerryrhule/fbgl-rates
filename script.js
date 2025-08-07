// Enhanced Financial Dashboard with Alpha Vantage API Integration
class FinancialDashboard {
    constructor() {
        this.charts = {};
        this.data = {};
        this.historicalData = {};
        this.isLoading = false;
        this.updateInterval = 60000; // 1 minute for real API (Alpha Vantage rate limit)
        this.maxDataPoints = 50;
        this.currentSymbol = 'CL=F'; // Default to WTI Crude Oil
        this.currentPeriod = '1D'; // For overview chart
        this.currentInterval = '1min'; // For main chart
        
        // Alpha Vantage API Configuration
        this.apiKey = 'GW7G2TU8GFHGU1S3'; // Your Alpha Vantage API key
        this.apiBase = 'https://www.alphavantage.co/query';
        
        // Commodity configurations with Alpha Vantage compatible symbols
        // Using ETFs and popular symbols that track commodities
        this.commodities = {
            'CL=F': { 
                name: 'Crude Oil WTI', 
                basePrice: 75.50, 
                volatility: 0.02,
                apiSymbol: 'USO', // United States Oil Fund ETF (tracks WTI)
                unit: '$',
                type: 'etf'
            },
            'BZ=F': { 
                name: 'Brent Oil', 
                basePrice: 79.20, 
                volatility: 0.02,
                apiSymbol: 'BNO', // United States Brent Oil Fund ETF
                unit: '$',
                type: 'etf'
            },
            'NG=F': { 
                name: 'Natural Gas', 
                basePrice: 2.85, 
                volatility: 0.03,
                apiSymbol: 'UNG', // United States Natural Gas Fund ETF
                unit: '$',
                type: 'etf'
            },
            'GC=F': { 
                name: 'Gold', 
                basePrice: 2040.00, 
                volatility: 0.005,
                apiSymbol: 'GLD', // SPDR Gold Trust ETF
                unit: '$',
                type: 'etf'
            },
            'SI=F': { 
                name: 'Silver', 
                basePrice: 24.50, 
                volatility: 0.015,
                apiSymbol: 'SLV', // iShares Silver Trust ETF
                unit: '$',
                type: 'etf'
            },
            'HG=F': { 
                name: 'Copper', 
                basePrice: 3.85, 
                volatility: 0.02,
                apiSymbol: 'CPER', // United States Copper Index Fund ETF
                unit: '$',
                type: 'etf'
            },
            'ZS=F': { 
                name: 'US Soybeans', 
                basePrice: 1450.00, 
                volatility: 0.02,
                apiSymbol: 'SOYB', // Teucrium Soybean Fund ETF
                unit: '$',
                type: 'etf'
            }
        };
        
        // Time period configurations for overview chart
        this.timePeriods = {
            '1D': { label: '1 Day', days: 1, interval: 'daily' },
            '1W': { label: '1 Week', days: 7, interval: 'daily' },
            '1M': { label: '1 Month', days: 30, interval: 'daily' },
            '6M': { label: '6 Months', days: 180, interval: 'weekly' },
            '1Y': { label: '1 Year', days: 365, interval: 'weekly' },
            '5Y': { label: '5 Years', days: 1825, interval: 'monthly' },
            'MAX': { label: 'Max', days: 3650, interval: 'monthly' }
        };

        // Time interval configurations for main chart
        this.timeIntervals = {
            '1min': { label: '1 Minute', apiInterval: '1min', maxPoints: 100 },
            '5min': { label: '5 Minutes', apiInterval: '5min', maxPoints: 100 },
            '15min': { label: '15 Minutes', apiInterval: '15min', maxPoints: 100 },
            '30min': { label: '30 Minutes', apiInterval: '30min', maxPoints: 100 },
            '1hr': { label: '1 Hour', apiInterval: '60min', maxPoints: 100 },
            '4hr': { label: '4 Hours', apiInterval: 'daily', maxPoints: 100 },
            '1d': { label: '1 Day', apiInterval: 'daily', maxPoints: 100 },
            '1w': { label: '1 Week', apiInterval: 'weekly', maxPoints: 52 },
            '1m': { label: '1 Month', apiInterval: 'monthly', maxPoints: 12 }
        };
        
        this.init();
    }

    async init() {
        this.initializeData();
        this.setupEventListeners();
        await this.loadInitialData();
        this.createCharts();
        this.startRealTimeUpdates();
        this.updateLastRefreshTime();
    }

    initializeData() {
        const now = new Date();
        
        Object.keys(this.commodities).forEach(symbol => {
            this.data[symbol] = {
                prices: [],
                timestamps: [],
                currentPrice: this.commodities[symbol].basePrice,
                previousPrice: this.commodities[symbol].basePrice,
                change: 0,
                changePercent: 0,
                mainChartData: [] // For main chart with different intervals
            };
            
            this.historicalData[symbol] = {};
            
            // Initialize with some simulated data as fallback
            for (let i = this.maxDataPoints; i >= 0; i--) {
                const time = new Date(now.getTime() - (i * 60000));
                const price = this.generateRealisticPrice(symbol, this.commodities[symbol].basePrice);
                
                this.data[symbol].prices.push(price);
                this.data[symbol].timestamps.push(time);
            }
            
            this.updateChangeCalculations(symbol);
        });
    }

    setupEventListeners() {
        // Period time buttons for overview chart
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTimePeriod(e.target.dataset.period);
            });
        });

        // Main chart interval buttons
        document.querySelectorAll('.main-time-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTimeInterval(e.target.dataset.interval);
            });
        });
        
        // Commodity item clicks
        document.querySelectorAll('.commodity-item.clickable').forEach(item => {
            item.addEventListener('click', (e) => {
                const symbol = item.dataset.symbol;
                const name = item.dataset.name;
                this.switchMainChart(symbol, name);
            });
        });
    }

    async loadInitialData() {
        this.showLoading();
        
        try {
            console.log('Loading real commodity data from Alpha Vantage...');
            
            // Load current prices for all commodities
            await this.fetchAllCurrentPrices();
            
            // Load historical data for current symbol and period (overview chart)
            await this.fetchHistoricalData(this.currentSymbol, this.currentPeriod);
            
            // Load main chart data for current symbol and interval
            await this.fetchMainChartData(this.currentSymbol, this.currentInterval);
            
            console.log('Data loaded successfully!');
        } catch (error) {
            console.error('Error loading initial data:', error);
            console.log('Falling back to simulated data');
        }
        
        this.hideLoading();
    }

    async fetchAllCurrentPrices() {
        // Fetch prices sequentially to respect API rate limits
        for (const symbol of Object.keys(this.commodities)) {
            await this.fetchCurrentPrice(symbol);
            // Small delay between requests to respect rate limits
            await this.delay(1000);
        }
    }

    async fetchCurrentPrice(symbol) {
        try {
            const config = this.commodities[symbol];
            
            // Use Alpha Vantage TIME_SERIES_INTRADAY for current ETF prices
            const url = `${this.apiBase}?function=TIME_SERIES_INTRADAY&symbol=${config.apiSymbol}&interval=5min&apikey=${this.apiKey}`;
            
            console.log(`Fetching current price for ${symbol} via ${config.apiSymbol}...`);
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data['Error Message']) {
                console.warn(`API Error for ${symbol}: ${data['Error Message']}`);
                this.updatePriceSimulated(symbol);
                return;
            }
            
            if (data['Note']) {
                console.warn('API call frequency limit reached, using simulated data');
                this.updatePriceSimulated(symbol);
                return;
            }
            
            // Parse Alpha Vantage intraday response
            const timeSeriesKey = 'Time Series (5min)';
            
            if (data[timeSeriesKey]) {
                const timeSeries = data[timeSeriesKey];
                const timestamps = Object.keys(timeSeries).sort().reverse(); // Latest first
                
                if (timestamps.length > 0) {
                    const latestData = timeSeries[timestamps[0]];
                    const currentPrice = parseFloat(latestData['4. close']);
                    
                    // Scale ETF price to approximate commodity price
                    const scaledPrice = this.scaleETFPrice(symbol, currentPrice);
                    
                    this.updatePriceFromAPI(symbol, scaledPrice);
                    console.log(`✓ Real price loaded for ${symbol}: $${scaledPrice.toFixed(2)} (via ${config.apiSymbol}: $${currentPrice.toFixed(2)})`);
                    return;
                }
            }
            
            // Fallback to simulated data
            console.warn(`No intraday data available for ${config.apiSymbol}, using simulated data`);
            this.updatePriceSimulated(symbol);
            
        } catch (error) {
            console.error(`Error fetching price for ${symbol}:`, error);
            this.updatePriceSimulated(symbol);
        }
    }

    // Scale ETF prices to approximate commodity prices for better user experience
    scaleETFPrice(symbol, etfPrice) {
        const config = this.commodities[symbol];
        const basePrice = config.basePrice;
        
        // Different scaling factors for different commodities
        switch(symbol) {
            case 'CL=F': // Oil ETF USO ~= WTI/2
                return etfPrice * 2.1;
            case 'BZ=F': // Brent ETF BNO ~= Brent/2.5
                return etfPrice * 2.3;
            case 'NG=F': // Natural Gas ETF UNG ~= NG*3
                return etfPrice * 0.15;
            case 'GC=F': // Gold ETF GLD ~= Gold/10
                return etfPrice * 10.2;
            case 'SI=F': // Silver ETF SLV ~= Silver
                return etfPrice * 1.1;
            case 'HG=F': // Copper ETF CPER ~= Copper*10
                return etfPrice * 0.25;
            case 'ZS=F': // Soybean ETF SOYB ~= Soybeans/10
                return etfPrice * 55;
            default:
                return etfPrice;
        }
    }

    async fetchHistoricalData(symbol, period) {
        try {
            const config = this.commodities[symbol];
            const periodConfig = this.timePeriods[period];
            
            // Use appropriate time series function based on period
            let functionName = 'TIME_SERIES_DAILY';
            let outputSize = 'compact'; // Last 100 data points
            
            if (periodConfig.days > 100) {
                outputSize = 'full'; // Full data
            }
            
            if (periodConfig.interval === 'weekly') {
                functionName = 'TIME_SERIES_WEEKLY';
            } else if (periodConfig.interval === 'monthly') {
                functionName = 'TIME_SERIES_MONTHLY';
            }
            
            const url = `${this.apiBase}?function=${functionName}&symbol=${config.apiSymbol}&outputsize=${outputSize}&apikey=${this.apiKey}`;
            
            console.log(`Fetching historical data for ${symbol} (${period}) via ${config.apiSymbol}...`);
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data['Error Message']) {
                console.warn(`API Error for historical data: ${data['Error Message']}`);
                this.generateHistoricalData(symbol, period);
                return;
            }
            
            if (data['Note']) {
                console.warn('API rate limit reached for historical data, using simulated data');
                this.generateHistoricalData(symbol, period);
                return;
            }
            
            // Parse historical data
            let timeSeriesKey = 'Time Series (Daily)';
            if (functionName === 'TIME_SERIES_WEEKLY') {
                timeSeriesKey = 'Weekly Time Series';
            } else if (functionName === 'TIME_SERIES_MONTHLY') {
                timeSeriesKey = 'Monthly Time Series';
            }
            
            if (data[timeSeriesKey]) {
                this.processAlphaVantageHistoricalData(symbol, period, data[timeSeriesKey]);
                console.log(`✓ Historical data loaded for ${symbol} (${period}) via ${config.apiSymbol}`);
                return;
            }
            
            // Fallback to simulated data
            console.warn(`No historical data available for ${config.apiSymbol}, using simulated data`);
            this.generateHistoricalData(symbol, period);
            
        } catch (error) {
            console.error(`Error fetching historical data for ${symbol}:`, error);
            this.generateHistoricalData(symbol, period);
        }
    }

    processAlphaVantageHistoricalData(symbol, period, timeSeries) {
        const dates = Object.keys(timeSeries).sort().reverse(); // Most recent first
        const periodConfig = this.timePeriods[period];
        
        // Limit data points based on period
        const maxPoints = Math.min(dates.length, 100);
        const data = [];
        
        for (let i = 0; i < maxPoints; i++) {
            const date = dates[i];
            const dayData = timeSeries[date];
            
            const etfPrice = parseFloat(dayData['4. close']);
            const scaledPrice = this.scaleETFPrice(symbol, etfPrice);
            
            data.push({
                date: new Date(date),
                price: scaledPrice,
                volume: parseInt(dayData['5. volume']) || 0
            });
        }
        
        this.historicalData[symbol][period] = data.reverse(); // Chronological order
    }

    updatePriceFromAPI(symbol, currentPrice) {
        const data = this.data[symbol];
        data.previousPrice = data.currentPrice;
        data.currentPrice = currentPrice;
        
        // Calculate change
        data.change = currentPrice - data.previousPrice;
        data.changePercent = data.previousPrice !== 0 ? 
            ((currentPrice - data.previousPrice) / data.previousPrice) * 100 : 0;
        
        // Add to price history
        data.prices.push(currentPrice);
        data.timestamps.push(new Date());
        
        if (data.prices.length > this.maxDataPoints) {
            data.prices.shift();
            data.timestamps.shift();
        }
    }

    updatePriceSimulated(symbol) {
        const data = this.data[symbol];
        data.previousPrice = data.currentPrice;
        
        const newPrice = this.generateRealisticPrice(symbol, data.currentPrice);
        data.currentPrice = newPrice;
        
        data.prices.push(newPrice);
        data.timestamps.push(new Date());
        
        if (data.prices.length > this.maxDataPoints) {
            data.prices.shift();
            data.timestamps.shift();
        }
        
        this.updateChangeCalculations(symbol);
    }

    async fetchMainChartData(symbol, interval) {
        try {
            const config = this.commodities[symbol];
            const intervalConfig = this.timeIntervals[interval];
            
            let functionName = 'TIME_SERIES_INTRADAY';
            let apiInterval = intervalConfig.apiInterval;
            let outputSize = 'compact';
            
            console.log(`Fetching main chart data for ${symbol} (${interval})...`);
            
            // Use appropriate function based on interval
            if (['1d', '1w', '1m'].includes(interval)) {
                if (interval === '1d') functionName = 'TIME_SERIES_DAILY';
                else if (interval === '1w') functionName = 'TIME_SERIES_WEEKLY';
                else if (interval === '1m') functionName = 'TIME_SERIES_MONTHLY';
                
                const url = `${this.apiBase}?function=${functionName}&symbol=${config.apiSymbol}&outputsize=${outputSize}&apikey=${this.apiKey}`;
                
                const response = await fetch(url);
                const data = await response.json();
                
                if (data['Error Message'] || data['Note']) {
                    console.warn(`API limit or error for main chart data, using simulated data`);
                    this.generateMainChartData(symbol, interval);
                    return;
                }
                
                this.processMainChartData(symbol, interval, data);
                console.log(`✓ Main chart data loaded for ${symbol} (${interval})`);
                
            } else {
                // Intraday data
                const url = `${this.apiBase}?function=${functionName}&symbol=${config.apiSymbol}&interval=${apiInterval}&outputsize=${outputSize}&apikey=${this.apiKey}`;
                
                const response = await fetch(url);
                const data = await response.json();
                
                if (data['Error Message'] || data['Note']) {
                    console.warn(`API limit or error for intraday data, using simulated data`);
                    this.generateMainChartData(symbol, interval);
                    return;
                }
                
                this.processIntradayMainChartData(symbol, interval, data, apiInterval);
                console.log(`✓ Intraday main chart data loaded for ${symbol} (${interval})`);
            }
            
        } catch (error) {
            console.error(`Error fetching main chart data for ${symbol}:`, error);
            this.generateMainChartData(symbol, interval);
        }
    }

    processMainChartData(symbol, interval, data) {
        let timeSeriesKey;
        if (interval === '1d') timeSeriesKey = 'Time Series (Daily)';
        else if (interval === '1w') timeSeriesKey = 'Weekly Time Series';
        else if (interval === '1m') timeSeriesKey = 'Monthly Time Series';
        
        if (data[timeSeriesKey]) {
            const timeSeries = data[timeSeriesKey];
            const dates = Object.keys(timeSeries).sort().reverse();
            const processedData = [];
            
            for (let i = 0; i < Math.min(dates.length, 100); i++) {
                const date = dates[i];
                const dayData = timeSeries[date];
                const etfPrice = parseFloat(dayData['4. close']);
                const scaledPrice = this.scaleETFPrice(symbol, etfPrice);
                
                processedData.push({
                    date: new Date(date),
                    price: scaledPrice
                });
            }
            
            this.data[symbol].mainChartData = processedData.reverse();
        }
    }

    processIntradayMainChartData(symbol, interval, data, apiInterval) {
        const timeSeriesKey = `Time Series (${apiInterval})`;
        
        if (data[timeSeriesKey]) {
            const timeSeries = data[timeSeriesKey];
            const timestamps = Object.keys(timeSeries).sort().reverse();
            const processedData = [];
            
            for (let i = 0; i < Math.min(timestamps.length, 100); i++) {
                const timestamp = timestamps[i];
                const timeData = timeSeries[timestamp];
                const etfPrice = parseFloat(timeData['4. close']);
                const scaledPrice = this.scaleETFPrice(symbol, etfPrice);
                
                processedData.push({
                    date: new Date(timestamp),
                    price: scaledPrice
                });
            }
            
            this.data[symbol].mainChartData = processedData.reverse();
        }
    }

    generateMainChartData(symbol, interval) {
        const basePrice = this.commodities[symbol].basePrice;
        const data = [];
        const now = new Date();
        
        let intervalMs;
        switch(interval) {
            case '1min': intervalMs = 60 * 1000; break;
            case '5min': intervalMs = 5 * 60 * 1000; break;
            case '15min': intervalMs = 15 * 60 * 1000; break;
            case '30min': intervalMs = 30 * 60 * 1000; break;
            case '1hr': intervalMs = 60 * 60 * 1000; break;
            case '4hr': intervalMs = 4 * 60 * 60 * 1000; break;
            case '1d': intervalMs = 24 * 60 * 60 * 1000; break;
            case '1w': intervalMs = 7 * 24 * 60 * 60 * 1000; break;
            case '1m': intervalMs = 30 * 24 * 60 * 60 * 1000; break;
            default: intervalMs = 60 * 1000;
        }
        
        for (let i = 100; i >= 0; i--) {
            const date = new Date(now.getTime() - (i * intervalMs));
            const price = this.generateRealisticPrice(symbol, basePrice);
            data.push({ date, price });
        }
        
        this.data[symbol].mainChartData = data;
    }

    generateHistoricalData(symbol, period) {
        const periodConfig = this.timePeriods[period];
        const basePrice = this.commodities[symbol].basePrice;
        const data = [];
        
        const now = new Date();
        const intervalMs = periodConfig.days * 24 * 60 * 60 * 1000 / 100; // 100 data points
        
        for (let i = 100; i >= 0; i--) {
            const date = new Date(now.getTime() - (i * intervalMs));
            const price = this.generateRealisticPrice(symbol, basePrice);
            
            data.push({ date, price, volume: Math.random() * 1000000 });
        }
        
        this.historicalData[symbol][period] = data;
    }

    switchMainChart(symbol, name) {
        // Update active commodity item
        document.querySelectorAll('.commodity-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-symbol="${symbol}"]`).classList.add('active');
        
        // Update main chart
        this.currentSymbol = symbol;
        document.getElementById('mainChartTitle').textContent = name;
        document.getElementById('mainChartSymbol').textContent = symbol;
        
        // Show loading for chart update
        this.showChartLoading();
        
        // Load data for new symbol
        Promise.all([
            this.fetchHistoricalData(symbol, this.currentPeriod),
            this.fetchMainChartData(symbol, this.currentInterval)
        ]).then(() => {
            this.updateMainChart();
            this.updateOverviewChart();
            this.updateMainPriceDisplay();
            this.hideChartLoading();
        }).catch(error => {
            console.error('Error switching commodity:', error);
            this.hideChartLoading();
        });
    }

    switchTimeInterval(interval) {
        // Update active interval button for main chart
        document.querySelectorAll('.main-time-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-interval="${interval}"]`).classList.add('active');
        
        this.currentInterval = interval;
        
        // Show loading for chart update
        this.showChartLoading();
        
        // Load data for new interval
        this.fetchMainChartData(this.currentSymbol, interval).then(() => {
            this.updateMainChart();
            this.hideChartLoading();
        }).catch(error => {
            console.error('Error switching interval:', error);
            this.hideChartLoading();
        });
    }

    switchTimePeriod(period) {
        // Update active time button for overview chart
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-period="${period}"]`).classList.add('active');
        
        this.currentPeriod = period;
        
        // Show loading for chart update
        this.showChartLoading();
        
        // Update period performance display
        this.updatePeriodPerformance(period);
        
        // Load historical data for new period
        this.fetchHistoricalData(this.currentSymbol, period).then(() => {
            this.updateOverviewChart();
            this.hideChartLoading();
        }).catch(error => {
            console.error('Error switching period:', error);
            this.hideChartLoading();
        });
    }

    switchTimePeriod(period) {
        // Update active time button
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-period="${period}"]`).classList.add('active');
        
        this.currentPeriod = period;
        
        // Update period performance display
        this.updatePeriodPerformance(period);
        
        // Load historical data for new period
        this.fetchHistoricalData(this.currentSymbol, period).then(() => {
            this.updateMainChart();
        });
    }

    updatePeriodPerformance(period) {
        const periodConfig = this.timePeriods[period];
        const performanceEl = document.getElementById('periodPerformance');
        const labelEl = performanceEl.querySelector('.period-label');
        const changeEl = performanceEl.querySelector('.period-change');
        
        labelEl.textContent = periodConfig.label;
        
        // Calculate period performance from historical data
        const historicalData = this.historicalData[this.currentSymbol] && 
                              this.historicalData[this.currentSymbol][period];
        
        if (historicalData && historicalData.length >= 2) {
            const firstPrice = historicalData[0].price;
            const lastPrice = historicalData[historicalData.length - 1].price;
            const periodChange = ((lastPrice - firstPrice) / firstPrice) * 100;
            
            const sign = periodChange >= 0 ? '+' : '';
            changeEl.textContent = `${sign}${periodChange.toFixed(2)}%`;
            changeEl.className = `period-change ${periodChange >= 0 ? 'positive' : 'negative'}`;
        } else {
            // Fallback to simulated data
            let periodChange = (Math.random() - 0.5) * 10;
            const sign = periodChange >= 0 ? '+' : '';
            changeEl.textContent = `${sign}${periodChange.toFixed(2)}%`;
            changeEl.className = `period-change ${periodChange >= 0 ? 'positive' : 'negative'}`;
        }
    }

    generateRealisticPrice(symbol, basePrice) {
        const config = this.commodities[symbol];
        const randomWalk = (Math.random() - 0.5) * config.volatility;
        const trend = Math.sin(Date.now() / 1000000) * config.volatility * 0.5;
        
        return basePrice * (1 + randomWalk + trend);
    }

    updateChangeCalculations(symbol) {
        const data = this.data[symbol];
        const current = data.currentPrice;
        const previous = data.previousPrice;
        
        data.change = current - previous;
        data.changePercent = previous !== 0 ? ((current - previous) / previous) * 100 : 0;
    }

    createCharts() {
        // Main chart for selected commodity with current interval
        this.createMainChart();
        
        // Overview chart for selected commodity with current period
        this.createOverviewChart();
        
        // Set initial active items
        document.querySelector(`[data-symbol="${this.currentSymbol}"]`).classList.add('active');
    }

    createMainChart() {
        const ctx = document.getElementById('mainChart').getContext('2d');
        const data = this.getMainChartData(this.currentSymbol);
        
        if (this.charts['main']) {
            this.charts['main'].destroy();
        }
        
        this.charts['main'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.timestamps.map(time => this.formatTimeForInterval(time, this.currentInterval)),
                datasets: [{
                    label: this.commodities[this.currentSymbol].name,
                    data: data.prices,
                    borderColor: '#F58426',
                    backgroundColor: 'rgba(245, 132, 38, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: '#F58426',
                    pointHoverBorderColor: '#ffffff',
                    pointHoverBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#F58426',
                        borderWidth: 1,
                        callbacks: {
                            label: (context) => {
                                const unit = this.commodities[this.currentSymbol].unit;
                                return `Price: ${unit}${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        grid: { color: '#f3f4f6', borderColor: '#e5e7eb' },
                        ticks: { color: '#6b7280', maxTicksLimit: 8 }
                    },
                    y: {
                        display: true,
                        grid: { color: '#f3f4f6', borderColor: '#e5e7eb' },
                        ticks: {
                            color: '#6b7280',
                            callback: (value) => {
                                const unit = this.commodities[this.currentSymbol].unit;
                                return `${unit}${value.toFixed(2)}`;
                            }
                        }
                    }
                },
                interaction: { intersect: false, mode: 'index' },
                animation: { duration: 300 }
            }
        });
    }

    createOverviewChart() {
        const ctx = document.getElementById('overviewChart').getContext('2d');
        const data = this.getOverviewChartData(this.currentSymbol);
        
        if (this.charts['overview']) {
            this.charts['overview'].destroy();
        }
        
        this.charts['overview'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.timestamps.map(time => this.formatTime(time, this.currentPeriod)),
                datasets: [{
                    label: this.commodities[this.currentSymbol].name,
                    data: data.prices,
                    borderColor: '#F58426',
                    backgroundColor: 'rgba(245, 132, 38, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 0,
                    pointHoverRadius: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#F58426',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        display: true,
                        grid: { color: '#f3f4f6', borderColor: '#e5e7eb' },
                        ticks: { color: '#6b7280', maxTicksLimit: 6 }
                    },
                    y: {
                        display: true,
                        grid: { color: '#f3f4f6', borderColor: '#e5e7eb' },
                        ticks: { color: '#6b7280' }
                    }
                },
                interaction: { intersect: false, mode: 'index' },
                animation: { duration: 300 }
            }
        });
    }

    getMainChartData(symbol) {
        // Use main chart data if available, fallback to live data
        const mainChartData = this.data[symbol].mainChartData;
        
        if (mainChartData && mainChartData.length > 0) {
            return {
                prices: mainChartData.map(d => d.price),
                timestamps: mainChartData.map(d => d.date)
            };
        }
        
        // Fallback to live data
        return this.data[symbol];
    }

    getOverviewChartData(symbol) {
        // Use historical data if available, fallback to live data
        const historicalData = this.historicalData[symbol] && this.historicalData[symbol][this.currentPeriod];
        
        if (historicalData && historicalData.length > 0) {
            return {
                prices: historicalData.map(d => d.price),
                timestamps: historicalData.map(d => d.date)
            };
        }
        
        return this.data[symbol];
    }

    formatTimeForInterval(date, interval) {
        switch(interval) {
            case '1min':
            case '5min':
            case '15min':
            case '30min':
            case '1hr':
                return date.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit'
                });
            case '4hr':
            case '1d':
                return date.toLocaleDateString([], { 
                    month: 'short', 
                    day: 'numeric'
                });
            case '1w':
            case '1m':
                return date.toLocaleDateString([], { 
                    month: 'short', 
                    day: 'numeric',
                    year: '2-digit'
                });
            default:
                return date.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit'
                });
        }
    }

    async updateData() {
        if (this.isLoading) return;
        
        // Don't show main loading indicator for background updates
        
        try {
            console.log('Background update: Updating commodity prices...');
            await this.fetchAllCurrentPrices();
            this.updateAllCharts();
            this.updateUI();
            console.log('✓ Background data updated successfully');
        } catch (error) {
            console.error('Error updating data:', error);
        }
        
        this.updateLastRefreshTime();
    }

    updateMainChart() {
        const chart = this.charts['main'];
        if (!chart) return;
        
        const data = this.getMainChartData(this.currentSymbol);
        
        chart.data.labels = data.timestamps.map(time => this.formatTimeForInterval(time, this.currentInterval));
        chart.data.datasets[0].data = [...data.prices];
        chart.data.datasets[0].label = this.commodities[this.currentSymbol].name;
        
        chart.update('none');
    }

    updateOverviewChart() {
        const chart = this.charts['overview'];
        if (!chart) return;
        
        const data = this.getOverviewChartData(this.currentSymbol);
        
        chart.data.labels = data.timestamps.map(time => this.formatTime(time, this.currentPeriod));
        chart.data.datasets[0].data = [...data.prices];
        chart.data.datasets[0].label = this.commodities[this.currentSymbol].name;
        
        chart.update('none');
    }

    updateAllCharts() {
        // Update main chart
        this.updateMainChart();
        
        // Update overview chart
        this.updateOverviewChart();
    }

    updateUI() {
        // Update main price display
        this.updateMainPriceDisplay();
        
        // Update commodity items
        Object.keys(this.commodities).forEach(symbol => {
            const item = document.querySelector(`[data-symbol="${symbol}"]`);
            if (item) {
                this.updateCommodityCard(item, this.data[symbol]);
            }
        });
    }

    updateMainPriceDisplay() {
        const data = this.data[this.currentSymbol];
        const unit = this.commodities[this.currentSymbol].unit;
        this.updatePriceDisplay('main', data, unit);
    }

    updatePriceDisplay(prefix, data, unit = '$') {
        const priceElement = document.getElementById(`${prefix}Price`);
        const changeElement = document.getElementById(`${prefix}Change`);
        
        if (priceElement) {
            priceElement.textContent = `${unit}${data.currentPrice.toFixed(2)}`;
            
            // Add price animation
            priceElement.classList.remove('price-up', 'price-down');
            if (data.change > 0) {
                priceElement.classList.add('price-up');
            } else if (data.change < 0) {
                priceElement.classList.add('price-down');
            }
        }
        
        if (changeElement) {
            const changeValue = changeElement.querySelector('.change-value');
            const changePercent = changeElement.querySelector('.change-percent');
            
            const changeClass = data.change > 0 ? 'positive' : data.change < 0 ? 'negative' : 'neutral';
            const changeSign = data.change > 0 ? '+' : '';
            
            if (changeValue) {
                changeValue.textContent = `${changeSign}${unit}${data.change.toFixed(2)}`;
                changeValue.className = `change-value ${changeClass}`;
            }
            
            if (changePercent) {
                changePercent.textContent = `(${changeSign}${data.changePercent.toFixed(2)}%)`;
                changePercent.className = `change-percent ${changeClass}`;
            }
        }
    }

    updateCommodityCard(card, data) {
        const symbol = card.dataset.symbol;
        const unit = this.commodities[symbol].unit;
        const priceElement = card.querySelector('.price');
        const changeValueElement = card.querySelector('.change-value');
        const changePercentElement = card.querySelector('.change-percent');
        
        if (priceElement) {
            priceElement.textContent = `${unit}${data.currentPrice.toFixed(2)}`;
            
            // Add price animation
            priceElement.classList.remove('price-up', 'price-down');
            if (data.change > 0) {
                priceElement.classList.add('price-up');
            } else if (data.change < 0) {
                priceElement.classList.add('price-down');
            }
        }
        
        const changeClass = data.change > 0 ? 'positive' : data.change < 0 ? 'negative' : 'neutral';
        const changeSign = data.change > 0 ? '+' : '';
        
        if (changeValueElement) {
            changeValueElement.textContent = `${changeSign}${unit}${data.change.toFixed(2)}`;
            changeValueElement.className = `change-value ${changeClass}`;
        }
        
        if (changePercentElement) {
            changePercentElement.textContent = `(${changeSign}${data.changePercent.toFixed(2)}%)`;
            changePercentElement.className = `change-percent ${changeClass}`;
        }
    }

    startRealTimeUpdates() {
        // Initial update
        this.updateData();
        
        // Set up interval for regular updates (1 minute for Alpha Vantage)
        setInterval(() => {
            this.updateData();
        }, this.updateInterval);
        
        // Update countdown timer
        this.startCountdown();
    }

    startCountdown() {
        let countdown = this.updateInterval / 1000;
        
        const updateCountdown = () => {
            const nextUpdateElement = document.getElementById('nextUpdate');
            if (nextUpdateElement) {
                const minutes = Math.floor(countdown / 60);
                const seconds = countdown % 60;
                nextUpdateElement.textContent = minutes > 0 ? 
                    `${minutes}m ${seconds}s` : `${seconds}s`;
            }
            
            countdown--;
            if (countdown < 0) {
                countdown = this.updateInterval / 1000;
            }
        };
        
        updateCountdown();
        setInterval(updateCountdown, 1000);
    }

    showLoading() {
        this.isLoading = true;
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.classList.add('show');
        }
    }

    hideLoading() {
        this.isLoading = false;
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.classList.remove('show');
        }
    }

    showChartLoading() {
        // Create or show chart-specific loading indicator
        let chartLoader = document.querySelector('.chart-loading');
        if (!chartLoader) {
            chartLoader = document.createElement('div');
            chartLoader.className = 'chart-loading';
            chartLoader.innerHTML = `
                <div class="chart-loading-content">
                    <div class="chart-spinner"></div>
                    <span>Loading chart data...</span>
                </div>
            `;
            document.body.appendChild(chartLoader);
        }
        chartLoader.classList.add('show');
    }

    hideChartLoading() {
        const chartLoader = document.querySelector('.chart-loading');
        if (chartLoader) {
            chartLoader.classList.remove('show');
        }
    }

    updateLastRefreshTime() {
        const lastUpdateElement = document.getElementById('lastUpdateTime');
        if (lastUpdateElement) {
            const now = new Date();
            lastUpdateElement.textContent = now.toLocaleTimeString();
        }
    }

    formatTime(date, period = '1D') {
        if (period === '1D') {
            return date.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit'
            });
        } else if (period === '1W') {
            return date.toLocaleDateString([], { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit'
            });
        } else {
            return date.toLocaleDateString([], { 
                month: 'short', 
                day: 'numeric',
                year: period.includes('Y') || period === 'MAX' ? 'numeric' : undefined
            });
        }
    }

    // Utility function for delays
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Financial Dashboard with Alpha Vantage API...');
    console.log('📡 Real commodity data will be fetched every minute');
    window.dashboard = new FinancialDashboard();
});

// Handle window resize for responsive charts
window.addEventListener('resize', () => {
    if (window.dashboard && window.dashboard.charts) {
        Object.values(window.dashboard.charts).forEach(chart => {
            if (chart) {
                chart.resize();
            }
        });
    }
});

// Add keyboard shortcuts for manual refresh and navigation
document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        if (window.dashboard) {
            console.log('🔄 Manual refresh triggered');
            window.dashboard.updateData();
        }
    }
    
    // Number keys to switch commodities (1-7)
    if (event.key >= '1' && event.key <= '7' && !event.ctrlKey && !event.metaKey) {
        const commodityIndex = parseInt(event.key) - 1;
        const symbols = Object.keys(window.dashboard.commodities);
        if (symbols[commodityIndex]) {
            const symbol = symbols[commodityIndex];
            const name = window.dashboard.commodities[symbol].name;
            console.log(`📊 Switching to ${name} via keyboard shortcut`);
            window.dashboard.switchMainChart(symbol, name);
        }
    }
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FinancialDashboard;
}
