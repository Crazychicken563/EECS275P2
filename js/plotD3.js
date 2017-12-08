var d3 = require('d3');

module.exports = {
    /* expected inputs:
     * docElement (where to insert the graph)
     * size {width:x, hight:y}
     * axis {xText:"", yText:""}
     * data: [(x,y)]
     * callback
     */
    createGraph: function(docElement, size, axis, data, plotLine, callback) {
        var x = d3.scaleLinear().range([0, size.width]);
        var y = d3.scaleLinear().range([size.height, 0]);

        var color = d3.scaleOrdinal(d3.schemeCategory10);

        var category;
        var keys = Object.keys(data[0]);
        for (var i in keys) {
            var key = keys[i];
            console.log("key:" + key);
            if (axis.x !== key && axis.y !== key) {
                category = key;
                break;
            }
        }
        console.log("category " + category);

        var xAxis = d3.axisBottom().scale(x);
        var yAxis = d3.axisLeft().scale(y);

        var svg = d3.select(docElement)
            .append("svg")
            .attr('width', size.width)
            .attr('height', size.height);

        var xExtent = d3.extent(data, function(d) {
            return d[axis.x];
        });
        var xRange = xExtent[1] - xExtent[0];
        var yExtent = d3.extent(data, function(d) {
            return d[axis.y];
        });
        var yRange = yExtent[1] - yExtent[0];

        // set domain to be extent +- 5%
        x.domain([xExtent[0] - (xRange * .05), xExtent[1] + (xRange * .05)]).nice();
        y.domain([yExtent[0] - (yRange * .05), yExtent[1] + (yRange * .05)]).nice();

        /*x.domain(d3.extent(data, function(d) {
            return d[axis.x];
        })).nice();
        y.domain(d3.extent(data, function(d) {
            return d[axis.y];
        })).nice();*/

        svg.append("g")
            .attr("class", "x axis")
            .style("stroke", "#000")
            .style("shape-rendering", "crispEdges")
            .attr("transform", "translate(0," + (size.height - 25) + ")")
            .call(xAxis)
            .append("text")
            .attr("class", "label")
            .attr("x", size.width)
            .attr("y", -6)
            .style("text-anchor", "end")
            .style("stroke", "#000")
            .style("shape-rendering", "crispEdges")
            .text(axis.x);

        svg.append("g")
            .attr("class", "y axis")
            .style("stroke", "#000")
            .style("shape-rendering", "crispEdges")
            .attr("transform", "translate(25,0)")
            .call(yAxis)
            .append("text")
            .attr("class", "label")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .style("stroke", "#000")
            .style("shape-rendering", "crispEdges")
            .text(axis.y)

        svg.selectAll(".dot")
            .data(data)
            .enter().append("circle")
            .attr("class", "dot")
            .attr("r", 3.5)
            .attr("cx", function(d) {
                return x(d[axis.x]);
            })
            .attr("cy", function(d) {
                return y(d[axis.y]);
            })
            .style("stroke", "#000")
            .style("fill", function(d) {
                return color(d[category]);
            });

        if (plotLine) {
            for (var i in plotLine) {
                var lineData = plotLine[i];

                var plotData = [];
                plotData.push({
                    x: xExtent[0],
                    y: lineData.slope * xExtent[0] + lineData.intercept
                });
                plotData.push({
                    x: xExtent[1],
                    y: lineData.slope * xExtent[1] + lineData.intercept
                });
                var line = d3.line()
                    .x(function(d) {
                        console.log("x:" + x(d.x));
                        return x(d.x);
                    })
                    .y(function(d) {
                        console.log("y:" + y(d.y));
                        return y(d.y);
                    });

                var strokeColor = lineData.strokeColor;
                if (!strokeColor) {
                    strokeColor = "steelblue";
                }
                console.log(plotData[0]);
                svg.append("path")
                    .datum(plotData)
                    .attr("fill", "none")
                    .attr("stroke", strokeColor)
                    .attr("stroke-linejoin", "round")
                    .attr("stroke-linecap", "round")
                    .attr("stroke-width", 1.5)
                    .attr("d", line);
            }
        }

        var legend = svg.selectAll(".legend")
            .data(color.domain())
            .enter().append("g")
            .attr("class", "legend")
            .attr("transform", function(d, i) {
                return "translate(0," + i * 20 + ")";
            });

        legend.append("rect")
            .attr("x", size.width - 18)
            .attr("width", 18)
            .attr("height", 18)
            .style("fill", color);

        legend.append("text")
            .attr("x", size.width - 24)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "end")
            .text(function(d) {
                return d;
            });

        callback(d3.select(docElement).html());
    }
}
