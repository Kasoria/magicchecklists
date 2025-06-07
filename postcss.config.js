import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import prefixwrap from 'postcss-prefixwrap';

export default {
  plugins: [
    tailwindcss(),
    autoprefixer(),
    prefixwrap(':is(#mcl-admin-root, #mcl-public-root)')
  ]
} 