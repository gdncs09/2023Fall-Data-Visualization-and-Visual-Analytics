const filePath = "TIMES_WorldUniversityRankings_2024.csv";
const margin = {top: 30, bottom: 50, left: 240, right: 300},
      width = 1000,
      height = 20000;
const innerWidth = width - margin.left - margin.right,
      innerHeight = height - margin.top - margin.bottom;

const criteria = ["scores_teaching", "scores_research", "scores_citations", "scores_industry_income", "scores_international_outlook"];
const colorScale = d3.scaleOrdinal()
	.domain(criteria)
	.range(["#41E0D9","#94E133","#533DE0","#E59B39","#E14066"]);
const legendData = [
  {label: "scores_teaching", color: '#41E0D9'},
  {label: "scores_research", color: '#94E133'},
  {label: "scores_citations", color: '#533DE0'},
  {label: "scores_industry_income", color: '#E59B39'},
  {label:  "scores_international_outlook", color: '#E14066'},
];

function sort(data, element, mode){
	if (element === "scores_overall"){ //By overall scores
    data.sort((a, b) => a[element] - b[element]);
    if (mode === "descending")
    data.reverse()
  }
  else{ //By each individual criterion 
    data.sort((a, b) => b[element] - a[element]);
    if (mode === "descending")
    data.reverse()
  }
}

function render(data){
  d3.select("#stacked-bar-charts svg").remove();
  const svg = d3.select("#stacked-bar-charts")
	.append("svg")
	.attr("width", width)
	.attr("height", height)
	.append("g")
	.attr("transform", `translate(${margin.left}, ${margin.top})`);
  
  var x = d3.scaleLinear()
    .domain([0, 100])
    .range([0, innerWidth]);
  svg.append("g")
    .call(d3.axisTop(x));
  
  var y = d3.scaleBand()
      .domain(data.map(d => d.name))
      .range([0, innerHeight])
      .padding(0.5)
  svg.append("g")
    .call(d3.axisLeft(y).tickSizeOuter(0))
		.selectAll("text")
  	.style('font-size', '0.5em');
  
  var stackedData = d3.stack().keys(criteria)(data)
  
  svg.append("g")
    .selectAll("g")
    .data(stackedData)
    .enter().append("g")
  	.attr('class', d => `group-${d.key}`) 
  		.attr("fill", d => colorScale(d.key))
      .selectAll("rect")
      .data(d => d)
      .enter().append("rect")
        .attr("x", d => x(d[0]))
        .attr("width", d => x(d[1]) - x(d[0]))
        .attr("height", y.bandwidth())
  			.attr("y", (d, i) => y(data[i].name))
  
  const legendContainer = svg
      .append('g')
      .attr('class', 'legend-container') 
  		.attr('transform', `translate(${innerWidth + 50}, ${margin.top})`);
  
  const legendItems = legendContainer
      .selectAll('g')
      .data(legendData)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform',(d, i) => `translate(0, ${i * 50})`);
  
  legendItems
      .attr('class', d => `group-${d.key}`) 
      .append('circle')
      .attr('r', 20)
      .attr('cx', 0)
      .attr('cy', margin.top)
      .attr('fill', d => d.color) 
  		.on("mouseover", function(d) {
    		const selectedItem = legendData.find(d => d.color === this.getAttribute("fill"));
        criteria.filter(key => key !== selectedItem.label).forEach(item => {
          svg.selectAll(`.group-${item} rect`)
            .attr('opacity', 0.1);
        })
    	})
  		.on("mouseout", function(d) {
        svg.selectAll('rect').attr('opacity', 1);
      });
  legendItems
    .append('text')
    .attr('x', 30)
    .attr('y', margin.top + 3)
    .text((d) => d.label);
  window.addEventListener('scroll', function() {
    const scrollY = window.scrollY;
    const translateY = scrollY; // Adjust as needed
    legendContainer.attr('transform', `translate(${innerWidth + 50}, ${translateY})`);
  });
}

//Load file
d3.csv(filePath).then(csv => {
  data = csv.filter(csv => csv.scores_overall !== 'n/a');
  data.forEach(d => {
  	d.scores_teaching = +d.scores_teaching * 0.295;
    d.scores_research = +d.scores_research * 0.29;
    d.scores_citations = +d.scores_citations * 0.3;
    d.scores_industry_income = +d.scores_industry_income * 0.04;
    d.scores_international_outlook = +d.scores_international_outlook * 0.075;
    d.scores_overall = d.scores_teaching + d.scores_research + d.scores_citations + d.scores_industry_income + d.scores_international_outlook;
  });
  var element = document.getElementById("element").value;
  var mode = document.getElementById("mode").value;
  sort(data, element, mode)
  render(data)

  //Element
  document
    .getElementById("element")
    .addEventListener("change", function(){
      element = this.value;
  })
  //Mode
  document
  	.getElementById("mode")
    .addEventListener("change", function(){
    	mode = this.value;
  })
  //Button
  document
    .getElementById("bt")
    .addEventListener("click", () => {
    	sort(data, element, mode)
    	render(data)
  })
});
