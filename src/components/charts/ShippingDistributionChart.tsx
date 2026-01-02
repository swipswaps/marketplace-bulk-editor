/**
 * Shipping Distribution Chart Component
 * D3.js donut chart showing shipping availability distribution
 */

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface ShippingData {
  shipping: string;
  count: number;
  percentage: number;
}

interface ShippingDistributionChartProps {
  data: ShippingData[];
  width?: number;
  height?: number;
}

export function ShippingDistributionChart({ 
  data, 
  width = 400, 
  height = 400 
}: ShippingDistributionChartProps) {
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

    // Color scale - green for Yes, gray for No
    const colorScale = d3.scaleOrdinal<string>()
      .domain(['Yes', 'No'])
      .range(['#10B981', '#6B7280']);

    // Pie generator
    const pie = d3.pie<ShippingData>()
      .value(d => d.count)
      .sort(null);

    // Arc generator
    const arc = d3.arc<d3.PieArcDatum<ShippingData>>()
      .innerRadius(innerRadius)
      .outerRadius(radius);

    // Arc for hover effect
    const arcHover = d3.arc<d3.PieArcDatum<ShippingData>>()
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
      .attr('fill', d => colorScale(d.data.shipping))
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
          .attr('y', -40)
          .attr('width', 160)
          .attr('height', 35);
        
        tooltip.append('text')
          .attr('fill', 'white')
          .attr('text-anchor', 'middle')
          .attr('y', -25)
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .text(`Shipping: ${d.data.shipping}`);
        
        tooltip.append('text')
          .attr('fill', 'white')
          .attr('text-anchor', 'middle')
          .attr('y', -10)
          .style('font-size', '11px')
          .text(`${d.data.count} listings (${d.data.percentage.toFixed(1)}%)`);
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
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .style('fill', 'white')
      .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.8)')
      .text(d => `${d.data.percentage.toFixed(1)}%`);

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
        No shipping data available
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
        Shipping Availability
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Facebook Marketplace prioritizes listings with shipping enabled
      </p>
      <svg ref={svgRef} className="w-full h-auto" />
    </div>
  );
}

