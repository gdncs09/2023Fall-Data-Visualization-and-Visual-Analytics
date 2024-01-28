const filePath = "car.data";

//sankey.js
d3.sankey = function() {
  var sankey = {},
      nodeWidth = 24,
      nodePadding = 8,
      size = [1, 1],
      nodes = [],
      links = [];

  sankey.nodeWidth = function(_) {
    if (!arguments.length) return nodeWidth;
    nodeWidth = +_;
    return sankey;
  };

  sankey.nodePadding = function(_) {
    if (!arguments.length) return nodePadding;
    nodePadding = +_;
    return sankey;
  };

  sankey.nodes = function(_) {
    if (!arguments.length) return nodes;
    nodes = _;
    return sankey;
  };

  sankey.links = function(_) {
    if (!arguments.length) return links;
    links = _;
    return sankey;
  };

  sankey.size = function(_) {
    if (!arguments.length) return size;
    size = _;
    return sankey;
  };

  sankey.layout = function(iterations) {
    computeNodeLinks();
    computeNodeValues();
    computeNodeBreadths();
    computeNodeDepths(iterations);
    computeLinkDepths();
    return sankey;
  };

  sankey.relayout = function() {
    computeLinkDepths();
    return sankey;
  };

  sankey.link = function() {
    var curvature = .5;

    function link(d) {
      var x0 = d.source.x + d.source.dx,
          x1 = d.target.x,
          xi = d3.interpolateNumber(x0, x1),
          x2 = xi(curvature),
          x3 = xi(1 - curvature),
          y0 = d.source.y + d.sy + d.dy / 2,
          y1 = d.target.y + d.ty + d.dy / 2;
      return "M" + x0 + "," + y0
           + "C" + x2 + "," + y0
           + " " + x3 + "," + y1
           + " " + x1 + "," + y1;
    }

    link.curvature = function(_) {
      if (!arguments.length) return curvature;
      curvature = +_;
      return link;
    };

    return link;
  };

  // Populate the sourceLinks and targetLinks for each node.
  // Also, if the source and target are not objects, assume they are indices.
  function computeNodeLinks() {
    nodes.forEach(function(node) {
      node.sourceLinks = [];
      node.targetLinks = [];
    });
    links.forEach(function(link) {
      var source = link.source,
          target = link.target;
      if (typeof source === "number") source = link.source = nodes[link.source];
      if (typeof target === "number") target = link.target = nodes[link.target];
      source.sourceLinks.push(link);
      target.targetLinks.push(link);
    });
  }

  // Compute the value (size) of each node by summing the associated links.
  function computeNodeValues() {
    nodes.forEach(function(node) {
      node.value = Math.max(
        d3.sum(node.sourceLinks, value),
        d3.sum(node.targetLinks, value)
      );
    });
  }

  // Iteratively assign the breadth (x-position) for each node.
  // Nodes are assigned the maximum breadth of incoming neighbors plus one;
  // nodes with no incoming links are assigned breadth zero, while
  // nodes with no outgoing links are assigned the maximum breadth.
  function computeNodeBreadths() {
    var remainingNodes = nodes,
        nextNodes,
        x = 0;

    while (remainingNodes.length) {
      nextNodes = [];
      remainingNodes.forEach(function(node) {
        node.x = x;
        node.dx = nodeWidth;
        node.sourceLinks.forEach(function(link) {
          if (nextNodes.indexOf(link.target) < 0) {
            nextNodes.push(link.target);
          }
        });
      });
      remainingNodes = nextNodes;
      ++x;
    }

    //
    moveSinksRight(x);
    scaleNodeBreadths((size[0] - nodeWidth) / (x - 1));
  }

  function moveSourcesRight() {
    nodes.forEach(function(node) {
      if (!node.targetLinks.length) {
        node.x = d3.min(node.sourceLinks, function(d) { return d.target.x; }) - 1;
      }
    });
  }

  function moveSinksRight(x) {
    nodes.forEach(function(node) {
      if (!node.sourceLinks.length) {
        node.x = x - 1;
      }
    });
  }

  function scaleNodeBreadths(kx) {
    nodes.forEach(function(node) {
      node.x *= kx;
    });
  }

  function computeNodeDepths(iterations) {
    var nodesByBreadth = d3.nest()
        .key(function(d) { return d.x; })
        .sortKeys(d3.ascending)
        .entries(nodes)
        .map(function(d) { return d.values; });

    //
    initializeNodeDepth();
    resolveCollisions();
    for (var alpha = 1; iterations > 0; --iterations) {
      relaxRightToLeft(alpha *= .99);
      resolveCollisions();
      relaxLeftToRight(alpha);
      resolveCollisions();
    }

    function initializeNodeDepth() {
      var ky = d3.min(nodesByBreadth, function(nodes) {
        return (size[1] - (nodes.length - 1) * nodePadding) / d3.sum(nodes, value);
      });

      nodesByBreadth.forEach(function(nodes) {
        nodes.forEach(function(node, i) {
          node.y = i;
          node.dy = node.value * ky;
        });
      });

      links.forEach(function(link) {
        link.dy = link.value * ky;
      });
    }

    function relaxLeftToRight(alpha) {
      nodesByBreadth.forEach(function(nodes, breadth) {
        nodes.forEach(function(node) {
          if (node.targetLinks.length) {
            var y = d3.sum(node.targetLinks, weightedSource) / d3.sum(node.targetLinks, value);
            node.y += (y - center(node)) * alpha;
          }
        });
      });

      function weightedSource(link) {
        return center(link.source) * link.value;
      }
    }

    function relaxRightToLeft(alpha) {
      nodesByBreadth.slice().reverse().forEach(function(nodes) {
        nodes.forEach(function(node) {
          if (node.sourceLinks.length) {
            var y = d3.sum(node.sourceLinks, weightedTarget) / d3.sum(node.sourceLinks, value);
            node.y += (y - center(node)) * alpha;
          }
        });
      });

      function weightedTarget(link) {
        return center(link.target) * link.value;
      }
    }

    function resolveCollisions() {
      nodesByBreadth.forEach(function(nodes) {
        var node,
            dy,
            y0 = 0,
            n = nodes.length,
            i;

        // Push any overlapping nodes down.
        nodes.sort(ascendingDepth);
        for (i = 0; i < n; ++i) {
          node = nodes[i];
          dy = y0 - node.y;
          if (dy > 0) node.y += dy;
          y0 = node.y + node.dy + nodePadding;
        }

        // If the bottommost node goes outside the bounds, push it back up.
        dy = y0 - nodePadding - size[1];
        if (dy > 0) {
          y0 = node.y -= dy;

          // Push any overlapping nodes back up.
          for (i = n - 2; i >= 0; --i) {
            node = nodes[i];
            dy = node.y + node.dy + nodePadding - y0;
            if (dy > 0) node.y -= dy;
            y0 = node.y;
          }
        }
      });
    }

    function ascendingDepth(a, b) {
      return a.y - b.y;
    }
  }

  function computeLinkDepths() {
    nodes.forEach(function(node) {
      node.sourceLinks.sort(ascendingTargetDepth);
      node.targetLinks.sort(ascendingSourceDepth);
    });
    nodes.forEach(function(node) {
      var sy = 0, ty = 0;
      node.sourceLinks.forEach(function(link) {
        link.sy = sy;
        sy += link.dy;
      });
      node.targetLinks.forEach(function(link) {
        link.ty = ty;
        ty += link.dy;
      });
    });

    function ascendingSourceDepth(a, b) {
      return a.source.y - b.source.y;
    }

    function ascendingTargetDepth(a, b) {
      return a.target.y - b.target.y;
    }
  }

  function center(node) {
    return node.y + node.dy / 2;
  }

  function value(link) {
    return link.value;
  }

  return sankey;
};

//My code
const margin = {top: 1, bottom: 1, left: 1, right: 1},
      width = 1350,
      height = 550;
const innerWidth = width - margin.left - margin.right,
      innerHeight = height - margin.top - margin.bottom;

const variables = ["buying", "maint", "doors", "persons", "lug_boot", "safety", "class"];

const svg = d3.select("svg")
	.append("svg")
	.attr("width", width)
	.attr("height", height)
	.append("g")
	.attr("transform", `translate(${margin.left}, ${margin.top})`);

const colorGroup = [["#edf8fb","#b2e2e2","#66c2a4","#2ca25f","#006d2c"], //BuGn
      							["#edf8fb","#b3cde3","#8c96c6","#8856a7","#810f7c"], //BuPu
                  	["#f0f9e8","#bae4bc","#7bccc4","#43a2ca","#0868ac"], //GnBu
                  	["#fef0d9","#fdcc8a","#fc8d59","#e34a33","#b30000"], //OrRd
                  	["#f6eff7","#bdc9e1","#67a9cf","#1c9099","#016c59"], //PuBuGn
                    ["#feebe2","#fbb4b9","#f768a1","#c51b8a","#7a0177"], //RdPu
                    ["#ffffd4","#fed98e","#fe9929","#d95f0e","#993404"] //YlOrBr
                   ];
var colorScale=[];
variables.forEach((variable, i) => {
  colorScale[variable] = d3.scaleOrdinal(colorGroup[i].reverse());
});

var sankey = d3.sankey()
  .nodeWidth(15)
  .nodePadding(10)
  .size([innerWidth, innerHeight]);
var path = sankey.link();
var freqCounter = 1;

const render = (graph) => {
	var link = svg.append("g")
    .selectAll(".link")
    .data(graph.links)
    .enter().append("path")
      .attr("class", "link")
      .attr("d", path)
      .style("stroke-width", function(d) { return Math.max(1, d.dy); })
  	.sort(function(a, b) { return b.dy - a.dy; })
	
  link.append("title")
    	.text(function(d) { return d.source.name + " → " + d.target.name + "\n" + "value: " + d.value;});
  
  var node = svg.append("g")
    .selectAll(".node")
    .data(graph.nodes)
    .enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
      .call(d3.drag()
        .subject(function(d) { return d; })
        .on("start", function() { this.parentNode.appendChild(this); })
        .on("drag", dragmove));
	
  node
    .append("rect")
      .attr("height", function(d) { return d.dy; })
      .attr("width", sankey.nodeWidth())
      .style("fill", function(d) { 
    		variable = d.name.replace(/:.*/, "");
    		var color = colorScale[variable];
    		return d.color = color(d.name.replace(/ .*:/, ""));})
      .style("stroke", function(d) { return d3.rgb(d.color).darker(2); })
    .append("title")
    	.text(function(d) { return d.name + "\n" + "value: " + d.value; });
  		
	node
    .append("text")
      .attr("x", -6)
      .attr("y", function(d) { return d.dy / 2; })
      .attr("dy", ".35em")
      .attr("text-anchor", "end")
      .attr("transform", null)
      .text(function(d) { return d.name; })
    .filter(function(d) { return d.x < width / 2; })
      .attr("x", 6 + sankey.nodeWidth())
      .attr("text-anchor", "start");
	
  // the function for moving the nodes
  function dragmove(d) {
    d3.select(this)
      .attr("transform","translate(" + d.x + "," + (d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))) + ")");
    sankey.relayout();
    link.attr("d", path);
  } 

  //Sankey Particles
  var linkExtent = d3.extent(graph.links, function (d) {return d.value});
  var frequencyScale = d3.scaleLinear().domain(linkExtent).range([1,100]);
  var particleSize = d3.scaleLinear().domain(linkExtent).range([1,5]);

  graph.links.forEach(function (link) {
    link.freq = frequencyScale(link.value);
    link.particleSize = particleSize(link.value);
    link.particleColor = d3.scaleLinear()
      	.domain([1,1000])
      	.range([link.source.color, link.target.color]);
  })

  var t = d3.timer(tick, 1000);
  var particles = [];

  function tick(elapsed, time) {

    particles = particles.filter(function (d) {return d.time > (elapsed - 1000)});

    if (freqCounter > 100) {
      freqCounter = 1;
    }

    d3.selectAll("path.link")
    .each(
      function (d) {
        if (d.freq >= freqCounter) {
          var offset = (Math.random() - .5) * d.dy;
          particles.push({link: d, time: elapsed, offset: offset, path: this})
        }
      });

    particleEdgeCanvasPath(elapsed);
    freqCounter++;

  }

  function particleEdgeCanvasPath(elapsed) {
    var context = d3.select("canvas").node().getContext("2d")

    context.clearRect(0,0,1350,1350);

      context.fillStyle = "gray";
      context.lineWidth = "1px";
    for (var x in particles) {
        var currentTime = elapsed - particles[x].time;
        var currentPercent = currentTime / 1000 * particles[x].path.getTotalLength();
        var currentPos = particles[x].path.getPointAtLength(currentPercent)
        context.beginPath();
      context.fillStyle = particles[x].link.particleColor(currentTime);
        context.arc(currentPos.x,currentPos.y + particles[x].offset,particles[x].link.particleSize,0,2*Math.PI);
        context.fill();
    }
  }
}

d3.text(filePath, function(error, input) {
  if (error) {
    console.error('Error loading data:', error);
  } else {
    rows = input.split("\n");

    linkList = {};
    const nodes = [];
    const links = [];

    rows.forEach(row => {
      if (row !== ""){
        const data = row.split(",");
        for (var i = 0; i < variables.length - 1; i++){
          const attr1 = `${variables[i]}: ${data[i]}`;
          const attr2 = `${variables[i+1]}: ${data[i+1]}`;
          const link = `${attr1}-${attr2}`;
          linkList[link] = (linkList[link] || 0) + 1;
          if (!nodes.some(node => node.name === attr1)) {
            nodes.push({name: attr1});
          }
          if (!nodes.some(node => node.name === attr2)) {
            nodes.push({name: attr2});
          }
          const source = nodes.findIndex(node => node.name === attr1);
          const target = nodes.findIndex(node => node.name === attr2);
          const existingLink = links.find(link => link.source === source && link.target === target);
          if (existingLink) {
            existingLink.value += 1;
          } else {
            links.push({source: source, target: target, value: 1});
          }
        }
    	}
    });
    const graph = {nodes,
                   links};
    sankey
      .nodes(graph.nodes)
      .links(graph.links)
      .layout(32);

    render(graph);
  }
});