(function(){
	function log() {
		if (window.console) {
			console.log.apply(console, arguments);
		}
	}
	// If bookmarklet called again, just re-show the QR
	window._BCC_ = function() {
		if (img) img.style.display = 'block';
	};

	var scripts = document.getElementsByTagName('script'),
		l = scripts.length;
	
	while (l--) {
		var src = scripts[l].src;
		if (src.indexOf('/_control?') !== -1) {
			var parts = src.split('/_control?');
			var base = parts[0];
			var qs = parts[1];
			break;
		}
	}

	if (!base) return alert('Failed to find script!');

	log('Loading Socket IO');

	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = base + '/socket.io/socket.io.js';
	script.onload = start;
	script.onerror = function() {
		alert('Failed to load socket io');
	};
	document.documentElement.lastChild.appendChild(script);

	var channel = localStorage._BRC_, img;
	// Try to continue using the same channel
	if (!channel) {
		channel = localStorage._BRC_ = generateChannel();
	}

	//- Socket IO

	function generateChannel() {
		var chars = 'abcdefghijklmnopqrsuvwxyzABCDEFGHIJKLMNOPQRSUVWXYZ0123456789';
		return [0,0,0,0,0].map(function() {
			return chars.charAt(Math.floor(Math.random() * chars.length));
		}).join('');
	}

	function start() {
		console.info('Socket IO loaded on channel', channel);
		
		var socket = io.connect(base);
		socket.on('connect', function () {
			socket.emit('join', {type:'client', channel:channel});
		});
		socket.on('join', function (data) {
			if (data.type === 'remote') {
				log('Remote connected');
				hideQR();
			}
		});
		socket.on('event', function (data) {
			hideQR();
			var code = data.code;
			var flags = parse(code);
			log('Received', flags || code, 'on', channel);

			if (flags) {
				trigger('keydown', flags);
				trigger('keyup', flags);
				trigger('keypress', flags);
			} else {
				click(code);
			}
		});

		showQR();
	}


	function parse(code) {
		if (!isNaN(code) || /^([csa]\+){0,3}\d+$/.test(code)) {
			var f = {};
			var p = code.split('+');
			f.code = parseInt(p.pop(), 10);
			p.forEach(function(k) { f[k] = true; });
			return f;
		}
		return null;
	}

	//- Show QR code to controller

	function showQR() {
		window._BCIMG_ = img = new Image();
		var sty = img.style;
		sty.position = 'fixed';
		sty.top = '50px';
		sty.left = '50%';
		sty.marginLeft = '-75px';
		sty.cursor = 'pointer';
		sty.zIndex = 9999;
		sty.background = 'black';
		sty.padding = '5px';
		img.onclick = function() {
			// TEMP
			window.open(data);
		};
		var data = base + '/remote?channel='+channel+'&'+qs;
		img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data='+encodeURIComponent(data);
		document.body.appendChild(img);
	}

	function hideQR() {
		img.style.display = 'none';
	}

	//- Trigger fake events

	function trigger(event, flags) {
		// FIXME: Doesn't work well
		try {
			var e = document.createEvent('KeyboardEvent');
			(e.initKeyEvent || e.initKeyboardEvent)(event, true, false, null, 0, false, 0, false, 0, 0);
		} catch (err) {
			e = document.createEvent('Events');
			e.initEvent(event, true, true );
		}

		e.keyCode = e.which = flags.code;
		e.charCode = String.fromCharCode(flags.code);
		e.ctrlKey = e.metaKey = !!flags.c;
		e.shiftKey = !!flags.s;
		e.altKey = !!flags.a;

		/*var action = */document.activeElement.dispatchEvent(e);
	}

	function click(selector) {
		log('Received click for', selector, 'on', channel);
		if (selector.charAt(0) === '_') {
			selector = '#'+selector.slice(1);
		}
		var node = document.querySelector(selector);
		if (!node) return log('Element not found', selector);
		node.click();
	}

})();