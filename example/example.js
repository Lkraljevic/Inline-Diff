window.onload = ()=>{
  window.cm1 = new CodeMirror(document.getElementById('cm1'))
  window.cm2 = new CodeMirror(document.getElementById('cm2'))

  document.getElementById('calculate').onclick = function() {
    window.inlineEditor.setTexts(cm1.getValue(),cm2.getValue());    
    window.inlineEditor.calculateDiff();
  }

  window.inlineEditor = new inlineDiff(document.getElementById('diff-content'))
}