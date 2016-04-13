## Inline-Diff
JavaScript inline visual diff tool. Based on [CodeMirror](https://codemirror.net/). 
This depends on the [google-diff-match-patch](https://code.google.com/archive/p/google-diff-match-patch/) library to compute the diffs.
## Usage
Example creating new instance of inline diff editor
```javascript
/*
* Inline diff constructor
* @attr place {DOM} HTML element where you wannt to render editor 
* @attr options {Object}
* @attr options.baseText
* @attr options.newText
*/
var editor = new inlineDiff(place, options);
```
You can create new instance and render it later
```javascript
var editor = new inlineDiff();
// Calling render method 
editor.render(place);
// Or setting editor parent element
editor.parentEl = place;
```
You can set or change original and new text anytime
```javascript
editor.setTexts(text1,text2);
// Or changing just one text
editor.baseText = text3;
editor.calculateDiff();
```

## Building
If you need to use this lib just include files inside build folder 
