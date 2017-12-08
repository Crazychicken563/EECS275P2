const fs = require('fs');
const csv = require('csvtojson');
const plotter = require('./js/plotD3');
const jsdom = require("jsdom");

const {
    JSDOM
} = jsdom;

const dom = new JSDOM(
    `<html>
        <body>
            <div id="test1" style="width: fit-content; height: fit-content; padding: 5px; border: black; border-style: solid; border-width: thin;"></div>
            <div id="test2" style="width: fit-content; height: fit-content; padding: 5px; border: black; border-style: solid; border-width: thin;"></div>
        </body>
    </html>`
);

var irisData = [];
var csvReader = csv().fromFile('irisdata.csv');
var blacklistColumn = ['sepal_length', 'sepal_width'];
var blacklistSpecies = ['setosa'];

// Convert CSV file to array of json objects
csvReader.on('json', (jsonObj) => {
    // filter out sepal here
    var keys = Object.keys(jsonObj);
    if (blacklistSpecies.indexOf(jsonObj.species) === -1) {
        var jsonToAdd = {};
        for (var i in keys) {
            var key = keys[i];
            if (blacklistColumn.indexOf(key) === -1) {
                jsonToAdd[key] = jsonObj[key];
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
    // console.log(irisData);

    plotter.createGraph(dom.window.document.querySelector('#test1'), {
        width: 910,
        height: 440
    }, {
        x: "petal_length",
        y: "petal_width"
    }, irisData, undefined, function(graphHTML) {
        //dom.window.document.querySelector('#test1').innerHTML = graphHTML;
        plotter.createGraph(dom.window.document.querySelector('#test2'), {
            width: 910,
            height: 440
        }, {
            x: "petal_length",
            y: "petal_width"
        }, irisData, {
            slope: -0.371,
            intercept: 3.4
        }, function(graphHTML) {
            //dom.window.document.querySelector('#test2').innerHTML = graphHTML;
            fs.writeFileSync('out.html', dom.window.document.querySelector('body').innerHTML);
        });
    });
});
