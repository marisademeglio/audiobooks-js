Version: 0.2.2

This is a spec-compliant audiobooks manifest processor. Given JSON input, it performs the processing steps as described in both [pub-manifest spec](https://www.w3.org/TR/pub-manifest/#manifest-processing) and  [audiobooks](https://www.w3.org/TR/audiobooks/#audio-manifest-processing). 

These rules dictate how to process and normalize the manifest data, so, for example, all the URLs get resolved, all the invalid values removed, any errors get reported, and anything that's not in an object or array and should be, is. There are also a handful of convenience functions for getting localizable strings and navigating the reading order.

This is __not__ intended to be a manifest validator. Errors are reported only when they affect processing.

To use it, copy [`audiobooks-js.min.js`](https://github.com/marisademeglio/audiobooks-js/tree/master/build/audiobooks-js.min.js) to your project.

I wrote this to help with some demos I'm working on. My target is the browser, and I wrote this processor as an ES6 module. It would be easy enough to port to other environments.

PRs welcome! 

# Links

* [Github](https://github.com/marisademeglio/audiobooks-js): Source code
* [API](https://marisademeglio.github.io/audiobooks-js/api): Documentation
* [Working example](https://marisademeglio.github.io/audiobooks-js/example): Try it
* [Run the tests](https://marisademeglio.github.io/audiobooks-js/tests/run-tests.html): Try it!
    * _Two of them fail currently because of differences between servers used in testing (local vs github)_
    * _A duration test fails because `audiobooks-js` is more permissive and allows durations like `00:33:11`
* [Run the W3C publ-tests](https://marisademeglio.github.io/audiobooks-js/official-tests)

To run anything locally (examples, tests), first start a web server, e.g. `npx http-serve -c-1`.

# Caveats

Does not (at the moment):
* differentiate the severity of validation errors (as described in [error handling](https://www.w3.org/TR/pub-manifest/#processing-errors)). E.g., it will tell you about validation vs fatal errors but it will not say whether a required or recommended practice has been violated.

