const filePath = "air-pollution.csv";
const width = 900,
      height = 16000,
      margin = 50;
const interval = 100,
			intervalMargin = 50;
const bandMax = 5;
var year = 2017,
    band = 1;	
var pollutants = ["SO2", "NO2", "O3", "CO", "PM10", "PM2.5"];
const pollutantDomains = { "SO2": 0.01, "NO2": 0.1, "O3": 0.05, "CO": 2.0, "PM10": 200, "PM2.5": 200 };
const colorName = ["Blues", "Greens", "Greys", "Oranges", "Purples", "Reds"];
const colorScale = {};
pollutants.forEach((pollutant, index) => {
  colorScale[pollutant] = d3[`scheme${colorName[index]}`][bandMax];
});

const svg = d3.select("#horizon-chart")
	.append("svg")
	.attr("width", width)
	.attr("height", height)

renderChart();

function selectDisplay() {
  if (d3.select("#display").property("value") === "All"){
    	pollutants = ["SO2", "NO2", "O3", "CO", "PM10", "PM2.5"];
  }
  else {
    pollutants = [d3.select("#display").property("value")];
  }
};

function selectYear() {
    year = parseInt(d3.select("#year").property("value"));
};
function selectBands() {
  band = parseInt(d3.select("#bands").property("value"));
};

function renderChart() {
  d3.csv(filePath).then(function(csv) {
    const data = csv.filter((d) => {return d["Measurement date"].split("-")[0]==year;});
    
    var lists = [];
    pollutants.forEach((pollutant) => {lists[pollutant] = {};})

    data.forEach((dataItem) => {
      pollutants.forEach((pollutant) => {
        const address = dataItem["Address"];
        const date = dataItem["Measurement date"].split(" ")[0];
        const value = Math.max(parseFloat(dataItem[pollutant]), 0.0);

        if (!lists[pollutant][address]) {
          lists[pollutant][address] = {};
        }

        if (!lists[pollutant][address][date]) {
          lists[pollutant][address][date] = [value];
        } else {
          lists[pollutant][address][date].push(value);
        }
      });
    });
    
    svg.selectAll(".axis").remove();
    svg.selectAll(".path").remove();
    svg.selectAll(".rect").remove();
    svg.selectAll(".text").remove();
    
    var count = 0;
    for (let pollutant in lists) {
    	for (let address in lists[pollutant]) {
        let averageData = [];
        for (let date in lists[pollutant][address]) {
          averageData.push({
            date: new Date(date),
            value: d3.mean(lists[pollutant][address][date])
          });
        }
      
        const xScale = d3.scaleTime()
          .domain([new Date(`${year}-01-01`), new Date(`${year}-12-31`)])
          .range([0, width - margin * 2]); 
        svg.append("g")
          .attr("class", "axis")
          .attr("transform", `translate(${margin}, ${margin+interval*(count+1)-intervalMargin})`)
          .call(d3.axisBottom(xScale));

        const yScale = d3.scaleLinear()
          .domain([0, pollutantDomains[pollutant] / band])
          .range([interval - intervalMargin, 0]);
        svg.append("g")
          .attr("class", "axis")
          .attr("transform", `translate(${margin}, ${margin+interval*count})`)
          .call(d3.axisLeft(yScale).ticks(4));
				
        for (var i=0; i <= band; i++){
          if (i < band){
            var area = d3.area()
              .x((d) => {return xScale(d.date);})
              .y0(yScale(0))
              .y1((d) => {return yScale(Math.min(Math.max(d.value-pollutantDomains[pollutant]/band*i, 0), pollutantDomains[pollutant]/band));})

            svg.append("path")
              .attr("class", "path")
              .datum(averageData)
              .attr("transform", `translate(${margin}, ${margin + interval * count})`)
              .attr("fill", colorScale[pollutant][i])
              .attr("d", area);

            svg.append("text")
              .attr("class", "text")
              .attr("x", 0)
              .attr("y", margin+interval*count-10)
              .attr("text-anchor", "left")
              .text(`${address} - ${pollutant}`)
              .style("font-weight", "bold");

            svg.append("rect")
              .attr("class", "rect")
              .attr("x", width-margin+5)
              .attr("y", margin+interval*count+((interval-intervalMargin)/band)*i)
              .attr("width", 5)
              .attr("height", (interval-intervalMargin)/band)
              .attr("fill", colorScale[pollutant][i]);
          }
          svg.append("text")
          	.attr("class", "text")
            .attr("x", width-margin+10)
            .attr("y", margin+interval*count+((interval-intervalMargin)/band)*i)
            .attr("text-anchor", "left")
          	.attr("dy", "0.35em")
          	.attr("font-size", "10px")
            .text(`${(pollutantDomains[pollutant]/band*i).toFixed(3)}`);
        }
        count++;
      }
  	}
  });
}
  