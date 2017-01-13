import 'codemirror/lib/codemirror.css!';
import CodeMirror from 'codemirror';
/* MODES */

import 'codemirror/mode/meta';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/mode/xml/xml';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/css/css';
import 'codemirror/mode/clike/clike';
import 'codemirror/addon/mode/multiplex';
import 'codemirror/addon/mode/overlay';
import 'codemirror/addon/mode/simple';

import DiffMatchPatch from 'diff-match-patch';

import './inline-diff.css!'

window.DIFF_DELETE = -1;
window.DIFF_INSERT = 1;
window.DIFF_EQUAL = 0;


var dmp = new DiffMatchPatch();
var Pos = CodeMirror.Pos;

class Editor {

	constructor() {
		this.gutterBase = 'CodeMirror-linenumbers-basetext';
    this.gutterNew = 'CodeMirror-linenumbers-newtext';
    this.maxNumber = 0;
	}
	createEditor() {
    this._editorWrapEl = document.createElement('div');
    this._editorWrapEl.className = 'editor-display';
    
    editor.cm = CodeMirror(this._editorWrapEl, {
      gutters: ["CodeMirror-linenumbers-basetext", 'CodeMirror-linenumbers-newtext'],
      readOnly: true,
      fixedGutter: false
    });
  }

  /*
  * Set value of Codemirror insance and calls markUp method
  * @method display
  */
  display(text, diff) {
  	this.cm.setValue(text);
  	this.markUpDiff(diff);
  }
  /*
  * Create markups and gutter based on diff
  * @method markUpDiff
  */
  markUpDiff(diff) {

    var clean = []
    

    var chunkStart = 0;
    var pos = Pos(0, 0);
    var gutterCorrectionBase = 0;
    var gutterCorrectionNew = 0;

    function number(ln) {
      var element = document.createElement('div');
      element.className = 'CodeMirror-linenumber CodeMirror-gutter-elt';
      element.innerHTML = (ln != null) ? ln + 1 : '';

      return element;
    }

    function collapseSingle(cm, from, to) {
      cm.addLineClass(from, "wrap", "CodeMirror-merge-collapsed-line");
      var widget = document.createElement("span");
      widget.className = "CodeMirror-merge-collapsed-widget";
      widget.title = "Identical text collapsed. Click to expand.";
      var mark = cm.markText(Pos(from, 0), Pos(to - 1), {
        inclusiveLeft: true,
        inclusiveRight: true,
        replacedWith: widget,
        clearOnEnter: true
      });
      function clear() {
        mark.clear();
        cm.removeLineClass(from, "wrap", "CodeMirror-merge-collapsed-line");
      }
      CodeMirror.on(widget, "click", clear);
      return {mark: mark, clear: clear};
    }
    

    function moveOver(pos, str, copy, other) {
      var out = copy ? Pos(pos.line, pos.ch) : pos,
        at = 0;
      for (;;) {
        var nl = str.indexOf("\n", at);
        if (nl == -1) break;
        ++out.line;
        if (other) ++other.line;
        at = nl + 1;
      }
      out.ch = (at ? 0 : out.ch) + (str.length - at);
      if (other) other.ch = (at ? 0 : other.ch) + (str.length - at);
      return out;
    }

    function startOfLineClean(diff, i) {
      if (i == 0) return true;
      var last = diff[i - 1][1];
      if (last.charCodeAt(last.length - 1) != 10) return false;
      if (i == 1) return true;
      last = diff[i - 2][1];
      return last.charCodeAt(last.length - 1) == 10;
    }

    function endOfLineClean(diff, i) {
      if (i == diff.length - 1) return true;
      var next = diff[i + 1][1];
      if (next.length == 1 || next.charCodeAt(0) != 10) return false;
      if (i == diff.length - 2) return true;
      next = diff[i + 2][1];
      return next.length > 1 && next.charCodeAt(0) == 10;
    }

    for (var i = 0; i < diff.length; ++i) {
      var part = diff[i],
        tp = part[0],
        str = part[1];
      if (tp == DIFF_EQUAL) {
        var currenClean = {};
        var cleanFrom = pos.line + (startOfLineClean(diff, i) ? 0 : 1);
        currenClean.start = pos.line;
        moveOver(pos, str);
        var cleanTo = pos.line + (endOfLineClean(diff, i) ? 1 : 0);
        currenClean.end = pos.line;
        //clean.push(currenClean)
        /*

          for (var i = 0; i < dv.chunks.length; i++) {
            var chunk = dv.chunks[i];
            for (var l = chunk.editFrom - margin; l < chunk.editTo + margin; l++) {
              var pos = l + off;
              if (pos >= 0 && pos < clear.length) clear[pos] = false;
            }
          }

        */
        if(i == 0 ) {
          if(currenClean.end - currenClean.start > 3)
          currenClean.end -= 2;  
        }
        else if(i == diff.length - 1) {
          if(currenClean.end - currenClean.start > 3) {
            currenClean.start += 2;
            currenClean.end += 1; // I dont knwo why this needs
          }
          

        }
        else {
          if(currenClean.end - currenClean.start > 5) {
            currenClean.start += 2;
            currenClean.end -= 2;
          }
        }
        if(diff.length != 1)
          collapseSingle(editor.cm, currenClean.start, currenClean.end);

        // Update gutter
        for (var j = cleanFrom; j < cleanTo; j++) {
          editor.cm.setGutterMarker(j, this.gutterBase, number(gutterCorrectionBase));
          editor.cm.setGutterMarker(j, this.gutterNew, number(gutterCorrectionNew));
          gutterCorrectionBase++;
          gutterCorrectionNew++;
        }

      } else {
        var startLine = pos.line;
        var end = moveOver(pos, str);
        var endLine = end.line;
        pos = end;
        for (var j = startLine; j < endLine; j++) {
          var gutterNumber = (tp == DIFF_INSERT) ? gutterCorrectionNew : gutterCorrectionBase;

          var marked = editor.cm.addLineClass(j, 'background', (tp == DIFF_INSERT) ? 'insert' : 'delete');
          var markedGutter = editor.cm.addLineClass(j, 'gutter', (tp == DIFF_INSERT) ? 'insert' : 'delete');
          editor.cm.setGutterMarker(j, (tp == DIFF_INSERT) ? this.gutterNew : this.gutterBase, number(gutterNumber));
          if (tp == DIFF_INSERT)
            gutterCorrectionNew++;
          else
            gutterCorrectionBase++;
        }
      }
      this.maxNumber = gutterCorrectionBase > gutterCorrectionNew ? gutterCorrectionBase: gutterCorrectionNew;
    }
    // After markup applay refresh codemirror and update gutter 
    this.refresh();

  }

  updateGutter() {

  	function updateGutterSpace() {
    	// Gutters div, width = sum(gutters) + border
    	var width = this.cm.display.gutters.offsetWidth;
    	// Codemirror sizer holds codemirror content
    	this.cm.display.sizer.style.marginLeft = width + "px";
  	}
    function updateLineGutters() {
    	var maxNumber = this.maxNumber;
      var parent = document.createElement("div");
      var child = document.createElement("div");

      child.appendChild(document.createTextNode(maxNumber));
      parent.appendChild(child);
      parent.className = "CodeMirror-linenumber CodeMirror-gutter-elt"
      var test = this.cm.display.measure.appendChild(parent);

      var gutterBaseElement = this.cm.getGutterElement().getElementsByClassName(this.gutterBase)[0];
      var gutterNewElement = this.cm.getGutterElement().getElementsByClassName(this.gutterNew)[0];
      gutterBaseElement.style.width = "";
      gutterNewElement.style.width = "";

      var innerW = test.firstChild.offsetWidth,
            padding = test.offsetWidth - innerW;
        
      var lineNumInnerWidth = Math.max(innerW, gutterBaseElement.offsetWidth - padding) + 1;
      var lineNumWidth = lineNumInnerWidth + padding;
      var lineNumChars = lineNumInnerWidth ? maxNumber.toString().length : -1;

      gutterBaseElement.style.width = lineNumWidth + "px";
      gutterNewElement.style.width = lineNumWidth + "px";
      updateGutterSpace.call(this);
    }
		
		updateLineGutters.call(this);
  }

  refresh() {
  	setTimeout(() => { 
      this.updateGutter();
    	this.cm.refresh();
    }, 0);	
  }

}

var editor = new Editor({});

/* 
* @class inlineDiff
*/
class inlineDiff {

  /*
   * @class inlineDiff
   * @constructor
   * @attr place {} DOM element where diff preview editor will be renderd
   * @attr options {Object} 
   * @attr options.baseText {String} original text
   * @attr options.newText {String} new txt
   */
  constructor(place, options) {
  	
  	editor.createEditor();
    this.editor = editor;
  	this.parentEl = place;

    if(options) {
    	if(options.baseText && options.newText)
    		this.setTexts(options.baseText, options.newText);
    }

  }

  /*
   *
   */
  set parentEl(parentEl) {
  	if(!parentEl) {
  		return;
  	}
  	// If change parent
  	if(parentEl != this._parentEl && this.parentEl) {
  		this.parentEl.removeChild(editor._editorWrapEl);
  	}

  	this._parentEl = parentEl;
    this._parentEl.appendChild(editor._editorWrapEl);

    editor.refresh();
  }
  get parentEl() {
    return this._parentEl;
  }

  set baseText(baseText) {
  	this._baseText = baseText;
  }
  get baseText() {
    return this._baseText || '';
  }
  set newText(newText) {
  	this._newText = newText;
  }
  get newText() {
    return this._newText;
  }
  
  /*
  * Calculate diff betwen baseText and newText property and send res to preview editor
  * @method calculateDiff
  */
  calculateDiff() {
    var diff = this.diff_lineMode(this.baseText, this.newText);
    var diffString = this.diffToString(diff);
    editor.display(diffString, diff);
  }

  /*
  * Set base and new text and calculate diffs over them
  * @method setTexts
  */
  setTexts(baseText, newText) {
  	this.baseText = baseText;
  	this.newText = newText;
  	this.calculateDiff();
  }

  /*
  *
  */
  render(element) {
  	this.parentEl = element;
  }
  
  /*
  * Calculate line diff
  * @method diff_lineMode
  * return linediff
  */
  diff_lineMode(text1, text2) {

    var a = dmp.diff_linesToChars_(text1, text2);
    var lineText1 = a.chars1;
    var lineText2 = a.chars2;
    var lineArray = a.lineArray;
    var diffs = dmp.diff_main(lineText1, lineText2, false);
    dmp.diff_charsToLines_(diffs, lineArray);
    return diffs;
  }

  /*
  * Join line diff to string
  * @method diffToString
  * return 
  */
  diffToString(diffs) {
    var html = [];
    for (var x = 0; x < diffs.length; x++) {
      html[x] = diffs[x][1];
    }
    return html.join('');
  }

  setMode(mode) {
    this.editor.setOptions('mode', mode);
  }
}


window.inlineDiff = inlineDiff;

