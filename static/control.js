(function(){
	function log() {
		if (window.console) {
			console.log.apply(console, arguments);
		}
	}
	// If bookmarklet called again, just re-show the QR
	window._BCC_ = function() {
		if (qr) qr.style.display = 'block';
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

	var channel, qr,
		match = qs.match(/c=([^&]+)/);

	if (match) {
		// The channel can be provided in the URL
		channel = match[1];
	} else if (localStorage._BRC_) {
		// Try to continue using the same channel
		channel = localStorage._BRC_;
	} else {
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
		qr = document.createElement('div');
		qr.innerHTML = channel+'<br/>';
		style(qr, {
			width: '150px',
			height: '175px',
			padding: '5px',
			textAlign: 'center',
			position:'fixed',
			top:'50px',
			left:'50%',
			marginLeft:'-75px',
			zIndex:9999,
			background:'black',
			color: 'white'
		});
		var data = base + '/remote?';
		if (!match) data += 'c='+channel+'&';
		data += qs;
		var img = document.createElement('img');
		style(img, {marginTop: '5px', cursor:'pointer'});
		img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data='+encodeURIComponent(data);
		img.onclick = function() {
			window.open(data);
		};
		qr.appendChild(img);
		document.body.appendChild(qr);
	}

	function hideQR() {
		qr.style.display = 'none';
	}

	function style(node, attrs) {
		for (var key in attrs) {
			node.style[key] = attrs[key];
		}
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