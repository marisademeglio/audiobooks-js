Version: 0.2.0

This is a (relatively) spec-compliant publication manifest processor. Given JSON input, it performs the processing steps as described in the [pub-manifest spec](https://www.w3.org/TR/pub-manifest/#manifest-processing). It also has additional processing rules for [audiobooks](https://www.w3.org/TR/audiobooks/#audio-manifest-processing). 

These rules dictate how to process and normalize the data, so, for example, all the URLs get resolved, all the invalid values removed, any errors get reported, and anything that's not in an object or array and should be, is. There are also a handful of convenience functions for getting localizable strings and navigating the reading order.

This is __not__ intended to be a manifest validator. Errors are reported only when they affect processing.

To use it, copy [`pubmanifest-parse.min.js`](https://github.com/marisademeglio/pubmanifest-parse/tree/master/build/pubmanifest-parse.min.js) to your project.

I wrote this to help with some demos I'm working on. My target is the browser, and I wrote this processor as an ES6 module. It would be easy enough to port to other environments.

PRs welcome! 

# Links

* [Github](https://github.com/marisademeglio/pubmanifest-parse)
* [API](https://marisademeglio.github.io/pubmanifest-parse/api)
* [Working example](https://marisademeglio.github.io/pubmanifest-parse/example)
* [Run the tests](https://marisademeglio.github.io/pubmanifest-parse/tests/run-tests.html)
    * _Two of them fail currently because of differences between servers used in testing (local vs github)_
* [Run the W3C publ-tests](https://marisademeglio.github.io/pubmanifest-parse/official-tests)
    * [Audiobooks manifest processing test results](https://marisademeglio.github.io/pubmanifest-parse/official-tests/results/audiobooks.html) as of 22 March 2020
    * [Publication manifest processing test results](https://marisademeglio.github.io/pubmanifest-parse/official-tests/results/pubmanifest.html) as of 22 March 2020

To run anything locally (examples, tests), first start a web server, e.g. `npx http-serve -c-1`.

# Caveats

Does not (at the moment):
* perform [global data checks](https://www.w3.org/TR/pub-manifest/#dfn-global-data-checks)
* differentiate the severity of validation errors (as described in [error handling](https://www.w3.org/TR/pub-manifest/#processing-errors))

