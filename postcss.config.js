import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import prefixwrap from 'postcss-prefixwrap';

export default {
  plugins: [
    tailwindcss(),
    autoprefixer(),
    prefixwrap(':is(#magiccl-admin-root, #magiccl-public-root)')
  ]
} 