/**
 * Analytics Dashboard Component
 * Displays statistics and insights about marketplace listings
 * Enhanced with D3.js visualizations and backend API integration
 */

import { useMemo, useState, useEffect } from 'react';
import { BarChart3, DollarSign, Package, TrendingUp, Settings, Eye, EyeOff, RefreshCw } from 'lucide-react';
import type { MarketplaceListing } from '../types';
import { apiClient } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import {
  PriceDistributionChart,
  CategoryBreakdownChart,
  TimeSeriesChart,
  TrendsChart,
  ShippingDistributionChart,
  ConditionDistributionChart
} from './charts';
import { ChartCarousel } from './ChartCarousel';

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B'];

interface AnalyticsDashboardProps {
  data: MarketplaceListing[];
}

// Chart visibility options
type ChartType = 'summaryCards' | 'wordCloud' | 'priceDistribution' | 'categoryBreakdown' | 'timeSeries' | 'trends' | 'shippingDistribution' | 'conditionDistribution';

// Backend API response types
interface PriceDistributionData {
  bins: Array<{ min: number; max: number; count: number; percentage: number }>;
  statistics: { mean: number; median: number; count: number; min: number; max: number };
}

interface TimeSeriesData {
  data: Array<{ date: string; count: number; total_value: number }>;
  period: string;
  days_back: number;
}

interface TrendsData {
  top_categories: Array<{ category: string; count: number; avg_price: number }>;
  top_conditions: Array<{ condition: string; count: number; avg_price: number }>;
  recent_activity: { last_7_days: number };
}

export function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  const { isAuthenticated } = useAuth();

  // Chart visibility state - all visible by default
  const [visibleCharts, setVisibleCharts] = useState<Record<ChartType, boolean>>({
    summaryCards: true,
    wordCloud: true,
    priceDistribution: true,
    categoryBreakdown: true,
    timeSeries: true,
    trends: true,
    shippingDistribution: true,
    conditionDistribution: true,
  });
  const [showChartSettings, setShowChartSettings] = useState(false);

  // Word cloud selection state
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  // Backend analytics data
  const [priceDistribution, setPriceDistribution] = useState<PriceDistributionData | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData | null>(null);
  const [trends, setTrends] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleChart = (chart: ChartType) => {
    setVisibleCharts(prev => ({ ...prev, [chart]: !prev[chart] }));
  };

  const showAllCharts = () => {
    setVisibleCharts({
      summaryCards: true,
      wordCloud: true,
      priceDistribution: true,
      categoryBreakdown: true,
      timeSeries: true,
      trends: true,
      shippingDistribution: true,
      conditionDistribution: true,
    });
  };

  const hideAllCharts = () => {
    setVisibleCharts({
      summaryCards: false,
      wordCloud: false,
      priceDistribution: false,
      categoryBreakdown: false,
      timeSeries: false,
      trends: false,
      shippingDistribution: false,
      conditionDistribution: false,
    });
  };

  // Fetch analytics data from backend
  const fetchAnalytics = async () => {
    if (!isAuthenticated || !data.length) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch all analytics endpoints in parallel
      const [priceDistData, timeSeriesData, trendsData] = await Promise.all([
        apiClient.get<PriceDistributionData>('/api/analytics/price-distribution?bins=10'),
        apiClient.get<TimeSeriesData>('/api/analytics/time-series?period=day&days=30'),
        apiClient.get<TrendsData>('/api/analytics/trends')
      ]);

      setPriceDistribution(priceDistData);
      setTimeSeries(timeSeriesData);
      setTrends(trendsData);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError('Failed to load analytics from backend. Using local data only.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch analytics when authenticated and data changes
  useEffect(() => {
    if (isAuthenticated && data.length > 0) {
      fetchAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, data.length]);

  // Filter listings by selected word (searches all fields, same as DataTable search)
  const filteredByWord = useMemo(() => {
    if (!selectedWord) return [];
    const searchTerm = selectedWord.toLowerCase();
    return data.filter(item => {
      const searchableText = [
        item.TITLE || '',
        item.DESCRIPTION || '',
        item.CATEGORY || '',
        item.CONDITION || '',
        String(item.PRICE || ''),
        item['OFFER SHIPPING'] || ''
      ].join(' ').toLowerCase();
      return searchableText.includes(searchTerm);
    });
  }, [data, selectedWord]);

  // Calculate statistics (only what's needed for Summary Cards + Word Cloud)
  const stats = useMemo(() => {
    if (!data.length) {
      return {
        totalListings: 0,
        averagePrice: 0,
        totalValue: 0,
        priceRange: { min: 0, max: 0 },
        wordFrequency: [] as { text: string; value: number }[],
        shippingData: [] as { shipping: string; count: number; percentage: number }[],
        conditionData: [] as { condition: string; count: number; percentage: number; avgPrice: number }[],
        dataQuality: { complete: 0, missingTitle: 0, missingDescription: 0, missingPrice: 0, completeness: 0 },
        titleLengthStats: { avgLength: 0, tooShort: 0, tooLong: 0, optimal: 0 },
        shippingPriceComparison: { withShipping: 0, withoutShipping: 0, difference: 0 },
      };
    }

    const prices = data.map(item => parseFloat(String(item.PRICE)) || 0);
    const totalValue = prices.reduce((sum, price) => sum + price, 0);
    const averagePrice = totalValue / data.length;

    // Word frequency for word cloud
    const wordCounts: Record<string, number> = {};
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'it', 'as', 'be', 'are', 'was', 'were', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'we', 'they', 'what', 'which', 'who', 'whom', 'where', 'when', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'just', 'don', 'now', '-', '–', '/', '|', 'x', 'w']);
    data.forEach(item => {
      const title = String(item.TITLE || '').toLowerCase();
      const words = title.split(/[\s\-/|,.]+/).filter(w => w.length > 2 && !stopWords.has(w) && !/^\d+$/.test(w));
      words.forEach(word => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      });
    });
    const wordFrequency = Object.entries(wordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 50)
      .map(([text, value]) => ({ text, value }));

    // Shipping distribution
    const shippingCounts: Record<string, number> = {};
    data.forEach(item => {
      const shipping = String(item['OFFER SHIPPING'] || 'No');
      shippingCounts[shipping] = (shippingCounts[shipping] || 0) + 1;
    });
    const shippingData = Object.entries(shippingCounts).map(([shipping, count]) => ({
      shipping,
      count,
      percentage: (count / data.length) * 100,
    }));

    // Condition distribution with avg price
    const conditionCounts: Record<string, { count: number; totalPrice: number }> = {};
    data.forEach(item => {
      const condition = String(item.CONDITION || 'Unknown');
      const price = parseFloat(String(item.PRICE)) || 0;
      if (!conditionCounts[condition]) {
        conditionCounts[condition] = { count: 0, totalPrice: 0 };
      }
      conditionCounts[condition].count++;
      conditionCounts[condition].totalPrice += price;
    });
    const conditionData = Object.entries(conditionCounts).map(([condition, { count, totalPrice }]) => ({
      condition,
      count,
      percentage: (count / data.length) * 100,
      avgPrice: totalPrice / count,
    }));

    // Data quality metrics
    let complete = 0;
    let missingTitle = 0;
    let missingDescription = 0;
    let missingPrice = 0;
    data.forEach(item => {
      const hasTitle = String(item.TITLE || '').trim().length > 0;
      const hasDescription = String(item.DESCRIPTION || '').trim().length > 0;
      const hasPrice = parseFloat(String(item.PRICE)) > 0;

      if (!hasTitle) missingTitle++;
      if (!hasDescription) missingDescription++;
      if (!hasPrice) missingPrice++;
      if (hasTitle && hasDescription && hasPrice) complete++;
    });
    const completeness = (complete / data.length) * 100;

    // Title length statistics (Facebook Marketplace limit: 150 chars)
    const titleLengths = data.map(item => String(item.TITLE || '').length);
    const avgLength = titleLengths.reduce((sum, len) => sum + len, 0) / data.length;
    const tooShort = titleLengths.filter(len => len < 20).length;
    const tooLong = titleLengths.filter(len => len > 150).length;
    const optimal = titleLengths.filter(len => len >= 20 && len <= 150).length;

    // Shipping price comparison
    const withShippingPrices = data
      .filter(item => String(item['OFFER SHIPPING']) === 'Yes')
      .map(item => parseFloat(String(item.PRICE)) || 0);
    const withoutShippingPrices = data
      .filter(item => String(item['OFFER SHIPPING']) !== 'Yes')
      .map(item => parseFloat(String(item.PRICE)) || 0);

    const avgWithShipping = withShippingPrices.length > 0
      ? withShippingPrices.reduce((sum, p) => sum + p, 0) / withShippingPrices.length
      : 0;
    const avgWithoutShipping = withoutShippingPrices.length > 0
      ? withoutShippingPrices.reduce((sum, p) => sum + p, 0) / withoutShippingPrices.length
      : 0;

    return {
      totalListings: data.length,
      averagePrice,
      totalValue,
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices),
      },
      wordFrequency,
      shippingData,
      conditionData,
      dataQuality: { complete, missingTitle, missingDescription, missingPrice, completeness },
      titleLengthStats: { avgLength, tooShort, tooLong, optimal },
      shippingPriceComparison: {
        withShipping: avgWithShipping,
        withoutShipping: avgWithoutShipping,
        difference: avgWithShipping - avgWithoutShipping
      },
    };
  }, [data]);

  if (!data.length) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
        <p>No data to analyze. Upload a file to see analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Chart Settings Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Analytics Dashboard</h2>
        <div className="flex gap-2">
          {isAuthenticated && (
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              aria-label="Refresh analytics"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          )}
          <button
            onClick={() => setShowChartSettings(!showChartSettings)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            aria-label="Toggle chart settings"
          >
            <Settings size={16} />
            Chart Settings
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">{error}</p>
        </div>
      )}

      {/* Chart Visibility Controls */}
      {showChartSettings && (
        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Select Charts to Display:</h3>
            <div className="flex gap-2">
              <button
                onClick={showAllCharts}
                className="px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              >
                Show All
              </button>
              <button
                onClick={hideAllCharts}
                className="px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Hide All
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {([
              { key: 'summaryCards', label: 'Summary Cards' },
              { key: 'wordCloud', label: 'Word Cloud' },
              { key: 'priceDistribution', label: 'Price Distribution' },
              { key: 'categoryBreakdown', label: 'Category Breakdown' },
              { key: 'timeSeries', label: 'Time Series' },
              { key: 'trends', label: 'Trends' },
              { key: 'shippingDistribution', label: 'Shipping Distribution' },
              { key: 'conditionDistribution', label: 'Condition Distribution' },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => toggleChart(key)}
                className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  visibleCharts[key]
                    ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
                }`}
                aria-pressed={visibleCharts[key]}
              >
                {visibleCharts[key] ? <Eye size={14} /> : <EyeOff size={14} />}
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {visibleCharts.summaryCards && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Package className="text-blue-600 dark:text-blue-400" size={24} />
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Listings</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.totalListings}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="text-green-600 dark:text-green-400" size={24} />
              <div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Average Price</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">${stats.averagePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-purple-600 dark:text-purple-400" size={24} />
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Total Value</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="text-orange-600 dark:text-orange-400" size={24} />
              <div>
                <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Price Range</p>
                <p className="text-lg font-bold text-orange-900 dark:text-orange-100">
                  ${stats.priceRange.min.toLocaleString()} - ${stats.priceRange.max.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Marketplace-Specific Summary Cards */}
      {visibleCharts.summaryCards && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Data Quality Card */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Package className="text-indigo-600 dark:text-indigo-400" size={24} />
              <div>
                <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">Data Quality</p>
                <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                  {stats.dataQuality.completeness.toFixed(1)}%
                </p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                  {stats.dataQuality.complete} complete listings
                </p>
              </div>
            </div>
          </div>

          {/* Title Length Card */}
          <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="text-cyan-600 dark:text-cyan-400" size={24} />
              <div>
                <p className="text-sm text-cyan-600 dark:text-cyan-400 font-medium">Avg Title Length</p>
                <p className="text-2xl font-bold text-cyan-900 dark:text-cyan-100">
                  {stats.titleLengthStats.avgLength.toFixed(0)} chars
                </p>
                <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-1">
                  {stats.titleLengthStats.optimal} within FB limit (150)
                </p>
              </div>
            </div>
          </div>

          {/* Shipping Price Comparison Card */}
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-emerald-600 dark:text-emerald-400" size={24} />
              <div>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Shipping Impact</p>
                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                  {stats.shippingPriceComparison.difference >= 0 ? '+' : ''}
                  ${stats.shippingPriceComparison.difference.toFixed(2)}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                  Avg price difference with shipping
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Word Cloud */}
      {visibleCharts.wordCloud && stats.wordFrequency.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Word Cloud (Click to Filter)</h3>
            {selectedWord && (
              <button
                onClick={() => setSelectedWord(null)}
                className="text-sm px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Clear Filter: "{selectedWord}"
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 justify-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            {stats.wordFrequency.map((word, i) => {
              const maxVal = stats.wordFrequency[0].value;
              const minSize = 14;
              const maxSize = 52;
              const size = minSize + ((word.value / maxVal) * (maxSize - minSize));
              const isSelected = selectedWord === word.text;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedWord(isSelected ? null : word.text)}
                  className={`inline-block transition-all hover:scale-110 cursor-pointer border-0 bg-transparent ${
                    isSelected ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900 rounded px-1' : ''
                  }`}
                  style={{
                    fontSize: `${size}px`,
                    color: isSelected ? '#3B82F6' : COLORS[i % COLORS.length],
                    fontWeight: size > 30 || isSelected ? 'bold' : 'normal',
                  }}
                  title={`${word.text}: ${word.value} listings - Click to filter`}
                >
                  {word.text}
                </button>
              );
            })}
          </div>

          {/* Filtered Listings */}
          {selectedWord && filteredByWord.length > 0 && (
            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">
                {filteredByWord.length} listing{filteredByWord.length !== 1 ? 's' : ''} containing "{selectedWord}"
              </h4>
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800">
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400">Title</th>
                      <th className="text-right py-2 px-3 text-gray-600 dark:text-gray-400">Price</th>
                      <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400">Condition</th>
                      <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400">Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredByWord.map((item, i) => (
                      <tr key={i} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-2 px-3 text-gray-900 dark:text-gray-100">
                          {String(item.TITLE || '').slice(0, 60)}{String(item.TITLE || '').length > 60 ? '...' : ''}
                        </td>
                        <td className="py-2 px-3 text-right font-medium text-green-600 dark:text-green-400">
                          ${parseFloat(String(item.PRICE) || '0').toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-gray-600 dark:text-gray-400">{item.CONDITION || '-'}</td>
                        <td className="py-2 px-3 text-gray-600 dark:text-gray-400">
                          {String(item.CATEGORY || '-').slice(0, 25)}{String(item.CATEGORY || '').length > 25 ? '...' : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* D3.js Charts - Backend API Integration with Carousel */}
      {isAuthenticated && (
        <ChartCarousel>
          {[
            // Price Distribution Chart
            visibleCharts.priceDistribution && priceDistribution && (
              <PriceDistributionChart key="price-dist" data={priceDistribution} />
            ),

            // Category Breakdown Chart
            visibleCharts.categoryBreakdown && trends && trends.top_categories.length > 0 && (
              <CategoryBreakdownChart key="category-breakdown" data={trends.top_categories} />
            ),

            // Time Series Chart
            visibleCharts.timeSeries && timeSeries && timeSeries.data.length > 0 && (
              <TimeSeriesChart key="time-series" data={timeSeries.data} />
            ),

            // Trends Chart - Categories
            visibleCharts.trends && trends && trends.top_categories.length > 0 && (
              <TrendsChart key="trends-categories" data={trends.top_categories} type="category" />
            ),

            // Trends Chart - Conditions
            visibleCharts.trends && trends && trends.top_conditions.length > 0 && (
              <TrendsChart key="trends-conditions" data={trends.top_conditions} type="condition" />
            ),

            // Shipping Distribution Chart (frontend-only, always available)
            visibleCharts.shippingDistribution && stats.shippingData.length > 0 && (
              <ShippingDistributionChart key="shipping-dist" data={stats.shippingData} />
            ),

            // Condition Distribution Chart (frontend-only, always available)
            visibleCharts.conditionDistribution && stats.conditionData.length > 0 && (
              <ConditionDistributionChart key="condition-dist" data={stats.conditionData} />
            ),
          ].filter(Boolean) as React.ReactNode[]}
        </ChartCarousel>
      )}

      {/* Not Authenticated Message */}
      {!isAuthenticated && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
          <p className="text-blue-800 dark:text-blue-200">
            Login to view advanced analytics charts powered by the backend API
          </p>
        </div>
      )}

    </div>
  );
}

