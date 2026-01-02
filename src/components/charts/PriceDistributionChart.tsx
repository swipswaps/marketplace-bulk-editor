/**
 * Price Distribution Chart Component
 * D3.js histogram showing price distribution across listings
 */

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface PriceDistributionData {
  bins: Array<{
    min: number;
    max: number;
    count: number;
    percentage: number;
  }>;
  statistics: {
    mean: number;
    median: number;
    count: number;
    min: number;
    max: number;
  };
}

interface PriceDistributionChartProps {
  data: PriceDistributionData;
  width?: number;
  height?: number;
}

export function PriceDistributionChart({ 
  data, 
  width = 600, 
  height = 400 
}: PriceDistributionChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.bins.length) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 60, left: 60 };
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

    // Scales
    const xScale = d3.scaleBand()
      .domain(data.bins.map((_, i) => i.toString()))
      .range([0, chartWidth])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data.bins, d => d.count) || 0])
      .nice()
      .range([chartHeight, 0]);

    // Color scale
    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain([0, data.bins.length - 1]);

    // Bars
    g.selectAll('.bar')
      .data(data.bins)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (_, i) => xScale(i.toString()) || 0)
      .attr('y', d => yScale(d.count))
      .attr('width', xScale.bandwidth())
      .attr('height', d => chartHeight - yScale(d.count))
      .attr('fill', (_, i) => colorScale(i))
      .attr('stroke', '#1e40af')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('mouseover', function(_event, d) {
        d3.select(this)
          .attr('opacity', 0.7);
        
        // Tooltip
        const tooltip = g.append('g')
          .attr('class', 'tooltip')
          .attr('transform', `translate(${xScale(data.bins.indexOf(d).toString())},${yScale(d.count) - 10})`);
        
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
          .style('font-size', '12px')
          .text(`$${d.min.toFixed(2)} - $${d.max.toFixed(2)}`);
        
        tooltip.append('text')
          .attr('fill', 'white')
          .attr('text-anchor', 'middle')
          .attr('y', -10)
          .style('font-size', '12px')
          .text(`Count: ${d.count} (${d.percentage}%)`);
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 1);
        g.selectAll('.tooltip').remove();
      });

    // X Axis
    const xAxis = d3.axisBottom(xScale)
      .tickFormat((_, i) => {
        const bin = data.bins[i];
        return `$${bin.min.toFixed(0)}`;
      });

    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .style('font-size', '10px');

    // Y Axis
    g.append('g')
      .call(d3.axisLeft(yScale))
      .style('font-size', '12px');

    // Axis labels
    g.append('text')
      .attr('transform', `translate(${chartWidth / 2},${chartHeight + 50})`)
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('Price Range');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -45)
      .attr('x', -chartHeight / 2)
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('Number of Listings');

  }, [data, width, height]);

  if (!data.bins.length) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        No price distribution data available
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
        Price Distribution
      </h3>
      <svg ref={svgRef} className="w-full h-auto" />
      <div className="mt-4 grid grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
        <div>
          <span className="font-semibold">Mean:</span> ${data.statistics.mean.toFixed(2)}
        </div>
        <div>
          <span className="font-semibold">Median:</span> ${data.statistics.median.toFixed(2)}
        </div>
        <div>
          <span className="font-semibold">Count:</span> {data.statistics.count}
        </div>
      </div>
    </div>
  );
}

