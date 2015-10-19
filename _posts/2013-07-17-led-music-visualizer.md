---
layout: post
status: publish
published: true
comments: true
title: LED Music Visualizer
date: '2013-07-17 16:17:00 -0400'
tags: [Hardware]
preview-img:
  url: /img/blog/2013/07/IMG_3064.jpg
  alt: LED strips
---

I've spent the past few days finally working on the music visualizer that I've
wanted to make for well over a year now. While there are a few issues,
it still looks beautiful, so I decided to call the first version of this
project "done".

------------------------------------------------------------------------------

<iframe width="420" height="315" src="http://www.youtube.com/embed/FjP1wSDdw-c" frameborder="0" allowfullscreen="allowfullscreen"> </iframe>

As the video shows, the visualizer doesn't require much hardware knowledge. So
long as you have the equipment to do some soldering (or at least a friend who
does), this project is entirely viable.

### Materials

 - 1x Arduino UNO - $20-$30
 - 1x [ShiftyVU shield][1] - $19.99
 - 2x [LPD8806 LED strip][2] - $29.99/ea.
 - 1x [5V 2A power supply][3] - $9.95
 - 1x [2.1mm jack to screw terminal block converter][4] - $2.00
 - 1x [4-pin JST SM Plug][5] - $1.50 (optional)
 - 1x 3.5mm stereo Y splitter - $3-$5
 - 1x 3.5mm stereo cable - $3-$5

### Setup

![][6]

 1. Solder on the header pins that came with the ShiftyVU shield and fit on
    top of Arudino.
 2. Replace the audio output from your computer with the Y splitter. Plug your
    normal output as well as the extra cable into the splitter. The extra
	cable plugs into the ShiftyVU shield.
 3. Desolder the LED strips from each other. They should come in sets of 16
    LEDs. Cut each one in half for 8 LEDs per strip.
 4. Lay out the strips where you want them to be and measure how much wire
    you'll need. The bars don't necessarily need to be soldered in the same
	direction. In my case, every other strip is backwards. This is very easy
	to account for in software.
 5. Cut and strip all the wire you need. Solder the LED strips together with
    the wires, making sure you're always connecting an output to an input
	(marked by "CO/DO" and "CI/DI" respectively).
	[Here's the Adafruit article on wiring this particular LED strip][7].
 6. Optionally, solder the JST SM plug to the input of the first strip. That
    way you can unplug the LEDs if it's ever necessary.
	![The way I laid out my LEDs][8]
 7. Plug in the power supply to the 2.1mm jack to screw terminal block
    converter. Attach a red wire to the + block and a black one to the -
	block. The red wire can go directly to the +5V on the LEDs, but the black
	one must be in a common ground with the Arudino. Luckily, the Arduino has
	2 GND ports, so plug the black wire to one of those ports, and then run
	another black wire from the other GND pin to the LED's GND wire.
 8. Plug the data wire (DI, green wire) into the Arduino's digital pin 2 and
    the clock wire (CI, yellow wire) into digital pin 3.
 9. Download the source code from [my GitHub repository][9], follow the
    installation instructions, then upload it to your Arduino.
 10. Put on some music and stare!
 
![][10]

In the next version of this project, I'm planning on building a small circuit
to read the audio in myself. As I explain in the video, the ShiftyVU does some
filtering of the audio that doesn't work well with spectrum analysis, but is
good enough to make something visually pleasing.

### Source Code

[<i class="fa fa-github"></i> Github][9]{:class="button"}

In case you glanced over the setup section.

### Progress

Here are some of the pictures I posted on Facebook and the videos I posted on
Instagram as I was working on the project.

![][11]
![][12]

<blockquote class="instagram-media" data-instgrm-captioned data-instgrm-version="5" style=" background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:658px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);"><div style="padding:8px;"> <div style=" background:#F8F8F8; line-height:0; margin-top:40px; padding:50% 0; text-align:center; width:100%;"> <div style=" background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAsCAMAAAApWqozAAAAGFBMVEUiIiI9PT0eHh4gIB4hIBkcHBwcHBwcHBydr+JQAAAACHRSTlMABA4YHyQsM5jtaMwAAADfSURBVDjL7ZVBEgMhCAQBAf//42xcNbpAqakcM0ftUmFAAIBE81IqBJdS3lS6zs3bIpB9WED3YYXFPmHRfT8sgyrCP1x8uEUxLMzNWElFOYCV6mHWWwMzdPEKHlhLw7NWJqkHc4uIZphavDzA2JPzUDsBZziNae2S6owH8xPmX8G7zzgKEOPUoYHvGz1TBCxMkd3kwNVbU0gKHkx+iZILf77IofhrY1nYFnB/lQPb79drWOyJVa/DAvg9B/rLB4cC+Nqgdz/TvBbBnr6GBReqn/nRmDgaQEej7WhonozjF+Y2I/fZou/qAAAAAElFTkSuQmCC); display:block; height:44px; margin:0 auto -44px; position:relative; top:-22px; width:44px;"></div></div> <p style=" margin:8px 0 0 0; padding:0 4px;"> <a href="https://instagram.com/p/br14-qL2tJ/" style=" color:#000; font-family:Arial,sans-serif; font-size:14px; font-style:normal; font-weight:normal; line-height:17px; text-decoration:none; word-wrap:break-word;" target="_blank">dat VU meter #arduino #daftpunk</a></p> <p style=" color:#c9c8cd; font-family:Arial,sans-serif; font-size:14px; line-height:17px; margin-bottom:0; margin-top:8px; overflow:hidden; padding:8px 0 7px; text-align:center; text-overflow:ellipsis; white-space:nowrap;">A video posted by Robert Rouhani (@robertrouhani) on <time style=" font-family:Arial,sans-serif; font-size:14px; line-height:17px;" datetime="2013-07-12T23:52:54+00:00">Jul 12, 2013 at 4:52pm PDT</time></p></div></blockquote>
<script async defer src="//platform.instagram.com/en_US/embeds.js"></script>

<blockquote class="instagram-media" data-instgrm-captioned data-instgrm-version="5" style=" background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:658px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);"><div style="padding:8px;"> <div style=" background:#F8F8F8; line-height:0; margin-top:40px; padding:50% 0; text-align:center; width:100%;"> <div style=" background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAsCAMAAAApWqozAAAAGFBMVEUiIiI9PT0eHh4gIB4hIBkcHBwcHBwcHBydr+JQAAAACHRSTlMABA4YHyQsM5jtaMwAAADfSURBVDjL7ZVBEgMhCAQBAf//42xcNbpAqakcM0ftUmFAAIBE81IqBJdS3lS6zs3bIpB9WED3YYXFPmHRfT8sgyrCP1x8uEUxLMzNWElFOYCV6mHWWwMzdPEKHlhLw7NWJqkHc4uIZphavDzA2JPzUDsBZziNae2S6owH8xPmX8G7zzgKEOPUoYHvGz1TBCxMkd3kwNVbU0gKHkx+iZILf77IofhrY1nYFnB/lQPb79drWOyJVa/DAvg9B/rLB4cC+Nqgdz/TvBbBnr6GBReqn/nRmDgaQEej7WhonozjF+Y2I/fZou/qAAAAAElFTkSuQmCC); display:block; height:44px; margin:0 auto -44px; position:relative; top:-22px; width:44px;"></div></div> <p style=" margin:8px 0 0 0; padding:0 4px;"> <a href="https://instagram.com/p/buI2E2L2qP/" style=" color:#000; font-family:Arial,sans-serif; font-size:14px; font-style:normal; font-weight:normal; line-height:17px; text-decoration:none; word-wrap:break-word;" target="_blank">Still a VU meter, but making progress... #arduino #musicvisualizer #parovstelar</a></p> <p style=" color:#c9c8cd; font-family:Arial,sans-serif; font-size:14px; line-height:17px; margin-bottom:0; margin-top:8px; overflow:hidden; padding:8px 0 7px; text-align:center; text-overflow:ellipsis; white-space:nowrap;">A video posted by Robert Rouhani (@robertrouhani) on <time style=" font-family:Arial,sans-serif; font-size:14px; line-height:17px;" datetime="2013-07-13T21:17:01+00:00">Jul 13, 2013 at 2:17pm PDT</time></p></div></blockquote>
<script async defer src="//platform.instagram.com/en_US/embeds.js"></script>

<blockquote class="instagram-media" data-instgrm-captioned data-instgrm-version="5" style=" background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:658px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);"><div style="padding:8px;"> <div style=" background:#F8F8F8; line-height:0; margin-top:40px; padding:50% 0; text-align:center; width:100%;"> <div style=" background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAsCAMAAAApWqozAAAAGFBMVEUiIiI9PT0eHh4gIB4hIBkcHBwcHBwcHBydr+JQAAAACHRSTlMABA4YHyQsM5jtaMwAAADfSURBVDjL7ZVBEgMhCAQBAf//42xcNbpAqakcM0ftUmFAAIBE81IqBJdS3lS6zs3bIpB9WED3YYXFPmHRfT8sgyrCP1x8uEUxLMzNWElFOYCV6mHWWwMzdPEKHlhLw7NWJqkHc4uIZphavDzA2JPzUDsBZziNae2S6owH8xPmX8G7zzgKEOPUoYHvGz1TBCxMkd3kwNVbU0gKHkx+iZILf77IofhrY1nYFnB/lQPb79drWOyJVa/DAvg9B/rLB4cC+Nqgdz/TvBbBnr6GBReqn/nRmDgaQEej7WhonozjF+Y2I/fZou/qAAAAAElFTkSuQmCC); display:block; height:44px; margin:0 auto -44px; position:relative; top:-22px; width:44px;"></div></div> <p style=" margin:8px 0 0 0; padding:0 4px;"> <a href="https://instagram.com/p/bw3Z3Xr2qG/" style=" color:#000; font-family:Arial,sans-serif; font-size:14px; font-style:normal; font-weight:normal; line-height:17px; text-decoration:none; word-wrap:break-word;" target="_blank">My project, now with 100% more FFT and a better color gradient algorithm #arduino #colors #musicvisualizer #justice</a></p> <p style=" color:#c9c8cd; font-family:Arial,sans-serif; font-size:14px; line-height:17px; margin-bottom:0; margin-top:8px; overflow:hidden; padding:8px 0 7px; text-align:center; text-overflow:ellipsis; white-space:nowrap;">A video posted by Robert Rouhani (@robertrouhani) on <time style=" font-family:Arial,sans-serif; font-size:14px; line-height:17px;" datetime="2013-07-14T22:42:20+00:00">Jul 14, 2013 at 3:42pm PDT</time></p></div></blockquote>
<script async defer src="//platform.instagram.com/en_US/embeds.js"></script>

<blockquote class="instagram-media" data-instgrm-captioned data-instgrm-version="5" style=" background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:658px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);"><div style="padding:8px;"> <div style=" background:#F8F8F8; line-height:0; margin-top:40px; padding:50% 0; text-align:center; width:100%;"> <div style=" background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAsCAMAAAApWqozAAAAGFBMVEUiIiI9PT0eHh4gIB4hIBkcHBwcHBwcHBydr+JQAAAACHRSTlMABA4YHyQsM5jtaMwAAADfSURBVDjL7ZVBEgMhCAQBAf//42xcNbpAqakcM0ftUmFAAIBE81IqBJdS3lS6zs3bIpB9WED3YYXFPmHRfT8sgyrCP1x8uEUxLMzNWElFOYCV6mHWWwMzdPEKHlhLw7NWJqkHc4uIZphavDzA2JPzUDsBZziNae2S6owH8xPmX8G7zzgKEOPUoYHvGz1TBCxMkd3kwNVbU0gKHkx+iZILf77IofhrY1nYFnB/lQPb79drWOyJVa/DAvg9B/rLB4cC+Nqgdz/TvBbBnr6GBReqn/nRmDgaQEej7WhonozjF+Y2I/fZou/qAAAAAElFTkSuQmCC); display:block; height:44px; margin:0 auto -44px; position:relative; top:-22px; width:44px;"></div></div> <p style=" margin:8px 0 0 0; padding:0 4px;"> <a href="https://instagram.com/p/bz2Y-sL2nz/" style=" color:#000; font-family:Arial,sans-serif; font-size:14px; font-style:normal; font-weight:normal; line-height:17px; text-decoration:none; word-wrap:break-word;" target="_blank">Now the LEDs are mounted under the desk. It&#39;s impossible to tell from the video, but the frosted glass diffuses the light in a very cool way. #arduino #musicvisualizer #colors #digitalism</a></p> <p style=" color:#c9c8cd; font-family:Arial,sans-serif; font-size:14px; line-height:17px; margin-bottom:0; margin-top:8px; overflow:hidden; padding:8px 0 7px; text-align:center; text-overflow:ellipsis; white-space:nowrap;">A video posted by Robert Rouhani (@robertrouhani) on <time style=" font-family:Arial,sans-serif; font-size:14px; line-height:17px;" datetime="2013-07-16T02:31:12+00:00">Jul 15, 2013 at 7:31pm PDT</time></p></div></blockquote>
<script async defer src="//platform.instagram.com/en_US/embeds.js"></script>

[1]:  http://macetech.com/store/index.php?main_page=product_info&products_id=11
[2]:  http://www.adafruit.com/products/306
[3]:  http://www.adafruit.com/products/276
[4]:  http://www.adafruit.com/products/368
[5]:  http://www.adafruit.com/products/578
[6]:  /img/blog/2013/07/IMG_3135.jpg
[7]:  http://learn.adafruit.com/digital-led-strip/wiring
[8]:  /img/blog/2013/07/IMG_3140.jpg
[9]:  https://github.com/Robmaister/LEDMusicVisualizer
[10]: /img/blog/2013/07/IMG_3258.jpg
[11]: /img/blog/2013/07/IMG_3064.jpg
[12]: /img/blog/2013/07/IMG_3132.jpg


