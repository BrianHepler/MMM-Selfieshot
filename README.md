# MMM-Selfie
Taking a Selfie with USB cam on MagicMirror.


## Installation
### Dependencies
1. For Raspbian / Linux
```sh
sudo apt-get install fswebcam
```

2. For Mac OSX
```sh
brew install imagesnap
```

### Install
```sh
cd <YOUR_MAGIC_MIRROR_DIRECTORY>/modules
git clone https://github.com/eouia/MMM-Selfie
cd MMM-Selfie
npm install
```

## Configuration
### Simple
> This module doesn't need `position` of module.

```js
{
	disabled: false,
	module: "MMM-Selfie",
	config: {}
}
```

### Defaults and Details
> These values are set as default, you don't need to copy all of these. Just pick what you need only and add it into your `config:{}`

```js
debug: false, // You can get more detailed log. If you have an issue, try to set this to true.
storePath: "./photos", // No need to modify.
width:1280,
height:720, // In some webcams, resolution ratio might be fixed so these values might not be applied.
quality: 100, //Of course.
device: null, // `null` for default camera. Or,
// device: "USB Camera" or "/video/video11" <-- See the backend log to get your installed camera name.
shootMessage: "Smile!",
shootCountdown: 5, // 5,4,3,2,1,0 then shutter.
displayCountdown: true,
displayResult: true,
playShutter: true,
shutterSound: "shutter.mp3",
useWebEndpoint: true, // You can activate this module with external HTTP method.
resultDuration: 1000 * 5,
sendTelegramBot: true,
sendMail: null, // or your email config (option for nodemailer https://nodemailer.com/about/)
```

### Note
- `width` & `height` : In some environment, resolution would be fixed so these value couldn't affect.


### sendMail
If you want to send a photo taken through mail, set for your environment like this example.
```js
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
```
- For details; read https://nodemailer.com/about/
- Your firewall could block mail. Check your network status.
- Use alternative than gmail. Above is just an example.
- Or any PR will be welcome to make this things simple.


## How to use
1. by `notification` **SELFIE_SHOOT**
- Your other module can make an order to take a picture (Button, Voice Commander, Sensors,...)
```js
this.sendNotification("SELFIE_SHOOT")
//or
this.sendNotification("SELFIE_SHOOT", {
  option: {
    shootCountdown: 1,
    displayResult: false,
    playShutter: false,
    displayCountdown: false,
    // only these 4 properties are available.
  }
})
//or
this.sendNotification("SELFIE_SHOOT", {
  option: { ... },
  callback: (result) => {
    console.log(result) // It will have result.path and result.uri
    this.doSomething(result)
  }
})
```
- `SELFIE_EMPTY_STORE` : You can remove all photos in store directory.



2. by `MMM-TelegramBot`
- `/selfie` or `/selfie 5` : Take a photo (with countdown)
- `/emptyselfie` : Remove all photos

3. by `HTTP Request`
- With `useWebEndpoint:true`, HTTP request via `https://YOUR_MIRROR_IP_OR_DOMAIN/selfie` could be obtained.

For example;
```sh
curl -d '{
  \ "shootCountdown":3, "displayCountdown":false, "playShutter":false, "displayResult":false
  \ }' -H "Content-Type: application/json" -X POST http://localhost:8080/selfie
```
You can use this for IFTTT or other program out of MagicMirror.

4. Photos will be stored in `/photos` directory. You can use `rsync` or any tools to share/send/sync with others.

5. (**NOT IMPLEMENT YET / TODO**) by `MMM-GooglePhotos`
- Photos will be uploaded to Google Photos album automatically.
- I'll implement this feature someday after rebuilding `MMM-GooglePhotos`.


## TODO
- Upload to Google Photos album
- Native Pi camera support. (I have no pi camera at this moment, so I can't implement. Or, any PR will be welcome.)
