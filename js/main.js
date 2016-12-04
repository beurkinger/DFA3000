window.onload = function()
{
  var lilcan = new LilCanvas.Core('DFA3000', 30);
  var buffer = lilcan.createBuffer();

  var screenWidth = lilcan.canvas.width;
  var screenHeight = lilcan.canvas.height;

  var gunX = lilcan.canvas.width / 2;
  var gunY = lilcan.canvas.height;

  var bombs = [];
  var bullets = [];
  var targets = [];
  var sparks = [];
  var explosions = [];

  var bombInterval = 30;
  var bombTimer = bombInterval;

  init();

  function init()
  {
    lilcan.on('click', function(e)
    {
      var targetX = parseInt(e.clientX - lilcan.canvas.getBoundingClientRect().left);
      var targetY = parseInt(e.clientY - lilcan.canvas.getBoundingClientRect().top);
      fireBullet(targetX, targetY);
    });

    lilcan.startLoop(
    function()
    {
      manageBombs();
      manageBullets();
      manageTargets();
      manageSparks();
      manageExplosions();
      dropBomb();
    });
  }

  function manageBombs()
  {
    var length = bombs.length - 1;
    for (var i = length; i > -1; i--)
    {
      if (bombs[i].isDone())
      {
        bombs[i].remove();
        bombs.splice(i, 1);
      }
      else
      {
        bombs[i].move();
      }
    }
  }

  function manageBullets()
  {
    var length = bullets.length - 1;
    for (var i = length; i > -1; i--)
    {
      if (bullets[i].hasArrived())
      {
        explodeBullet(bullets[i]);
        bullets[i].target.done = true;
        bullets[i].remove();
        bullets.splice(i, 1);
      }
      else
      {
        makeBulletSpark(bullets[i]);
        bullets[i].move();
      }
    }
  }

  function manageTargets()
  {
    var length = targets.length - 1;
    for (var i = length; i > -1; i--)
    {
      if (targets[i].isDone())
      {
        targets[i].remove();
        targets.splice(i, 1);
      }
      else
      {
        targets[i].animate();
      }
    }
  }

  function manageSparks()
  {
    var length = sparks.length - 1;
    for (var i = length ; i > -1; i--)
    {
      if (sparks[i].isDone())
      {
        sparks[i].remove();
        sparks.splice(i, 1);
      }
      else
      {
        sparks[i].move();
      }
    }
  }

  function manageExplosions()
  {
    var length = explosions.length - 1;
    for (var i = length ; i > -1; i--)
    {
      checkFrags(explosions[i]);
      if (explosions[i].isDone())
      {
        explosions[i].remove();
        explosions.splice(i, 1);
      }
      else
      {
        explosions[i].animate();
      }
    }
  }

  function dropBomb()
  {
    if (bombTimer === bombInterval)
    {
      var width = 10;
      var height = 40;
      var speed = 5;
      var x = Math.round(Math.random() * screenWidth);
      x = x > screenWidth - width ? screenWidth - width : x;
      var bomb = new Bomb(x, -height, width, height, '#ABEBC6', 1);
      buffer.addObject(bomb);
      bombs.push(bomb);
      bombTimer = 0;
    }
    else
    {
      bombTimer++;
    }
  }

  function fireBullet(targetX, targetY)
  {
    var target = new Target(targetX, targetY);
    targets.push(target);
    buffer.addObject(target);

    var bullet = new Bullet(gunX, gunY, 5, targetX, targetY, 6, target);
    bullets.push(bullet);
    buffer.addObject(bullet);
  }

  function explodeBullet(bullet)
  {
    var center = bullet.getCenter();
    var explosion = new Explosion(center.x, center.y, 2, 20, 4, '#FFF');
    explosions.push(explosion);
    buffer.addObject(explosion);
  }

  function makeBulletSpark(bullet)
  {
    var center = bullet.getCenter();
    // var randX = Math.round(Math.random() * 4) - 2 ;
    var speed = Math.random() + 1 ;
    var lifeSpawn = Math.round(Math.random() * 30) + 15 ;
    // var color = Math.round(Math.random()) ? '#FFF' : '#FF0000';
    var spark = new Spark(center.x, center.y, 2, '#FFF', speed, lifeSpawn);
    sparks.push(spark);
    buffer.addObject(spark);
  }

  function checkFrags(explosion)
  {
    for (var i = 0; i < bombs.length; i++)
    {
      if (isCollision(explosion, bombs[i]))
      {
        explodeBomb(bombs[i]);
        bombs[i].remove();
        bombs.splice(i, 1);
      }
    }
  }

  function explodeBomb(bomb)
  {
    var center = bomb.getCenter();
    var explosion = new Explosion(center.x, center.y, 8, 24, 2, bomb.color);
    explosions.push(explosion);
    buffer.addObject(explosion);
  }

  function isCollision(explosion, bomb)
  {
      var radius = explosion.radius + explosion.stroke;
      //Premier filtre grossier afin de gagner d'éliminer la plupart des cas rapidement
      if (explosion.x + radius < bomb.x || explosion.x - radius > bomb.x + bomb.width) return false;
      if (explosion.y + radius < bomb.y || explosion.y > - radius > bomb.y + bomb.height) return false;

      var bombCenter = bomb.getCenter();
      var xDist = Math.abs(explosion.x - bombCenter.x);
      var yDist = Math.abs(explosion.y - bombCenter.y);

      if (xDist <= radius && yDist <= radius) return true;
      return false;
  }

  Bullet = function(x, y, size, targetX, targetY, speed, target)
  {
    this.size = size;
    LilCanvas.Rectangle.call(this, x, y, this.size, this.size, '#FFF');
    this.speed = speed;
    this.targetX = targetX;
    this.targetY = targetY;
    this.distance = null;
    this.target = target;
  };
  Bullet.prototype = new LilCanvas.Rectangle();
  Bullet.prototype.move = function()
  {
    var center = this.getCenter();

    this.distance = Math.sqrt( Math.pow(this.targetX - center.x, 2) + Math.pow(this.targetY - center.y, 2) );

    var distX = center.x - this.targetX;
    var distY = center.y - this.targetY;

    var cos =  distX / this.distance;
    var sin =  distY / this.distance;

    var xStep = - this.speed * cos;
    var yStep = - this.speed * sin;

    this.x += xStep;
    this.y += yStep;
  };
  Bullet.prototype.hasArrived = function()
  {
    if (this.distance !== null && this.distance < this.speed) return true;
    return false;
  };

  Target = function(x, y)
  {
    this.interval = 10;
    this.timer = 0;
    this.done = false;
    LilCanvas.Rectangle.call(this, x-2, y-2, 4, 4, 'tomato');
  };
  Target.prototype = new LilCanvas.Rectangle();
  Target.prototype.animate = function()
  {
    if (this.timer < this.interval)
    {
      this.timer++;
    }
    else
    {
      this.timer = 0;
      this.isVisible = !this.isVisible;
    }
  };
  Target.prototype.isDone = function()
  {
    return this.done;
  };

  Spark = function(x, y, size, color, speed, lifeSpawn)
  {
    this.size = size;
    this.speed = speed;
    this.lifeSpawn = lifeSpawn;
    LilCanvas.Rectangle.call(this, x, y, this.size, this.size, color);
  };
  Spark.prototype = new LilCanvas.Rectangle();
  Spark.prototype.move = function()
  {
    this.y += this.speed;
    this.lifeSpawn--;
  };
  Spark.prototype.isDone = function()
  {
    if (this.lifeSpawn <= 0) return true;
    return false;
  };

  Explosion = function(x, y, startRadius, maxRadius, speed, color)
  {
    this.maxRadius = 20;
    this.speed = speed;
    LilCanvas.Circle.call(this, x, y, startRadius, color, false, 10);
  }
  Explosion.prototype = new LilCanvas.Circle();
  Explosion.prototype.animate = function()
  {
    if (this.radius < this.maxRadius) this.radius += this.speed;
  }
  Explosion.prototype.isDone = function()
  {
    if (this.radius >= this.maxRadius) return true;
    return false;
  };

  Bomb = function(x, y, width, height, color, speed)
  {
    LilCanvas.Rectangle.call(this, x, y, width, height, color);
    this.speed = speed;
  };
  Bomb.prototype = new LilCanvas.Rectangle();
  Bomb.prototype.move = function()
  {
    this.y += this.speed;
  };
  Bomb.prototype.isDone = function()
  {
    if (this.y > screenHeight) return true;
    return false;
  };
}
