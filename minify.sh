npx rollup -c
wait
npx babel-minify build/pubmanifest-parse.js --out-file build/pubmanifest-parse.min.js --sourceType module
wait
rm build/pubmanifest-parse.js
