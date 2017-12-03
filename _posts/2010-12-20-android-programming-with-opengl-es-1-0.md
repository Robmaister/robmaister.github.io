---
layout: post
status: publish
published: true
comments: true
has-lightbox: true
title: Android programming with OpenGL ES 1.0
date: '2010-12-20 01:41:32 -0500'
tags: [software]
preview-img:
  url: /img/blog/2010/12/workingtextures.png
  alt: Working textures
---

[![Android Emulator][1]][1]{: data-lightbox="gallery"}
So I've dived right into OpenGL on the Android platform with a few of my friends. Currently we've got the following working:

 - fullscreen
 - almost completely OO (not encapsulated yet, for testing purposes and some of our code is temporarily placed where it shouldn't be)
 - using OpenGL ES 1.0
 - proper cartesian plane, with -y at the bottom
 - collision detection by Separating Axis Theorem(working on having them bounce back now)
 - movement/rotation/scaling with inerpolation
 - textures (currently 1, and planning on splitting into tileset)
 - touch-based camera motion (it's clamped right now, as in touching the very center of the screen returns camera to (0,0))
 - programmer art tileset, complete with shitty, hand-drawn numbers
 - a hot pink background color. I entered random values for the RGB values, ended up being pink. We looked up what hot pink was, adjusted the values. I don't know why we haven't changed it yet.

Expect to see more soon!

[1]: /img/blog/2010/12/workingtextures.png "Showing off textures"
