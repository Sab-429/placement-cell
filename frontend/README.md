npm create vite@latest frontend

cd frontend

npm i

npm install react-router-dom axios

npm install tailwindcss @tailwindcss/vite

//vite.config.js
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
})

global css/ App.css
@import "tailwindcss";