---
layout: post
status: publish
published: true
comments: true
has-lightbox: true
has-code: true
title: RPI Game Jam 10/27/12 Postmortem
date: '2012-10-28 16:44:45 -0400'
tags: [software, game-jams]
preview-img:
  url: /img/blog/2012/10/minescape_screen.png
  alt: MineEscape
sidebar: |
    ## Download
    - [<i class="fa fa-download"></i> Binary](https://github.com/Robmaister/RPI-Game-Jam-10-27-12/downloads){: .button}
    - [<i class="fa fa-code"></i> Source](https://github.com/Robmaister/RPI-Game-Jam-10-27-12){: .button}
    {: .list-no-style}
---

**MineEscape** is our entry for the RPI game dev club's game jam on 10/27/2012.



Requires OpenAL. If the game crashes at the very beginning, this is probably
the issue. [Download it here][3].

[![][4]][4]{: data-lightbox="gallery"}

So now that I've got two of these RPI game dev club game jams under my belt,
it's time to get that second postmortem done. The theme was **Surprise and
Suspense**. I'm just going to dive right in...

# What Happened?

Like the previous game jam, we spent about an hour coming up with an idea.
This time I decided to use C# and [OpenTK][5], a combination I'm much more
familiar with than Python and Pygame. I borrowed a teeny tiny amount of code
from [a previous game jam][6] (open sourced) to avoid having to spend time on
boilerplate code that most engines already have. Pretty much just the Texture
class, the AudioBuffer class, and the Resources class, the AABB class, and the
PhysicsManager class, along with a few method definitions for the IState
interface. In total it was about ~650 lines of borrowed code, including blank
lines and those bulky C# doc comments. The only functionality I borrowed was
basic resource management, light wrapping around some OpenGL/OpenAL
functionality, and AABB collision detection.

The first few hours were spent setting things up - getting the camera and
player classes to move, defining the proper coordinate spaces, etc. Following
that, one of my teammates finishes a rough outline of the first level which I
use to set up the map collision code. (The entire map is converted to a
bool[][] based on whether or not the alpha value of that pixel is below a
certain threshold. Each entity's axis-aligned bounding box is checked against
the map for any pixels that are considered solid.)

Following that, I start work on the flashlight/shadowing. The way it works is
that I draw the area of the flashlight to the stencil buffer (along with an
alpha-tested version of the player) and then draw a fullscreen quad with a
slightly transparent black texture everywhere except for the parts of the
stencil map I wrote to. The results were alright, there was no penumbra (the
edges of the flashlight were very harshly aliased) and no falloff towards the
end of the light.

At the same time my teammates were working on detailing the level more and
making sprites. I got a bit of work done in the ways of text rendering and
menus, then grabbed the new version of the map and the sprites and
incorporated them in. There were some minor issues with the level collision
map, due to the layering effect&#47;transparency that took a little bit of
time to find a hack around. Towards the end of the night, we got a second
level done and I took that in and set up some code to progress through levels.
This also involved setting up entity interactivity (some hacks to detect
collision between the player and the entities in the world) and implement the
core mechanic - turn on the generator to turn on the lights in the level and
make all the enemies disappear, then use the newly-activated lift to get up
closer to the surface.

Before I went to bed that night I also added all of the menus and polished
the transitions with some nice fading effects.

[![][7]][7]{: data-lightbox="gallery"}

The next morning I woke up at about 9:15am and walked over to Sage 2510 (where
the game jam was taking place) and continued working on the menus and
polishing the game a bit until my teammates arrived. When that happened I
imported the third completed level that he had finished later on the previous
night and put together AI for goblins and possessed pickaxes. AI was very
simply a radius check and some movement code, and it worked well enough.
Following that, I spent a little while trying to get OpenAL's positional audio
to work, but I couldn't manage it. I'm still not entirely sure why it wasn't
working, but thinking about it now the scale was probably too large for the
units OpenAL assumed, but I made all the sources relative to the listener and
it got the job done.

With only a few hours left, we started work on the 4th and final level and the
"end" level in which you simply walk towards a bright exit out of the cave. We
finished that and added a bit of polish in the last remaining hour we had. The
final game still had a handful of item placement bugs and dying would send you
back to the first level instead of just the last level you were on, which we
found out while presenting the game...

# What Went Right?

 - Execution. We thought of the idea and got something done within the 24
   hours with enough time to eat&#47;sleep. We were not rushing any features
   in the last hour, unlike the previous game jam and we had time to do a
   little bit of polish (not as much as I had hoped for).
 - Communication. Again, comparing this to the previous jam, my team
   communicated much more effectively and we were much more efficient in this
   way. There were some minor communication issues with the first level's
   collision map (and spawn point info), but after that it was all smooth
   sailing.
 - I used a language/libraries I was already familiar with but still learned
   something new (stencil buffer flashlight). I didn't have to look up any
   language features like the previous game jam. The code was cleaner and more
   organized because of this.
 - I let the artists do the art (mostly). There were a few things that didn't
   look too great as they were getting imported, but since I was getting
   psd's, it was very easy to go in and adjust the map quickly. The most time
   I spent on art was cleaning up the player sprite and making it look like
   his headlamp was emitting the light.

# What Went Wrong?

 - Like all game jam entries, there were features that we didn't have time to
   bring into the game. What went wrong here was that the main balancing
   mechanic was not implemented. We originally wanted enemies to back off when
   the light was shined towards them, but never got a chance to implement it.
   This should have been done very early on but never happened.
 - The game was too simple, again. The feedback we got from the judges was
   very useful and highlighted that the game was too easy once the generator
   was on. Some additional puzzle elements would have made the game a lot
   better.

# How Will I Fix My Mistakes?

 - Implement core mechanics earlier, then work on the polishing and other
   effects. That way we won't run into this issue of completely forgetting a
   mechanic that would have added a bit of balance to the game.
 - Aim higher and focus the programming early on. A simple inventory and
   locked door/key puzzle system would have taken the game a lot further. We
   might not have had as much polish (or a 4th level), but the game would
   have been a lot more interesting with this.

# Worst Hack?
Continuing with the organization of the previous postmortem, I'll post the
worst hack in the game's source code. A lot of the hacking in this game was
just making variables public to save some time in writing wrapper properties,
and there weren't really too many terrible hacks since I'm more familiar with
C# and have a better idea of how to structure game code in it. The biggest
hack I had to make, though, was one dealing with the flow of game states. I
wrote a basic state manager really early on that kept track of a state stack
([very similar to the article I wrote earlier on the subject][8]), but the way
I got the game to restart after winning was by spawning a main menu state
under the next menu after the main menu was popped off the stack:

{% highlight csharp linenos %}
startMenu.OnPopped +=
	(s, e) =>
	{
		startMenu.Reset();
		StateManager.PushState(startMenu); //reset and loop
		StateManager.PushState(objectiveMenu);
	};
{% endhighlight %}

This meant that for a while the game could not be exited with Esc, since that
would just pop states off the stack, so the fix was to write a method that
would pop all the states off without giving it a chance to spawn the temporary
new start menu. So I added a bool to StateManager's StateAction class for
clearing the entire stack knowing that the method immediately after update
would check for an empty stack and exit the game, giving it no time to
actually push the new stack on.

{% highlight csharp linenos %}
else if (action.clearing)
{
	while (stack.Count > 0)
	{
		stack.Pop().OnUnload(new EventArgs());
	}
}
{% endhighlight %}

This was also what caused the death-returning-to-main-menu bug. We had simply
forgotten to set up the lose menu state to load a new GameState with the same
level, and the game quitting to desktop would have been a clearer indication
of this forgetfulness than returning to the main menu, which we simply
overlook since most of the testing was done on the first level.

[1]: https://github.com/Robmaister/RPI-Game-Jam-10-27-12/downloads
[2]: https://github.com/Robmaister/RPI-Game-Jam-10-27-12
[3]: http://connect.creativelabs.com/openal/Downloads/oalinst.zip
[4]: /img/blog/2012/10/minescape_screen.png "MineEscape screencap"
[5]: http://www.opentk.com/
[6]: https://github.com/Robmaister/RoversSpirit
[7]: /img/blog/2012/10/map1.png "MineEscape map 1"
[8]: http://blog.robmaister.com/advanced-state-management-in-games/
