---
layout: post
status: publish
published: true
comments: true
has-lightbox: true
title: Reflections on Implementing Cascaded Shadow Maps
date: '2013-07-07 13:34:13 -0400'
tags: [software]
preview-img:
  url: /img/blog/2013/07/TopHat-2013-07-04-00.03.45.0008.png
  alt: TopHat shadows
---

So I've spent the past few days implementing shadow mapping in TopHat.

[![][1]][1]{: data-lightbox="gallery"}

It looks nice, doesn't it? Well with the settings I had on the screenshot, I
was getting about 50fps on my desktop, which has an Intel i7-2600k and a
NVIDIA GeForce GTX570. That means that it's going to be too slow to run on the
"average" gaming desktop that we want to target. There's still a lot of
optimization to do, but the simplest solution is to simply use less cascades
and smaller shadow maps. In this post I'm going to discuss the process I went
through in implementing CSMs, and any issues I ran into along the way.

# Why CSMs?

Since the world is procedurally generated, lightmapping would add a rediculous
amount of load time if I wanted it to look even halfway decent. It would also
consume a ton of memory, which I'd rather save for more important things. So I
needed a dynamic shadow mapping algorithm, and one that would work well on a
very large scale (about 16km^2) with a good amount of detail (objects as small
as 1m^3 should have shadows). After doing some research, I came across
Cascaded Shadow Maps which essentially fits all of my requirements and decided
I wanted to implement it.

# Gathering Resources
My primary reference was the cascaded shadow map sample in
[NVIDIA's OpenGL SDK 10.6][2]. In addition, I kept a copy of the
[NVIDIA paper][3] and read through the [MSDN article on CSMs][4].

# Porting to C\#

My game is written in C#, and NVIDIA's sample was (naturally) written in C++.
Normally, porting code between languages isn't too hard so long as you
understand exactly what's going on in the original version and know how to
re-implement it in the target language. The issue with the NVIDIA sample was
that it relied on the now-removed OpenGL matrix stacks, and my game manages
it's own matrices separately. So in order to port the sample to C#, I had to
keep track of the entire GL_PROJECTION and GL_MODELVIEW stacks in my head
throughout the entire draw loop. It didn't help that matrices were
occasionally read out into float arrays and modified them with their own
matrix4 class and only sometimes sent back to an OpenGL matrix stack.

Besides that, there weren't really any issues in porting the code itself. I
did end up doing some of the matrix math incorrectly, so the first time I
tried running the game with shadows, this was the result:

[![][5]][5]{: data-lightbox="gallery"}

# Fixing the Issues

So after a nice break, I came back to the computer and tried to debug the
shadows. The first thing I did was shade all the geometry based on which
cascade it would read from. As it turns out, that worked just fine. The second
thing I did was drawing each shadow cascade on-screen. That's where I found
the first of two bugs, an incorrect light crop/projection matrix.

The way I fixed that was correcting the order of a few of my matrix
multiplications and changing the parameters of the look-at matrix. This gave
me something resembling a shadow map from the NVIDIA sample, only rotated 90
degrees. For some reason, the NVIDIA sample defines its up axis as the
negative X axis, so I went and changed the parameters of my look-at matrix to
use the proper up-axis, the Y axis. At that point, I had a shadow map that was
looking towards the light instead of from it. I defined my light direction
vector as the direction the light is pointing in, and the NVIDIA sample did
the opposite of that.

The second bug was an incorrect fragment-to-shadow matrix. After a lot of
guessing and trying to follow the sample, I gave up and decided to see if
reading the paper would give me any clearer of an understanding of what goes
into the matrix. It did. The matrix is simply the inverse view matrix
multiplied by the light's crop/projection matrix multiplied by a "bias"
matrix that scales the point into [0; 1] range for easier texture lookup.

{% include embed/youtube.html id='1utakCjC7Xc' %}

# Remaining bugs

The only remaining bug that has an impact on shadow map quality is finding the
right Z bounds on the light's orthographic projection matrix. Either part of
the terrain gets clipped out and the shadows from a mountain disappear, or I
test against all the bounding spheres in the world and the minimum Z is too
far away and I lose precision, causing a [Peter Panning][6] artifact. The
solution to this is to either place several small bounding spheres at the
edges of the terrain and at local extrema, or to do some sort of raycasting
test against the terrain.

Also, in testing with lower quality shadow maps and less splits, I'm getting a
pretty bad amount of shadow acne, something I'll look into and tweak some
values for.

# Looking Forward

The first thing I want to change about my shadow maps in the future is the way
they're filtered. Perhaps the option to use [PCSS][7] on higher-end machines,
maybe replace the 3x3 gaussian blurred PCF filtering with [VSM][8] or
[SAVSM][9]. I have other non-graphics things to tend to for the game right
now, but I will eventually write another post about how I fixed the remaining
bugs and any additional work I do on shadow mapping.

------------------------------------------------------------------------------

{: .content-grid .content-grid-third}
 - [![][10]][10]{: data-lightbox="gallery"}
 - [![][11]][11]{: data-lightbox="gallery"}
 - [![][12]][12]{: data-lightbox="gallery"}

[1]:  /img/blog/2013/07/TopHat-2013-07-04-00.03.45.0008.png "Crytek Sponza model with 4096x4096 4-split CSMs, 3x3 Gaussian blurring with PCF"
[2]:  https://developer.nvidia.com/nvidia-graphics-sdk-11
[3]:  http://developer.download.nvidia.com/SDK/10.5/opengl/src/cascaded_shadow_maps/doc/cascaded_shadow_maps.pdf
[4]:  http://msdn.microsoft.com/en-us/library/windows/desktop/ee416307(v=vs.85).aspx
[5]:  /img/blog/2013/07/TopHat-2013-06-28-16.08.46.0823.png "First Attempt"
[6]:  http://msdn.microsoft.com/en-us/library/windows/desktop/ee416324(v=vs.85).aspx#Peter_Panning
[7]:  http://developer.download.nvidia.com/shaderlibrary/docs/shadow_PCSS.pdf
[8]:  http://www.punkuser.net/vsm/
[9]:  http://http.developer.nvidia.com/GPUGems3/gpugems3_ch08.html
[10]: /img/blog/2013/07/TopHat-2013-06-29-16.44.07.5504.png
[11]: /img/blog/2013/07/TopHat-2013-06-30-14.53.33.6017.png
[12]: /img/blog/2013/07/TopHat-2013-07-03-01.28.03.7231.png
