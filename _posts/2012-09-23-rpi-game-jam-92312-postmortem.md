---
layout: post
status: publish
published: true
comments: true
title: RPI Game Jam 9/23/12 Postmortem
date: '2012-09-23 17:37:25 -0400'
tags: [Software, Game Jams]
preview-img:
  url: /img/blog/2012/09/boxopolis_cover.png
  alt: Boxopolis Cover
---

This is the technical postmortem for the game I made earlier this weekend,
"60 Sekonds to Save Boxopolis". The game was made as an entry for a 24-hour
game jam hosted by RPI's game development club.

![header][1]
The competition's theme was **60 seconds to save the world**. I was working in
a team with 2 other people, one of whom did most of the art and the other who
helped a bit with the code, but mostly learned about it from me. The idea of
the game is that a 6 year old is playing in his backyard and coming up with
scenarios in which the world is ending, and that he has 60 seconds to retrieve
the toys he needs to save the world. Before I start the actual postmortem, I'd
like to mention that the entire source code (plus history) is available on
[GitHub][2]

### What Happened?

We only took a half hour or so to come up with the basic idea and started
dividing up work. Within an hour we had a list of art assets we needed to make
and a list of things we had to start programming. I wanted to make a game with
pygame (despite my lack of experience with it) and I had everything I needed
to start working with it installed and ready from the previous night, but I
still spend a good half hour helping the other programmer set up eclipse, git,
python, and pygame on his laptop. Once that was set up, we got coding. By 6pm
I had worked my way around pygame enough to set up a window that rendered a
map in [.tmx format][3] with some text overlayed. There was also a solid red
square that was our player, and he would collide with certain tiles in the
world. The other programmer had set up (with some assistance from me) a method
to render text on top of the game, to display the 60 second countdown.

![Pygame Logo][4]
From 6pm to about 8pm we went to downtown Troy to grab some dinner at the
Brown Bag, and it was raining when we had to walk all the way back up to
campus :(. After that we spent a bit of time implementing multiline text to
list all of the goal objects you need to pick up in a level, and also wrote
some code to have the player collide with obstacles and goals, and to be able
to pick up the goal objects. By that point it was 10pm and my teammates
decided to go work in their own rooms and go to bed after that, so I took the
rest of the night off (but went to bed much later than 10pm).

![][5]
The next morning, we wake up and meet at 7:30 to (supposedly) have breakfast.
Except everywhere is closed at 7:30am on a Sunday. Which is understandable,
since we only walked past 2 people in the 10 minute walk back to Sage 2510
(the location of the jam). We spent the rest of the day getting the game done.
I spent way too much time importing the art&nbsp;(downscaling it and touching
things up, I'll talk more about this later), but after that I implemented
levels, redid the background tileset, set up sound, and set my teammate up
with the level editor. I spent some time copying the description text and
making sure it was properly aligned and not going past the edge of the screen.
When the levels were done, I copied them into the game and they all worked
with only a few issues I could tweak by hand with Notepad++. We had the other
teammate playtest the levels, there were a handful of bugs that I fixed. By
that time it was 20 minutes to the deadline, and we realized that I had never
put in the animated player sprite and that we almost finished our game with a
red square for a player. I finished implementing sprite animation with about a
minute to spare, which I spent changing the window title.

After that, we presented our game and got some very valuable feedback from the
judges.

### What Went Right?

 - For starters, we finished the game. We didn't win any awards, but with only
   24 hours, making a finished game is a reward in itself.
 - I learned about pygame. I went into this game jam wanting to know about
   python game development a little bit more, and now I do. Although after
   using OpenGL for so long, surface blitting seems very restricting. If I
   work in Python for the next jam, I'm going to get more comfortable with
   PyOpenGL and use that.

### What Went Wrong?

 - We ran out of time. What we had done by the end of the jam was what we
   should have had done by the morning. Ideally, the entire morning should
   have been spent playtesting and polishing. Getting to polishing around 10am
   to 11am is a good goal to have, realistically.
 - The levels had no progression. The 10th level was just as easy as the
   first. The feedback we got from the judges about this was very well
   articulated. Some sort of moving obstacle or a maze setup would have made
   the game a lot more difficult and pushed it just that much further.
 - We should have been communicating more as a team. All the art was done in
   64x64 and I ended up having to convert everything down to 32x32. Better
   communication would have helped a lot there.
 - I didn't know pygame before this game jam. Yes, it's good that I learned
   about it during the game jam, but having spent all that time learning hurt
   our final product immensely. If I had made the game in C# using OpenGL, we
   would have had a better product done earlier.
 - I tend to be a perfectionist. I took some liberties with the art I was
   being given as I scaled them down. There were some issues with downsampling
   algorithm that left some artifacts, so I had to outline everything and
   clean up the edges. I ended up redoing some of the sprites completely, and
   that took up 1.5-2hrs that could have been better spent.

### How Will I Fix My Mistakes?

 - Push for an earlier first iteration of the game. Don't worry about doing
   things the right way, just make sure they're done. This is much easier to
   do if you know the libraries you're using really well.
 - We could have added a progression in difficulty if we had time for it. By
   getting an earlier first iteration, we can identify issues like this much
   earlier and have more time to try and fix it.
 - Be more specific about the requirements of the art, have better tools in
   place to let the artist to more of the importing process.
 - Next time I won't learn a brand new library during a game jam, I'll use
   something I'm familiar with and work more on the actual game.
 - I'll let go of making the art perfect and focus more on getting a better
   game done. The focus should be on perfecting the mechanics and game itself,
   not the art. In a way, game jams are there to teach us that we can't be
   perfectionists if we want to meet deadlines, so I should also make a
   conscious effort to try and let go of the finer details.

![][6]

### Worst Hack?

Game jams happen so quickly that almost every entry has some level of hackery
in the code. Anything from a harmless, bug-fixing magic number to lengthy,
messy hacks that could make grown men cry. I figured with each postmortem I
write, I could include the worst hack I had to write to get the game working,
so here goes:

I did collision response in the player class, because it seemed to make sense
in the beginning, but as we kept building up the game I realized I had to
modify the global state of the game when you collide with a goal object. So I
wrote a method in main.py and imported it in the player class and called the
method. Because I imported main, all the game initialization code was run
again and the game was reset to the title menu. The solution? Pass a lambda
function to player, player stores it and invokes it whenever it collides with
an obstacle or goal object.

{% highlight python %}
def collide_obstacle(obstacle):
    global levelTime, goal_obstacles, pickup_sound, hurt_sound
    key = pygame.key.get_pressed()
    if key[pygame.K_e]:
        if obstacle.get_obs_type() == "Goal":
            goal_obstacles.remove(obstacle)
            allsprites.remove(obstacle)
            pickup_sound.play()
            return obstacle
    elif obstacle.get_obs_type() == "Obstacle":
        levelTime -= 0.5
        hurt_sound.play()
{% endhighlight %}

{% highlight python %}
player = Player((32, 32), 1, lambda o: collide_obstacle(o))
{% endhighlight %}

{% highlight python %}
class Player(pygame.sprite.Sprite):
    def __init__(self, (x, y), speed, collide_lambda, fps=10):
        self.collide_obstacle = collide_lambda
        #...
		
    def move(self, x, y):
        #...
        obstacle_to_remove = None
        for o in self.obstacles:
            if self.rect.colliderect(o.get_rect()):
                if x > 0: # Moving right; Hit the left side of the wall
                    self.rect.right = o.get_rect().left
                if x < 0: # Moving left; Hit the right side of the wall
                    self.rect.left = o.get_rect().right
                if y > 0: # Moving down; Hit the top side of the wall
                    self.rect.bottom = o.get_rect().top
                if y < 0: # Moving up; Hit the bottom side of the wall
                    self.rect.top = o.get_rect().bottom
                obstacle_to_remove = self.collide_obstacle(o)
        if obstacle_to_remove is not None:
            self.obstacles.remove(obstacle_to_remove)
{% endhighlight %}


[1]: /img/blog/2012/09/boxopolis_cover.png "60 Sekonds to Save Boxopolis"
[2]: https://github.com/Robmaister/RPI-Game-Jam-9-22-12
[3]: http://www.mapeditor.org/
[4]: /img/blog/2012/09/pygame_small.gif
[5]: /img/blog/2012/09/boxopolis_screen.png "60 Sekonds to Save Boxopolis screenshot"
[6]: /img/blog/2012/09/boxopolis_screen2.png "Screenshot"
