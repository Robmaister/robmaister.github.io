---
layout: post
status: publish
published: true
comments: true
title: Advanced State Management in Games
date: '2012-07-29 13:11:13 -0400'
tags: [Software]
---

In this blog post I'm going to describe the state management system I've built
for my most recent game, the reasoning behind my design choices, and most
importantly the steps I took to build that system and the issues that pushed
me to build a bigger system. I'll start writing posts like this more often if
I get a lot of positive feedback. Writing these posts is a win for everyone,
since you guys get to skip the trial-and-error that I had to go through and
I'll get to look at my code in closer detail and try to improve it. Anyways,
on to the post itself...

------------------------------------------------------------------------------

If you've ever programmed a game, you've dealt with the issue of getting a
single main loop to act in completely different ways based on what's
happening. When the game first starts up you want to present a main menu to
the user. When you're loading all the game's assets you want to have a loading
screen to show progress. When the user pauses the game, you want to show a
paused menu that gives the user the option to resume the game or to exit.

Depending on what kind of game you're making, that could be the most you need
- a state enum and 4 or 5 states just to manage the menus around the game. You
can throw that in a switch statement and be done with it. It works great,
incurs no overhead, and is very readable. I did this a while back for an
escape-the-room game. Each clickable area was a state and I hardcoded all the
states together and it worked pretty well for a small game. The
[full source code][1] is available on my GitHub account.

{% highlight cpp %}
enum GameStates {
	mainMenu,
	room1Side1,
	room1Side2,
	room1Side3,
	room1Side4,
	room1Up,
	room1UnderBed,
	room1OutsideSafe,
	room1UncoveredSafe,
	room1InsideSafe,
	room1InsideVent,
	room1Dresser,
	room1ToolBox,
	room1BehindCurtains,
	//room2Side1,
	//room2Cabinet,
	//room2InsideCabinet,
	//room1DoorClose,
	winMenu
};

GameStates gs = mainMenu;
{% endhighlight %}

But what happens when you're making a game that requires more complex states?
What if you need more functionality out the state manager?

Let's say you're making an RPG or Roguelike with an inventory system. You have
an "inventory" state so that you can look at all your items (a few can be
hotkeyed and are visible from the main game state) and you have a
"description" state that provides a long textual description of the item along
with all it's stats and a picture. You want the description state to pop up
when you select an item, either from the hotkeyed section or from the
inventory state. At first you might think "No problem, you just hook both of
those to change the state to the description state," but you'll run into an
issue when you try to reverse that action. When you exit the description
state, what state do you change to?

An immediate solution to that problem would be to store not only the current
state, but the last state as well. When you want to return to the game or
inventory, you'll just change the state to the previous one. Great! Now what
happens when a player pauses the game in the description state? The paused
state will overwrite the previous state with the description state. When you
try to get out of the description state, the puased screen state will load
instead.

The solution is a stack of states. You use Peek() to get the current state,
and all state changing can be represented as a series of Push() and Pop()
calls. This provides a very elegant solution to the problems I described
above:

 1. Both the hotkeys and inventory state can change to a description state.
	- **Solution:** Push a description state to the stack.
 2. The description state must be able to return to the state it was called
    from.
	- **Solution:** Pop the description state off the stack.
 3. The game can be paused at any point without any side effects to game
    state.
	- **Solution:** Push a pause state and pop it off afterwards.

Now that we've determined the best way to organize states, exactly what
functionality does a state contain and how do we store it? Depending on the
game you're making and the libraries you're using, this will vary. In my case,
I'm using [OpenTK][2], which provides a GameWindow class. The GameWindow class
handles the main loop, the message pump, OpenGL context creation, and user
input. I'm also making a first person shooter, which means a layer must be
able to hide the cursor, as well as choose the type of mouse input they want
(unbound and unaccelerated for the game, window bound and OS-accelerated for
the UI). So it would make sense for me to take most, if not all, of the
virtual GameWindow methods and route them to the current state.

As you can see in [the source for my Ludum Dare 22 entry][3], Each state is a
class that implements the IState interface, which I defined as the following:

{% highlight csharp %}
public interface IState
{
	void OnLoad(EventArgs e);
	void OnUpdateFrame(FrameEventArgs e, KeyboardDevice Keyboard, MouseDevice Mouse);
	void OnRenderFrame(FrameEventArgs e);
	void OnResize(EventArgs e, Size ClientSize);
	void OnKeyDown(object sender, KeyboardKeyEventArgs e, KeyboardDevice Keyboard, MouseDevice Mouse);
	void OnKeyUp(object sender, KeyboardKeyEventArgs e, KeyboardDevice Keyboard, MouseDevice Mouse);
	void OnMouseDown(object sender, MouseEventArgs e, KeyboardDevice Keyboard, MouseDevice Mouse);
	void OnMouseUp(object sender, MouseEventArgs e, KeyboardDevice Keyboard, MouseDevice Mouse);
	void OnUnload(EventArgs e);
}
{% endhighlight %}

Again, this is simpler than the current system I have for my FPS, especially
since I didn't bother to write an actual manager with a stack (For those who
don't know, [Ludum Dare][4] is a competition that gives you 48 hours to
develop a full game, so you tend to skip writing any code that isn't 100%
necessary), but it still shows what I consider a state and how it's stored.

The system I've built for my FPS includes a few more methods, simplifies the
parameters, and adds functionality that I've found to be very useful, like the
ability to partially update states below the current state in the stack
(rendering, logic updating, mouse&#47;keyboard input). This gives you the
ability to do some really fancy things like transparent pause menus that don't
stop the game in multiplayer to defining the HUD as a "state" to split that
rendering code off from the rest of the game, since it's a much different
process than rendering a 3d scene. With that new functionality, I found that
the word "state" doesn't really represent what these objects can do, so I call
them layers instead.

Control over which actions are passed through to the next layer are defined as
3 separate enums (comments stripped out for readability on a blog):

{% highlight csharp %}
[Flags]
public enum LayerActionStates
{
	None = 0x0,
	Render = 0x1,
	Update = 0x2,
	All = Render | Update
}

[Flags]
public enum LayerKeyboardStates
{
	None = 0x0,
	ContinuousInput = 0x1,
	KeyEvents = 0x2,
	All = ContinuousInput | KeyEvents
}

[Flags]
public enum LayerMouseStates
{
	None = 0x0,
	ContinuousInput = 0x1,
	MouseEvents = 0x2,
	All = ContinuousInput | MouseEvents
}
{% endhighlight %}

And in the ILayer interface, I define the following properties:

{% highlight csharp %}
public interface ILayer
{
	//...
	
	LayerActionStates ActionState { get; }
	LayerKeyboardStates KeyboardState { get; }
	LayerMouseStates MouseState { get; }
	
	//...
}
{% endhighlight %}

Looking back, these 3 enums can easily be consolidated into a single enum,
which takes advantage of the fact that they're bitfields (currently I'm only
using the first 2 bits for 3 separate enums). Either way, here's how I use it:

{% highlight csharp %}
bool continueMouse = true, continueKeyboard = true, continueUpdate = true;
foreach (ILayer layer in layerStack)
{
	//run the current layer's keyboard update, unless the above layer blocks it
	if (Focused && continueKeyboard)
		layer.KeyboardUpdate(frameTime, OpenTK.Input.Keyboard.GetState());
		
	//run the current layer's mouse update, unless the above layer blocks it
	if (Focused && continueMouse)
		layer.MouseUpdate(frameTime, OpenTK.Input.Mouse.GetState());
		
	//run the current layer's general update
	if (continueUpdate)
		layer.LogicUpdate(frameTime);
		
	//if a layer requests that we don't send keyboard/mouse input down, set the proper bool to false.
	if ((layer.KeyboardState & LayerKeyboardStates.ContinuousInput) != LayerKeyboardStates.ContinuousInput || !Focused)
		continueKeyboard = false;
	if ((layer.MouseState & LayerMouseStates.ContinuousInput) != LayerMouseStates.ContinuousInput || !Focused)
		continueMouse = false;
	if ((layer.ActionState & LayerActionStates.Update) != LayerActionStates.Update)
		continueUpdate = false;
		
	if (!continueKeyboard && !continueMouse && !continueUpdate)
		break;
}
{% endhighlight %}

To get a layering effect for transparent menus, I render the layers backwards.
Yes, it's possible to render forwards and get that same layering effect with
some fancy depth peeling code, but this way is a lot simpler and only has a
small amount of overhead:

{% highlight csharp %}
//flip the stack to render (rendering needs to happen bottom up, otherwise bottom layer occludes everything above it, etc.)
renderStack.Clear();
foreach (ILayer layer in layerStack)
{
	renderStack.Push(layer);
	
	if ((layer.ActionState & LayerActionStates.Render) != LayerActionStates.Render)
		break;
}

//Render all the layers in reverse order
foreach (ILayer layer in renderStack)
{
	layer.OnDraw(frameTime);
}
{% endhighlight %}

And here's how I manage the layer stack from anywhere in the code (not
thread-safe, but it's only ever accessed from one thread):

{% highlight csharp %}
//Originally from http://blog.robmaister.com/advanced-state-management-in-games/
public static class LayerManager
{
	private static Queue<LayerStackAction> stackActions = new Queue<LayerStackAction>();
	
	public static void PushLayer(ILayer layer)
	{
		stackActions.Enqueue(LayerStackAction.CreatePushAction(layer));
	}
	
	public static void PopLayer()
	{
		stackActions.Enqueue(LayerStackAction.CreatePopAction());
	}
	
	public static void PopLayer(int count)
	{
		for (; count > 0; count--)
			PopLayer();
	}
	
	public static void UpdateLayerStack(Stack<ILayer> layerStack, Size window)
	{
		while (stackActions.Count > 0)
		{
			stackActions.Dequeue().ApplyAction(layerStack, window);
		}
	}
	
	private sealed class LayerStackAction
	{
		private readonly Action action;
		private readonly ILayer layer;
		
		private LayerStackAction(Action a, ILayer layer)
		{
			action = a;
			this.layer = layer;
		}
		
		private enum Action
		{
			Push,
			Pop
		}
		
		public static LayerStackAction CreatePopAction()
		{
			return new LayerStackAction(Action.Pop, null);
		}
		
		public static LayerStackAction CreatePushAction(ILayer layer)
		{
			return new LayerStackAction(Action.Push, layer);
		}
		
		public void ApplyAction(Stack<ILayer> layerStack, Size window)
		{
			switch (action)
			{
				case Action.Pop:
					//pop and unload the layer
					layerStack.Pop().OnUnload();
					break;
				case Action.Push:
					//load and push the layer
					layer.OnLoad(window.Width, window.Height);
					layerStack.Push(layer);
					break;
			}
		}
	}
}
{% endhighlight %}

While it may look overengineered for something that's just supposed to push
and pop a stack, a lot of it is necessary to ensure proper functionality. For
example, before I had the nested LayerStackAction class, there was a
Queue<ILayer> for pushed layers and an int that kept count of how many layers
to pop. When it was time to update, it would pop all the counted layers then
push all the layers in the queue. The would cause issues when a piece of code
calls Pop and Push and expects the actions to execute in the order they were
given. For example, calling Push() then Pop() wouldn't remove the newly pushed
layer, but rather pop the existing layer and push the new layer on top of
that.

With my recent work on UI, I've had to revisit this state management code to
add functionality I need in 2D, like control over cursor hiding. While working
on that I realized just how much work I'd put into state management and how
robust it is, I felt like it wouldn't be right to keep it hidden.

As for using this source code, feel free to use it anywhere. If you're
redistributing in source format, I would appreciate it if you kept the link to
this post with the source code.

[1]: https://github.com/Robmaister/DarkGDK-EscapeTheRoom/blob/master/DarkGDK-EscapeTheRoom/Main.cpp
[2]: http://www.opentk.com/
[3]: https://github.com/Robmaister/RoversSpirit/blob/master/RoversSpirit/IState.cs
[4]: http://www.ludumdare.com/compo/about-ludum-dare/
