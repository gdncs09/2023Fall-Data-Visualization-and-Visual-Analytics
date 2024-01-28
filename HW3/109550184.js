const margin = {top: 20, bottom: 200, left: 150, right: 100},
      width = 800,
      height = 600,
      inWidth = width - margin.left - margin.right,
      inHeight = height - margin.top - margin.bottom;

const colorScale = d3.scaleLinear()
	.domain([-1,0,1])
	.range(["#FFAEBC","#FFFFFF","#A0E7E5"]);

const dataFeatures = ["Length", "Diameter", "Height", "Whole_weight", "Shucked_weight", "Viscera_weight", "Shell_weight", "Rings"];

d3.text("abalone.data").then(function(f) {
  dataList = f.split("\n");
  var list = {Male: [], Female: [], Infant: []};
  var corrMatrix = {Male: [], Female: [], Infant: []};
  for (var i = 0; i < dataList.length; i++){
  	var data = dataList[i].split(",");
    var value = [];
    for (var j = 1; j < data.length; j++){
    	value.push(data[j]);
    }
    switch (data[0]){
      case "M": //Male
        list.Male.push(value);
        break;
      case "F": //Female
        list.Female.push(value);
        break;
      case "I": //Infant
        list.Infant.push(value);
        break;
    }
  }
  corrMatrix.Male = CorrelationMatrix(list.Male)
  corrMatrix.Female = CorrelationMatrix(list.Female)
  corrMatrix.Infant = CorrelationMatrix(list.Infant)
  
  var selected = document.getElementById("categories").value;
  Display(corrMatrix[selected]);
  
  document
  	.getElementById("categories")
    .addEventListener("change", function () {
    	selected = this.value;
    	console.log(selected);
  		Display(corrMatrix[selected]);
  	});
});
			
function CorrelationMatrix(data){
  var matrix = [];
  const dataTranspose = math.transpose(data);
  for (var i = 0; i < dataTranspose.length; i++){
    matrix[i] = [];
  	for (var j = 0; j <= i; j++){
    	var value = math.corr(dataTranspose[i], dataTranspose[j]);
      matrix[i][j] = value;
    }
  }
  return matrix;
}


function Display(data){
  d3.select("#correlation-matrix svg").remove();
  const svg = d3
    .select("#correlation-matrix")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);
		
  //Matrix
  const cellSize = Math.min(inWidth, inHeight) / data.length;

  const rows = svg
	  .selectAll(".row")
    .data(data)
  	.enter()
    .append("g")
    .attr("class", "row")
    .attr("transform", (d, i) => `translate(0, ${i * cellSize})`);

  const cells = rows
    .selectAll(".cell")
    .data((d) => d)
    .enter()
    .append("g")
    .attr("class", "cell")
    .attr("transform", (d, i) => `translate(${i * cellSize}, 0)`);

  cells
    .append("rect")
    .attr("width", cellSize)
    .attr("height", cellSize)
    .style("fill", (d) => colorScale(d));

  cells
    .append("text")
    .attr("x", cellSize / 2)
    .attr("y", cellSize / 2)
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "middle")
    .style("fill", "black")
    .text((d) => d.toFixed(2));
  
  //Labels
  const leftLabels = svg.append("g")
    .attr("class", "feature-labels")
    .selectAll(".feature-label")
    .data(dataFeatures)
    .enter()
    .append("text")
    .attr("class", "feature-label")
    .attr("x", -10) // Adjust the x-coordinate to position the labels
    .attr("y", (d, i) => i * cellSize + cellSize / 2)
    .attr("text-anchor", "end")
    .attr("alignment-baseline", "middle")
  	.style("font-weight", "bold")
    .text((d) => d);
  
  const bottomLabels = svg.append("g")
    .attr("class", "feature-labels")
    .selectAll(".feature-label")
    .data(dataFeatures)
    .enter()
    .append("text")
    .attr("class", "feature-label")
    .attr("transform", (d, i) => `rotate(-90) translate(-${height - margin.bottom}, ${i * cellSize + cellSize / 2})`)
    .attr("text-anchor", "end")
    .attr("alignment-baseline", "middle")
  	.style("font-weight", "bold")
    .text((d) => d);
  
  //Color legend
  const legendWidth = 20;
  const legendHeight = inHeight;
    
  const legendsvg = svg
    .append("g")
    .attr("transform", `translate(${inWidth + 30}, 0)`);
		
  const defs = legendsvg.append("defs");
    
  const gradient = defs
    .append("linearGradient")
    .attr("id", "linear-gradient")
    .attr("x1", 0)
    .attr("x2", 0)
    .attr("y1", 0)
    .attr("y2", 1);
    
  const colorStops = [1, 0.5, 0, -0.5, -1];
  const stopOffset = [0, 0.25, 0.5, 0.75, 1];
 
  gradient
    .selectAll("stop")
    .data(colorStops)
    .enter()
    .append("stop")
    .attr("offset", (d, i) => stopOffset[i])
    .attr("stop-color", (d) => colorScale(d));    
  
  legendsvg
    .append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#linear-gradient)");

  const legendText = legendsvg
    .selectAll("legend-text")     
  	.data(colorStops)
    .enter()
    .append("text")
	  .attr("class", "legend-text")
    .attr("x", (d, i) => stopOffset[i] + 40)
    .attr("y", (d, i) => (i / (colorStops.length - 1)) * legendHeight)
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "middle")
  	.text((d) => d.toFixed(1));
}



