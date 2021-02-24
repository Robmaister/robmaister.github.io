---
layout: post
status: publish
published: true
comments: true
has-lightbox: true
title: The Last 6 Months
date: '2013-05-22 21:52:58 -0400'
tags: [software]
preview-img:
  url: /img/blog/2013/05/TopHat-2013-05-20-22.26.31.7624.png
  alt: TopHat terrain
---

It's been a busy few months for me, I haven't had a whole lot of time to write
blog posts as I finished my first semester at RPI, had an action-packed winter
break, and completed my first year at RPI. So here's one really long post
about everything I would have posted individually had I the time.

------------------------------------------------------------------------------

I had two final projects due at the end of last semester that were games. One
was for *Intro to Game Design*, where I chose to focus on the mechanics and
technical aspects of the game, the other was for *Art for Interactive Media*,
where we had to focus on the aesthetics, specifically pixel art. The source
code for both are available on GitHub, as [igd-final][1] and [afim-final][2],
respectively. I spent a disproportionate amount of time on these projects,
completing the *Art for Interactive Media* project in a matter of hours but
spending several days on the *Intro to Game Design* one.

[![][3]][3]{: data-lightbox="gallery"}

My *Intro to Game Design* project was a puzzle game with the primary mechanic
of failed attempts acting as agents in the current attempt. The game stores
all your keypresses (compressed by number of frames held in a run-length
encoding fashion) in a lifetime and stores them. When you die, it copies them
 to a list of previous lives. Every frame the list of lives is iterated over
and and the keypresses are applied to a separate Player instance. The previous
life Players interact with the world as the current Player would, meaning that
changing the state of the puzzle may result in previous lives dying early or
being stuck where they wouldn't have been earlier. The idea of the game is to
force the player to die multiple times in order to be able to complete the
level. Making the previous lives interact with the world as it is in the
current life gives the game an interesting challenge where you have to worry
not only about getting your current life to where it needs to go but also to
make sure that you don't mess up the previous lives and get yourself stuck.

I only had time to make 2 very simple levels, but still found it difficult to
design levels that were difficult without being diabolical or relying on
perfect timing. The goal of the project was to make a game based off one of
two (or both) randomly selected words, of which mine were **Failure** and
**Propagate**. I felt like I succeeded in that goal, as my game requires
failure to succeed, and that your failed attempts propagated through the time
that you spend solving the puzzle.

[![][4]][4]{: data-lightbox="gallery"}

My *Art for Interactive Media* project was a much smaller project in which I
attempted to do pixel art. The game is very simple and was made in only a few
hours. The point of it is to build a gingerbread house by clicking on tiles in
under 30 seconds. You get a score based on how similar your gingerbread house
is to a reference one stored in a file. This game could have used a lot of
additional work, the most important bit being what happens when you click on
an incorrect tile. I should have some logic to push the boundaries of the
house further away instead of just making a floating gingerbread block there.
I doubt I'll really have much time to go back and add anything or fix any of
the flaws, as there will always be something more important to work on, but
you never know, maybe I'll use it as a way to transition back to Python and
pygame in the future or something. I'm not that great at pixel art and I'm
fine with that, I'm mostly interested in 3d graphics anyways. If anything, I'd
work on generating 3d gingerbread houses or something really cool like that.

------------------------------------------------------------------------------

Throughout everything, I've also been making steady progress on that game I'm
working on with friends, which we're calling **TopHat** for now. We've got a
[very basic website][5] and some social networking accounts in place (mostly
empty) as we've begun testing an authentication scheme for the game and for
user accounts. We're still working on lower-level code and world generation,
but since multiplayer is an integral part of the game it's important that we
get networking and authentication working early.

On the graphics side, about 6 months ago I did a lot of work abstracting
rendering and finally wrote code that controls the directional light and lets
you set multiple lights. Here's a video of that functionality:

{% include embed/youtube.html id='IQIbuOjuW98' %}

Shortly after that, I did some benchmarking, as the game was a bit slow on my
laptop, and found out we were vertex processor bound with the terrain alone.
So I did some research into terrain LoD algorithms and settled on a
quadtree-based solution based loosely off the DICE publication
["Terrain Rendering in Frostbite using Procedural Shader Splatting"][6],
mostly around slides 37-40. Our implementation uses a zero-balanced quadtree,
their T-junction solution, and a static buffer of vertices. We're trying to
target a minimum of OpenGL 2.1, so we chose not to use the method that relied
on vertex texture lookup. At some point in the future we may raise the minimum
OpenGL version if we feel enough people have support for newer versions of
OpenGL. Our current T-junction implementation uses 9 index buffers per
quadtree level, using a static 33x33 grid would be a much cleaner solution if
we have vertex texture fetch support. Here's a video of that algorithm in
action:

{% include embed/youtube.html id='qWBhC_Mch9M' %}

Most of the work I did over break was networking and other backend stuff that
doesn't have much to show off. There wasn't a whole lot of work on the game
throughout the semester, but I've recently modified our terrain generation
algorithm and started on road generation. Here's what the terrain looks like
so far:

[![][7]][7]{: data-lightbox="gallery"}

------------------------------------------------------------------------------

Starting this last semester, I signed up for the
[Rensselaer Center for Open Source (RCOS)][8], a form of undergraduate
research that allows students to work on their own open source software for
either course credit or money. I started off making minor contributions to
[Kinect Gesture Library][9], but I plan to start my own project next semester.
There really isn't a whole lot to show for my contributions to RCOS at the
moment, but I felt like mentioning this anyways.

------------------------------------------------------------------------------

Over this last semester I've made more significant contributions to OpenTK.
Not directly, as the original maintainer has gone missing, the last release
being in 2010. Instead, I sent my contributions to
[andykorth's github repository][10] where people have started making their
contributions to. My contributions so far are mostly related to the math
classes. I went through and profiled/optimized a large portion of the Matrix4
class, then added several other Matrix classes to match all the available
matrices in GLSL (everything from a 2x2 to a 4x4).

Additionally, I wrote a library called [SharpFont][11], a wrapper around
FreeType2 for C# and all other CLI languages. I wrote this library because
GDI+ was not giving me enough information about each glyph to be able to pack
glyphs into a texture atlas and because Tao.FreeType was old and very lacking.
SharpFont exposes an API typical to libraries written in C# that neatly wraps
everything up in classes. For this reason it's become my most popular GitHub
repo. As of today 14 users have starred it and there are two forks.
[OpenRA][12] recently replaced Tao.FreeType with SharpFont, and someone
created a [NuGet package][13] that, as of today, has 168 downloads.

------------------------------------------------------------------------------

So that's about it for now, I'll try and take the time to post more
regularly instead of having these massive post twice annually.

[1]:  https://github.com/Robmaister/igd-final
[2]:  https://github.com/Robmaister/afim-final
[3]:  /img/blog/2013/05/igd-final-screenshot.png
[4]:  /img/blog/2013/05/gingerbread_screenshot.png
[5]:  #
[6]:  http://dice.se/publications/terrain-rendering-in-frostbite-using-procedural-shader-splatting/
[7]:  /img/blog/2013/05/TopHat-2013-05-20-22.26.31.7624.png
[8]:  http://rcos.rpi.edu/
[9]:  https://github.com/eawerbaneth/Kinect-Gesture-Library
[10]: https://github.com/andykorth/opentk
[11]: https://github.com/Robmaister/SharpFont
[12]: https://github.com/OpenRA/OpenRA
[13]: https://nuget.org/packages/SharpFont/
