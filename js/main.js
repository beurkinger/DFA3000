window.onload = function()
{
  var lilcan = new LilCanvas.Core('DFA3000', 30);
  var buffer = lilcan.createBuffer();

  var gunX = lilcan.canvas.width / 2;
  var gunY = lilcan.canvas.height;

  var bullets = [];

  lilcan.on('click', function(e)
  {
    var targetX = parseInt(e.clientX - lilcan.canvas.getBoundingClientRect().left);
    var targetY = parseInt(e.clientY - lilcan.canvas.getBoundingClientRect().top);


    var bullet = new Bullet(gunX, gunY, 10, targetX, targetY);
    bullets.push(bullet);
    buffer.addObject(bullet);
  });

  lilcan.startLoop(
  function()
  {
    for (var i = bullets.length - 1; i >= 0; i--)
    {
      if (bullets[i].hasArrived())
      {
        bullets[i].remove();
        bullets.splice(i, 1);
      }
      else
      {
        bullets[i].move();
      }
    }
  });

  Bullet = function(x, y, size, targetX, targetY)
  {
    this.size = size;
    LilCanvas.Rectangle.call(this, x, y, this.size, this.size, '#FFF');
    this.speed = 8;
    this.targetX = targetX;
    this.targetY = targetY;
    this.distance = null;
  }

  Bullet.prototype = new LilCanvas.Rectangle();
  Bullet.prototype.move = function()
  {
    this.distance = Math.sqrt( Math.pow(this.targetX - this.x, 2) + Math.pow(this.targetY - this.y, 2) );

    var distX = this.x - this.targetX;
    var distY = this.y - this.targetY;

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
}
