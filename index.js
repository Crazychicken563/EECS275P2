const fs = require('fs');
const csv = require('csvtojson');
const plotter = require('./js/plotD3');
const jsdom = require("jsdom");

const {
    JSDOM
} = jsdom;

var irisData = [];
var csvReader = csv().fromFile('irisdata.csv');
var blacklistColumn = ['sepal_length', 'sepal_width'];

const gradientStep = 0.01;
const decentErrorMargin = 0.00001;

// Convert CSV file to array of json objects
csvReader.on('json', (plantData) => {
    // filter out sepal here
    var jsonToAdd = {};
    for (var key in plantData) {
        if (blacklistColumn.indexOf(key) === -1) {
            if (key === 'species') {
                jsonToAdd[key] = plantData[key];
            } else {
                jsonToAdd[key] = parseFloat(plantData[key]);
            }
        }
    }
    irisData.push(jsonToAdd);
});

function filterSpecies(blacklistSpecies) {
    var filteredData = [];
    for (var i in irisData) {
        if (irisData[i].species !== blacklistSpecies) {
            filteredData.push(irisData[i]);
        }
    }
    return filteredData;
}

// After reading in entire file, execute program
csvReader.on('done', (error) => {
    if (error) {
        console.log(error);
    }
    question1(filterSpecies('setosa'));
    question2(filterSpecies('setosa'));
    question3(filterSpecies('setosa'));
    extraCreditQuestion(irisData);
});

function extraCreditQuestion(data) {
    const dom = new JSDOM(
        `<html>
            <body>
                <div>Extra Credit<br>Circular Decision Boundaries for versicolor, virginica, and setosa</div>
                <div id="graph1" style="width: fit-content; height: fit-content; padding: 5px; border: black; border-style: solid; border-width: thin;"></div>
            </body>
        </html>`
    );

    var boundaryCircles = {
        setosa: {
            center: {
                x: 1.464,
                y: 0.244
            },
            radius: 0.5
        },
        versicolor: {
            center: {
                x: 4,
                y: 1.326
            },
            radius: 1.1
        },
        virginica: {
            center: {
                x: 6,
                y: 2.026
            },
            radius: 1.15
        }
    };

    reclassify(data, classifyCircle, boundaryCircles, function(reclassifiedData) {
        // wrap data for plotter
        var plotCircles = [];
        for (var species in boundaryCircles) {
            var plotCircle = {
                shape: 'circle',
                data: boundaryCircles[species]
            };
            plotCircle.data.category = species + '_identified';
            plotCircles.push(plotCircle);
        }

        plotter.createGraph(dom.window.document.querySelector('#graph1'), {
            width: 910,
            height: 440
        }, {
            x: "petal_length",
            y: "petal_width"
        }, reclassifiedData, plotCircles, function(graphHTML) { // figure out how to draw circles
            fs.writeFileSync('extraCredit.html', dom.window.document.querySelector('body').innerHTML);
        });
    });
}

function question3(data) {
    const dom = new JSDOM(
        `<html>
            <body>
                <div>Question 3 Part C<br>Initial Random Gradient for versicolor and virginica</div>
                <div id=initial-boundary></div>
                <div id="graph1" style="width: fit-content; height: fit-content; padding: 5px; border: black; border-style: solid; border-width: thin;"></div>
                <div>Question 3 Part C<br>Halfway Through Gradient Decent for versicolor and virginica</div>
                <div id=halfway-boundary></div>
                <div id="graph2" style="width: fit-content; height: fit-content; padding: 5px; border: black; border-style: solid; border-width: thin;"></div>
                <div>Question 3 Part C<br>Midway Through Gradient Decent Error History for versicolor and virginica</div>
                <div id="graph3" style="width: fit-content; height: fit-content; padding: 5px; border: black; border-style: solid; border-width: thin;"></div>
                <div>Question 3 Part C<br>Final State of Gradient Decent for versicolor and virginica</div>
                <div id=final-boundary></div>
                <div id="graph4" style="width: fit-content; height: fit-content; padding: 5px; border: black; border-style: solid; border-width: thin;"></div>
                <div>Question 3 Part C<br>Final State of Gradient Decent Error History for versicolor and virginica</div>
                <div id="graph5" style="width: fit-content; height: fit-content; padding: 5px; border: black; border-style: solid; border-width: thin;"></div>
            </body>
        </html>`
    );

    var startBoundary = {
        intercept: Math.random() * 0.2 + 3.2,
        slope: -(Math.random() * 0.4 + 0.2)
    }

    //lower limit
    /*var startBoundary = {
        intercept: 3.3,
        slope: -0.6
    }*/

    // upper limit
    /*var startBoundary = {
        intercept: 3.5,
        slope: -0.2
    }*/

    reclassify(data, classifyLine, startBoundary, function(reclassifiedData) {
        calculateMSE(reclassifiedData, startBoundary, function(startError) {
            calculateDescent(reclassifiedData, startError, 100, startBoundary, [], function(finalBoundary, gradientHistory) {
                // First plot
                dom.window.document.querySelector('#initial-boundary').innerHTML = 'Initial Boundary: ' +
                    'y=' + startBoundary.slope + '*x+' + startBoundary.intercept;
                plotter.createGraph(dom.window.document.querySelector('#graph1'), {
                    width: 910,
                    height: 440
                }, {
                    x: "petal_length",
                    y: "petal_width"
                }, reclassifiedData, [{
                    shape: 'line',
                    data: startBoundary
                }], function(graphHTML) {
                    var halfwayGradientHistoryIndex = Math.floor(gradientHistory.length / 2);
                    var halfwayGradient = gradientHistory[halfwayGradientHistoryIndex];
                    reclassify(data, classifyLine, halfwayGradient, function(reclassifiedData) {
                        // Middle plot
                        dom.window.document.querySelector('#halfway-boundary').innerHTML = 'Halfway Boundary: ' +
                            'y=' + halfwayGradient.slope + '*x+' + halfwayGradient.intercept;
                        plotter.createGraph(dom.window.document.querySelector('#graph2'), {
                            width: 910,
                            height: 440
                        }, {
                            x: "petal_length",
                            y: "petal_width"
                        }, reclassifiedData, [{
                            shape: 'line',
                            data: halfwayGradient
                        }], function(graphHTML) {
                            var plotData = [];
                            for (var i = 0; i < halfwayGradientHistoryIndex; i++) {
                                plotData.push({
                                    error: gradientHistory[i].error,
                                    iteration: i
                                });
                            }
                            // Middle Plot Error
                            plotter.createGraph(dom.window.document.querySelector('#graph3'), {
                                width: 910,
                                height: 440
                            }, {
                                x: "iteration",
                                y: "error",
                                category: "error"
                            }, plotData, undefined, function(graphHTML) {
                                var finalGradient = gradientHistory[gradientHistory.length - 1];
                                reclassify(data, classifyLine, finalGradient, function(
                                    reclassifiedData) {
                                    // Final plot
                                    dom.window.document.querySelector('#final-boundary').innerHTML =
                                        'Final Boundary: ' +
                                        'y=' + finalGradient.slope + '*x+' + finalGradient.intercept;
                                    plotter.createGraph(dom.window.document.querySelector(
                                        '#graph4'
                                    ), {
                                        width: 910,
                                        height: 440
                                    }, {
                                        x: "petal_length",
                                        y: "petal_width"
                                    }, reclassifiedData, [{
                                        shape: 'line',
                                        data: finalGradient
                                    }], function(
                                        graphHTML) {
                                        for (var i = halfwayGradientHistoryIndex; i <
                                            gradientHistory.length; i++) {
                                            plotData.push({
                                                error: gradientHistory[i].error,
                                                iteration: i
                                            });
                                        }
                                        // Final Plot Error
                                        plotter.createGraph(dom.window.document.querySelector(
                                            '#graph5'
                                        ), {
                                            width: 910,
                                            height: 440
                                        }, {
                                            x: "iteration",
                                            y: "error",
                                            category: "error"
                                        }, plotData, undefined, function(
                                            graphHTML) {
                                            fs.writeFileSync(
                                                'question3.html',
                                                dom.window.document.querySelector(
                                                    'body'
                                                ).innerHTML
                                            );
                                        }, false);
                                    });
                                });
                            }, false);
                        });
                    });
                });
            });
        });
    });
}

function calculateDescent(data, currError, prevError, currBoundary, gradientHistory, callback) {
    // Keep calling calculateGradient with updated values until the difference in error is insignificant
    currBoundary.error = currError;
    gradientHistory.push(currBoundary);
    if (Math.abs(prevError - currError) > decentErrorMargin) {
        calculateGradient(data, currBoundary, function(newBoundary) {
            calculateMSE(data, newBoundary, function(newError) {
                process.nextTick(function() {
                    calculateDescent(data, newError, currError, newBoundary, gradientHistory, callback);
                });
            });
        });
    } else {
        callback(currBoundary, gradientHistory);
    }
}

function question2(data) {
    const dom = new JSDOM(
        `<html>
            <body>
                <div>Question 2 Part B<br>Small MSE Plot of Classification for versicolor and virginica</div>
                <div id=mse-small></div>
                <div id="graph1" style="width: fit-content; height: fit-content; padding: 5px; border: black; border-style: solid; border-width: thin;"></div>
                <div>Question 2 Part B<br>Large MSE Plot of Classification for versicolor and virginica</div>
                <div id=mse-large></div>
                <div id="graph2" style="width: fit-content; height: fit-content; padding: 5px; border: black; border-style: solid; border-width: thin;"></div>
                <div>Question 2 Part E<br>Calculate Gradient Step with user assigned decision boundary</div>
                <div id=gradient></div>
                <div id="graph3" style="width: fit-content; height: fit-content; padding: 5px; border: black; border-style: solid; border-width: thin;"></div>
            </body>
        </html>`
    );

    // PART B
    var smallErrorBoundary = {
        slope: -0.38,
        intercept: 3.5
    };
    reclassify(data, classifyLine, smallErrorBoundary, function(reclassifiedData) {
        calculateMSE(reclassifiedData, smallErrorBoundary, function(error) {
            dom.window.document.querySelector('#mse-small').innerHTML = 'MSE: ' + error;
            plotter.createGraph(dom.window.document.querySelector('#graph1'), {
                width: 910,
                height: 440
            }, {
                x: "petal_length",
                y: "petal_width"
            }, reclassifiedData, [{
                shape: 'line',
                data: smallErrorBoundary
            }], function(graphHTML) {
                var largeErrorBoundary = {
                    slope: -0.39,
                    intercept: 4.5
                };
                reclassify(data, classifyLine, largeErrorBoundary, function(reclassifiedData) {
                    calculateMSE(reclassifiedData, largeErrorBoundary, function(error) {
                        dom.window.document.querySelector('#mse-large').innerHTML = 'MSE: ' + error;
                        plotter.createGraph(dom.window.document.querySelector('#graph2'), {
                            width: 910,
                            height: 440
                        }, {
                            x: "petal_length",
                            y: "petal_width"
                        }, reclassifiedData, [{
                            shape: 'line',
                            data: largeErrorBoundary
                        }], function(graphHTML) {
                            // Part E
                            reclassify(data, classifyLine, smallErrorBoundary, function(reclassifiedData) {
                                calculateGradient(reclassifiedData, smallErrorBoundary, function(
                                    gradientBoundary) {
                                    dom.window.document.querySelector('#gradient').innerHTML =
                                        'Gradient Step:' +
                                        '<br>Before: ' +
                                        'y=' + smallErrorBoundary.slope + '*x+' +
                                        smallErrorBoundary.intercept +
                                        '<br>After: ' +
                                        'y=' + gradientBoundary.slope + '*x+' +
                                        gradientBoundary.intercept;

                                    gradientBoundary.strokeColor = "red";
                                    var plotLines = [{
                                        shape: 'line',
                                        data: smallErrorBoundary
                                    }, {
                                        shape: 'line',
                                        data: gradientBoundary
                                    }];
                                    plotter.createGraph(dom.window.document.querySelector(
                                        '#graph3'), {
                                        width: 910,
                                        height: 440
                                    }, {
                                        x: "petal_length",
                                        y: "petal_width"
                                    }, reclassifiedData, plotLines, function(
                                        graphHTML) {
                                        fs.writeFileSync(
                                            'question2.html',
                                            dom.window.document.querySelector(
                                                'body'
                                            ).innerHTML
                                        );
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

// Question 2 Part C
function calculateGradient(data, boundary, callback) {
    // calculating the step of the gradient
    var interceptGradient = 0;
    var slopeGradient = 0;
    for (var i in data) {
        interceptGradient += (boundary.slope * data[i].petal_length + boundary.intercept) - data[i].petal_width;
        slopeGradient += ((boundary.slope * data[i].petal_length + boundary.intercept) - data[i].petal_width) * data[i].petal_length;
    }

    // Question 2 Part D
    // Scalar Form
    var changeSlope = (slopeGradient * 2) / data.length;
    var changeIntercept = (interceptGradient * 2) / data.length;
    var delta = gradientStep / data.length;

    // Question 2 Part D
    // Vector Form
    var gradientBoundary = {
        slope: boundary.slope - changeSlope * delta,
        intercept: boundary.intercept - changeIntercept * delta
    };

    callback(gradientBoundary);
}

// Question 2 Part A
function calculateMSE(data, boundary, callback) {
    // computing the difference between the observed and expected squared
    var totalError = 0;
    for (var i in data) {
        var category = data[i].category;
        //if (isMisclassifed(category)) {
        var error = (boundary.slope * data[i].petal_length + boundary.intercept) - data[i].petal_width;
        totalError += Math.pow(error, 2);
        //}
    }

    // calculating the error
    error = totalError / data.length;
    callback(error);
}

function isMisclassifed(category) {
    return category.substr(category.indexOf('_') + 1, category.length) === 'misclassified';
}

function question1(data) {
    const dom = new JSDOM(
        `<html>
            <body>
                <div>Question 1 Part A<br>Petal Lengths vs Petal Widths for versicolor and virginica</div>
                <div id="graph1" style="width: fit-content; height: fit-content; padding: 5px; border: black; border-style: solid; border-width: thin;"></div>
                <div>Question 1 Part B<br>Petal Lengths vs Petal Widths for versicolor and virginica with user assigned decision boundary</div>
                <div id="graph2" style="width: fit-content; height: fit-content; padding: 5px; border: black; border-style: solid; border-width: thin;"></div>
                <div>Question 1 Part C<br>Classification Analysis of versicolor and virginica with user assigned decision boundary</div>
                <div id="graph3" style="width: fit-content; height: fit-content; padding: 5px; border: black; border-style: solid; border-width: thin;"></div>
            </body>
        </html>`
    );

    // PART A
    plotter.createGraph(dom.window.document.querySelector('#graph1'), {
        width: 910,
        height: 440
    }, {
        x: "petal_length",
        y: "petal_width"
    }, data, undefined, function(graphHTML) {
        // PART B
        var arbitraryClassificationBoundary = {
            slope: -0.38,
            intercept: 3.5
        }
        plotter.createGraph(dom.window.document.querySelector('#graph2'), {
            width: 910,
            height: 440
        }, {
            x: "petal_length",
            y: "petal_width"
        }, data, [{
            shape: 'line',
            data: arbitraryClassificationBoundary
        }], function(graphHTML) {
            // PART C
            reclassify(data, classifyLine, arbitraryClassificationBoundary, function(reclassifiedData) {
                plotter.createGraph(dom.window.document.querySelector('#graph3'), {
                    width: 910,
                    height: 440
                }, {
                    x: "petal_length",
                    y: "petal_width"
                }, reclassifiedData, [{
                    shape: 'line',
                    data: arbitraryClassificationBoundary
                }], function(graphHTML) {
                    fs.writeFileSync('question1.html', dom.window.document.querySelector('body').innerHTML);
                });
            });
        });
    });
}

function classifyCircle(datum, circlesData) {
    return setCategory(
        datum.species,
        circlesData[datum.species].radius > Math.sqrt(Math.pow(datum.petal_length - circlesData[datum.species].center.x, 2) + Math.pow(datum.petal_width -
            circlesData[datum.species].center.y, 2)));
}

function classifyLine(datum, boundary) {
    if (datum.species === 'virginica') {
        return setCategory(
            datum.species,
            datum.petal_width > boundary.slope * datum.petal_length + boundary.intercept);
    } else if (datum.species === 'versicolor') {
        return setCategory(
            datum.species,
            datum.petal_width < boundary.slope * datum.petal_length + boundary.intercept);
    } else {
        console.log("UNEXPECTED DATA");
        return "UNEXPECTED_DATA";
    }
}

function setCategory(species, insideBoundary) {
    if (insideBoundary) {
        return species + '_identified';
    } else {
        return species + '_misclassified';
    }
}

function reclassify(data, classificationFunction, boundary, callback) {
    var reclassifiedData = [];
    for (var i in data) {
        reclassifiedData.push({
            petal_width: data[i].petal_width,
            petal_length: data[i].petal_length,
            category: classificationFunction(data[i], boundary)
        });
    }

    callback(reclassifiedData);
}
