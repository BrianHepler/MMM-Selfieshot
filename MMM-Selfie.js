Module.register("MMM-Selfie", {
  defaults: {
    debug: true,
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
    playShutter: "shutter.mp3",
    useWebEndpoint: true,
    resultDuration: 1000 * 5,
    sendTelegramBot: true,
    sendMail: null, // or your email config (option for nodemailer https://nodemailer.com/about/)
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
    return ["MMM-Selfie.css"]
  },

  getCommands: function(commander) {
    commander.add({
      command: 'selfie',
      callback: 'cmdSelfie',
      description: "Take a selfie",
    })
    commander.add({
      command: 'emptyselfie',
      callback: 'cmdEmptySelfie',
      description: "Remove all selfie photos."
    })
  },

  cmdSelfie: function(command, handler) {
    var countdown = null
    if (Number(handler.args)) countdown = Number(handler.args)
    var session = Date.now()
    this.session[session] = handler
    this.shoot(countdown, session, "TELBOT")
  },

  cmdSelfieResult: function(session, path) {
    var handler = this.session[session]
    handler.reply("PHOTO_PATH", path)
    this.session[session] = null
    delete this.session[session]
  },

  cmdEmptySelfie: function(command, handler) {
    this.sendSocketNotification("EMPTY")
    handler.reply("TEXT", "done.")
  },

  start: function() {
    this.session = {}
    this.sendSocketNotification("INIT", this.config)
  },

  prepare: function() {
    var dom = document.createElement("div")
    dom.id = "SELFIE"
    var win = document.createElement("div")
    win.classList.add("window")
    var message = document.createElement("div")
    message.classList.add("message")
    message.innerHTML = this.config.shootMessage
    var count = document.createElement("div")
    count.classList.add("count")
    count.innerHTML = this.config.shootCountdown
    win.appendChild(message)
    win.appendChild(count)
    dom.appendChild(win)
    var shutter = document.createElement("audio")
    shutter.classList.add("shutter")
    if (this.config.playShutter) {
      shutter.src = "modules/MMM-Selfie/" + this.config.playShutter
    }
    dom.appendChild(shutter)
    var result = document.createElement("result")
    result.classList.add("result")
    dom.appendChild(result)
    document.body.appendChild(dom)
  },

  socketNotificationReceived: function(noti, payload) {
    if (noti == "SHOOT_RESULT") {
      this.postShoot(payload)
    }
    if (noti == "SELFIE_EMPTY_STORE") {
      this.sendSocketNotification("EMPTY")
    }
  },

  notificationReceived: function(noti, payload, sender) {
    if (noti == "DOM_OBJECTS_CREATED") {
      this.prepare()
      //this.shoot()
    }
    if (noti == "SELFIE_SHOOT") {
      var countdown = (payload.countdown) ? payload.countdown : null
      var session = null
      var ext = null
      if (typeof payload.callback == "function") {
        session = Date.now() + Math.round(Math.random() * 1000)
        this.session[session] = payload.callback
        ext = "CALLBACK"
      }
      this.shoot(countdown, session, ext)
    }
  },

  shoot: function(countdown=null, session=null, ext=null) {
    var showing = this.config.displayCountdown
    var sound = this.config.playShutter
    countdown = (countdown) ? countdown : this.config.shootCountdown
    var con = document.querySelector("#SELFIE")
    if (showing) con.classList.toggle("shown")
    var win = document.querySelector("#SELFIE .window")
    if (showing) win.classList.toggle("shown")
    const loop = (count) => {
      var c = document.querySelector("#SELFIE .count")
      c.innerHTML = count
      if (count < 0) {
        this.sendSocketNotification("SHOOT", {session:session, ext:ext})
        var shutter = document.querySelector("#SELFIE .shutter")
        if (sound) shutter.play()
        if (showing) win.classList.toggle("shown")
        if (showing) con.classList.toggle("shown")
      } else {
        setTimeout(()=>{
          count--
          loop(count)
        }, 1000)
      }
    }
    loop(countdown)
  },

  postShoot: function(result) {
    var showing = this.config.displayResult
    var con = document.querySelector("#SELFIE")
    if (showing) con.classList.toggle("shown")
    var rd = document.querySelector("#SELFIE .result")
    rd.style.backgroundImage = `url(modules/MMM-Selfie/photos/${result.uri})`
    if (showing) rd.classList.toggle("shown")
    setTimeout(()=>{
      if (showing) rd.classList.toggle("shown")
      if (showing) con.classList.toggle("shown")
    }, this.config.resultDuration)
    if (result.session) {
      if (result.ext == "TELBOT") {
        this.cmdSelfieResult(result.session, result.path)
      }
      if (result.ext == "CALLBACK") {
        if (this.session.hasOwnProperty(result.session)) {
          callback = this.session[result.session]
          callback({
            path: result.path,
            uri: result.uri
          })
          this.session[result.session] = null
          delete this.session[result.session]
        }
      }
    } else {
      if (this.config.sendTelegramBot) {
        this.sendNotification("TELBOT_TELL_ADMIN", {
          type: "PHOTO_PATH",
          path: result.path
        })
        this.sendNotification("TELBOT_TELL_ADMIN", "New Selfie")
      }
    }
  },
})
