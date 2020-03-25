npx rollup -c
wait
npx babel-minify build/audiobooks.js --out-file build/audiobooks.min.js --sourceType module
wait
