/**
 * Condition Distribution Chart Component
 * D3.js donut chart showing condition distribution (New vs Used)
 */

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface ConditionData {
  condition: string;
  count: number;
  percentage: number;
  avgPrice: number;
}

interface ConditionDistributionChartProps {
  data: ConditionData[];
  width?: number;
  height?: number;
}

export function ConditionDistributionChart({ 
  data, 
  width = 400, 
  height = 400 
}: ConditionDistributionChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    const radius = Math.min(width, height) / 2 - 40;
    const innerRadius = radius * 0.6; // Donut hole

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    // Color scale - different colors for each condition
    const colorScale = d3.scaleOrdinal<string>()
      .domain(['New', 'Used - Like New', 'Used - Good', 'Used - Fair'])
      .range(['#10B981', '#3B82F6', '#F59E0B', '#EF4444']);

    // Pie generator
    const pie = d3.pie<ConditionData>()
      .value(d => d.count)
      .sort(null);

    // Arc generator
    const arc = d3.arc<d3.PieArcDatum<ConditionData>>()
      .innerRadius(innerRadius)
      .outerRadius(radius);

    // Arc for hover effect
    const arcHover = d3.arc<d3.PieArcDatum<ConditionData>>()
      .innerRadius(innerRadius)
      .outerRadius(radius + 10);

    // Create arcs
    const arcs = g.selectAll('.arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'arc');

    // Add paths
    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => colorScale(d.data.condition))
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function(_event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arcHover(d) as string);
        
        // Show tooltip
        const tooltip = g.append('g')
          .attr('class', 'tooltip');
        
        tooltip.append('rect')
          .attr('fill', 'rgba(0, 0, 0, 0.8)')
          .attr('rx', 4)
          .attr('x', -90)
          .attr('y', -50)
          .attr('width', 180)
          .attr('height', 50);
        
        tooltip.append('text')
          .attr('fill', 'white')
          .attr('text-anchor', 'middle')
          .attr('y', -35)
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .text(d.data.condition);
        
        tooltip.append('text')
          .attr('fill', 'white')
          .attr('text-anchor', 'middle')
          .attr('y', -20)
          .style('font-size', '11px')
          .text(`${d.data.count} listings (${d.data.percentage.toFixed(1)}%)`);
        
        tooltip.append('text')
          .attr('fill', 'white')
          .attr('text-anchor', 'middle')
          .attr('y', -5)
          .style('font-size', '11px')
          .text(`Avg Price: $${d.data.avgPrice.toFixed(2)}`);
      })
      .on('mouseout', function(_event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arc(d) as string);
        
        g.selectAll('.tooltip').remove();
      });

    // Add percentage labels
    arcs.append('text')
      .attr('transform', d => {
        const [x, y] = arc.centroid(d);
        return `translate(${x},${y})`;
      })
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', 'white')
      .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.8)')
      .text(d => d.data.percentage > 5 ? `${d.data.percentage.toFixed(1)}%` : '');

    // Center text (total count)
    const total = d3.sum(data, d => d.count);
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', -10)
      .style('font-size', '24px')
      .style('font-weight', 'bold')
      .style('fill', 'currentColor')
      .text(total);

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 10)
      .style('font-size', '14px')
      .style('fill', 'currentColor')
      .text('Total Listings');

  }, [data, width, height]);

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        No condition data available
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
        Condition Distribution
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Breakdown of listing conditions with average prices
      </p>
      <svg ref={svgRef} className="w-full h-auto" />
    </div>
  );
}

