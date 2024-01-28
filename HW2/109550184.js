var data;
$(document).ready(function () {
  const updateChart = (data, axes) => {
    const margin = {
      top: 20,
      right: 200,
      bottom: 10,
      left: 50,
    };
    const width = 700;
    const height = 300;
    const innerWidth =
      width - margin.left - margin.right;
    const innerHeight =
      height - margin.top - margin.bottom;
    d3.select('#parallel-plot svg').remove();
    const svg = d3
      .select('#parallel-plot')
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const graphContainer = svg
      .append('g')
      .attr(
        'transform',
        `translate(${margin.left},${margin.top})`
      );

    console.log(axes);
    const yAxes = {};
    for (var obj in axes) {
      name = axes[obj];
      yAxes[name] = d3
        .scaleLinear()
        .domain([0, 10])
        .range([0, innerHeight]);
    }
    const xAxes = d3
      .scalePoint()
      .range([0, innerWidth])
      .domain(axes);

    const connection = (d) =>
      d3.line()(
        axes.map((pt) => [
          xAxes(pt),
          yAxes[pt](d[pt]),
        ])
      );

    graphContainer
      .selectAll('connections')
      .data(data)
      .enter()
      .append('path')
      .attr('d', connection)
      .attr('class', (d) => d.class)
      .attr(
        'class',
        (d) => 'connection ' + d.class
      );

    graphContainer
      .selectAll('axes')
      .data(axes)
      .enter()
      .append('g')
      .attr('transform', function (d) {
        return 'translate( ' + xAxes(d) + ', 0)';
      })
      .each(function (d) {
        d3.select(this).call(
          d3.axisLeft().scale(yAxes[d])
        );
      })
      .append('text')
      .attr('x', 20)
      .attr('y', -5)
      .text((d) => d)
      .style('fill', 'black');

    const legendData = [
      { label: 'Iris-setosa', color: 'red' },
      {
        label: 'Iris-versicolor',
        color: 'yellow',
      },
      { label: 'Iris-virginica', color: 'blue' },
    ];

    const legendContainer = svg
      .append('g')
      .attr('class', 'legend-container')
      .attr(
        'transform',
        'translate(' +
          (width - 150) +
          ',' +
          10 +
          ')'
      );

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
      .append('line')
      .attr('x1', 0)
      .attr('x2', 30)
      .attr('y1', 15)
      .attr('y2', 15)
      .style('stroke', (d) => d.color)
      .style('stroke-width', 1);

    legendItems
      .append('text')
      .attr('x', 40)
      .attr('y', 20)
      .text((d) => d.label);
  };

  $('.axes-container').sortable({
    connectWith: '.axes-container',
    placeholder: 'axes-placeholder',
    update: function (event, ui) {
      if (event.target.id == 'axes-order') {
        let axes = [];
        $('#axes-order')
          .children('.axis')
          .each((idx, element) => {
            axes.push($(element).data('axis'));
          });
        updateChart(data, axes);
      }
    },
  });

  d3.csv('iris.csv').then(function (csv) {
    csv = csv.filter(function (row) {
      return row.class !== '';
    });
    let axes = Object.keys(csv[0]).filter(
      (d) => d != 'class'
    );
    data = csv;
    console.log(data);
    updateChart(data, axes);
  });
});
