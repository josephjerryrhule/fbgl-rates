# 📊 Commodities Dashboard

A professional, real-time commodities trading dashboard built with HTML5, CSS3, and vanilla JavaScript. Features live data integration with Alpha Vantage API and an intuitive interface similar to major financial platforms.

![Dashboard Preview](https://img.shields.io/badge/Status-Live-brightgreen)
![Version](https://img.shields.io/badge/Version-2.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## 🌟 Features

### **Real-time Data Integration**
- **Alpha Vantage API** integration for live commodity prices
- **ETF Tracking** for accurate commodity price representation
- **Background Updates** every 60 seconds without UI interruption
- **Smart Fallbacks** to simulated data when API limits are reached

### **Interactive Charts**
- **Dual Chart System**: Main chart for detailed analysis, overview chart for trends
- **Multiple Time Intervals**: 1min, 5min, 15min, 30min, 1hr, 4hr, 1D, 1W, 1M
- **Period Analysis**: 1D, 1W, 1M, 6M, 1Y, 5Y, MAX for long-term trends
- **Professional Styling** with consistent #F58426 orange theme

### **Commodity Coverage**
- **WTI Crude Oil** (CL=F) via USO ETF
- **Brent Oil** (BZ=F) via BNO ETF
- **Natural Gas** (NG=F) via UNG ETF
- **Gold** (GC=F) via GLD ETF
- **Silver** (SI=F) via SLV ETF
- **Copper** (HG=F) via CPER ETF
- **US Soybeans** (ZS=F) via SOYB ETF

### **User Experience**
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Loading States** - Elegant loading indicators for chart updates
- **Click Navigation** - Switch between commodities instantly
- **Price Animations** - Visual feedback for price changes
- **Keyboard Shortcuts** - Ctrl/Cmd+R to refresh, number keys (1-7) to switch

## 🚀 Quick Start

### **1. Clone Repository**
```bash
git clone https://github.com/yourusername/commodities-dashboard.git
cd commodities-dashboard
```

### **2. Get Alpha Vantage API Key**
1. Visit [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
2. Sign up for a free API key
3. Replace the API key in `script.js`:
```javascript
this.apiKey = 'YOUR_ALPHA_VANTAGE_API_KEY';
```

### **3. Launch Dashboard**
```bash
# Simple HTTP server (Python)
python -m http.server 8000

# Or using Node.js
npx serve .

# Or just open index.html in your browser
open index.html
```

### **4. Access Dashboard**
Open your browser to `http://localhost:8000`

## 📁 Project Structure

```
commodities-dashboard/
├── index.html          # Main dashboard interface
├── styles.css          # Professional styling & responsive design
├── script.js           # Core functionality & API integration
├── README.md           # Documentation
└── .gitignore         # Git ignore rules
```

## 🎯 Usage Guide

### **Main Chart Controls**
- **Time Intervals**: Click 1min, 5min, 15min, etc. for detailed price action
- **Commodity Switching**: Click any commodity in the sidebar list
- **Price Display**: Shows current price, change value, and percentage

### **Overview Chart**
- **Period Controls**: Use 1D, 1W, 1M, etc. for trend analysis
- **Performance Metrics**: Shows period-based gain/loss
- **Context View**: Provides broader market perspective

### **Interactive Features**
- **Real-time Updates**: Prices update automatically every minute
- **Loading Indicators**: Smooth loading states for chart updates
- **Responsive Design**: Adapts to any screen size
- **Keyboard Navigation**: Quick commodity switching with number keys

## 🛠️ Technical Details

### **Technologies Used**
- **HTML5** - Semantic structure and Canvas API
- **CSS3** - Grid/Flexbox layouts, animations, responsive design
- **JavaScript ES6+** - Async/await, classes, modules
- **Chart.js** - Professional charting library
- **Alpha Vantage API** - Real-time financial data

### **API Integration**
The dashboard uses Alpha Vantage API with ETF mapping for commodity tracking:

| Commodity | ETF Symbol | Scaling Factor |
|-----------|------------|----------------|
| WTI Oil   | USO        | 2.1x          |
| Brent Oil | BNO        | 2.3x          |
| Natural Gas | UNG      | 0.15x         |
| Gold      | GLD        | 10.2x         |
| Silver    | SLV        | 1.1x          |
| Copper    | CPER       | 0.25x         |
| Soybeans  | SOYB       | 55x           |

## 🔧 Configuration

### **API Settings**
Edit `script.js` to customize:
```javascript
this.apiKey = 'YOUR_ALPHA_VANTAGE_API_KEY';
this.updateInterval = 60000; // Update frequency (milliseconds)
```

### **Chart Colors**
Change the theme color in both CSS and JS:
```css
/* In styles.css */
:root {
    --primary-color: #F58426;
}
```

```javascript
// In script.js
borderColor: '#F58426',
backgroundColor: 'rgba(245, 132, 38, 0.1)',
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Alpha Vantage](https://www.alphavantage.co/) for reliable financial data API
- [Chart.js](https://www.chartjs.org/) for excellent charting capabilities
- [Inter Font](https://fonts.google.com/specimen/Inter) for clean typography

---

**Built with ❤️ for the trading community**

*Real-time data • Professional charts • Responsive design*
