function start () {
    var context = window.ac,
        file = context.file,
        fileReader = new FileReader();
    fileReader.onload = function() {
        var fileResult = event.target.result;
        if (context.aContext !== null || context.aContext !== undefined) {
            context.aContext.decodeAudioData(fileResult, function(buffer) {
                visualize(context.aContext, buffer);
            }, function(e) {
                alert(e);
            });
        }
    };
    fileReader.onerror = function(e) {
        alert(e);
    };
    fileReader.readAsArrayBuffer(file);
}
function visualize (context, buffer) {
    var audioBufferSouceNode = context.createBufferSource(),
        analyser = context.createAnalyser();
    audioBufferSouceNode.connect(analyser);
    analyser.connect(context.destination);
    audioBufferSouceNode.buffer = buffer;
    if (!audioBufferSouceNode.start) {
        audioBufferSouceNode.start = audioBufferSouceNode.noteOn;
        audioBufferSouceNode.stop = audioBufferSouceNode.noteOff ;
    }
    if (window.ac.animationId !== undefined) {
        cancelAnimationFrame(window.ac.animationId);
    }
    if (window.ac.source !== undefined) {
        window.ac.source.stop(0);
    }
    audioBufferSouceNode.start(0);
    window.ac.status = 1;
    window.ac.source = audioBufferSouceNode;
    audioBufferSouceNode.onended = function() {
        stop();
    };
    window.ac.info.innerText = 'Playing ' + ac.fileName;
    draw(analyser);
}
function draw (analyser) {
    var w = window.ac.canvas.width,
        h = window.ac.canvas.height - 2,
        meterWidth = 10,
        gap = 2,
        capHeight = 2,
        capStyle = '#fff',
        meterNum = 800 / (10 + 2),
        capYPositionArray = [],
        ctx = window.ac.canvas.getContext('2d'),
        gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(1, '#0f0');
    gradient.addColorStop(0.5, '#ff0');
    gradient.addColorStop(0, '#f00');
    var drawMeter = function() {
        var array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        if (window.ac.status === 0) {
            for (var i = array.length - 1; i >= 0; i--) {
                array[i] = 0;
            }
            window.ac.allCapsReachBottom = true;
            for (var i = capYPositionArray.length - 1; i >= 0; i--) {
                window.ac.allCapsReachBottom = window.ac.allCapsReachBottom && (capYPositionArray[i] === 0);
            }
            if (window.ac.allCapsReachBottom) {
                cancelAnimationFrame(window.ac.animationId);
                return;
            }
        }
        var step = Math.round(array.length / meterNum);
        ctx.clearRect(0, 0, w, h);
        for (var i = 0; i < meterNum; i++) {
            var value = array[i * step];
            if (capYPositionArray.length < Math.round(meterNum)) {
                capYPositionArray.push(value);
            }
            ctx.fillStyle = capStyle;
            if (value < capYPositionArray[i]) {
                ctx.fillRect(i * 12, h - (--capYPositionArray[i]), meterWidth, capHeight);
            } else {
                ctx.fillRect(i * 12, h - value, meterWidth, capHeight);
                capYPositionArray[i] = value;
            }
            ctx.fillStyle = gradient;
            ctx.fillRect(i * 12, h - value + capHeight, meterWidth, h);
        }
        window.ac.animationId = requestAnimationFrame(drawMeter);
    };
    window.ac.animationId = requestAnimationFrame(drawMeter);
}
function stop () {
    if (window.ac.forceStop) {
        window.ac.forceStop = false;
        window.ac.status = 1;
        return;
    }
    window.ac.status = 0;
    window.ac.info.innerHTML = 'Select one more mp3';
}
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.AudioContext = window[vendors[x] + 'AudioContext'];
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame']
            || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }
    window.ac = {};
    window.ac.aContext = new AudioContext();
    window.ac.filesButton = document.getElementsByClassName('player__files-button')[0];
    window.ac.info = document.getElementsByClassName('player__info')[0];
    window.ac.canvas = document.getElementsByClassName('player__visualizer-canvas')[0];

    window.ac.filesButton.onchange = function () {
        if (window.ac.aContext === null) {
            return;
        }
        if (window.ac.filesButton.files.length !== 0) {
            window.ac.file = window.ac.filesButton.files[0];
            window.ac.fileName = window.ac.file.name;
            if (window.ac.status === 1) {
                window.ac.forceStop = true;
            }
            start();
        }
    };
    window.ac.canvas.addEventListener("dragenter", function() {
        document.getElementsByClassName('player__files')[0].style.opacity = 1;
    });
    window.ac.canvas.addEventListener("dragover", function(event) {
        event.stopPropagation();
        event.preventDefault();
        //set the drop mode
        event.dataTransfer.dropEffect = 'copy';
    });
    window.ac.canvas.addEventListener("dragleave", function() {
        document.getElementsByClassName('player__files')[0].style.opacity = 0.2;
    });
    window.ac.canvas.addEventListener("drop", function(event) {
        event.stopPropagation();
        event.preventDefault();
        if (window.ac.aContext===null) {return}
        document.getElementsByClassName('player__files')[0].style.opacity = 1;
        window.ac.file = event.dataTransfer.files[0];
        if (window.ac.status === 1) {
            document.getElementsByClassName('player__files')[0].style.opacity = 1;
            window.ac.forceStop = true;
        }
        window.ac.fileName = window.ac.file.name;
        start();
    });

