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
var blacklistSpecies = ['setosa'];

// Convert CSV file to array of json objects
csvReader.on('json', (plantData) => {
    // filter out sepal here
    var keys = Object.keys(plantData);
    if (blacklistSpecies.indexOf(plantData.species) === -1) {
        var jsonToAdd = {};
        for (var i in keys) {
            var key = keys[i];
            if (blacklistColumn.indexOf(key) === -1) {
                if (key === 'species') {
                    jsonToAdd[key] = plantData[key];
                } else {
                    jsonToAdd[key] = parseFloat(plantData[key]);
                }
            }
        }
        irisData.push(jsonToAdd);
    }
});

// After reading in entire file, execute program
csvReader.on('done', (error) => {
    if (error) {
        console.log(error);
    }
    question2();
});

function question2() {
    const dom = new JSDOM(
        `<html>
            <body>
                <div>Question 2 Part B<br>Small MSE Plot of Classification for versicolor and virginica</div>
                <div id=mse-small></div>
                <div id="graph1" style="width: fit-content; height: fit-content; padding: 5px; border: black; border-style: solid; border-width: thin;"></div>
                <div>Question 2 Part B<br>Large MSE Plot of Classification for versicolor and virginica</div>
                <div id=mse-large></div>
                <div id="graph2" style="width: fit-content; height: fit-content; padding: 5px; border: black; border-style: solid; border-width: thin;"></div>
                <div>Question 1 Part C<br>Classification Analysis of versicolor and virginica with user assigned decision boundary</div>
                <div id="graph3" style="width: fit-content; height: fit-content; padding: 5px; border: black; border-style: solid; border-width: thin;"></div>
            </body>
        </html>`
    );

    // PART B
    var smallErrorBoundary = {
        slope: -0.371,
        intercept: 3.4
    };
    reclassify(irisData, smallErrorBoundary, function(reclassifiedData) {
        calculateMSE(reclassifiedData, smallErrorBoundary, function(error) {
            dom.window.document.querySelector('#mse-small').innerHTML = 'Mean squared error: ' + error;
            plotter.createGraph(dom.window.document.querySelector('#graph1'), {
                width: 910,
                height: 440
            }, {
                x: "petal_length",
                y: "petal_width"
            }, reclassifiedData, smallErrorBoundary, function(graphHTML) {
                var largeErrorBoundary = {
                    slope: -0.371,
                    intercept: 4.5
                };
                reclassify(irisData, largeErrorBoundary, function(reclassifiedData) {
                    calculateMSE(reclassifiedData, largeErrorBoundary, function(error) {
                        dom.window.document.querySelector('#mse-large').innerHTML = 'Mean squared error: ' + error;
                        plotter.createGraph(dom.window.document.querySelector('#graph2'), {
                            width: 910,
                            height: 440
                        }, {
                            x: "petal_length",
                            y: "petal_width"
                        }, reclassifiedData, largeErrorBoundary, function(graphHTML) {
                            fs.writeFileSync('question2.html', dom.window.document.querySelector('body').innerHTML);
                        });
                    });
                });
            });
        });
    });
}

// Question 2 Part A
function calculateMSE(data, boundary, callback) {
    // computing the difference between the observed and expected squared
    var error_sum = 0;
    for (var i in data) {
        var difference = (boundary.slope * data[i].petal_length + boundary.intercept) - data[i].petal_width;
        error_sum += Math.pow(difference, 2);
    }

    // calculating the error
    error = error_sum / data.length;
    callback(error);
}

function question1() {
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
    }, irisData, undefined, function(graphHTML) {
        // PART B
        var arbitraryClassificationBoundary = {
            slope: -0.371,
            intercept: 3.4
        }
        plotter.createGraph(dom.window.document.querySelector('#graph2'), {
            width: 910,
            height: 440
        }, {
            x: "petal_length",
            y: "petal_width"
        }, irisData, arbitraryClassificationBoundary, function(graphHTML) {
            // PART C
            reclassify(irisData, arbitraryClassificationBoundary, function(reclassifiedData) {
                plotter.createGraph(dom.window.document.querySelector('#graph3'), {
                    width: 910,
                    height: 440
                }, {
                    x: "petal_length",
                    y: "petal_width"
                }, reclassifiedData, arbitraryClassificationBoundary, function(graphHTML) {
                    fs.writeFileSync('question1.html', dom.window.document.querySelector('body').innerHTML);
                });
            });
        });
    });
}

function reclassify(data, boundary, callback) {
    var reclassifiedData = [];
    for (var i in data) {
        reclassifiedData.push({
            petal_width: data[i].petal_width,
            petal_length: data[i].petal_length,
            category: selectCategory(
                data[i].species,
                data[i].petal_width > boundary.slope * data[i].petal_length + boundary.intercept,
                'virginica',
                'versicolor')
        });
    }
    callback(reclassifiedData);
}

function selectCategory(species, belowBoundary, option1, option2) {
    return species === option1 ? (!belowBoundary ? option1 + '_misclassified' : option1 + '_identified') : (belowBoundary ? option2 + '_misclassified' :
        option2 + '_identified');
}
