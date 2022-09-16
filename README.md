# MMM-Selfieshot
Taking a Selfie with USB web cam or Raspberry Pi camera module on MagicMirror.

## Screenshot
![](https://raw.githubusercontent.com/eouia/MMM-Selfieshot/master/screenshot.png)


## New Updates
**`[1.0.4] - 2022-08=10`**
- Added: Feature to rotate the countdown and image preview for landscape magic mirrors.

**`[1.0.3] - 2020-06-02`**
- Added: Feature to put a touch-enabled icon to take a selfie.

**`[1.0.2] - 2020-03-23`**
- Added: Feature for showing last taken selfie.
    - TelegramBot command `/lastselfie`
		- Notification: `SELFIE_LAST`
- Added: Notification for shooting result. `SELFIE_RESULT` with payload `{uri, path}`		

**`[1.0.1] - 2020-03-23`**
- Added: Can upload photo to specific google photos via MMM-GooglePhotos(> v2.0.0)

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
git clone https://github.com/eouia/MMM-Selfieshot
cd MMM-Selfieshot
npm install
```

## Configuration
### Simple
> This module doesn't need `position` of module unless you're using the touch button.

```js
{
	disabled: false,
	module: "MMM-Selfieshot",
	config: {}
}
```
### Touch-Enabled
To place a button on the mirror that you can click or touch, you will have to include a position and the name of the [Font Awesome](https://fontawesome.com/icons?d=gallery&q=selfie) icon.
```js
{
  disabled: false,
  module: "MMM-Selfieshot",
  position: "bottom_left",
  config: {
    displayButton: "portrait"
  }
}
```

### Configuration Options
> These values are set as default, you don't need to copy all of these. Just pick what you need only and add it into your `config:{}`

| Parameter     | Default  | Description  |
|---------------|----------|---------------|
| debug | false | You can get a more detailed log for troubleshooting |
| storePath | "./photos" | You most likely won't need to modify this |
| width | 1280 | Width of captured image (may not be respected by camera) |
| height | 720 | Height of captured image (may not be respected by camera) |
| quality | 100 |   |
| device | null | Leave as `null` for the default camera. "USB Camera" or "/video/video11" for other device. See backend log to get your installed camera name. |
| shootMessage | "Smile!" | The message to display during the countdown. |
| shootCountdown | 5 | How many seconds in the countdown before the image is taken. |
| displayCountdown | true | |
| displayResult | true | If you set this to `false`, the module will not display what it saw. |
| rotateCountdown | "none" | Rotates the countdown & "shoot message". Designed for landscape Magic Mirrors. Valid options: "left", "right", "invert" |
| rotatePreview | "none" | Rotates the result image. Designed for landscape Magic Mirrors. Valid options: "left", "right", "invert" |
| playShutter | true | Play the sound of the camera shutter. |
| shutterSound | "shutter.mp3" | The sound to play for the shutter. Located in the module main directory. |
| useWebEndpoint | "selfie" | This will activate 'http://YOUR_MM_IP_OR_DOMAIN:PORT/selfie [POST]' as web API endpoint. |
| resultDuration | 1000 * 5 | How long to display the image (in milliseconds) |
| sendTelegramBot | true |  |
| sendMail | null | You can provide the configuration for NodeMailer (https://nodemailer.com/about/) |


### Note
- `width` & `height` : In some environment, resolution would be fixed so these value won't affect output.


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
    from: "youremail@gmail.com",
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
Your other module can make an order to take a picture (Button, Voice Commander, Sensors,...)
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
- `SELFIE_LAST` : You can display last photo taken on screen.


2. by `MMM-TelegramBot`
- `/selfie` or `/selfie 5` : Take a photo (with countdown)
- `/emptyselfie` : Remove all photos
- `/lastselfie` : Display last the last photo taken on screen and telegram.

3. by `HTTP Request`
- This will activate 'http://YOUR_MM_IP_OR_DOMAIN:PORT/selfie [POST]' as web API endpoint.
- If you don't need this, set it to `null`.

CURL example;
```sh
curl -d '{"shootCountdown":7}' -H "Content-Type: application/json" -X POST http://localhost:8080/selfie
```
You can use this feature for IFTTT or other program out of MagicMirror.

4. Photos will be stored in `/photos` directory. You can use `rsync` or any tools to share/send/sync with other storage. (Ask to your network/system admin.)

5. by `MMM-GooglePhotos`
- Photos will be uploaded to Google Photos album automatically.
