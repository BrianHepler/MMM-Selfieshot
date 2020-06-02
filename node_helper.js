const NodeWebcam = require( "node-webcam" );
const moment = require("moment");
const path = require("path");
const exec = require("child_process").exec;
var nodemailer = require('nodemailer');
const bodyParser = require("body-parser");

var log = () => {
	//do nothing
};

var NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
	start: function() {
		this.devices = [];
		this.device = false;

	},

	initialize: function(payload) {
		this.config = payload;
		if (payload.debug) {
			log = (...args) => {
				console.log("[SELFIE]", ...args);
			};
		}
		if (payload.useWebEndpoint) {
			log("Web server endpoint is activated:", `/${payload.useWebEndpoint} [POST]`);
			this.expressApp.use(bodyParser.json());
  		this.expressApp.use(bodyParser.urlencoded({extended: true}));
			this.expressApp.post("/" + payload.useWebEndpoint, (req, res) => {
				log("External request arrives from", req.ip);
				this.sendSocketNotification("WEB_REQUEST", req.body);
				res.status(200).send({status: 200});
			});
		}
		var Webcam = NodeWebcam.create({});
		Webcam.list((list)=>{
			log("Searching camera devices...");
			if (!list || list.length <= 0) {
				log ("Cannot find any camera in this computer.");
				return;
			}
			this.devices.concat(list);
			log("Detected devices:", list);
			if (payload.device) {
				var idx = list.indexOf(payload.device);
				if (idx !== -1) {
					this.device = list[idx];
					log(`'${payload.device}' will be used.`);
				} else {
					log(`Cannot find '${payload.device}' in the list. '${list[0]}' be selected as default.`);
				}
			} else {
				log(`Default camera '${list[0]}' will be used.`);
			}
			this.sendSocketNotification("INITIALIZED");
		});
	},

	socketNotificationReceived: function(noti, payload) {
    if (payload.debug) log("Notification received: " + noti);
		if (noti == "INIT") {
			this.initialize(payload);
		}
		if (noti == "SHOOT") {
			this.shoot(payload);
		}
		if (noti == "EMPTY") {
			var dir = path.resolve(__dirname, "photos");
			exec(`rm ${dir}/*.jpg`, (err, sto, ste)=>{
				log("Cleaning directory:", dir);
				if (err) this.log("Error:", err);
				if (sto) this.log(sto);
				if (ste) this.log(ste);
			});
		}
	},

	shoot: function(payload) {
		var uri = moment().format("YYMMDD_HHmmss") + ".jpg";
		var filename = path.resolve(__dirname, "photos", uri);
		var opts = Object.assign ({
			width: 1280,
			height: 720,
			quality: 100,
			delay: 0,
			saveShots: true,
			output: "jpeg",
			device: this.device,
			callbackReturn: "location",
			verbose: this.config.debug
		}, (payload.options) ? payload.options : {});
		NodeWebcam.capture(filename, opts, (err, data)=>{
			if (err) log("Error:", err);
			log("Photo is taken:", data);
			this.sendSocketNotification("SHOOT_RESULT", {
				path: data,
				uri: uri,
				session: payload.session
			});
			this.sendMail(data);
		});
	},

	sendMail: function(filepath) {
		if (this.config.sendMail && typeof this.config.sendMail == "object") {
			try {
				var transport = nodemailer.createTransport(this.config.sendMail.transport);
				var msg = Object.assign({}, this.config.sendMail.message, {attachments: [{path: filepath}]});
				transport.sendMail(msg, (err)=>{
					if (err) {
						log("Failed to send mail.");
						log("Error:", err);
						return;
					}
					log("Email sent.");
					return;
				});
			} catch (e) {
				log("Invalid mail account configuration.");
				log("Error:", e);
				return;
			}
		} else {
			return;
		}
	}
});
