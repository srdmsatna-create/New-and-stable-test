/* SRDM FINAL READABLE PRINT JS — external file, never shown as page text */
(function(){
  "use strict";

  function byId(id){ return document.getElementById(id); }

  function esc(v){
    return String(v == null ? "" : v)
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;");
  }

  function cleanedTable(){
    var src = byId("reportTable");
    if(!src) return null;

    var t = src.cloneNode(true);
    var bad = t.querySelectorAll("script,style,template,noscript");
    for(var i=0;i<bad.length;i++){ bad[i].remove(); }

    var all=t.querySelectorAll("*");
    for(var j=0;j<all.length;j++){
      all[j].removeAttribute("width");
      all[j].style.transform="none";
      all[j].style.rotate="none";
      all[j].style.writingMode="horizontal-tb";
      all[j].style.whiteSpace="normal";
    }
    return t.outerHTML;
  }

  function printCurrent(ev){
    if(ev){
      ev.preventDefault();
      ev.stopPropagation();
      if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    }

    var orientation = "landscape";
    var sel = byId("printOrientation");
    if(sel && sel.value === "portrait") orientation = "portrait";

    var table = cleanedTable();
    if(!table) return;

    var title = byId("viewTitle") ? byId("viewTitle").textContent : "VBGRAMG Report";
    var meta = byId("viewMeta") ? byId("viewMeta").textContent : "";

    /* One complete table only. Larger font + narrower wrapped columns. */
    var font = orientation === "portrait" ? "7.4px" : "9.0px";
    var page = orientation === "portrait" ? "A4 portrait" : "A4 landscape";

    var html =
      "<!doctype html><html><head><meta charset='utf-8'><title>"+esc(title)+"</title>"+
      "<style>"+
      "@page{size:"+page+";margin:5mm}"+
      "*{box-sizing:border-box}"+
      "html,body{margin:0!important;padding:0!important;background:#fff!important;transform:none!important;rotate:none!important}"+
      "body{font-family:Arial,'Noto Sans Devanagari',sans-serif;color:#132238}"+
      "h1{font-size:17px;line-height:1.08;margin:0 0 2px;color:#0b3159}"+
      ".meta{font-size:9px;line-height:1.1;color:#607286;margin:0 0 6px}"+
      ".sheet{width:100%;max-width:100%;overflow:visible!important}"+
      "table{width:100%!important;min-width:0!important;max-width:100%!important;border-collapse:collapse!important;table-layout:fixed!important;font-size:"+font+"!important;transform:none!important;writing-mode:horizontal-tb!important}"+
      "th,td{border:1px solid #688cb2!important;padding:2.6px 1.8px!important;text-align:center!important;vertical-align:middle!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:normal!important;line-height:1.16!important;transform:none!important;rotate:none!important;writing-mode:horizontal-tb!important}"+
      "th{background:#cfe0f5!important;color:#0a3158!important;font-weight:800!important}"+
      "th:nth-child(1),td:nth-child(1){width:4.8%!important}"+
      "th:nth-child(2),td:nth-child(2){width:5.8%!important}"+
      ".badge{font-size:inherit!important;padding:1px 2px!important}"+
      "script,style,template,noscript{display:none!important}"+
      "</style></head><body>"+
      "<h1>"+esc(title)+"</h1><div class='meta'>"+esc(meta)+"</div>"+
      "<div class='sheet'>"+table+"</div>"+
      "</body></html>";

    var w=window.open("","_blank","width=1250,height=900");
    if(!w){
      alert("Print popup blocked है। Browser में pop-up allow करें।");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(function(){ w.print(); },450);
  }

  function install(){
    var orient=byId("printOrientation");
    if(orient){
      orient.disabled=false;
      orient.title="Portrait या Landscape चुनें";
    }

    var btn=byId("printBtn");
    if(btn && !btn.dataset.srdmReadablePrint){
      btn.dataset.srdmReadablePrint="1";
      btn.addEventListener("click",printCurrent,true);
    }
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",install);
  }else{
    install();
  }
})();
