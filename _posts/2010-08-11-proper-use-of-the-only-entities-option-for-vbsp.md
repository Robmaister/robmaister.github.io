---
layout: post
status: publish
published: true
comments: true
has-lightbox: true
title: Proper use of the "Only Entities" option for VBSP
date: '2010-08-11 02:14:35 -0400'
tags: [level-design, source-engine]
preview-img:
  url: /img/blog/2010/08/hammer2.jpg
  alt: settings
---

I'm sure many of you who use Hammer glance at the "Only Entities" setting for
VBSP in the compile menu and just skip over it. I'm fairly certain at least a
few of you have tried setting VBSP to compile Only Entities and have noticed
that VVIS and VRAD start throwing errors because of it. This is a fairly short
guide on how to properly use the Only Entities compile option. Before I jump
right in, however, I do want to explain exactly what this option does. When
you run VBSP as Only Entities, it skips over a very large portion of the VBSP
process. the BSP tree isn't created, visleafs aren't cut up, detail sprites
aren't placed, and all those other little things that VBSP does to compile a
map are not done. VBSP simply overwrites all the entity values stored in the
currently compiled map. Attempting to re-run VVIS or VRAD over it will return
errors because of the way those tools work, something a little bit more
complicated than I really want to go over in this guide.

[![][1]][1]{: data-lightbox="gallery"}

So anyways, before you attempt this, make sure that the only things modified
in your map are entities (excluding props with shadows enabled or light
entities), because anything else will require another compile to update other
parts of the level, such as lightmaps). For this example, I'll be using an
env_smokestack in my single-player mapping contest entry. Initially, the smoke
is a specific color (in this case 37 37 37), but let's say I wanted to do
something funky, like an extremely bright green color.

To do this, we need to hop back into Hammer and change some value in order to
see the effect of this compile. So in this case, all we need to do is make the
color value an obnoxiously bright green. Note that you can change pretty much
any entity at all, and even make as many entity changes as you please. The
only thing that you can't do is change any brushwork, move brush-based
entities, or deal with anything that is taken into consideration when VRAD
calculates lighting. You can also modify outputs.

[![][2]][2]{: data-lightbox="gallery"}

So now the only edits made to the map are entity based, so the rest of the
compiled map will stay exactly as it has. Now all we need to do is configure
our compilation correctly. Your compile menu should look like the image to the
left, VBSP set to Only Entities, everything else set to No, and the standard
game parameters. If you feel better using the expert compile menu, add
`-onlyents` to the $bsp_exe command. You can also just choose the Only
Entities configuration from the configuration drop down list.

[![][3]][3]{: data-lightbox="gallery"}

So now there should be a significantly shorter compile, but lighting will
still stay intact, which is the real benefit to using this configuration
because certain things like env_smokestacks won't look the same in a
fullbright map. I could have spent hours sitting in front of my computer doing
nothing while VRAD ran the same radiosity calculations over and over, and I
wouldn't have gotten as far as I am now. It can be a real time saver if used
properly; I saved 7 seconds on VBSP, 1 second on VVIS, and 2 minutes and 4
seconds on VRAD this way. And that's with every compile. I spent at least
10-20 compiles trying to refine the smokestack and make it spread out a little
less or increase the minimum particle size or just change some value slightly.
I hope this helps you as much as it's helped me with my maps!

[![][4]][4]{: data-lightbox="gallery"}

[1]: /img/blog/2010/08/singleplayercontest_notop0026.jpg "The env_smokestack in question."
[2]: /img/blog/2010/08/hammer1.jpg "Oh, this will look SO much better!"
[3]: /img/blog/2010/08/hammer2.jpg "Settings to compile with Only Entities"
[4]: /img/blog/2010/08/singleplayercontest_notop0028.jpg "oooh, this does look SO MUCH BETTER!"
