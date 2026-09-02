/* SRDM_EXCEL_DOWNLOAD_FINAL_01_09_2026 */
(function(){
  "use strict";

  function byId(id){ return document.getElementById(id); }

  function escapeHtml(v){
    return String(v == null ? "" : v)
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;");
  }

  function currentTableClone(){
    var src = byId("reportTable");
    if(!src) return null;

    var t = src.cloneNode(true);
    var bad = t.querySelectorAll("script,style,template,noscript");
    for(var i=0;i<bad.length;i++){ bad[i].remove(); }

    var cells = t.querySelectorAll("th,td");
    for(var j=0;j<cells.length;j++){
      cells[j].style.whiteSpace = "normal";
      cells[j].style.verticalAlign = "middle";
    }
    return t;
  }

  function downloadExcel(ev){
    if(ev){
      ev.preventDefault();
      ev.stopPropagation();
      if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    }

    var table = currentTableClone();
    if(!table){
      alert("Current report table नहीं मिला।");
      return;
    }

    var titleEl = byId("viewTitle");
    var metaEl = byId("viewMeta");
    var title = titleEl ? titleEl.textContent.trim() : "VBGRAMG Report";
    var meta = metaEl ? metaEl.textContent.trim() : "";

    var html =
      '<html xmlns:o="urn:schemas-microsoft-com:office:office" '+
      'xmlns:x="urn:schemas-microsoft-com:office:excel" '+
      'xmlns="http://www.w3.org/TR/REC-html40">'+
      '<head><meta charset="utf-8">'+
      '<style>'+
      'body{font-family:Arial,sans-serif}'+
      'h2{font-size:16px;color:#0b3159;margin:0 0 3px}'+
      'p{font-size:10px;color:#607286;margin:0 0 8px}'+
      'table{border-collapse:collapse;width:100%;font-size:11px}'+
      'th,td{border:1px solid #7293b5;padding:4px;text-align:center;vertical-align:middle;white-space:normal}'+
      'th{background:#cfe0f5;color:#0a3158;font-weight:bold}'+
      '</style></head><body>'+
      '<h2>'+escapeHtml(title)+'</h2>'+
      '<p>'+escapeHtml(meta)+'</p>'+
      table.outerHTML+
      '</body></html>';

    var blob = new Blob(["\ufeff", html], {
      type: "application/vnd.ms-excel;charset=utf-8"
    });

    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    var stamp = new Date().toISOString().slice(0,10);
    var safeTitle = title.replace(/[\\/:*?"<>|]+/g,"-").replace(/\s+/g,"_").slice(0,60);

    a.href = url;
    a.download = (safeTitle || "VBGRAMG_Report") + "_" + stamp + ".xls";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();

    setTimeout(function(){
      try{ URL.revokeObjectURL(url); }catch(e){}
      try{ a.remove(); }catch(e){}
    },1000);
  }

  function installExcel(){
    var btn = byId("excelBtn");
    if(!btn) return;

    var cleanBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(cleanBtn, btn);
    cleanBtn.addEventListener("click", downloadExcel, true);
    cleanBtn.title = "Current visible report Excel में डाउनलोड करें";
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", installExcel);
  }else{
    installExcel();
  }
})();
