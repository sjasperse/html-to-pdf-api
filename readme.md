Html to PDF API
=======================

 Exposes an API to convert Html to PDF. 

 It is just a small API (using `express`) over the `phantom-html-to-pdf` NodeJS package, so any options for `phantom-html-to-pdf` can be passed.

 Routes
 -------
 - `GET /test` - Internal test to make sure PDF creation is functioning properly. It will return a pair of 2x1 labels.
 - `GET /test.html` - Returns the HTML used to create the two labels.
 - `GET /test.json` - Returns the json passed to the self-test.
 - `POST /` - Receives a json body with the options to be passed into PDF converter. Returns PDFs.

 Notes
 -------
  For some reason, with PhantomJS 2+ the zoom is off when rendering to PDF. I offset this in my POC by setting a zoom factor when rendering the page, but with the `phantom-html-to-pdf` package I didn't have a good way to do this. I solved it by duplicating the entire phantomjs rendering script from his repo, adding the little stub I needed, and then passing the new script file path into the converter engine.

