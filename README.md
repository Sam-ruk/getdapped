# Get Dapped

An immersive 3D interactive experience showcasing the Monad blockchain ecosystem and its dapps.

## 📌 Features

**Scroll-Driven 3D Animation**
- Cinematic animation and camera movements synchronized with page scroll.

## 🛠 Tech Stack

**Frontend**: Next.js, TypeScript, React Three Fiber.

**3D Assets**: Blender for modeling and animation, assets exported in GLTF/GLB format.

## ⚙️ Setup & Installation

**Prerequisites**
- Node.js 
- npm, yarn, or pnpm

**Installation**

Clone the repository:
```bash
git clone https://github.com/Sam-ruk/getdapped
cd getdapped
```

Install dependencies:
```bash
npm install
```

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser and start scrolling.

## 📂 Project Structure

```
/getdapped
├── /app
│   └── page.tsx                 # Main page with scene switching logic
├── /components
│   ├── MainScene.tsx            # Scroll-based 3D animation scene
│   ├── CategoryScene.tsx        # Category detail view with dApp explorer
│   └── TypingAnimation.tsx      # Animated typing text with sound
├── /types
│   └── index.ts                 # TypeScript type definitions
├── /public
│   ├── model.glb                # Main 3D scene (created in Blender)
│   ├── show_2.glb               # Category scene (created in Blender)
│   ├── dapps.json               # dApp info list
│   ├── typing.mp3               # Typing sound effect
│   ├── accelerada.mp3           # phonk music
│   ├── trollface.png            # surprise image ;)
│   └── [category].png           # Category image sprites used by the showcase glb model
├── next.config.js               # Next.js config
├── tsconfig.json                # TypeScript config
└── README.md                    # Project documentation
```

## 🔑 Key Components

**MainScene**
- Controls the 3D animation based on page scroll.
- Detects button clicks and triggers dapp category selection.

**CategoryScene**
- Displays 3D showcase with dApp information.

**TypingAnimation**
- Animated typing effect with blinking cursor.


## ✨ Credits

Built with [Blender](https://www.blender.org/), [Three.js](https://threejs.org/) and [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/).