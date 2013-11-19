(function(){

  var scripts = document.getElementsByTagName('script'),
    l = scripts.length;
  
  while (l--) {
    var src = scripts[l].src;
    if (src.indexOf('/_js/') !== -1) {
      var parts = src.split('/_js/');
      var base = parts[0];
      var channel = parts[1];
      break;
    }
  }

  if (!base) return alert('Failed to find script!');
  console.info('Loading Socket IO');

  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = base + '/socket.io/socket.io.js';
  script.onload = start;
  script.onerror = function() {
    alert('Failed to load socket io');
  };
  document.documentElement.lastChild.appendChild(script);

  function start() {
    console.info('Socket IO loaded on channel', channel);
    
    var socket = io.connect();
    socket.on('connect', function () {
        socket.emit('join', {type:'client', channel:channel});
    });
    socket.on('event', function (data) {
        trigger(data.code);
    });
  }

  function trigger(code) {
    console.log('Received key', code, 'on', channel);
    // FIXME: Doesn't work well
    try {
      var e = document.createEvent('KeyboardEvent');
      (e.initKeyEvent || e.initKeyboardEvent)('keyup', true, false, null, 0, false, 0, false, 0, 0);
    } catch (err) {
      e = document.createEvent('Events');
      e.initEvent( 'keyup', true, true );
    }

    e.keyCode = e.which = code;
    e.charCode = String.fromCharCode(code);

    var action = document.activeElement.dispatchEvent(e);
    if(action) {
    }
  }

})();