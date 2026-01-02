/**
 * Category Breakdown Chart Component
 * D3.js donut chart showing category distribution
 */

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface CategoryData {
  category: string;
  count: number;
  avg_price: number;
}

interface CategoryBreakdownChartProps {
  data: CategoryData[];
  width?: number;
  height?: number;
}

export function CategoryBreakdownChart({ 
  data, 
  width = 400, 
  height = 400 
}: CategoryBreakdownChartProps) {
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

    // Color scale
    const colorScale = d3.scaleOrdinal<string>()
      .domain(data.map(d => d.category))
      .range(d3.schemeSet3);

    // Pie generator
    const pie = d3.pie<CategoryData>()
      .value(d => d.count)
      .sort(null);

    // Arc generator
    const arc = d3.arc<d3.PieArcDatum<CategoryData>>()
      .innerRadius(innerRadius)
      .outerRadius(radius);

    // Arc for hover effect
    const arcHover = d3.arc<d3.PieArcDatum<CategoryData>>()
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
      .attr('fill', d => colorScale(d.data.category))
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
          .attr('x', -80)
          .attr('y', -50)
          .attr('width', 160)
          .attr('height', 45);
        
        tooltip.append('text')
          .attr('fill', 'white')
          .attr('text-anchor', 'middle')
          .attr('y', -30)
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .text(d.data.category);
        
        tooltip.append('text')
          .attr('fill', 'white')
          .attr('text-anchor', 'middle')
          .attr('y', -15)
          .style('font-size', '11px')
          .text(`Count: ${d.data.count}`);
        
        tooltip.append('text')
          .attr('fill', 'white')
          .attr('text-anchor', 'middle')
          .attr('y', 0)
          .style('font-size', '11px')
          .text(`Avg Price: $${d.data.avg_price.toFixed(2)}`);
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
      .text(d => {
        const total = d3.sum(data, item => item.count);
        const percentage = ((d.data.count / total) * 100);
        return percentage > 5 ? `${percentage.toFixed(1)}%` : ''; // Only show if > 5%
      });

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
        No category data available
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
        Category Breakdown
      </h3>
      <svg ref={svgRef} className="w-full h-auto" />
    </div>
  );
}

