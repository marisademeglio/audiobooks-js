npx rollup -c
wait
npx babel-minify build/audiobooks-js.js --out-file build/audiobooks-js.min.js --sourceType module
wait
#rm build/audiobooks-js.js
