---
layout: page
title: Ilium VR
---

As the CTO of Ilium VR, I built our software stack as well as several tools
used internally. I also set up and maintained all of the workstations for our
team as well as one server that hosted our repositories, a file share, and a
CI setup.

Ilium VR was a company that set out to build controllers for VR that would
more closely simulate real-world objects than wand controllers would. We
started with a rifle that would have realistic recoil, a clip that could be
released and pushed back in, and analog tracking on a majority of the inputs.

The level of realism we were aiming for was to be able to pull back the slide
and visually check if there was a bullet in the chamber. By our second
developer kit, the hardware and software were both capable of doing this, but
our provided prefab had a more traditional UI wrapping around the model of the
rifle in-game.

## The Software Stack

We started off with a custom camera setup that would optically track the gun
and fuse sensor data with an on-board IMU. This was long before the existence
of the [Vive Tracker](https://www.vive.com/us/vive-tracker/), and a little
while before the Vive Pre was publicly announced. We wanted to be able to
update the fusion software independently of any sort of integration into a
game or game engine, so I chose to implement this as a background service that
would communicate with games or other software that wanted this information.

This was implemented as a Windows service written in C++ that communicated
over a named pipe with a C API. There was infrastructure built to allow a
quick implementation of the same core code as a Linux daemon using Unix
pipes (or even a UDP socket), though it never ended up being used. I will
refer to this piece of software as the Runtime.

The C API abstracted all of the communication with Runtime and provided
functions to poll for the latest controller + tracking information. All of
this data was provided as simple structs. It was designed to be easy to write
bindings for in any language that could bind to C. The abstraction of any
communcation details also made it easy to drop in whatever backend we wanted,
making it so that our partnering game developers wouldn't have to do anything
between releases or new platform support (besides shipping an extra binary for
that platform).

The only bindings for the API were in C# (for Unity support), which I wrote.

Our game engine integrations consisted of two parts:

 - A plugin/package that integrated with the engine's input/VR systems
 - A simple demo scene or game that uses our plugin

The two engines we supported were Unity and Unreal, with Unity receiving more
attention because we had more developers using Unity.

The Runtime also had some extra functionality that proved useful past our
custom tracking setup. It hooked into device event notifications so that we
could indicate to the user that there was a problem from within the game. Past
our first developer kit, I added the ability to flash firmware through the
Runtime automatically (the device would put itself into the right mode to
flash new firmware).

This lead to the creation of a small tray application we called the Runtime
Utility. With this, you could check the status of your device (including
firmware version), flash new firmware, test all of the buttons and axes,
test force feedback, and restart the service without having to dig through
the various menus in Windows to find it. It was written in C# with Winforms.

This was all distributed and installed with NSIS.

## Tools & Open Source

More details are available in the [Open Source](/software/open-source/)
section of my website.

## Server Setup

We opted for running a single server locally for a few reasons that boiled
down to two reasons:

 - We might want to have hardware plugged in for running tests in a CI setup
 - The specifics of our office and the software we wanted to run made it a
   good choice both economically and performance wise.

We picked a very cheap, relatively old server off eBay, threw a few new 2TB
drives in it, and installed XenServer. We ran, among other things, a Windows
VM with Jenkins on it for CI, a Linux VM with a Samba share, and a pfSense
instance that acted as a DNS forwarder an OpenVPN server.
