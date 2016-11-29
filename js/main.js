window.onload = function()
{
  var lilcan = new LilCanvas.Core('DFA3000', 30);
  var buffer = lilcan.createBuffer();

  var gunX = lilcan.canvas.width / 2;
  var gunY = lilcan.canvas.height;

  var bullets = [];
  var explosions = [];
  var sparks = [];

  lilcan.on('click', function(e)
  {
    var targetX = parseInt(e.clientX - lilcan.canvas.getBoundingClientRect().left);
    var targetY = parseInt(e.clientY - lilcan.canvas.getBoundingClientRect().top);
    fireBullet(targetX, targetY);
  });

  lilcan.startLoop(
  function()
  {
    animateBullets();
    animateSparks();
    animateExplosions();
  });

  function animateBullets()
  {
    var length = bullets.length - 1;
    for (var i = length; i > -1; i--)
    {
      if (bullets[i].hasArrived())
      {
        explodeBullet(bullets[i]);
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

  function animateSparks()
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

  function animateExplosions()
  {
    var length = explosions.length - 1;
    for (var i = length ; i > -1; i--)
    {
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

  function fireBullet(targetX, targetY)
  {
    var bullet = new Bullet(gunX, gunY, 8, targetX, targetY, 6);
    bullets.push(bullet);
    buffer.addObject(bullet);
  }

  function explodeBullet(bullet)
  {
    var center = bullet.getCenter();
    var explosion = new Explosion(center.x, center.y, 2, 20, 4);
    explosions.push(explosion);
    buffer.addObject(explosion);
  }

  function makeBulletSpark(bullet)
  {
    var center = bullet.getCenter();
    var rand = Math.round(Math.random() * 5) - 2 ;
    var speed = Math.round(Math.random()) + 1 ;
    var lifeSpawn = Math.round(Math.random() * 45) + 30 ;
    // var color = Math.round(Math.random()) ? '#FFF' : '#FF0000';
    var spark = new Spark(center.x + rand, center.y, 2, '#FFF', speed, lifeSpawn);
    sparks.push(spark);
    buffer.addObject(spark);
  }

  Bullet = function(x, y, size, targetX, targetY, speed)
  {
    this.size = size;
    LilCanvas.Rectangle.call(this, x, y, this.size, this.size, '#FFF');
    this.speed = speed;
    this.targetX = targetX;
    this.targetY = targetY;
    this.distance = null;
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

  Explosion = function(x, y, startRadius, maxRadius, speed)
  {
    this.maxRadius = 20;
    this.speed = speed;
    LilCanvas.Circle.call(this, x, y, startRadius, '#FFF', false, 3);
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
}
