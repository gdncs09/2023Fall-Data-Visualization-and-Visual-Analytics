const filePath = "spotify_tracks.csv";
//"http://vis.lab.djosix.com:2023/data/spotify_tracks.csv"
const margin = {top: 30, bottom: 500, left: 70, right: 100},
      width = 1350,
      height = 1000;
const innerWidth = width - margin.left - margin.right,
      innerHeight = height - margin.top - margin.bottom;

const colorCodes = ["#e3eef9","#cfe1f2","#b5d4e9","#93c3df","#6daed5","#4b97c9","#2f7ebc","#1864aa","#0a4a90","#08306b",
                    "#e8f6e3","#d3eecd","#b7e2b1","#97d494","#73c378","#4daf62","#2f984f","#157f3b","#036429","#00441b",
                    "#f2f2f2","#e2e2e2","#cecece","#b4b4b4","#979797","#7a7a7a","#5f5f5f","#404040","#1e1e1e","#000000",
                    "#fee8d3","#fdd8b3","#fdc28c","#fda762","#fb8d3d","#f2701d","#e25609","#c44103","#9f3303","#7f2704",
                    "#f1eff6","#e2e1ef","#cecee5","#b6b5d8","#9e9bc9","#8782bc","#7363ac","#61409b","#501f8c","#3f007d",
                    "#fee3d6","#fdc9b4","#fcaa8e","#fc8a6b","#f9694c","#ef4533","#d92723","#bb151a","#970b13","#67000d",
                    "#fde4e1","#fccfcc","#fbb5bc","#f993b0","#f369a3","#e03e98","#c01788","#99037c","#700174","#49006a",              
                    "#543005","#8c510a","#bf812d","#dfc27d","#f6e8c3","#c7eae5","#80cdc1","#35978f","#01665e","#003c30",              
                    "#6e40aa","#963db3","#bf3caf","#e4419d","#fe4b83","#ff5e63","#ff7847","#fb9633","#e2b72f","#c6d63c",
                    "#aff05b","#6054c8","#4c6edb","#368ce1","#23abd8","#1ac7c2","#1ddfa3","#30ef82","#52f667","#7ff658",
                    "#1a1530","#163d4e","#1f6642","#54792f","#a07949","#d07e93","#cf9cda","#c1caf3","#d2eeef","#8dd3c7",
                    "#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9","#bc80bd","#ccebc5","#ffed6f"]

var selected = document.getElementById('display').value;

const render_bar_chart = (data) => {
  d3.selectAll("#charts svg").remove();
  const svg = d3.select("#charts")
	.append("svg")
	.attr("width", width)
	.attr("height", height)
	.append("g")
	.attr("transform", `translate(${margin.left}, ${margin.top})`);
  
  //Y Axis
  var y = d3.scaleLinear()
  	.domain([0, 100])
  	.range([innerHeight, 0]);
  
  svg.append("g")
  	.call(d3.axisLeft(y));
  
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", - 50)
    .attr("x", -(innerHeight / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
  	.style("font-weight", "bold")
    .text("popularity");
  
  //X Axis
  var x = d3.scaleBand()
    .domain(data.map(d => d.track_name))
    .range([0, innerWidth])
    .padding(0.2);
  
  svg.append("g")
  	.attr('transform', `translate(0, ${innerHeight})`)
		.call(d3.axisBottom(x).tickSizeOuter(0))
  	.selectAll("text") 
    .attr("transform", "rotate(-60)") 
    .style("text-anchor", "end");
  
  svg.append("text")
  .attr("transform", `translate(${innerWidth + 50} , ${innerHeight+3})`)
  .style("text-anchor", "middle")
  .style("font-weight", "bold")
  .text("track name");
  
  const xValue = d => d.track_name; 
  const yValue = d => d.popularity;
	
  var graph = svg.selectAll('rect')
   .data(data)
   .enter().append('rect')
   .attr('x', (d) => x(xValue(d)))
   .attr('y', (d) => y(yValue(d)))
   .attr('height', (d) => (innerHeight - y(yValue(d))))
   .attr('width', x.bandwidth())
   .attr('fill', "steelblue");
  
  graph.append("title")
    .text((d,i) => {
    	return (i+1) + "\n" + "Track name: " + d.track_name + "\n" + 
        "Artists: " + d.artists + "\n" +
    		"Popularity: " + d.popularity;
  	});
};


const render_scatter_plot = (data, selected) => {
  const isHidden = {};
  const genre_types = [...new Set(data.map(entry => entry.track_genre))].sort();
  genre_types.forEach((d) => {
  	isHidden[d] = true;
  })
  const colorScale = d3.scaleOrdinal()
  	.domain(genre_types)
  	.range(colorCodes); 
  
	d3.select("#charts svg").remove();
  const svg = d3.select("#charts")
	.append("svg")
	.attr("width", width)
	.attr("height", height)
	.append("g")
	.attr("transform", `translate(${margin.left}, ${margin.top})`);
  
  var x = d3.scaleLinear()
  	.domain([0, 1])
  	.range([0, innerWidth]);
  svg.append("g")
  	.attr('transform', `translate(0, ${innerHeight})`)
  	.call(d3.axisBottom(x));
  
  svg.append("text")
    .attr("transform", `translate(${innerWidth/2} , ${innerHeight+40})`)
    .style("text-anchor", "middle")
    .style("font-weight", "bold")
    .text(selected);
  
  var y = d3.scaleLinear()
  	.domain([0, 100])
  	.range([innerHeight, 0]);
  svg.append("g")
  	.call(d3.axisLeft(y));
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", - 50)
    .attr("x", -(innerHeight / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
  	.style("font-weight", "bold")
    .text("popularity");
  
  const points = svg.append('g')
    .selectAll('dot')
    .data(data)
    .enter().append('circle')
      .attr('cx', function (d) {return x(d[selected]);})
      .attr('cy', function (d) {return y(d.popularity);})
      .attr('r', 2)
      .attr('opacity', 0.05)
  		.attr('class', (d) => `group-${d.track_genre}`) 
  		.attr("fill", (d) => {return colorScale(d.track_genre);});
  		
  const legendContainer = svg
      .append('g')
      .attr('class', 'legend-container') 
  		.attr('transform', `translate(${-margin.left+20}, ${innerHeight+margin.top})`);
  
  const legendItems = legendContainer
      .selectAll('g')
      .data(genre_types)
      .enter()
      .append('g')
      .attr('transform',(d, i) => {
        const column = i % 9;
        const row = Math.floor(i / 9);
        return `translate(${column*150}, ${row*30})`;
      });
  
  legendItems
      .append('circle')
      .attr('r', 10)
      .attr('cx', 0)
      .attr('cy', margin.top)
  		.attr('class', (d) => `group-${d}`) 
  		.attr('opacity', 0.5)
      .attr('fill', d => {return colorScale(d)})
  		.on("click", function (d){
    		const selectedItem = genre_types.find(d => colorScale(d) === this.getAttribute("fill"));
    		console.log(selectedItem)
    		const className = selectedItem;
    		if (isHidden[selectedItem]===true){
          svg.selectAll(`.group-${className}`)
              .attr('opacity', 1);
          legendItems.selectAll(`.group-${className}`)
              .attr('opacity', 1);
          isHidden[selectedItem]=false;
        }
    		else {
          svg.selectAll(`.group-${className}`)
              .attr('opacity', 0.05);
          legendItems.selectAll(`.group-${className}`)
              .attr('opacity', 0.5);
          isHidden[selectedItem]=true;
        };
        });

  legendItems
    .append('text')
  	.attr('opacity', 1)
    .attr('x', 20)
    .attr('y', margin.top + 3)
    .text(d => d);
};

d3.csv(filePath).then(csv => {
  const data = csv.filter(csv => csv.track_genre !== "");
  const sortedPopularity = data.sort((a, b) => b.popularity - a.popularity);

  const trackNameSet = new Set();
  const data_track_name = [];
  for (let i = 0; i < sortedPopularity.length; i++) {
    const trackName = sortedPopularity[i].track_name;
    if (!trackNameSet.has(trackName)) {
      trackNameSet.add(trackName);
      data_track_name.push(sortedPopularity[i]);
    }
  }
	if (selected === "track_name")
  	render_bar_chart(data_track_name.slice(0, 50));
  else 
    render_scatter_plot(data, selected);
  
  document.getElementById('display')
    .addEventListener('change', function () {
      selected = this.value;
      if (selected === "track_name")
        render_bar_chart(data_track_name.slice(0, 50));
      else 
        render_scatter_plot(data, selected);
    });
})