const filePath = "iris.csv";
const columns = ["sepal length", "sepal width", "petal length", "petal width"];

const margin = {top: 25, bottom: 50, left: 70, right: 50},
      width = 700,
      height = 600;
const size = (500 - margin.left - margin.right) / columns.length;

const color = d3
  .scaleOrdinal()
  .domain(['Iris-setosa', 'Iris-versicolor', 'Iris-virginica'])
  .range(['#F9AB40', '#A1DBF1', '#C85250']);

const svg = d3.select("#scatter-plot-matrix")
	.append("svg")
	.attr("width", width)
	.attr("height", height)
	.append("g")
	.attr("transform", `translate(${margin.left}, ${margin.top})`);

svg.selectAll(".x-axis-label")
    .data(columns)
    .enter()
    .append("text")
    .attr("class", "x-axis-label")
    .attr("x", (d, i) => i * size + size / 2)
    .attr("y", -10) // Adjust the Y position to place labels at the top
    .style("text-anchor", "middle")
		.style("font-weight", "bold")
    .text(d => d);

svg.selectAll(".y-axis-label")
    .data(columns)
    .enter()
    .append("text")
    .attr("class", "y-axis-label")
    .attr("transform", (d, i) => `translate(${size*columns.length + margin.left - margin.right}, ${i * size + size / 2}) rotate(90)`) // Adjust X position
    .style("text-anchor", "middle")
    .style("font-weight", "bold")
    .text(d => d);

const legendData = [
  { label: 'Iris-setosa', color: '#F9AB40' },
  { label: 'Iris-versicolor', color: '#A1DBF1' },
  { label: 'Iris-virginica', color: '#C85250' }
];

const legendContainer = svg
      .append('g')
      .attr('class', 'legend-container')
      .attr(
        'transform', `translate(${size*columns.length + margin.left + 10}, 0)`);

    const legendItems = legendContainer
      .selectAll('g')
      .data(legendData)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr(
        'transform',
        (d, i) => `translate(0, ${i * 30})`
      );

    legendItems
      .append('circle')
      .attr('r', 6)
      .attr('cx', 0)
      .attr('cy', size + margin.top)
      .style('fill', d => d.color);

    legendItems
      .append('text')
      .attr('x', 15)
      .attr('y', size + margin.top + 5)
      .text((d) => d.label);

//Load file
d3.csv(filePath).then(function(csv) {
  data = csv.filter(function(row){
    return row.class !== '';
  });
  render(data)
});

function render(){
  const x = columns.map(c => d3.scaleLinear()
      .domain(d3.extent(data, d => d[c]))
      .range([3, size-3]));

	const y =columns.map(c => d3.scaleLinear()
      .domain(d3.extent(data, d => d[c]))
     	.range([size-3, 3]));
  
  const axisx = d3.axisBottom()
      .ticks(5)
      .tickSize(size * columns.length);
  const xAxis = g => g.selectAll("g").data(x).join("g")
      .attr("transform", (d, i) => `translate(${i * size}, 0)`)
      .each(function(d) { return d3.select(this).call(axisx.scale(d)); })
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line").attr("stroke", "#ddd"));
	const axisy = d3.axisLeft()
      .ticks(5)
      .tickSize(-size * columns.length);
  const yAxis = g => g.selectAll("g").data(y).join("g")
      .attr("transform", (d, i) => `translate(0,${i * size})`)
      .each(function(d) { return d3.select(this).call(axisy.scale(d)); })
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line").attr("stroke", "#ddd"));
  
  svg.append("style")
      .text(`circle.hidden { fill: #000; fill-opacity: 1; r: 1px; }`);

  svg.append("g")
      .call(xAxis);

  svg.append("g")
      .call(yAxis);
  
  const cell = svg.append("g")
    .selectAll("g")
    .data(d3.cross(d3.range(columns.length), d3.range(columns.length)))
    .join("g")
    .attr("transform", ([i, j]) => `translate(${i * size},${j * size})`);

  cell.append("rect")
      .attr("fill", ([i,j]) => i === j ? "white" : "none")
      .attr("stroke", "#aaa")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", size)
      .attr("height", size);

  cell.each(function([i, j]) {
    if (i!==j){
      d3.select(this).selectAll("circle")
        .data(data.filter(d => !isNaN(d[columns[i]]) && !isNaN(d[columns[j]])))
        .join("circle")
          .attr("cx", d => x[i](d[columns[i]]))
          .attr("cy", d => y[j](d[columns[j]]));
    }
    else{ //histogram
      const values = data.map(d => d[columns[i]]);
      const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d[columns[i]]))
        .range([0, size]);
			
      const histogram = d3.histogram()
        .value(d => d)
        .domain(xScale.domain())
        .thresholds(xScale.ticks(15));
    	var bins = histogram(values);
      
      const yScale = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length)+3])
        .range([size, 0]);
                 
			d3.select(this).selectAll(".hist")
      .data(bins)
      .enter()
      .append("rect")  
  	  .attr("x", 1)
      .attr("transform", function(d) { return "translate(" + xScale(d.x0) + "," + yScale(d.length) + ")"; })
			.attr("width", d => Math.max(0, xScale(d.x1) - xScale(d.x0) - 1))
      .attr("height", d => Math.max(0, size - yScale(d.length)))
      .style("fill", "#5289B5")
     
    }
  	const circle = cell.selectAll("circle")
      .attr("r", 2)
      .attr("fill", d => color(d.class));
			
  	cell.call(brush, circle, svg, {size, x, y, columns});
  });
  svg.property("value", [])
}

function brush(cell, circle, svg, {size, x, y, columns}) {
  const brush = d3.brush()
      .extent([[0, 0], [size, size]])
      .on("start", brushstarted)
      .on("brush", brushed)
      .on("end", brushended);

  cell.call(brush);

  let brushCell;
  function brushstarted() {
    if (brushCell !== this) {
      d3.select(brushCell).call(brush.move, null);
      brushCell = this;
    }
  }

  function brushed({selection}, [i, j]) {
    let selected = [];
    if (selection && i !== j) {
      const [[x0, y0], [x1, y1]] = selection; 
      circle.classed("hidden",
        d => x0 > x[i](d[columns[i]])
          || x1 < x[i](d[columns[i]])
          || y0 > y[j](d[columns[j]])
          || y1 < y[j](d[columns[j]]));
      selected = data.filter(
        d => x0 < x[i](d[columns[i]])
          && x1 > x[i](d[columns[i]])
          && y0 < y[j](d[columns[j]])
          && y1 > y[j](d[columns[j]]));
    }
    svg.property("value", selected).dispatch("input");
  }

  function brushended({selection}) {
    if (selection) return;
    svg.property("value", []).dispatch("input");
    circle.classed("hidden", false);
  }
}