const filePath = "ma_lga_12345.csv";
const margin = {top: 50, bottom: 100, left: 50, right: 400},
      width = 900,
      height = 500;
const innerWidth = width - margin.left - margin.right,
      innerHeight = height - margin.top - margin.bottom;

const keys = [];
const isHidden = {};
const svg = d3.select("#theme-river")
	.append("svg")
	.attr("width", width)
	.attr("height", height)
	.append("g")
	.attr("transform", `translate(${margin.left}, ${margin.top})`);
		
//Load file
d3.csv(filePath).then(function(csv) {
  input = csv.filter((row) => {
    return row.saledate !== '';
  });
  data=[];
  input.forEach(item => {
    const key = `${item.type} - ${item.bedrooms} bedrooms`;
    if (!keys.includes(key))
      keys.push(key)
    	isHidden[key]=false;
  });
  input.forEach(item => {   
    const key = `${item.type} - ${item.bedrooms} bedrooms`;
    if (!(item.saledate in data)){
      data[item.saledate] = {};
    	keys.forEach(k => {
      	data[item.saledate][k]=0;
    	})
    }
    data[item.saledate][key] =  +item.MA;
	});
  data = Object.keys(data).map(key => {
    saledate = moment(key, "DD/MM/YYYY").toDate();
  	return {saledate, ...data[key]};
	});
  data.sort((a,b) => {return a.saledate - b.saledate;});
  render(data)
});

const render = (data => {
  svg
      .append('text')
      .attr('x', -margin.left)
      .attr('y', -margin.top+20)
      .text("Move the mouse to display the exact price")
  		.style("font-weight", "bold");
	const x = d3.scaleTime()
  	.domain(d3.extent(data, (d) => d.saledate))
  	.range([0, innerWidth]);
	const y = d3.scaleLinear()
  	.domain([-2500000, 2500000])
  	.range([innerHeight, 0]);
  svg.append("g")
  	.attr('transform', `translate(0, ${innerHeight})`)
  	.call(d3.axisBottom(x));
  
  const colorScale = d3.scaleOrdinal()
  	.domain(keys)
  	.range(d3.schemeSet2);
  
  var stackedData = d3.stack().offset(d3.stackOffsetSilhouette).keys(keys)(data)
  
  const area = d3.area()
    .x((d) => {return x(d.data.saledate);})
    .y0((d) => {return y(d[0]);})
    .y1((d) => {return y(d[1]);})
	
  const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("position", "absolute")
  .style("opacity", 0)
  .style("font-weight", "bold");
  
  svg.append("g")
  	.selectAll("graph")
    .data(stackedData)
  	.join("path")
    .attr('class', (d) => `group-${d.key.replace(/[^\w]/g, '')}`) 
    .attr("fill", (d) => {return colorScale(d.key);})
    .attr("d", area)
  	.on("mousemove", (event, d) => {
    	const criteria = d.key;
    	if (isHidden[criteria]===false){
        const selectedDate = x.invert(event.x-margin.left);
        const formatDate = d3.timeFormat("%d/%m/%Y");    
        const date = formatDate(selectedDate)
        const value = d.find((item) => formatDate(item.data.saledate) === formatDate(selectedDate));
        if (value!==undefined){
          price = value.data[criteria];
          tooltip.html(`Criteria: ${criteria}, Date: ${date}, Price: ${price}`)
            .style("left", (d) => {
              var xAxis = event.pageX - margin.left;
              if (event.pageX > innerWidth + margin.left - 200)
                xAxis = innerWidth - 200;
              return xAxis + "px";
            })
            .style("top", (event.pageY + 10) + "px");
          tooltip.transition()
            .duration(200)
            .style("opacity", 0.9);
        }
      }
    	
  	})
    .on("mouseout", () => {
      tooltip.transition()
        .duration(500)
        .style("opacity", 0);
    });
  
  const legendContainer = svg
      .append('g')
      .attr('class', 'legend-container') 
  		.attr('transform', `translate(${innerWidth + 100}, ${-margin.top})`);
  
  const legendLabel = legendContainer
      .append('text')
      .attr('x', 0)
      .attr('y', margin.top)
      .text("Click to hide/show specific criteria")
  		.style("font-weight", "bold");
  
  const legendItems = legendContainer
      .selectAll('g')
      .data(keys)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform',(d, i) => `translate(50, ${50 + i * 50})`);
  
  legendItems
      .append('circle')
      .attr('r', 20)
      .attr('cx', 0)
      .attr('cy', margin.top)
      .attr('fill', d => {return colorScale(d)})
  		.on("click", function (d){
    		const selectedItem = keys.find(d => colorScale(d) === this.getAttribute("fill"));
    		const className = selectedItem.replace(/[^\w]/g, '');
    		if (isHidden[selectedItem]===true){
          svg.selectAll(`.group-${className}`)
              .attr('opacity', 1);
          isHidden[selectedItem]=false;
        }
    		else {
          svg.selectAll(`.group-${className}`)
              .attr('opacity', 0.2);
          isHidden[selectedItem]=true;
        };
        });

  legendItems
    .append('text')
    .attr('x', 30)
    .attr('y', margin.top + 3)
    .text(d => d);
})