function Ball(x, y, radius, e, mass, color, image, useImage){
    this.position = {x: x, y: y}; // m
    this.velocity = {x: 0, y: 0}; // m/s
    this.e = -e; // Coefficient of restitution, has no units
    this.mass = mass; // kg
    this.radius = radius; // m
    this.color = color;
    this.area = (Math.PI * radius * radius) / 10000; // m^2
    this.noteIndex = 0;
    this.image = image; // store the image
    this.useImage = useImage;
}

var canvas = null;
var ballSpawnButton = null;
var ctx = null;
var fps = 1/60; // 60 FPS
var dt = fps * 1000; // ms
var timer = false;
var mouse = {x: 0, y: 0, isDown: false};
var ag = 9.81; // m/s^2 acceleration due to gravity on earth
var width = 0;
var height = 0;
var balls = [];
var circleCenter = {};
var circleRadius = 0;

// using web audio api
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
// extra notes i choose to omit
// 196, 220, 246.94, 261.63, 293.66, 329.63, 349.23, 
const musicalScale = [392.00, 440.00, 493.88, 523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77, 1046.5];

// Global variable to keep track of whether to use images for balls or not
var useImagesForBalls = false;
// preload all images and store them in an array for easy access
var images = [];
function preloadImages() {
    var imageNames = ['aiden', 'alec', 'chris', 'nathan'];
    imageNames.forEach(function(name) {
        var img = new Image();
        img.onload = function() {
            images.push(img);
        };
        img.src = 'images/' + name + '.png';
    });
}
preloadImages();

function resetGame() {
    // Clear all balls from the array
    balls = [];

    useImagesForBalls = false; 

    // Redraw the game area
    drawCircle();
}

function playNote(noteIndex) {
    const oscillator = audioCtx.createOscillator();
    oscillator.frequency.setValueAtTime(musicalScale[noteIndex], audioCtx.currentTime);
    oscillator.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);
}

function drawCircle() {
    ctx.clearRect(0, 0, width, height); // Clears the canvas
    ctx.beginPath();
    ctx.strokeStyle = 'white';
    ctx.arc(circleCenter.x, circleCenter.y, circleRadius, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.closePath();
}


var setup = function(){
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    width = canvas.width;
    height = canvas.height;
    circleCenter = {x: width / 2, y: height / 2};
    circleRadius = Math.min(width, height) / 2 - 10; // Subtract 10 to account for the ball radius
	document.getElementById('boundarySlider').addEventListener('input', function(e) {
		circleRadius = e.target.value;
		drawCircle(); // You may need to create this function or integrate its functionality into your code
	});

    ag = 0;

    document.getElementById('gravitySlider').addEventListener('input', function(e) {
        ag = parseFloat(e.target.value) / 10;
    });

    document.getElementById('ballSizeSlider').addEventListener('input', function(e) {
        // Update the radius of all existing balls
        var newSize = parseFloat(e.target.value);
        for (var i = 0; i < balls.length; i++) {
            balls[i].radius = newSize;
            balls[i].area = (Math.PI * newSize * newSize) / 10000; // Update the area accordingly
        }
    });

    document.getElementById('resetButton').addEventListener('click', resetGame);

    canvas.onmousedown = mouseDown;
    canvas.onmouseup = mouseUp;
    canvas.onmousemove = getMousePosition;
    timer = setInterval(loop, dt);
}

var mouseDown = function(e){
    if(e.which == 1){
        getMousePosition(e);
        mouse.isDown = true;

        // Update useImagesForBalls here before creating a new ball
        useImagesForBalls = document.getElementById('useImageCheckbox').checked;

        var imageToUse = useImagesForBalls ? images[Math.floor(Math.random() * images.length)] : null;

        var max = 255;
        var min = 20;
        var r = 75 + Math.floor(Math.random() * (max - min) - min);
        var g = 0 + Math.floor(Math.random() * (0 - 0) - 0);
        var b = 75 + Math.floor(Math.random() * (max - min) - min);
        var ballSize = parseFloat(document.getElementById('ballSizeSlider').value);

        // Pass the image and the useImagesForBalls flag to the Ball constructor
        balls.push(new Ball(mouse.x, mouse.y, ballSize, 0.7, 10, "rgb(" + r + "," + g + "," + b + ")", imageToUse, useImagesForBalls));
    }
}


var mouseUp = function(e){
    if(e.which == 1){
        mouse.isDown = false;
        balls[balls.length - 1].velocity.x = (balls[balls.length - 1].position.x - mouse.x) / 10;
        balls[balls.length - 1].velocity.y = (balls[balls.length - 1].position.y - mouse.y) / 10;
    }
}

function getMousePosition(e){
    mouse.x = e.pageX - canvas.offsetLeft;
    mouse.y = e.pageY - canvas.offsetTop;
}

function loop() {
    ctx.clearRect(0, 0, width, height);

    // Draw the circle boundary
    ctx.beginPath();
    ctx.strokeStyle = 'white';
    ctx.arc(circleCenter.x, circleCenter.y, circleRadius, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.closePath();

    // Loop over the balls and draw each one
    for (var i = 0; i < balls.length; i++) {
        var ball = balls[i];
        
        // Decide whether to draw the ball with an image or a color
        if (ball.image && ball.useImage) { // Check ball-specific flag
            ctx.drawImage(ball.image, ball.position.x - ball.radius, ball.position.y - ball.radius, ball.radius*2, ball.radius*2);
        } else {
            ctx.beginPath();
            ctx.fillStyle = ball.color;
            ctx.arc(ball.position.x, ball.position.y, ball.radius, 0, 2 * Math.PI, true);
            ctx.fill();
            ctx.closePath();
        }
        
        // Ball collision with other balls
        if (document.getElementById('collideCheckbox').checked) {
            for (var j = i + 1; j < balls.length; j++) {
                collisionBalls(ball, balls[j]);
            }
        }

        // Ball collision with the circle boundary
        collisionCircle(ball);

        // Update ball's position and velocity
        ball.velocity.y += ag * fps * 100; // Gravity effect
        ball.position.x += ball.velocity.x * fps * 100; // Horizontal movement
        ball.position.y += ball.velocity.y * fps * 100; // Vertical movement
    }
}




function collisionBalls(ball1, ball2) {
    var dx = ball2.position.x - ball1.position.x;
    var dy = ball2.position.y - ball1.position.y;
    var distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= ball1.radius + ball2.radius) {
        // Calculate collision normal
        var nx = (ball2.position.x - ball1.position.x) / distance;
        var ny = (ball2.position.y - ball1.position.y) / distance;

        // Calculate relative velocity
        var relativeVelocityX = ball2.velocity.x - ball1.velocity.x;
        var relativeVelocityY = ball2.velocity.y - ball1.velocity.y;

        // Calculate dot product of relative velocity and normal
        var dotProduct = relativeVelocityX * nx + relativeVelocityY * ny;

        // Apply impulse along the normal
        var impulseX = nx * dotProduct;
        var impulseY = ny * dotProduct;

        // Update velocities
        ball1.velocity.x += impulseX;
        ball1.velocity.y += impulseY;
        ball2.velocity.x -= impulseX;
        ball2.velocity.y -= impulseY;
    }
}



function collisionCircle(ball){
    var dx = ball.position.x - circleCenter.x;
    var dy = ball.position.y - circleCenter.y;
    var distance = Math.sqrt(dx * dx + dy * dy);

    if(distance + ball.radius >= circleRadius){
        // Reflect the velocity vector across the normal to the circle at the point of collision
        var normalX = dx / distance;
        var normalY = dy / distance;
        var dot = (ball.velocity.x * normalX + ball.velocity.y * normalY) * 2;

        ball.velocity.x -= dot * normalX;
        ball.velocity.y -= dot * normalY;

        // Move the ball outside the circle boundary to prevent sticking
        var overlap = (ball.radius + distance) - circleRadius;
        ball.position.x -= overlap * normalX;
        ball.position.y -= overlap * normalY;

        // Check if the "Change Color" checkbox is checked
        var max = 255;
        var min = 20;
        var r = 75 + Math.floor(Math.random() * (max - min) - min);
        var g = 0 + Math.floor(Math.random() * (0 - 0) - 0);
        var b = 75 + Math.floor(Math.random() * (max - min) - min);
        ball.color = "rgb(" + r + "," + g + "," + b + ")";
        
        // Check if the play note checkbox is checked and play the note
        if (document.getElementById('playNoteCheckbox').checked) {
            playNote(ball.noteIndex);
            ball.noteIndex = (ball.noteIndex + 1) % musicalScale.length;
        }
    }
}


// Call the setup function to initialize the game
setup();
