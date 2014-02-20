var DEBUG = false;
var SPEED = 180;
var GRAVITY = 18;
var FLAP = 420;
var SPAWN_RATE = 1 / 1.2;
var OPENING = 144;

// Load in Clay.io API
var Clay = Clay || {};
Clay.gameKey = "dtmb";
Clay.readyFunctions = [];
Clay.ready = function( fn ) {
    Clay.readyFunctions.push( fn );
    // Load game
    WebFontConfig = {
        google: { families: [ 'Purple+Purse::latin' ] },
        active: main
    };
    (function() {
        var wf = document.createElement('script');
        wf.src = ('https:' == document.location.protocol ? 'https' : 'http') +
          '://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
        wf.type = 'text/javascript';
        wf.async = 'true';
        var s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(wf, s);
    })(); 
};
( function() {
    var clay = document.createElement("script"); clay.async = true;
    clay.src = "http://cdn.clay.io/api.js"; 
    var tag = document.getElementsByTagName("script")[0]; tag.parentNode.insertBefore(clay, tag);
} )();

function main() {

var state = {
    preload: preload,
    create: create,
    update: update,
    render: render
};

var parent = document.querySelector('#screen');

var game = new Phaser.Game(
    320,
    568,
    Phaser.CANVAS,
    parent,
    state
);


function clayLoaded() {
    // Set up the menu items
    var options = {
        items: [
            { title: 'View High Scores', handler: showScores }
        ]
    };
    Clay.UI.Menu.init(options);
    leaderboard = new Clay.Leaderboard({ id: 2797 });
}
Clay.ready(clayLoaded);

function showScores() {
    if (leaderboard) {
        leaderboard.show({ best: true });
    }
}

function kikThis() {
    Clay.Kik.post( { message: 'I just scored ' + score + ' in Flirty Bird! Think you can beat my score?', title: 'Flirty Bird!' } );
}

function postScore() {
    if( postingScore ) // skip if it's already trying to post the score...
        return;
    postScoreText.setText('...');
    postingScore = true;
    
    var post = function() {
    	if(!leaderboard) return;
        leaderboard.post({ score: score }, function() {
            showScores();
            postScoreText.setText('Post Score!');
            postingScore = false;
        });
    }
    
    if (Clay.Environment.platform == 'kik') {
	    Clay.Kik.connect({}, function(response) {
	        if (response.success) {
	            Clay.Player.onUserReady( post );
	        } else {
                postScoreText.setText('Post Score!');
	            postingScore = false;
	        }
	    });
    } else {
    	post();
    }
    	
}

function preload() {
    var assets = {
        spritesheet: {
            bird: ['assets/bird.png', 24, 24],
            clouds: ['assets/clouds.png', 640, 320]
        },
        image: {
            tower: ['assets/tower.png'],
            floor: ['assets/floor.png']
        },
        audio: {
            flap: ['assets/flap.wav'],
            score: ['assets/score.wav'],
            hurt: ['assets/hurt.wav']
        }
    };
    Object.keys(assets).forEach(function(type) {
        Object.keys(assets[type]).forEach(function(id) {
            game.load[type].apply(game.load, [id].concat(assets[type][id]));
        });
    });
}

var gameStarted,
    gameOver,
    score,
    bg,
    clouds,
    towers,
    invs,
    bird,
    floor,
    scoreText,
    instText,
    highScoreText,
    kikThisText,
    kikThisClickArea,
    postScoreClickArea,
    postingScore,
    leaderboard,
    flapSnd,
    scoreSnd,
    hurtSnd,
    towersTimer,
    cloudsTimer;

function create() {
    game.stage.scaleMode = Phaser.StageScaleMode.SHOW_ALL;
    game.stage.scale.setScreenSize(true);
    // Draw bg
    bg = game.add.graphics(0, 0);
    bg.beginFill(0xCCEEFF, 1);
    bg.drawRect(0, 0, game.world.width, game.world.height);
    bg.endFill();
    // Add clouds group
    clouds = game.add.group();
    // Add towers
    towers = game.add.group();
    // Add invisible thingies
    invs = game.add.group();
    // Add bird
    bird = game.add.sprite(0, 0, 'bird');
    bird.anchor.setTo(0.5, 0.5);
    bird.animations.add('fly', [0, 1, 2, 3], 10, true);
    bird.inputEnabled = true;
    bird.body.collideWorldBounds = true;
    bird.body.gravity.y = GRAVITY;
    // Add floor
    floor = game.add.tileSprite(0, game.world.height - 32, game.world.width, 32, 'floor');
    floor.tileScale.setTo(0.5, 0.5);
    // Add score text
    scoreText = game.add.text(
        game.world.width / 2,
        game.world.height / 5,
        "",
        {
            font: '32px "Purple Purse"',
            fill: '#fff',
            stroke: '#9cf',
            strokeThickness: 4,
            align: 'center'
        }
    );
    scoreText.anchor.setTo(0.5, 0.5);
    // Add instructions text
    instText = game.add.text(
        game.world.width / 2,
        game.world.height - game.world.height / 4,
        "",
        {
            font: '20px "Purple Purse"',
            fill: '#fff',
            stroke: '#9cf',
            strokeThickness: 4,
            align: 'center'
        }
    );
    instText.anchor.setTo(0.5, 0.5);
    // Add game over text
    highScoreText = game.add.text(
        game.world.width / 2,
        game.world.height / 3,
        "",
        {
            font: '30px "Purple Purse"',
            fill: '#fff',
            stroke: '#9cf',
            strokeThickness: 4,
            align: 'center'
        }
    );
    highScoreText.anchor.setTo(0.5, 0.5);
    // Add kik this text (hidden until game is over)
    postScoreText = game.add.text(
        game.world.width / (Clay.Environment.platform == 'kik' ?  4 : 2),
        game.world.height / 2,
        "",
        {
            font: '20px "Purple Purse"',
            fill: '#fff',
            stroke: '#9cf',
            strokeThickness: 4,
            align: 'center'
        }
    );
    postScoreText.setText('Post Score!');
    postScoreText.anchor.setTo(0.5, 0.5);
    postScoreText.renderable = false;
    // So we can have clickable text... we check if the mousedown/touch event is within this rectangle inside flap()
    postScoreClickArea = new Phaser.Rectangle(
        postScoreText.x - postScoreText.width / 2,
        postScoreText.y - postScoreText.height / 2,
        postScoreText.width,
        postScoreText.height
    );
    // Add kik this text (hidden until game is over)
    kikThisText = game.add.text(
        3 * game.world.width / 4,
        game.world.height / 2,
        "",
        {
            font: '20px "Purple Purse"',
            fill: '#fff',
            stroke: '#9cf',
            strokeThickness: 4,
            align: 'center'
        }
    );
    kikThisText.setText("Kik This!");
    kikThisText.anchor.setTo(0.5, 0.5);
    kikThisText.renderable = false;
    // So we can have clickable text... we check if the mousedown/touch event is within this rectangle inside flap()
    kikThisClickArea = new Phaser.Rectangle(
        kikThisText.x - kikThisText.width / 2,
        kikThisText.y - kikThisText.height / 2,
        kikThisText.width,
        kikThisText.height
    );
    // Add sounds
    flapSnd = game.add.audio('flap');
    scoreSnd = game.add.audio('score');
    hurtSnd = game.add.audio('hurt');
    // Add controls
    game.input.onDown.add(flap);
    // Start clouds timer
    cloudsTimer = new Phaser.Timer(game);
    cloudsTimer.onEvent.add(spawnCloud);
    cloudsTimer.start();
    cloudsTimer.add(Math.random());
    // RESET!
    reset();
}

function reset() {
    gameStarted = false;
    gameOver = false;
    score = 0;
    scoreText.setText("Flirty Bird");
    instText.setText("Touch to start");
    highScoreText.renderable = false;
    postScoreText.renderable = false;
    kikThisText.renderable = false;
    bird.body.allowGravity = false;
    bird.angle = 0;
    bird.reset(game.world.width / 4, game.world.height / 2);
    bird.scale.setTo(2, 2);
    bird.animations.play('fly');
    towers.removeAll();
    invs.removeAll();
}

function start() {
    bird.body.allowGravity = true;
    // SPAWN FINGERS!
    towersTimer = new Phaser.Timer(game);
    towersTimer.onEvent.add(spawnTowers);
    towersTimer.start();
    towersTimer.add(2);
    // Show score
    scoreText.setText(score);
    instText.renderable = false;
    // START!
    gameStarted = true;
}

function flap() {
    if (!gameStarted) {
        start();
    }
    if (!gameOver) {
        bird.body.velocity.y = -FLAP;
        flapSnd.play();
    } else {
        // Check if the touch event is within our text for posting a score
        if (postScoreClickArea && Phaser.Rectangle.contains(postScoreClickArea, game.input.x, game.input.y)) {
            postScore();
        }
        // Check if the touch event is within our text for sending a kik message
        else if (Clay.Environment.platform == 'kik' && kikThisClickArea && Phaser.Rectangle.contains(kikThisClickArea, game.input.x, game.input.y)) {
            kikThis();
        }
    }
}

function spawnCloud() {
    cloudsTimer.stop();

    var cloudY = Math.random() * game.height * 2 / 3;
    var cloud = clouds.create(
        game.width,
        cloudY,
        'clouds',
        Math.floor(4 * Math.random())
    );
    var cloudScale = 0.5 + 0.2 * Math.random();
    cloud.scale.setTo(cloudScale, cloudScale);
    cloud.body.allowGravity = false;
    cloud.body.velocity.x = -SPEED / (2  * cloudScale / 0.7);
    cloud.alpha = 0.9 * cloudScale / 0.7;
    cloud.anchor.y = 0.5;

    cloudsTimer.start();
    cloudsTimer.add(1 + 2 * Math.random());
}

function o() {
    return OPENING + 60 * ((score > 50 ? 50 : 50 - score) / 50);
}

function spawnTower(towerY, flipped) {
    var tower = towers.create(
        game.width,
        towerY + (flipped ? -o() : o()) / 2,
        'tower'
    );
    tower.body.allowGravity = false;

    // Flip tower! *GASP*
    tower.scale.y = flipped ? -1 : 1;
    tower.body.offset.y = flipped ? -tower.body.height * 2 : 0;

    // Move to the left
    tower.body.velocity.x = -SPEED;

    return tower;
}

function spawnTowers() {
    towersTimer.stop();

    var towerY = ((game.height - 16 - o() / 2) / 2) + (Math.random() > 0.5 ? -1 : 1) * Math.random() * game.height / 6;
    // Bottom tower
    var botTower = spawnTower(towerY);
    // Top tower (flipped)
    var topTower = spawnTower(towerY, true);

    // Add invisible thingy
    var inv = invs.create(topTower.x + topTower.width, 0);
    inv.width = 2;
    inv.height = game.world.height;
    inv.body.allowGravity = false;
    inv.body.velocity.x = -SPEED;

    towersTimer.start();
    towersTimer.add(1 / SPAWN_RATE);
}

function addScore(_, inv) {
    invs.remove(inv);
    score += 1;
    scoreText.setText(score);
    scoreSnd.play();
}

function setGameOver() {
    gameOver = true;
    instText.setText("Touch to try again");
    instText.renderable = true;
    var hiscore = window.localStorage.getItem('hiscore');
    hiscore = hiscore ? hiscore : score;
    hiscore = score > parseInt(hiscore, 10) ? score : hiscore;
    window.localStorage.setItem('hiscore', hiscore);
    highScoreText.setText("High Score\n" + hiscore);
    highScoreText.renderable = true;
    
    postScoreText.renderable = true;
    if (Clay.Environment.platform == 'kik') {
        kikThisText.renderable = true;
    }
    
    // Stop all towers
    towers.forEachAlive(function(tower) {
        tower.body.velocity.x = 0;
    });
    invs.forEach(function(inv) {
        inv.body.velocity.x = 0;
    });
    // Stop spawning towers
    towersTimer.stop();
    // Make bird reset the game
    bird.events.onInputDown.addOnce(reset);
    hurtSnd.play();
}

function update() {
    if (gameStarted) {
        // Make bird dive
        var dvy = FLAP + bird.body.velocity.y;
        bird.angle = (90 * dvy / FLAP) - 180;
        if (bird.angle < -30) {
            bird.angle = -30;
        }
        if (
            gameOver ||
            bird.angle > 90 ||
            bird.angle < -90
        ) {
            bird.angle = 90;
            bird.animations.stop();
            bird.frame = 3;
        } else {
            bird.animations.play('fly');
        }
        // bird is DEAD!
        if (gameOver) {
            if (bird.scale.x < 4) {
                bird.scale.setTo(
                    bird.scale.x * 1.2,
                    bird.scale.y * 1.2
                );
            }
            highScoreText.scale.setTo(
                0.9 + 0.1 * Math.sin(game.time.now / 100),
                0.9 + 0.1 * Math.cos(game.time.now / 100)
            );
            postScoreText.scale.setTo(
                0.9 + 0.1 * Math.sin(game.time.now / 100),
                0.9 + 0.1 * Math.cos(game.time.now / 100)
            );
            kikThisText.scale.setTo(
                0.9 + 0.1 * Math.sin(game.time.now / 100),
                0.9 + 0.1 * Math.cos(game.time.now / 100)
            );
        } else {
            // Check game over
            game.physics.overlap(bird, towers, setGameOver);
            if (!gameOver && bird.body.bottom >= game.world.bounds.bottom) {
                setGameOver();
            }
            // Add score
            game.physics.overlap(bird, invs, addScore);
        }
        // Remove offscreen towers
        towers.forEachAlive(function(tower) {
            if (tower.x + tower.width < game.world.bounds.left) {
                tower.kill();
            }
        });
        // Update tower timer
        towersTimer.update();
    } else {
        bird.y = (game.world.height / 2) + 8 * Math.cos(game.time.now / 200);
    }
    if (!gameStarted || gameOver) {
        // Shake instructions text
        instText.scale.setTo(
            0.9 + 0.1 * Math.sin(game.time.now / 100),
            0.9 + 0.1 * Math.cos(game.time.now / 100)
        );
    }
    // Shake score text
    scoreText.scale.setTo(
        0.9 + 0.1 * Math.cos(game.time.now / 100),
        0.9 + 0.1 * Math.sin(game.time.now / 100)
    );
    // Update clouds timer
    cloudsTimer.update();
    // Remove offscreen clouds
    clouds.forEachAlive(function(cloud) {
        if (cloud.x + cloud.width < game.world.bounds.left) {
            cloud.kill();
        }
    });
    // Scroll floor
    if (!gameOver) {
        floor.tilePosition.x -= game.time.physicsElapsed * 2 * SPEED;
    }
}

function render() {
    if (DEBUG) {
        game.debug.renderSpriteBody(bird);
        towers.forEachAlive(function(tower) {
            game.debug.renderSpriteBody(tower);
        });
        invs.forEach(function(inv) {
            game.debug.renderSpriteBody(inv);
        });
    }
}

};
