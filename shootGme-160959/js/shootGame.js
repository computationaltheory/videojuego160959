// nos marca los pulsos del juego
window.requestAnimFrame = (function () {
    return  window.requestAnimationFrame        ||
        window.webkitRequestAnimationFrame  ||
        window.mozRequestAnimationFrame     ||
        window.oRequestAnimationFrame       ||
        window.msRequestAnimationFrame      ||
        function (callback, element) {
            window.setTimeout(callback, 1000 / 60);
        };
})();
arrayRemove = function (array, from) {
    var rest = array.slice((from) + 1 || array.length);
    array.length = from < 0 ? array.length + from : from;
    return array.push.apply(array, rest);
};

var game = (function () {

    // Variables globales a la aplicacion
    var player,
        velocidad,
        vida,
        ext,
        ext2,
        aux,
        evil,
        playerShot,
        evilSpeed = 1,
        totalEvils = 7,
        shotSpeed = 10,
        playerSpeed = 2,
        evilCounter = 0,
        youLoose = false,
        congratulations = false,
        minHorizontalOffset = 100,
        maxHorizontalOffset = 400,
        evilShots = 10,   // disparos que tiene el malo al principio
        evilLife = 3,    // vidas que tiene el malo al principio (se van incrementando)
        finalBossShots = 30,
        finalBossLife = 12,
        totalBestScoresToShow = 3, // las mejores puntuaciones que se mostraran
        playerShotsBuffer = [],
        evilShotsBuffer = [],
        keyPressed = {},
        keyMap = {
            left: 37,
            right: 39,
            tomar: 68, //d
            Darriba: 83, //s
            arriba: 38,
            abajo: 40 
        },
        nextPlayerShot = 0,
        playerShotDelay = 250,
        now = 0;
        playerLife = 3
        //ciclo para actualiza pantalla y dibujar pensonajes
    function loop() {
        update();
        draw();
    }
    var bgMain, bgBoss, evilShotImage, playerShotImage, playerKilledImage;
        var evilImages = {
            animation : [],
            killed : new Image()
        }
        var bossImages = {
            animation : [],
            killed : new Image()
        }
        //se asignan a cada personaje su imagene
    function preloadImages () {
        for (var i = 1; i <= 8; i++) {
            var evilImage = new Image();
            evilImage.src = 'images/malo' + i + '.png';
            evilImages.animation[i-1] = evilImage;
            var bossImage = new Image();
            bossImage.src = 'images/jefe' + i + '.png';
            bossImages.animation[i-1] = bossImage;
        }
        evilImages.killed.src = 'images/malo_muerto.png';
        bossImages.killed.src = 'images/jefe_muerto.png';
        bgMain = new Image();
        bgMain.src = 'images/fondo.png';
        bgBoss = new Image();
        bgBoss.src = 'images/fondo.png';
        playerShotImage = new Image();
        playerShotImage.src = 'images/disparo_bueno.png';
        evilShotImage = new Image();
        evilShotImage.src = 'images/disparo_malo.png';
        playerKilledImage = new Image();
        playerKilledImage.src = 'images/bueno_muerto.png';

    }
    var canvas, ctx, buffer, bufferctx;
    //funcion inicial para cargar personajes y seccion del videojuego (canvas)
    function init() {
        preloadImages();

        showBestScores();

        canvas = document.getElementById('canvas');
        ctx = canvas.getContext("2d");

        buffer = document.createElement('canvas');
        buffer.width = canvas.width;
        buffer.height = canvas.height;
        bufferctx = buffer.getContext('2d');

        extra = new extras();
        extra2 = new extras2();
        player = new Player(playerLife, 0);
        evilCounter = 1;
        //funciones que se ejecutaran dentro del canvas
        createNewEvil();
        showLifeAndScore();
        //captura de teclas
        addListener(document, 'keydown', keyDown);
        addListener(document, 'keyup', keyUp);
        //funcion para realizar la animacion de los enemigos
        function anim () {
            loop();
            requestAnimFrame(anim);
        }
        anim();
    }
    //se imprimen los puntos y las vidas que tiene el jugador
    function showLifeAndScore () {
        bufferctx.fillStyle="rgb(255,0,0)";
        bufferctx.font="bold 20px Arial";
        bufferctx.fillText("Puntos: " + player.score, canvas.width - 120, 40);
        bufferctx.fillText("Vidas: " + player.life, canvas.width - 120, 60);
    }
    //aleatorio para posiciones
    function getRandomNumber(range) {
        return Math.floor(Math.random() * range);
    }
    //gemas se cargan imagenes de gemas y se especifican posiciones.
    function extras()
    {
        vida = new Image();
        vida.src = 'images/gem1.png';
        velocidad = new Image();
        velocidad.src = 'images/gem2.png';
        vida.posX = 100;
        vida.posY = 650;
        velocidad.posX = 100;
        velocidad.posY = 300;
    }
    //gemas se cargan imagenes de gemas y se especifican posiciones.
    function extras2()
    {
        ext = new Image();
        ext.src = 'images/gem3.png';
        ext2 = new Image();
        ext2.src = 'images/gem4.png';
        ext.posX = 780;
        ext.posY = 100;
        ext2.posX = 100;
        ext2.posY = 100;
    }
    //Vidas declaradas paea el jugador
    
    function Player(life, score) {
        var settings = {
            marginBottom : 10,
            defaultHeight : 66
        };
        //se crea el personajes o jugador como player y se le asigna su personaje png
        //se indica la posicion donde aparecera el personaje dentro del recuadro creado (canvas)
        player = new Image();
        player.src = 'images/bueno.png';
        player.posX = (canvas.width / 2) - (player.width / 2);
        player.posY = canvas.height - (player.height == 0 ? settings.defaultHeight : player.height) - settings.marginBottom;
        player.life = life;
        player.score = score;
        player.dead = false;
        player.speed = playerSpeed;

        //registro de los disparos del jugador y se gurdan para irlos presentando en la pantalla
        var shoot = function () {
            if (nextPlayerShot < now || now == 0) {
                playerShot = new PlayerShot(player.posX + (player.width / 2) - 5 , player.posY);
                playerShot.add();
                now += playerShotDelay;
                nextPlayerShot = now + playerShotDelay;
            } else {
                now = new Date().getTime();
            }
        };
//Se realizan los momevientos del jugador identificando los obstaculos en el mapa
//que en este caso mi mapa son arboles y sirven como paredes
    var totGem = 0;
        player.doAnything = function() {
            //posiciones de gemas y sus acciones
            if (keyPressed.tomar && player.posY > 640 && player.posY < 700 && player.posX > 10 && player.posX < 110)
            {
                vida.posX = -50;
                player.speed = 3;
                totGem += 1;
            }   
            if (keyPressed.tomar && player.posY > 280 && player.posY < 320 && player.posX > 10 && player.posX < 110)
            {
                velocidad.posX = -50;
                totGem += 1;
            }   
            if (keyPressed.tomar && player.posY > 90 && player.posY < 110 && player.posX > 770 && player.posX < 790)
            {
                ext.posX = -50;
                totGem += 1;
                player.life = 3;
            }   
            if (keyPressed.tomar && player.posY > 90 && player.posY < 110 && player.posX > 90 && player.posX < 110)
            {
                ext2.posX = -50;
                totGem += 1;
            }   
            //identifica si terminaron las vidas del jugador
            if (player.dead)
                return;
            //Identifica si se presiona la tecla espacio para disparar
            if (keyPressed.Darriba)
                shoot();
            //Condicionales con la tecla arriba para el choque con los arboles
            //arriba
            //2
            if (keyPressed.arriba && player.posY > 540 && player.posX > 500)
                player.posY -= player.speed;
            //6
            if (keyPressed.arriba && player.posX > 290 && player.posX < 360 && player.posY > 290)
                player.posY -= player.speed;
            //5
            if (keyPressed.arriba && player.posX > 360 && player.posX < 430 && player.posY > 350)
                player.posY -= player.speed;
            //4
            if (keyPressed.arriba && player.posX < 500 && player.posX > 430 && player.posY > 290)
                player.posY -= player.speed;
            //7
            if (keyPressed.arriba && player.posX < 210 && player.posX > 90 && player.posY > 530)
                player.posY -= player.speed;
            if (keyPressed.arriba && player.posX < 90 && player.posX > 10 && player.posY > 460)
                player.posY -= player.speed;
            //8
            if (keyPressed.arriba && player.posY < 490 && player.posY > 350 && player.posX < 300 && player.posX > 150)
                player.posY -= player.speed;
            //9
            if (keyPressed.arriba && player.posY < 310 && player.posY > 200 && player.posX < 230 && player.posX > 10)
                player.posY -= player.speed;
            //10
            if (keyPressed.arriba && player.posX > 500 && player.posX < 560 && player.posY < 490 && player.posY > 290)
                player.posY -= player.speed;
            if (keyPressed.arriba && player.posX > 560 && player.posX < 640 && player.posY < 490 && player.posY > 10)
                player.posY -= player.speed;
            if (keyPressed.arriba && player.posX > 640 && player.posX < 845 && player.posY < 490 && player.posY > 200)
                player.posY -= player.speed;
            if (keyPressed.arriba && player.posX > 845 && player.posX < 910 && player.posY > 10)
                player.posY -= player.speed;
            if (keyPressed.arriba && player.posX > 640 && player.posY < 150 && player.posY > 10)
                player.posY -= player.speed;
            //12
            if (keyPressed.arriba && player.posX > 640 && player.posY < 150 && player.posY > 10)
                player.posY -= player.speed;
            //13
            if (keyPressed.arriba && player.posX > 10 && player.posX < 550 && player.posY < 140 && player.posY > 10)
                player.posY -= player.speed;
            if (keyPressed.arriba && player.posX > 420 && player.posX < 600 && player.posY > 10 && player.posY < 270)
                player.posY -= player.speed;

            //Condicionales con la tecla izquierda para el choque con los arboles
            //izquierda
            //1
            if (keyPressed.left && player.posX > 435 && player.posY > 570)
                player.posX -= player.speed;
            //3
            if (keyPressed.left && player.posY > 490 && player.posY < 570 && player.posX > 300)
                player.posX -= player.speed;
            
            if (keyPressed.left && player.posY > 500 && player.posY < 570 && player.posX > 300)
                player.posX -= player.speed;

            if (keyPressed.left && player.posY > 450 && player.posY < 500 && player.posX > 10)
                player.posX -= player.speed;

            if (keyPressed.left && player.posY > 350 && player.posY < 490 && player.posX > 170)
                player.posX -= player.speed;
            //7
            if (keyPressed.left && player.posX < 220 && player.posX > 10 && player.posY > 510)
                player.posX -= player.speed;
            //9
            if (keyPressed.left && player.posX > 700 && player.posY < 150)
                player.posX -= player.speed;
            if (keyPressed.left && player.posX < 420 && player.posX > 10 && player.posY > 170 && player.posY < 310)
                player.posX -= player.speed;
            //11
            if (keyPressed.left && player.posX > 875 && player.posY < 180 && player.posY > 150)
                player.posX -= player.speed;
            //5 LEFT
            if (keyPressed.left && player.posX > 430 && player.posY < 350 && player.posY > 280)
                player.posX -= player.speed;
            //10 LEFT
            if (keyPressed.left && player.posX > 560  && player.posY < 280 && player.posY > 230)
                player.posX -= player.speed;
            if (keyPressed.left && player.posX > 430  && player.posY < 230 && player.posY > 180)
                player.posX -= player.speed;
            if (keyPressed.left && player.posX > 430 && player.posX < 670  && player.posY < 180 && player.posY > 140)
                player.posX -= player.speed;
            //13
            if (keyPressed.left && player.posX > 10 && player.posX < 650 && player.posY < 140 && player.posY > 5)
                player.posX -= player.speed;
            

            //Condicionales con la tecla derecha para el choque con los arboles
            //derecha
            if (keyPressed.right && player.posX > 300 && player.posX < 880 && player.posY > 530 )
                player.posX += player.speed; 
            if (keyPressed.right && player.posX > 200 && player.posX < 480 && player.posY > 490 )
                player.posX += player.speed;
            if (keyPressed.right && player.posY > 410 && player.posY < 490 && player.posX < 770 )
                player.posX += player.speed;
            if (keyPressed.right && player.posY > 190 && player.posY < 410 && player.posX < 880 && player.posX > 410)
                player.posX += player.speed;
            if (keyPressed.right && player.posX > 5 && player.posX < 190 && player.posY > 520 )
                player.posX += player.speed;
            if (keyPressed.right && player.posX < 80 && player.posX > 5 && player.posY > 490 && player.posY < 520 )
                player.posX += player.speed;
            if (keyPressed.right && player.posY > 350 && player.posY < 410 && player.posX < 435 && player.posX > 100)
                player.posX += player.speed;
            if (keyPressed.right && player.posX > 680 && player.posX < 880 && player.posY < 150 && player.posY > 5)
                player.posX += player.speed;
            if (keyPressed.right && player.posX > 5 && player.posX < 200 && player.posY < 270 && player.posY > 190)
                player.posX += player.speed;
            if (keyPressed.right && player.posX > 5 && player.posX < 340 && player.posY < 330 && player.posY > 270)
                player.posX += player.speed;
            if (keyPressed.right && player.posX > 5 && player.posX < 600 && player.posY < 180 && player.posY > 5)
                player.posX += player.speed;


            //Condicionales con la tecla abajo para el choque con los arboles
            //abajo
            //7
            if (keyPressed.abajo && player.posX > 5 && player.posX < 200 && player.posY < 660 && player.posY > 500)
                    player.posY += player.speed;
            if (keyPressed.abajo && player.posX > 5 && player.posX < 80 && player.posY < 660 && player.posY > 450)
                    player.posY += player.speed;
            if (keyPressed.abajo && player.posX > 440 && player.posX < 900 && player.posY < 660 && player.posY > 500)
                    player.posY += player.speed;
            if (keyPressed.abajo && player.posX > 280 && player.posX < 435 && player.posY < 550 && player.posY > 487)
                    player.posY += player.speed;
            if (keyPressed.abajo && player.posX > 280 && player.posX < 435 && player.posY < 550 && player.posY > 487)
                    player.posY += player.speed;
            if (keyPressed.abajo && player.posX > 280 && player.posX < 435 && player.posY < 550 && player.posY > 487)
                    player.posY += player.speed;
            if (keyPressed.abajo && player.posX > 100 && player.posX < 770 && player.posY < 360 && player.posY > 350)
                    player.posY += player.speed;
            if (keyPressed.abajo && player.posX > 100 && player.posX < 770 && player.posY < 485 && player.posY > 330)
                    player.posY += player.speed;
            if (keyPressed.abajo && player.posX > 435 && player.posX < 880 && player.posY < 330 && player.posY > 260)
                    player.posY += player.speed;
            if (keyPressed.abajo && player.posX > 550 && player.posX < 880 && player.posY < 380 && player.posY > 170)
                    player.posY += player.speed;
            if (keyPressed.abajo && player.posX > 840 && player.posX < 900 && player.posY < 350 && player.posY > 5)
                    player.posY += player.speed;
            if (keyPressed.abajo && player.posX > 690 && player.posX < 842 && player.posY < 120 && player.posY > 5)
                    player.posY += player.speed;
            if (keyPressed.abajo && player.posX > 5 && player.posX < 420 && player.posY < 120 && player.posY > 5)
                    player.posY += player.speed;
            if (keyPressed.abajo && player.posX > 420 && player.posX < 680 && player.posY < 210 && player.posY > 5)
                    player.posY += player.speed;
            if (keyPressed.abajo && player.posX > 5 && player.posX < 280 && player.posY < 300 && player.posY > 180)
                    player.posY += player.speed;
            if (keyPressed.abajo && player.posX > 280 && player.posX < 400 && player.posY < 369 && player.posY > 250)
                    player.posY += player.speed;     

        };
        //identifica cuantas vidas tiene el jugador y se llama al 
        //momento que colisiona con bala del enemigo para eliminar una vida
        player.killPlayer = function() {
            //si aun tiene vidas solo se restan
            if (this.life > 0) {
                this.dead = true;
                evilShotsBuffer.splice(0, evilShotsBuffer.length);
                playerShotsBuffer.splice(0, playerShotsBuffer.length);
                this.src = playerKilledImage.src;
                createNewEvil();
                setTimeout(function () {
                    player = new Player(player.life - 1, player.score);
                }, 500);
            //si ya no tiene vidas pierde
            } else {
                saveFinalScore();
                youLoose = true;
            }
        };

        return player;
    }

    //disparos (parametros del disparo tanto posiciones como velocidad)
    function Shot( x, y, array, img) {
        this.posX = x;
        this.posY = y;
        this.image = img;
        this.speed = shotSpeed;
        this.identifier = 0;
        this.add = function () {
            array.push(this);
        };
        this.deleteShot = function (idendificador) {
            arrayRemove(array, idendificador);
        };
    }

    //funcion para identificar si el disparo del juagdor colisiona con el enemigo
    function PlayerShot (x, y) {
        Object.getPrototypeOf(PlayerShot.prototype).constructor.call(this, x, y, playerShotsBuffer, playerShotImage);
        this.isHittingEvil = function() {
            return (!evil.dead && this.posX >= evil.posX && this.posX <= (evil.posX + evil.image.width) &&
                this.posY >= evil.posY && this.posY <= (evil.posY + evil.image.height));
        };
    }

    PlayerShot.prototype = Object.create(Shot.prototype);
    PlayerShot.prototype.constructor = PlayerShot;

    //funcion para identificar si el disparo del enemigo colisiona con el jugador
    function EvilShot (x, y) {
        Object.getPrototypeOf(EvilShot.prototype).constructor.call(this, x, y, evilShotsBuffer, evilShotImage);
        this.isHittingPlayer = function() {
            return (this.posX >= player.posX && this.posX <= (player.posX + player.width)
                && this.posY >= player.posY && this.posY <= (player.posY + player.height));
        };
    }

    EvilShot.prototype = Object.create(Shot.prototype);
    EvilShot.prototype.constructor = EvilShot;


    //enemigos

    function Enemy(life, shots, enemyImages) {
        this.image = enemyImages.animation[0];
        this.imageNumber = 1;
        this.animation = 0;
        this.posX = getRandomNumber(canvas.width - this.image.width);
        this.posY = -50;
        this.life = life ? life : evilLife;
        this.speed = evilSpeed;
        this.shots = shots ? shots : evilShots;
        this.dead = false;

        var desplazamientoHorizontal = minHorizontalOffset +
            getRandomNumber(maxHorizontalOffset - minHorizontalOffset);
        this.minX = 15;
        this.maxX = 500;
        this.direction = 'D';

        //identificar si el enemigo murio o terminaron vidas para crear uno nuevo
        this.kill = function() {
            this.dead = true;
            totalEvils --;
            this.image = enemyImages.killed;
            verifyToCreateNewEvil();
        };
        //movimiento de los enemigos en el juego
        this.update = function () {
            this.posY += this.goDownSpeed;
            //this.posY = 100;
            if (this.direction === 'D') {
                if (this.posX <= this.maxX) {
                    this.posX += this.speed;
                } else {
                    this.direction = 'I';
                    this.posX -= this.speed;
                }
            } else {
                if (this.posX >= this.minX) {
                    this.posX -= this.speed;
                } else {
                    this.direction = 'D';
                    this.posX += this.speed;
                }
            }
            this.animation++;
            //se van cambiando las imagenes del enemigo para que simule movimiento
            if (this.animation > 5) {
                this.animation = 0;
                this.imageNumber ++;
            //solo son 8 transiciones al momento de cumplir las 8 se reinicia en la imagen 0
                if (this.imageNumber > 8) {
                    this.imageNumber = 1;
                }
                this.image = enemyImages.animation[this.imageNumber - 1];
            }
        };
        //identifica si sobresalen del rango del canvas
        this.isOutOfScreen = function() {
            return this.posY > (canvas.height + 15);
        };
//posicion del disparo y resta un disparo a los enemigos
        function shoot() {
            if (evil.shots > 0 && !evil.dead) {
                var disparo = new EvilShot(evil.posX + 1 , evil.posY + 1);
                disparo.add();
                evil.shots --;
                setTimeout(function() {
                    shoot();
                }, getRandomNumber(3000));
            }
        }
        setTimeout(function() {
            shoot();
        }, 1000 + getRandomNumber(2500));

        this.toString = function () {
            return 'Enemigo con vidas:' + this.life + 'shotss: ' + this.shots + ' puntos por matar: ' + this.pointsToKill;
        }

    }
    //funcion para vidas y disparos de los enemigos
    function Evil (vidas, disparos) {
        Object.getPrototypeOf(Evil.prototype).constructor.call(this, vidas, disparos, evilImages);
        this.goDownSpeed = evilSpeed;
        this.pointsToKill = 5 + evilCounter;
    }
    //se crea el enemigo
    Evil.prototype = Object.create(Enemy.prototype);
    Evil.prototype.constructor = Evil;
    //funcion del enemigo final para ganar
    function FinalBoss () {
        Object.getPrototypeOf(FinalBoss.prototype).constructor.call(this, finalBossLife, finalBossShots, bossImages);
        this.goDownSpeed = evilSpeed/2;
        this.pointsToKill = 20;
    }
    //se crea el enemigo
    FinalBoss.prototype = Object.create(Enemy.prototype);
    FinalBoss.prototype.constructor = FinalBoss;

    //se identifica si aun hay enemigos por salir
    //si no hay mas la variable congratulations se vuelve verdadero indicando que ganaste
    function verifyToCreateNewEvil() {
        if (totalEvils > 0) {
            setTimeout(function() {
                createNewEvil();
                evilCounter ++;
            }, getRandomNumber(3000));

        } else {
            setTimeout(function() {
                saveFinalScore();
                congratulations = true;
            }, 2000);

        }
    }
    //verifica el numero de enemigos que hay si ya solo falta uno
    //se crea en enemigo final
    function createNewEvil() {
        if (totalEvils != 1) {
            evil = new Evil(evilLife + evilCounter - 1, evilShots + evilCounter - 1);
        } else {
            evil = new FinalBoss();
        }
    }
    //identifica si el disparo del jugador colisiona con el enemigo
    // (solo identifica las posiciones)
    function isEvilHittingPlayer() {
        return ( ( (evil.posY + evil.image.height) > player.posY && (player.posY + player.height) >= evil.posY ) &&
            ((player.posX >= evil.posX && player.posX <= (evil.posX + evil.image.width)) ||
                (player.posX + player.width >= evil.posX && (player.posX + player.width) <= (evil.posX + evil.image.width))));
    }
    //si colisiona y hay mas de una vida solo le resta una al enemigo
    //si no se llama kill para matar al enemigo
    function checkCollisions(shot) {
        if (shot.isHittingEvil()) {
            if (evil.life > 1) {
                evil.life--;
            } else {
                evil.kill();
                player.score += evil.pointsToKill;
            }
            shot.deleteShot(parseInt(shot.identifier));
            return false;
        }
        return true;
    }
    //llama las acciones del enemigo que son los movimientos anteriormente declarados
    //para identificar las colisiones en el mapa
    function playerAction() {
        player.doAnything();
    }

    function addListener(element, type, expression, bubbling) {
        bubbling = bubbling || false;

        if (window.addEventListener) {
            element.addEventListener(type, expression, bubbling);
        } else if (window.attachEvent) { 
            element.attachEvent('on' + type, expression);
        }
    }
//se obtienen la teclas seleccionadas (si se pulsó)
    function keyDown(e) {
        var key = (window.event ? e.keyCode : e.which);
        for (var inkey in keyMap) {
            if (key === keyMap[inkey]) {
                e.preventDefault();
                keyPressed[inkey] = true;
            }
        }
    }
//se obtienen la teclas seleccionadas (si se soltó)
    function keyUp(e) {
        var key = (window.event ? e.keyCode : e.which);
        for (var inkey in keyMap) {
            if (key === keyMap[inkey]) {
                e.preventDefault();
                keyPressed[inkey] = false;
            }
        }
    }
    //funcion para imprimir imagen en pantalla
    function draw() {
        ctx.drawImage(buffer, 0, 0);
    }
    //muestra la palabra game over si es que se pierde
    function showGameOver() {
        bufferctx.fillStyle="rgb(255,0,0)";
        bufferctx.font="bold 35px Arial";
        bufferctx.fillText("GAME OVER", canvas.width / 2 - 100, canvas.height / 2);
    }

    function showText() {
        bufferctx.fillStyle="rgb(255,0,0)";
        bufferctx.font="bold 35px Arial";
        bufferctx.fillText("TE FALTARON PUNTOS PARA GANAR", canvas.width / 2 - 240, canvas.height / 2);
    }
    //Muestra una frace de felicitaciones
    //puntos obtenidos
    //vidas
    function showCongratulations () {
        if (player.score < 35) {
            showText();
        }
        else{
            bufferctx.fillStyle="rgb(204,50,153)";
            bufferctx.font="bold 22px Arial";
            bufferctx.fillText("Has ganado el juego!", canvas.width / 2 - 200, canvas.height / 2 - 30);
            bufferctx.fillText("PUNTOS: " + player.score, canvas.width / 2 - 200, canvas.height / 2);
            bufferctx.fillText("VIDAS: " + player.life + " x 5", canvas.width / 2 - 200, canvas.height / 2 + 30);
            bufferctx.fillText("PUNTUACION TOTAL: " + getTotalScore(), canvas.width / 2 - 200, canvas.height / 2 + 60);
        }
        
    }
    //funcion para calcular el resultado del jugador (su puntaje)
    function getTotalScore() {
        return player.score + player.life;
    }
    //funcion que estara verificando el proceso del juego
    //para identificar la fase en la que se encuentra
    //dentro se llaman las funciones para estar en transicion
    //como los disparos, los movimientos, las vidas, los enemigos y las colisiones
    function update() {

        drawBackground();

        if (congratulations) {
            showCongratulations();
        }

        if (youLoose) {
            showGameOver();
            return;
        }
//se dibujan personajes y objetos en pantalla
        bufferctx.drawImage(player, player.posX, player.posY);
        bufferctx.drawImage(vida, vida.posX, vida.posY);
        bufferctx.drawImage(velocidad, velocidad.posX, velocidad.posY);
        bufferctx.drawImage(evil.image, evil.posX, evil.posY);
        bufferctx.drawImage(ext, ext.posX, ext.posY);
        bufferctx.drawImage(ext2, ext2.posX, ext2.posY);
        updateEvil();
        //se guardan los disparos seleccionados o requeridos
        //y se impimen con la funcion
        for (var j = 0; j < playerShotsBuffer.length; j++) {
            var disparoBueno = playerShotsBuffer[j];
            updatePlayerShot(disparoBueno, j);
        }
        //identifica si hay colision el enemigo con jugador
        if (isEvilHittingPlayer()) {
            player.killPlayer();
        } else {
            for (var i = 0; i < evilShotsBuffer.length; i++) {
                var evilShot = evilShotsBuffer[i];
                updateEvilShot(evilShot, i);
            }
        }

        showLifeAndScore();

        playerAction();
    }

    //funcion para actualizar el disparo del jugador
    //identifico la direccion del disparo
    function updatePlayerShot(playerShot, id) {
        if (playerShot) {
            playerShot.identifier = id;
            if (checkCollisions(playerShot)) {
                if (playerShot.posX > 0) {
                    playerShot.posX -= playerShot.speed;
                    bufferctx.drawImage(playerShot.image, playerShot.posX, playerShot.posY);
                } else {
                    playerShot.deleteShot(parseInt(playerShot.identifier));
                }
            }
        }
    }

    function updateEvilShot(evilShot, id) {
        if (evilShot) {
            evilShot.identifier = id;
            if (!evilShot.isHittingPlayer()) {
                if (evilShot.posX <= canvas.height) {
                    evilShot.posX += evilShot.speed;
                    bufferctx.drawImage(evilShot.image, evilShot.posX, evilShot.posY);
                } else {
                    evilShot.deleteShot(parseInt(evilShot.identifier));
                }
            } else {
                player.killPlayer();
            }
        }
    }

    function drawBackground() {
        var background;
        if (evil instanceof FinalBoss) {
            background = bgBoss;
        } else {
            background = bgMain;
        }
        bufferctx.drawImage(background, 0, 0);
    }
//crea a los nuevos enemigos y cuando salen del margen de la pantalla los elimina
    function updateEvil() {
        if (!evil.dead) {
            evil.update();
            if (evil.isOutOfScreen()) {
                evil.kill();
            }
        }
    }

   //puntuaciones del tablero (las 3 mejores)
    function saveFinalScore() {
        localStorage.setItem(getFinalScoreDate(), getTotalScore());
        showBestScores();
        removeNoBestScores();
    }

    function getFinalScoreDate() {
        var date = new Date();
        return fillZero(date.getDay()+1)+'/'+
            fillZero(date.getMonth()+1)+'/'+
            date.getFullYear()+' '+
            fillZero(date.getHours())+':'+
            fillZero(date.getMinutes())+':'+
            fillZero(date.getSeconds());
    }

    function fillZero(number) {
        if (number < 10) {
            return '0' + number;
        }
        return number;
    }

    function getBestScoreKeys() {
        var bestScores = getAllScores();
        bestScores.sort(function (a, b) {return b - a;});
        bestScores = bestScores.slice(0, totalBestScoresToShow);
        var bestScoreKeys = [];
        for (var j = 0; j < bestScores.length; j++) {
            var score = bestScores[j];
            for (var i = 0; i < localStorage.length; i++) {
                var key = localStorage.key(i);
                if (parseInt(localStorage.getItem(key)) == score) {
                    bestScoreKeys.push(key);
                }
            }
        }
        return bestScoreKeys.slice(0, totalBestScoresToShow);
    }

    function getAllScores() {
        var all = [];
        for (var i=0; i < localStorage.length; i++) {
            all[i] = (localStorage.getItem(localStorage.key(i)));
        }
        return all;
    }

    function showBestScores() {
        var bestScores = getBestScoreKeys();
        var bestScoresList = document.getElementById('puntuaciones');
        if (bestScoresList) {
            clearList(bestScoresList);
            for (var i=0; i < bestScores.length; i++) {
                addListElement(bestScoresList, bestScores[i], i==0?'negrita':null);
                addListElement(bestScoresList, localStorage.getItem(bestScores[i]), i==0?'negrita':null);
            }
        }
    }

    function clearList(list) {
        list.innerHTML = '';
        addListElement(list, "Fecha");
        addListElement(list, "Puntos");
    }

    function addListElement(list, content, className) {
        var element = document.createElement('li');
        if (className) {
            element.setAttribute("class", className);
        }
        element.innerHTML = content;
        list.appendChild(element);
    }

    // extendemos el objeto array con un metodo "containsElement"
    Array.prototype.containsElement = function(element) {
        for (var i = 0; i < this.length; i++) {
            if (this[i] == element) {
                return true;
            }
        }
        return false;
    };
    // De los registros guardados selecciona solo 3, los mas altos y los demas los elimina
    function removeNoBestScores() {
        var scoresToRemove = [];
        var bestScoreKeys = getBestScoreKeys();
        for (var i=0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            if (!bestScoreKeys.containsElement(key)) {
                scoresToRemove.push(key);
            }
        }
        for (var j = 0; j < scoresToRemove.length; j++) {
            var scoreToRemoveKey = scoresToRemove[j];
            localStorage.removeItem(scoreToRemoveKey);
        }
    }
    /******************************* FIN MEJORES PUNTUACIONES *******************************/

    return {
        init: init
    }
})();