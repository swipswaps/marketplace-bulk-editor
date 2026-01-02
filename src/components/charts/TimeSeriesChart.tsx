/**
 * Time Series Chart Component
 * D3.js line chart showing listings created over time
 */

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface TimeSeriesData {
  date: string;
  count: number;
  total_value: number;
}

interface TimeSeriesChartProps {
  data: TimeSeriesData[];
  width?: number;
  height?: number;
  metric?: 'count' | 'total_value';
}

export function TimeSeriesChart({ 
  data, 
  width = 700, 
  height = 400,
  metric = 'count'
}: TimeSeriesChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 60, left: 70 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Parse dates
    const parseDate = d3.timeParse('%Y-%m-%d');
    const parsedData = data.map(d => ({
      ...d,
      parsedDate: parseDate(d.date) || new Date()
    }));

    // Scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(parsedData, d => d.parsedDate) as [Date, Date])
      .range([0, chartWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(parsedData, d => metric === 'count' ? d.count : d.total_value) || 0])
      .nice()
      .range([chartHeight, 0]);

    // Line generator
    const line = d3.line<typeof parsedData[0]>()
      .x(d => xScale(d.parsedDate))
      .y(d => yScale(metric === 'count' ? d.count : d.total_value))
      .curve(d3.curveMonotoneX);

    // Area generator (for gradient fill)
    const area = d3.area<typeof parsedData[0]>()
      .x(d => xScale(d.parsedDate))
      .y0(chartHeight)
      .y1(d => yScale(metric === 'count' ? d.count : d.total_value))
      .curve(d3.curveMonotoneX);

    // Gradient
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'line-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#3b82f6')
      .attr('stop-opacity', 0.3);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#3b82f6')
      .attr('stop-opacity', 0);

    // Add area
    g.append('path')
      .datum(parsedData)
      .attr('fill', 'url(#line-gradient)')
      .attr('d', area);

    // Add line
    g.append('path')
      .datum(parsedData)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add dots
    g.selectAll('.dot')
      .data(parsedData)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(d.parsedDate))
      .attr('cy', d => yScale(metric === 'count' ? d.count : d.total_value))
      .attr('r', 4)
      .attr('fill', '#3b82f6')
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function(_event, d) {
        d3.select(this)
          .attr('r', 6)
          .attr('fill', '#1e40af');
        
        // Tooltip
        const tooltip = g.append('g')
          .attr('class', 'tooltip')
          .attr('transform', `translate(${xScale(d.parsedDate)},${yScale(metric === 'count' ? d.count : d.total_value) - 15})`);
        
        tooltip.append('rect')
          .attr('fill', 'rgba(0, 0, 0, 0.8)')
          .attr('rx', 4)
          .attr('x', -60)
          .attr('y', -40)
          .attr('width', 120)
          .attr('height', 35);
        
        tooltip.append('text')
          .attr('fill', 'white')
          .attr('text-anchor', 'middle')
          .attr('y', -25)
          .style('font-size', '11px')
          .text(d.date);
        
        tooltip.append('text')
          .attr('fill', 'white')
          .attr('text-anchor', 'middle')
          .attr('y', -10)
          .style('font-size', '11px')
          .text(metric === 'count' ? `Count: ${d.count}` : `Value: $${d.total_value.toFixed(2)}`);
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('r', 4)
          .attr('fill', '#3b82f6');
        g.selectAll('.tooltip').remove();
      });

    // X Axis
    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale).ticks(6))
      .selectAll('text')
      .style('font-size', '11px');

    // Y Axis
    g.append('g')
      .call(d3.axisLeft(yScale))
      .style('font-size', '11px');

    // Axis labels
    g.append('text')
      .attr('transform', `translate(${chartWidth / 2},${chartHeight + 45})`)
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('Date');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -50)
      .attr('x', -chartHeight / 2)
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text(metric === 'count' ? 'Number of Listings' : 'Total Value ($)');

  }, [data, width, height, metric]);

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        No time series data available
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
        Listings Over Time
      </h3>
      <svg ref={svgRef} className="w-full h-auto" />
    </div>
  );
}

