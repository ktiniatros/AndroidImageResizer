var fs = require('fs');
var path = require('path');
var imagemagick = require('imagemagick');
var readline = require('readline');

//CHANGE THIS TO YOUR Android Studio path
var androidStudioPath = "/Users/giorgos/Documents/androidstudio";
var projectPath;
var mipmapPath = "/app/src/main/res/mipmap-";

var sizeNames = [/*'xxxhdpi', */'xxhdpi', 'xhdpi', 'hdpi', 'mdpi'/*, 'ldpi'*/];
var multipliers = [/*4.0, */3.0, 2.0, 1.5, 1/*, 0.75*/];

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

var imageFiles = [];

var currentImageSize = "xxhdpi";
var smallestImageSize;

function askUserForCurrentSize() {

    // currentImageSize = 'xxhdpi';
    // askUserForSmallestSize();
    // return;
    rl.question("Enter your project folder name: ",
        function (inputString) {
            projectPath = path.join(androidStudioPath, inputString);
            if (!fs.existsSync(projectPath)) {
                console.log(projectPath + " does not exist!");
                askUserForCurrentSize();
            } else {
                androidStudioPath = projectPath;
                askUserForSmallestSize();
            }
        });
}

function askUserForSmallestSize() {
    smallestImageSize = 'mdpi';
    makeDirectories();
    return;
    rl.question("Enter smallest desired image size [xxxhdpi, xxhdpi, xhdpi, hdpi, mdpi, ldpi]: ",
        function (inputString) {
            smallestImageSize = inputString;
            makeDirectories();
            rl.close();
        });
}

function makeDirectories() {
    // var startIndex = 0;//sizeNames.indexOf(currentImageSize);
    // var endIndex = sizeNames.length - 1;//sizeNames.indexOf(smallestImageSize);
    // for (var i = startIndex; i <= endIndex; i++) {
    //     if (!fs.existsSync('./' + sizeNames[i])) {
    //         console.log("Making directory: " + sizeNames[i]);
    //         fs.mkdirSync(sizeNames[i]);
    //     }
    // }
    populateImageFiles();
}

function populateImageFiles() {
    console.log("Finding image files...");
    var currentDirectory = process.cwd();
    var allFiles = fs.readdirSync(path.join(currentDirectory, "assets"));
    for (var i = 0; i < allFiles.length; i++) {
        var extname = path.extname(allFiles[i]);
        var f = path.join("assets", allFiles[i]);
        console.log("extname", extname);
        if (extname == '.jpg' || extname == '.jpeg' || extname == '.png') {
            try {
                fs.renameSync(f, f.replace('@3x', ''));
            } catch (e) {
                console.log("error removing @3x", e);
            }
            imageFiles.push(f.replace('@3x', ''));
        }
    }
    console.log("imageFiles", imageFiles);
    console.log("allFiles", allFiles, i);
    if (imageFiles.length > 0) {
        console.log("Resizing all images...");
        resize(0, 0);
    } else {
        console.log("no image files found (.jpg, .jpeg, .png)");
        process.exit(); return;
    }
}

function resize(fileIndex, sizeIndex) {
    var filePath = getPath(fileIndex, sizeIndex);
    console.log("about to convert: " + imageFiles[fileIndex], fs.existsSync(imageFiles[fileIndex]));
    imagemagick.convert(
        [imageFiles[fileIndex], '-resize', getPercentString(sizeNames[sizeIndex]),
            filePath],
        function (e) {
            if (e) {
                console.log("error on resize for " + filePath, e);
            }
            if (sizeIndex + 1 < sizeNames.length) {
                resize(fileIndex, sizeIndex + 1);
            } else if ((fileIndex + 1) < imageFiles.length) {
                resize(fileIndex + 1, 0);
            } else {
				for (var index = 0; index < imageFiles.length; index++) {
					var element = imageFiles[index];
					fs.unlinkSync(element);
				}
                console.log("Done.");
                process.exit();
            }
        });
}

function getPath(fileIndex, sizeIndex) {
    var finalPath = androidStudioPath + mipmapPath + sizeNames[sizeIndex] + imageFiles[fileIndex].replace("assets", "");
    console.log("file to: " + finalPath);
    return finalPath;
}

function getPercentString(sizeName) {
    return getPercent(sizeName) * 100 + '%';
}

function getPercent(sizeName) {
    return multipliers[sizeNames.indexOf(sizeName)] / multipliers[sizeNames.indexOf(currentImageSize)];
}

askUserForCurrentSize();
