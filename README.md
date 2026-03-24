# Flappy Bird
I build this project because i like to play Dino game with infinte loop like that i build a different version of that game to learn something

## what I learned from this project
- Game Loop using requestAnimationFrame()
- Gravity movement
- Collision detection
- canvas element for drawing games
- Creating a game that can run both on desktop and mobile

## strugle I faced
- Bird rotation while flap
- Collision handling
- Making difficulty actually feel
- Responsive for all screen type

## Features of my project
- Press space / click to flap the wings of the bird (work on mobile too!)
- Smooth gravity movement of the bird
- sound effects - flap, score, and death sounds
- 3 difficulty modes - Easy, Medium, Hard
- Difficulty increases as you play - pipes get faster, gaps shrink
- Keeping track of the score
- Game over; restart the game
- Responsive - works on laptop and phone

## Difficulty breakdown
| Mode   | Starting Gap | Speed     | Bird Gravity  |
|--------|--------------|-----------|---------------|
| Easy   | 130px → 90px | 2.4 → 6.5 | 0.40 (floaty) |
| Medium | 110px → 78px | 3.0 → 6.5 | 0.45 (normal) |
| Hard   | 85px → 65px  | 3.8 → 6.5 | 0.52 (heavy)  |

Every 5 points = new level. Speed increases and gap shrinks automatically.

## Technology Stack
- HTML5 Canvas element
- CSS
- JavaScript

## Instructions to play the game
1. Open `index.html` in your browser — no server needed, just double click
2. Pick a difficulty: **Easy**, **Medium**, or **Hard**
3. Click **Play**
4. Press **Space** / click to flap
5. Dodge the pipes and survive as long as possible
6. Beat your best score

If you liked this project:
- Star the repo – it really helps me
- Give a rating of 8 or above if you think it deserves cookies
- More support = more motivation to build more weird fun projects