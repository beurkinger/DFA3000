'use strict';

var LilCanvas = LilCanvas || {};

LilCanvas.Core = function(canvasId, framerate, width, height)
{
    this.canvas = document.getElementById(canvasId);
    this.canvas.width = width ? parseInt(width) : this.canvas.clientWidth;
    this.canvas.height = height ? parseInt(height) : this.canvas.clientHeight;
    this.ctx = this.canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;

    this.interval = 1000 / (framerate ? parseInt(framerate) : 30);
    this.then;
    this.now;

    this.buffers = [];

    this.stopped = false;
};

LilCanvas.Core.prototype.createBuffer = function(x, y, width, height)
{
    x = x ? parseInt(x) : 0;
    y = y ? parseInt(y) : 0;
    width  = width ? parseInt(width) : this.ctx.canvas.width;
    height = height ? parseInt(height) : this.ctx.canvas.height;
    var buffer = new LilCanvas.Buffer(x, y, width, height);
    this.buffers.push(buffer);
    return buffer;
};

LilCanvas.Core.prototype.removeBuffer = function(buffId)
{
    this.buffers.splice(buffId, 1);
};

LilCanvas.Core.prototype.removeBuffers = function(buffIdArray)
{
    for (var i = 0; i < buffIdArray.length; i++)
    {
        this.removeBuffer(buffIdArray[i]);
    }
};

LilCanvas.Core.prototype.startLoop = function(logicFn)
{
    this.stopped = false;
    if (logicFn && typeof logicFn !== "function") throw new Error ('Argument passed to startLoop is not a function.');
    this.then = window.performance.now();
    this.loop(logicFn);
};

LilCanvas.Core.prototype.stopLoop = function()
{
    this.stopped = true;
};

LilCanvas.Core.prototype.loop = function(logicFn)
{
    if (this.stopped) return;

    var self = this;
    requestAnimationFrame(function() { self.loop(logicFn); });

    this.now = window.performance.now();
    if (this.now - this.then > this.interval)
    {
        this.then = this.now;
        if (logicFn) logicFn();
        this.refresh();
    }
};

LilCanvas.Core.prototype.refresh = function()
{
    var buffToRemove = [];
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    for (var i = 0; i < this.buffers.length; i++)
    {
        var buffer = this.buffers[i];
        if (buffer.toRemove)
        {
            buffToRemove.push(i);
        }
        else
        {
            buffer.refresh(this.ctx);
        }
        this.removeBuffers(buffToRemove);
    }
};


LilCanvas.Core.prototype.on = function(eventType, fn)
{
  this.canvas.addEventListener(eventType, fn);
};

LilCanvas.Buffer = function(x, y, width, height)
{
    this.element = document.createElement('canvas');
    this.ctx = this.element.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
    this.x = parseInt(x);
    this.y = parseInt(y);
    this.ctx.canvas.width  = parseInt(width);
    this.ctx.canvas.height = parseInt(height);
    this.objects = [];
    this.toRemove = false;
};

LilCanvas.Buffer.prototype.remove = function()
{
    this.toRemove = true;
};

LilCanvas.Buffer.prototype.addObject = function(obj)
{
    obj.toRemove = false;
    this.objects.push(obj);
};

LilCanvas.Buffer.prototype.addObjects = function(objArray)
{
    for (var i = 0; i < objArray.length; i++)
    {
        this.addObject(objArray[i]);
    }
};

LilCanvas.Buffer.prototype.removeObject = function(objId)
{
    this.objects.splice(objId, 1);
};

LilCanvas.Buffer.prototype.removeObjects = function(objIdArray)
{
    for (var i = 0; i < objIdArray.length; i++)
    {
        this.removeObject(objIdArray[i]);
    }
};

LilCanvas.Buffer.prototype.refresh = function(canvasCtx)
{
    var objToRemove = [];
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    for (var j = 0; j < this.objects.length; j++)
    {
        if (this.objects[j].toRemove)
        {
            objToRemove.push(j);
        }
        else if (this.objects[j].isVisible)
        {
            this.objects[j].draw(this.ctx);
        }
    }
    canvasCtx.drawImage(this.element, this.x, this.y);
    this.removeObjects(objToRemove);
};

LilCanvas.Point = function(x, y, alpha)
{
    this.x = parseInt(x);
    this.y = parseInt(y);
    this.alpha = typeof alpha !== 'undefined' ? parseFloat(alpha) : 1;
    this.isVisible = true;
    this.toRemove = false;
};
LilCanvas.Point.prototype.hide = function()
{
    this.isVisible = false;
}
LilCanvas.Point.prototype.show = function()
{
    this.isVisible = true;
}
LilCanvas.Point.prototype.remove = function()
{
    this.toRemove = true;
}

LilCanvas.GeoObj = function(x, y, color, full, alpha)
{
    LilCanvas.Point.call(this, x, y, alpha);
    this.color = color;
    this.full = typeof full !== 'undefined' ? full : true;
};
LilCanvas.GeoObj.prototype = new LilCanvas.Point();

LilCanvas.Circle = function(x, y, radius, color, full, alpha)
{
    LilCanvas.GeoObj.call(this, x, y, color, full, alpha);
    this.radius = parseInt(radius);
};
LilCanvas.Circle.prototype = new LilCanvas.GeoObj();
LilCanvas.Circle.prototype.draw = function(ctx)
{
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
    if (this.full)
    {
        ctx.fillStyle = this.color;
        ctx.fill();
    }
    else
    {
        ctx.strokeStyle = this.color;
        ctx.stroke();
    }
};

LilCanvas.Rectangle = function(x, y, width, height, color, full, alpha)
{
    LilCanvas.GeoObj.call(this, x, y, color, full, alpha);
    this.width = parseInt(width);
    this.height = parseInt(height);
};
LilCanvas.Rectangle.prototype = new LilCanvas.GeoObj();
LilCanvas.Rectangle.prototype.draw = function(ctx)
{
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.rect(this.x, this.y, this.width, this.height);
    if (this.full)
    {
        ctx.fillStyle = this.color;
        ctx.fill();
    }
    else
    {
        ctx.strokeStyle = this.color;
        ctx.stroke();
    }
};

LilCanvas.Sprite = function(x, y, width, height, image, nbFrames, alpha, animationSpeed)
{
    LilCanvas.Point.call(this, x, y, alpha);
    this.width = parseInt(width);
    this.height = parseInt(height);
    this.displayWidth = this.width;
    this.displayHeight = this.height;
    this.image = image;
    this.nbFrames = nbFrames ? parseInt(nbFrames) : 1;
    this.animationSpeed = animationSpeed ? parseFloat(animationSpeed) : 1;
    this.currentFrame = 0;
    this.row = 0;
    this.scale = 1;
    this.clipX = 0;
    this.clipY = 0;
    this.frozen = false;
};
LilCanvas.Sprite.prototype = new LilCanvas.Point();
LilCanvas.Sprite.prototype.freeze = function()
{
    this.frozen = true;
    return this;
};
LilCanvas.Sprite.prototype.unfreeze = function()
{
    this.frozen = false;
    return this;
};
LilCanvas.Sprite.prototype.stretch = function(width, height)
{
    this.displayWidth = parseInt(width);
    this.displayHeight = parseInt(height);
    return this;
};
LilCanvas.Sprite.prototype.setScale = function(scale)
{
    this.scale = parseFloat(scale);
    this.displayWidth = Math.round(this.width * this.scale);
    this.displayHeight = Math.round(this.height * this.scale);
    return this;
};
LilCanvas.Sprite.prototype.setRow = function(row, nbFrames)
{
    this.row = parseInt(row);
    this.clipY = this.row * this.height + 1;
    this.nbFrames = this.nbFrames = nbFrames ? parseInt(nbFrames) : this.nbFrames;
    this.currentFrame = 0;
    this.clipX = 0;
    return this;
};
LilCanvas.Sprite.prototype.resetAnimation = function()
{
    this.currentFrame = 0;
    this.clipX = 0;
    return this;
};
LilCanvas.Sprite.prototype.setAnimationSpeed = function(speed)
{
    this.animationSpeed = parseFloat(speed);
    return this;
};
LilCanvas.Sprite.prototype.animate = function()
{
    if (this.nbFrames <= 1 || this.frozen) return;
    if (this.currentFrame + this.animationSpeed >= this.nbFrames)
    {
        this.currentFrame = 0;
        this.clipX = 0;
    }
    else
    {
        this.currentFrame += this.animationSpeed;
        this.clipX = Math.floor(this.currentFrame) * this.width;
    }
};
LilCanvas.Sprite.prototype.draw = function(ctx)
{
    ctx.drawImage(this.image, this.clipX, this.clipY, this.width, this.height, this.x, this.y, this.displayWidth, this.displayHeight);
    this.animate();
};

LilCanvas.ImageLoader = function()
{
    this.promises = [];

    this.load = function(src)
    {
        var image = new Image;
        var promise = new Promise(function(resolve, reject)
        {
          image.src = src;
          image.onload = function()
          {
              resolve('Picture loaded');
          };
          image.onerror = function()
          {
              reject('Error loading the picture ' + src);
          };
        });
        this.promises.push(promise);
        return image;
    }

    this.done = function()
    {
      return Promise.all(this.promises);
    };
};

LilCanvas.KeyChecker = function()
{
    var keys = [];

    this.keydownListener = document.addEventListener("keydown",
    function(e)
    {
        keys[e.keyCode] = true;
    });

    this.keyUpListener = document.addEventListener("keyup",
    function(e)
    {
        keys[e.keyCode] = false;
    });

    this.isDown = function(key)
    {
        if (keys[key]) return true;
        return false;
    };
};
