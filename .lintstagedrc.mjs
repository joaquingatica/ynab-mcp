export default {
  '*.{mjs,js?(x),mts,ts?(x)}': ['eslint --cache --fix', 'prettier --write'],
  '*.{json,md?(x),y?(a)ml}': ['prettier --write'],
}
