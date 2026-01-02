/**
 * Trends Chart Component
 * D3.js horizontal bar chart showing top categories or conditions
 */

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface TrendData {
  category?: string;
  condition?: string;
  count: number;
  avg_price: number;
}

interface TrendsChartProps {
  data: TrendData[];
  type: 'category' | 'condition';
  width?: number;
  height?: number;
}

export function TrendsChart({ 
  data, 
  type,
  width = 600, 
  height = 400 
}: TrendsChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 20, right: 100, bottom: 60, left: 150 };
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

    // Get label
    const getLabel = (d: TrendData) => type === 'category' ? d.category || '' : d.condition || '';

    // Scales
    const yScale = d3.scaleBand()
      .domain(data.map(getLabel))
      .range([0, chartHeight])
      .padding(0.2);

    const xScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count) || 0])
      .nice()
      .range([0, chartWidth]);

    // Color scale
    const colorScale = d3.scaleOrdinal<string>()
      .domain(data.map(getLabel))
      .range(d3.schemeTableau10);

    // Bars
    g.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', 0)
      .attr('y', d => yScale(getLabel(d)) || 0)
      .attr('width', d => xScale(d.count))
      .attr('height', yScale.bandwidth())
      .attr('fill', d => colorScale(getLabel(d)))
      .attr('stroke', '#1e40af')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('mouseover', function(_event, d) {
        d3.select(this)
          .attr('opacity', 0.7);
        
        // Tooltip
        const tooltip = g.append('g')
          .attr('class', 'tooltip')
          .attr('transform', `translate(${xScale(d.count) + 10},${(yScale(getLabel(d)) || 0) + yScale.bandwidth() / 2})`);
        
        tooltip.append('rect')
          .attr('fill', 'rgba(0, 0, 0, 0.8)')
          .attr('rx', 4)
          .attr('x', 0)
          .attr('y', -30)
          .attr('width', 140)
          .attr('height', 40);
        
        tooltip.append('text')
          .attr('fill', 'white')
          .attr('x', 70)
          .attr('y', -15)
          .attr('text-anchor', 'middle')
          .style('font-size', '11px')
          .text(`Count: ${d.count}`);
        
        tooltip.append('text')
          .attr('fill', 'white')
          .attr('x', 70)
          .attr('y', 0)
          .attr('text-anchor', 'middle')
          .style('font-size', '11px')
          .text(`Avg: $${d.avg_price.toFixed(2)}`);
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 1);
        g.selectAll('.tooltip').remove();
      });

    // Add count labels on bars
    g.selectAll('.label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('x', d => xScale(d.count) + 5)
      .attr('y', d => (yScale(getLabel(d)) || 0) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', 'currentColor')
      .text(d => d.count);

    // Y Axis (categories/conditions)
    g.append('g')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .style('font-size', '11px')
      .style('font-weight', '500');

    // X Axis
    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale))
      .style('font-size', '11px');

    // Axis labels
    g.append('text')
      .attr('transform', `translate(${chartWidth / 2},${chartHeight + 45})`)
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('Number of Listings');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -130)
      .attr('x', -chartHeight / 2)
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text(type === 'category' ? 'Category' : 'Condition');

  }, [data, type, width, height]);

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        No trend data available
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
        Top {type === 'category' ? 'Categories' : 'Conditions'}
      </h3>
      <svg ref={svgRef} className="w-full h-auto" />
    </div>
  );
}

