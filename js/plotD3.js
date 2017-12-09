var d3 = require('d3');

module.exports = {
    /* expected inputs:
     * docElement (where to insert the graph)
     * size {width:x, hight:y}
     * dataKeys {x:"", y:"", category:""}
     * data: [(x,y)]
     * callback
     */
    createGraph: function(docElement, size, dataKeys, data, plotShape, callback) {
        var xScale = d3.scaleLinear().range([0, size.width]);
        var yScale = d3.scaleLinear().range([size.height, 0]);

        var color = d3.scaleOrdinal(d3.schemeCategory10);

        var category = dataKeys.category;
        if (!category) {
            var keys = Object.keys(data[0]);
            for (var i in keys) {
                var key = keys[i];
                console.log("key:" + key);
                if (dataKeys.x !== key && dataKeys.y !== key) {
                    category = key;
                    break;
                }
            }
        }
        console.log("category " + category);

        var xAxis = d3.axisBottom().scale(xScale);
        var yAxis = d3.axisLeft().scale(yScale);

        var svg = d3.select(docElement)
            .append("svg")
            .attr('width', size.width)
            .attr('height', size.height);

        var xExtent = d3.extent(data, function(d) {
            return d[dataKeys.x];
        });
        var xRange = xExtent[1] - xExtent[0];
        var yExtent = d3.extent(data, function(d) {
            return d[dataKeys.y];
        });
        var yRange = yExtent[1] - yExtent[0];

        // set domain to be extent +- 5%
        xScale.domain([xExtent[0] - (xRange * .05), xExtent[1] + (xRange * .05)]).nice();
        yScale.domain([yExtent[0] - (yRange * .05), yExtent[1] + (yRange * .05)]).nice();

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
            .text(dataKeys.x);

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
            .text(dataKeys.y)

        svg.selectAll(".dot")
            .data(data)
            .enter().append("circle")
            .attr("class", "dot")
            .attr("r", 3.5)
            .attr("cx", function(d) {
                return xScale(d[dataKeys.x]);
            })
            .attr("cy", function(d) {
                return yScale(d[dataKeys.y]);
            })
            .style("stroke", "#000")
            .style("fill", function(d) {
                return color(d[category]);
            });

        if (plotShape) {
            for (var i in plotShape) {
                console.log(plotShape[i].shape);
                if (plotShape[i].shape === 'line') {
                    var lineData = plotShape[i].data;

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
                            return xScale(d.x);
                        })
                        .y(function(d) {
                            return yScale(d.y);
                        });

                    var strokeColor = lineData.strokeColor;
                    if (!strokeColor) {
                        strokeColor = "steelblue";
                    }
                    svg.append("path")
                        .datum(plotData)
                        .attr("fill", "none")
                        .attr("stroke", strokeColor)
                        .attr("stroke-linejoin", "round")
                        .attr("stroke-linecap", "round")
                        .attr("stroke-width", 1.5)
                        .attr("d", line);
                } else if (plotShape[i].shape === 'circle') {
                    svg.append("ellipse")
                        .datum(plotShape[i].data)
                        .attr("cx", function(d) {
                            return xScale(d.center.x);
                        })
                        .attr("cy", function(d) {
                            return yScale(d.center.y);
                        })
                        .attr("rx", function(d) {
                            return Math.abs(xScale(xExtent[0] + d.radius) - xScale(xExtent[0]));
                        })
                        .attr("ry", function(d) {
                            return Math.abs(yScale(xExtent[0] + d.radius) - yScale(xExtent[0]));
                        })
                        .style("stroke", function(d) {
                            return color(d.category);
                        })
                        .style("fill", "none");
                } else {
                    console.log("UNKNOWN SHAPE");
                }
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
