=== LibreVideoJS HTML5 Player ===
Contributors: heckyel, jorgesumle
Donate link: https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=94ETCSCSGNQVJ&lc=AL&item_name=librevideojs&item_number=Apoyo%20a%20LibreVideoJS&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHosted
Tags: video, wpvideo, HTML5, videojs, mobile, playlists, embed video, librevideojs, player, video player, embed, lightweight, minimal, myvideo, responsive
requires at least: 4.2
Tested up to: 4.7.3
Stable tag: 1.2.2
License: GPLv3 or later
License URI: http://www.gnu.org/licenses/gpl-3.0.html

Embed video files with LibreVideoJS beautifully in WordPress, adaptable to different screen resolutions and compatible with LibreJS.

== Description ==

[LibreVideoJS HTML5 Player](https://wordpress.org/plugins/librevideojs-html5-player) is a plugin that supports playback of video available on desktops and mobile devices. Now it is very easy to embed video files that are hosted externally or internally using the library [LibreVideoJS](https://notabug.org/Heckyel/LibreVideoJS).

= LibreVideoJS HTML5 Player Features =

* Embed responsive videos.
* Embed videos in HTML5, compatible with all major browsers.
* Embed videos with Poster of image.
* Common hotkeys
* Play a video automatically when the page is processed.
* Embed videos uploaded to your media library of WordPress with direct links in the access code.
* Does not require to know a lot of programming, simply install and begin to embed videos.
* Lightweight and compatible with the latest version of WordPress.
* Clean and elegant player without any brand of water.
* Support for WebM, OGV and MP4 file types.

= Use the Plugin LibreVideoJS HTML5 Player =

To embed a video in a new post/page use the following Shortcode:

`[librevideojs_video url="http://example.com/wp-content/uploads/videos/myvideo.webm" url_calidad="1080p" code="webm"]`

Here, "url" is the location of the source file of WebM Video (VP8 and VP9 encoded). You need to replace the 'url' with the actual link of the video file.
When you don't want to use multiple resolutions, there is no need to write 'url_calidad' to specify the video quality.

= Video Shortcode Options =

The following options are compatible with the Shortcode.

**Resolutions and quality Selector**

You can specify a video file OGV in addition to the source WebM & OGV video files.
The parameter url is the URL of the video and url_calidad (example: 4k, 2k, 1080p, 720p, etc) is the quality of the video specified with the url parameter.
Do not forget to put code="webm" or code="ogv" depending on the format of your file.
Then it is also necessary to specify with the command selector="resolution to show" the default resolution (720p, 480p, 360p, 240p, 144p), for example:

`[librevideojs_video url="http://example.com/wp-content/uploads/videos/myvideo.webm" code="webm" url_calidad="1080p" selector="360p"]
[calidades lvjs_calidad="720p" src_video="video720.webm" lvjs_code="webm"]
[calidades lvjs_calidad="480p" src_video="video480.webm" lvjs_code="webm"]
[calidades lvjs_calidad="360p" src_video="video360.webm" lvjs_code="webm"]
[/librevideojs_video]
`

**Subtitles or captions**

To add subtitles use the command 'track' followed by the parameters: 'kind', 'subt', 'srclang', 'Label', 'default' (optional) from HTML.
It is recommended that the subtitles are in your web site, i.e., if your website is 'https://www.example.com/' subtitles should be in 'https://www.example.com/subtitles/mysubtitles.vtt' or in a similar URL. Subtitles will not be loaded if you import them from another website (http://www.another_website.com/subs/subtitles.vtt).

`[librevideojs_video url="http://example.com/wp-content/uploads/videos/myvideo.webm" url_calidad="1080p" code="webm" selector="360p"]
[track kind="captions" subt="http://localhost/web/wp-content/uploads/subtitles/en.vtt" srclang="en" label="English"]
[track kind="captions" subt="http://localhost/web/wp-content/uploads/subtitles/es.vtt" srclang="es" label="Spanish" default="true"]
[track kind="captions" subt="http://localhost/web/wp-content/uploads/subtitles/pt.vtt" srclang="pt" label="Portuguese"]
[/librevideojs_video]
`

**Skin**

To change the color and style of the player use 'skin', by adding the name of the style ('mixblue', 'mixgrey','mixpurple', 'mixred', 'mixteal', 'mixyellow', 'materialblue', 'materialgrey', 'materialpurple', 'materialred', 'materialteal', 'materialyellow'), example:

`[librevideojs_video url="myvideo.webm" code="webm" skin="mixteal"][/librevideojs_video]`

**Preload**

Specifies how the video must be loaded when you load the page. By default this is set to "Auto" (the video should be fully charged when the page is loaded). There area other options:

* "metadata" - only the metadata must be loaded when you load the page.
* "none" - the video should not be loaded when you load the page.

`[librevideojs_video url="http://example.com/wp-content/uploads/videos/myvideo.webm" preload="metadata" url_calidad="1080p" code="webm"]`

**Controls**

Specifies that the video controls must be shown. Its default value is "true". In order to hide the controls, set this parameter to "false".

`[librevideojs_video url="http://example.com/wp-content/uploads/videos/myvideo.webm" controls="false" url_calidad="1080p" code="webm"]`

When you disable the controls, users will not be able to interact with your videos. It is therefore recommended that you enable the playback without using the command controls.

**Auto-play**

Makes the video file to play automatically when the page is loaded.

`[librevideojs_video url="http://example.com/wp-content/uploads/videos/myvideo.webm" autoplay="true" url_calidad="1080p" code="webm"]`

**Poster**

Defines the image to display as a placeholder before the video is played.

`[librevideojs_video url="http://example.com/wp-content/uploads/videos/myvideo.webm" poster="http://example.com/wp-content/uploads/poster.jpg" url_calidad="1080p" code="webm"]`

**Loop**

Makes the video play again from the beginning when it finishes.

`[librevideojs_video url="http://example.com/wp-content/uploads/videos/myvideo.webm" loop="true" url_calidad="1080p" code="webm"]`

**Mute**

Specifies that the audio output of the video must be muted.

`[librevideojs_video url="http://example.com/wp-content/uploads/videos/myvideo.webm" muted="true" code="webm"]`

For detailed documentation, please visit the website of the plugin [LibreVideoJS HTML5 Player](https://notabug.org/Heckyel/librevideojs-html5-player)

**All**
`[librevideojs_video url="videooriginal.webm" code="webm" url_calidad="1080p" selector="480p"]
[calidades lvjs_calidad="720p" src_video="video720.webm" lvjs_code="webm"]
[calidades lvjs_calidad="480p" src_video="video480.webm" lvjs_code="webm"]
[calidades lvjs_calidad="360p" src_video="video360.webm" lvjs_code="webm"]
[track kind="captions" subt="http://localhost/web/wp-content/uploads/subtitles/en.vtt" srclang="en" label="English"]
[track kind="captions" subt="http://localhost/web/wp-content/uploads/subtitles/es.vtt" srclang="es" label="Spanish" default="true"]
[track kind="captions" subt="http://localhost/web/wp-content/uploads/subtitles/pt.vtt" srclang="pt" label="Portuguese"]
[/librevideojs_video]
`

= Hotkeys =

The video player that comes with this plugin enables some keyboard hotkeys when the player has focus:

* Space bar toggles play/pause.
* Right and Left Arrow keys seek the video forwards and back.
* Up and Down Arrow keys increase and decrease the volume.
* M key toggles mute/unmute.
* F key toggles fullscreen off and on. (Does not work in Internet Explorer, it seems to be a limitation where scripts cannot request fullscreen without a mouse click)
* Double-clicking with the mouse toggles fullscreen off and on.
* Number keys from 0-9 skip to a percentage of the video. 0 is 0% and 9 is 90%.

**Note: clicking any of the control buttons such as Play/Pause, Fullscreen, or Mute, will remove focus on the player
which appears to "break" the hotkeys.  This is for accessibility reasons so that people who do not use or know about
the hotkeys can still properly use the `Tab` key to highlight the control buttons and press `space` to toggle them.**

**To restore focus, just click on the video, or an empty part of the control bar at the bottom of the video player.**

== Installation ==

1. Go to the screen to add new plugins in the dashboard of WordPress
2. Click the tab of the load
3. Browse to the file for the plugin (librevideojs-html5-player.zip) in your computer
4. Click "Install Now", and then press the 'Enable' button

== Frequently Asked Questions ==

= Can this plugin be used to embed videos in Wordpress? =

Yes.

= Is it adaptive to different screen sizes? =

Yes.

= Can I embed videos with several resolutions with this plugin? =

Yes.

= Can I embed the subtitles in the video with this plugin? =

Yes.

== Screenshots ==

For screenshots, visit the page of the plugin [LibreVideoJS HTML5 Player](https://wordpress.org/plugins/librevideojs-html5-player/screenshots/)

1. screenshot-1.png
2. screenshot-2.png
3. screenshot-3.png
4. screenshot-4.png
5. screenshot-5.png
6. screenshot-6.png
7. screenshot-7.png
8. screenshot-8.png
9. screenshot-9.png
10. screenshot-10.png
11. screenshot-11.png
12. screenshot-12.png
13. screenshot-13.png
14. screenshot-14.png

== Upgrade Notice ==
None

== Changelog ==

= 1.2.2 =
* Correction style of play button
* Update languages

= 1.2.1 =
* Debugging Smart shortcode

= 1.2.0 =
* New Functionality - Hotkeys
* Debugging source code

= 1.1.2 =
* Patch librevideojs-html5-player.php
* Remove unused style

= 1.1.1 =
* Fixed - string PHP and HTML

= 1.1.0 =
* Smart shortcode (Load only when it is running)
* New multicolors skin-material and skin-mix
* Debugging cliplibrejs.dev.js

= 1.0.3 =
* Ordering the subtitles and tracks

= 1.0.2 =
* First Commit

== Video Tutorials ==

There are several video tutorials available. If you have made a video tutorial,
or if you know one which is not listed here, please let us know.
After the title of each video, you can find the version used.

= Spanish =

* [LibreVideoJS para Wordpress](http://www.roaming-initiative.net/mediagoblin/u/cybersy/m/librevideojs-para-wordpress/) (version 1.0.2)
* [Preguntas frecuentes y bonus de LibreVideoJS para Wordpress](http://www.roaming-initiative.net/mediagoblin/u/cybersy/m/preguntas-frecuentes-y-bonus-de-librevideojs-para-wordpress/) (version 1.0.2)

== Written tutorials ==

There are several written tutorials available. If you have written an article
or a tutorial, or if you know one which is not listed here, please let
us know.

= Spanish =

* [Sí, LibreVideoJS también puede reproducir vídeos de YouTube](http://www.freakspot.net/si-librevideojs-tambien-puede-reproducir-videos-de-youtube/)

== Demos ==

* [Freakspot.net](http://www.freakspot.net/locutus-de-gnu/)
* [Conocimientoslibres.tuxfamily.org](https://conocimientoslibres.tuxfamily.org/acerca-de/)
