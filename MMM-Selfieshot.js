/* eslint-disable eqeqeq */
/* eslint-disable prettier/prettier */
Module.register("MMM-Selfieshot", {
	defaults: {
		debug: false,
		storePath: "./photos",
		width:1280,
		height:720, // In some webcams, resolution ratio might be fixed so these values might not be applied.
		quality: 100, //Of course.
		device: null, // For default camera. Or,
		// device: "USB Camera" <-- See the backend log to get your installed camera name.
		shootMessage: "Smile!",
		shootCountdown: 5,
		displayCountdown: true,
		displayResult: true,
		displayButton: null, // null = no button or name of FontAwesome icon
		playShutter: true,
		shutterSound: "shutter.mp3",
		useWebEndpoint: "selfie", // It willl become `https://YOUR_MM_IP_OR_DOMAIN::PORT/selfie`
		resultDuration: 1000 * 5,
		sendTelegramBot: true,
		sendMail: null, // or your email config (option for nodemailer https://nodemailer.com/about/)
		rotateCountdown: "none", // rotates countdown display. "left", "right", "invert" also options
		rotatePreview: "none" // rotates preview display. "left", "right", "invert" also options
		/*
    sendMail: {
      transport: {
        host: 'smtp.gmail.com', // If required.
        port: 465, // If required.
        secure: true, // If required.
        auth: {
          user: "youremail@gmail.com",
          pass: "your gmail password"
        }
      },
      message: {
        from: "youremail@gmail.com"
        to: "who@where.com",
        subject: "Selfie",
        text: "New selfie.",
      }
    }
    */
		//In some environment (under firewall), you might get Connection Refused error. Allow the port.
		//gmail has many issues. If possible, use alternative services.
	},

	getStyles: function() {
		return ["MMM-Selfieshot.css", "font-awesome.css"];
	},

	getCommands: function(commander) {
		commander.add({
			command: 'selfie',
			callback: 'cmdSelfie',
			description: "Take a selfie.",
		});

		commander.add({
			command: 'emptyselfie',
			callback: 'cmdEmptySelfie',
			description: "Remove all selfie photos."
		});

		commander.add({
			command: 'lastselfie',
			callback: 'cmdLastSelfie',
			description: 'Display the last selfie shot taken.'
		});
	},

	cmdSelfie: function(command, handler) {
		var countdown = null;
		if (handler.args) countdown = handler.args;
		if (!countdown) countdown = this.config.shootCountdown;
		var session = Date.now();
		this.session[session] = handler;
		this.shoot({shootCountdown:countdown}, {key:session, ext:"TELBOT"});
	},

	cmdSelfieResult: function(key, path) {
		var handler = this.session[key];
		handler.reply("PHOTO_PATH", path);
		this.session[key] = null;
		delete this.session[key];
	},

	cmdLastSelfie: function(command, handler) {
		if (this.lastPhoto) {
			handler.reply("PHOTO_PATH", this.lastPhoto.path);
			this.showLastPhoto(this.lastPhoto);
		} else {
			handler.reply("TEXT", "Couldn't find the last selfie.");
		}
	},

	cmdEmptySelfie: function(command, handler) {
		this.sendSocketNotification("EMPTY");
		handler.reply("TEXT", "done.");
	},

	start: function() {
		this.session = {};
		this.sendSocketNotification("INIT", this.config);
		this.lastPhoto = null;
	},

	getDom: function() {
		if (this.config.displayButton != null) {
			var wrapper = document.createElement("div");
			// wrapper.innerHTML = "Take a Selfie";

			var img = document.createElement("span");
			img.className = "fa fa-" + this.config.displayButton + " fa-large";
			img.classList.add("large");

			var session = {};
			img.addEventListener("click", () => this.shoot(this.config, session));
			wrapper.appendChild(img);
			return wrapper;
		}
	},

	prepare: function() {
		var dom = document.createElement("div");
		dom.id = "SELFIE";
		var win = document.createElement("div");
		win.classList.add("window");
		var message = document.createElement("div");
		message.classList.add("message");
		message.innerHTML = this.config.shootMessage;
		var count = document.createElement("div");
		count.classList.add("count");
		count.innerHTML = this.config.shootCountdown;

		switch (this.config.rotateCountdown) {
			case "right":
				win.style.transform = "rotate(90deg)";
				break;
			case "left":
				win.style.transform = "rotate(-90deg)";
				break;
			case "invert":
				win.style.transform = "rotate(180deg)";
		}

		win.appendChild(message);
		win.appendChild(count);
		dom.appendChild(win);

		var shutter = document.createElement("audio");
		shutter.classList.add("shutter");
		if (this.config.playShutter) {
			shutter.src = "modules/MMM-Selfieshot/" + this.config.shutterSound;
		}
		dom.appendChild(shutter);

		var result = document.createElement("result");
		result.classList.add("result");

		dom.appendChild(result);
		document.body.appendChild(dom);
	},

	socketNotificationReceived: function(noti, payload) {
		if (noti == "SHOOT_RESULT") {
			this.postShoot(payload);
		}
		if (noti == "WEB_REQUEST") {
			this.shoot(payload);
		}
	},

	notificationReceived: function(noti, payload, sender) {
		if (noti == "DOM_OBJECTS_CREATED") {
			this.prepare();
			//this.shoot()
		}
		if (noti == "SELFIE_SHOOT") {
			var session = {};
			var pl = {
				option: {},
				callback:null,
			};
			pl = Object.assign({}, pl, payload);
			if (typeof pl.callback == "function") {
				key = Date.now() + Math.round(Math.random() * 1000);
				this.session[key] = pl.callback;
				session["key"] = key;
				session["ext"] = "CALLBACK";
			}
			this.shoot(pl.option, session);
		}
		if (noti == "SELFIE_EMPTY_STORE") {
			this.sendSocketNotification("EMPTY");
		}
		if (noti == "SELFIE_LAST") {
			this.showLastPhoto(this.lastPhoto);
		}
	},

	shoot: function(option={}, session={}) {
		this.sendNotification("SELFIE_START");
		var showing = (option.hasOwnProperty("displayCountdown")) ? option.displayCountdown : this.config.displayCountdown;
		var sound = (option.hasOwnProperty("playShutter")) ? option.playShutter : this.config.playShutter;
		var countdown = (option.hasOwnProperty("shootCountdown")) ? option.shootCountdown : this.config.shootCountdown;
		var rotatePreview = (option.hasOwnProperty("rotatePreview")) ? option.rotatePreview : this.config.rotatePreview;
		var rotateCountdown = (option.hasOwnProperty("rotateCountdown")) ? option.rotateCountdown : this.config.rotateCountdown;
		if (option.hasOwnProperty("displayResult")) session["displayResult"] = option.displayResult;
		var con = document.querySelector("#SELFIE");
		if (showing) con.classList.toggle("shown");
		var win = document.querySelector("#SELFIE .window");
		if (showing) win.classList.toggle("shown");

		const loop = (count) => {
			var c = document.querySelector("#SELFIE .count");
			c.innerHTML = count;
			if (count < 0) {
				this.sendSocketNotification("SHOOT", {
					option: option,
					session: session
				});

				var shutter = document.querySelector("#SELFIE .shutter");
				if (sound) shutter.play();
				if (showing) win.classList.toggle("shown");
				if (showing) con.classList.toggle("shown");
			} else {
				setTimeout(()=>{
					count--;
					loop(count);
				}, 1000);
			}
		};
		loop(countdown);
	},

	postShoot: function(result) {

		var at = false;
		var showing = true;
		if (result.session) {
			if (result.session.hasOwnProperty("displayResult")) { showing = result.session.displayResult; }
			if (result.session.ext == "TELBOT") {
				at = true;
				this.cmdSelfieResult(result.session.key, result.path);
			}
			if (result.session.ext == "CALLBACK") {
				if (this.session.hasOwnProperty(result.session.key)) {
					callback = this.session[result.session.key];
					callback({
						path: result.path,
						uri: result.uri
					});
					this.session[result.session.key] = null;
					delete this.session[result.session.key];
				}
			}
		}

		if (this.config.sendTelegramBot && !at) {
			this.sendNotification("TELBOT_TELL_ADMIN", {
				type: "PHOTO_PATH",
				path: result.path
			});
			this.sendNotification("TELBOT_TELL_ADMIN", "New Selfie");
		}
		this.sendNotification("SELFIE_RESULT", result);
		this.sendNotification("GPHOTO_UPLOAD", result.path);
		this.lastPhoto = result;
		if (showing == true) {this.showLastPhoto(result); }
	},

	showLastPhoto: function(result) {
		if (this.config.debug) console.log("Showing last photo.");
		var showing = this.config.displayResult;
		var con = document.querySelector("#SELFIE");
		if (showing) con.classList.toggle("shown");
		var rd = document.querySelector("#SELFIE .result");
		rd.style.backgroundImage = `url(modules/MMM-Selfieshot/photos/${result.uri})`;

		switch (this.config.rotatePreview) {
			case "right":
				rd.style.transform = "rotate(90deg)";
				break;
			case "left":
				rd.style.transform = "rotate(-90deg)";
				break;
			case "invert":
				rd.style.transform = "rotate(180deg)";
		}

		if (showing) rd.classList.toggle("shown");
		setTimeout(()=>{
			if (showing) rd.classList.toggle("shown");
			if (showing) con.classList.toggle("shown");
		}, this.config.resultDuration);
	}
});
