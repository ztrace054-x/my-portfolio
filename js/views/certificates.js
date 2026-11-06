import {certificates,certificateContent} from "../data/certificates.js?v=20261106.2";
import {stats} from "../data/stats.js?v=20261106.1";
import {escapeHTML} from "../utils.js?v=20261016.1";
import {mountPhase5View,renderPhase5Header} from "./phase5-view.js?v=20261020.2";
function renderEarned(c) {
 const name=escapeHTML(c.name), original=escapeHTML(c.original);
 return `<article class="hud-panel certificate-earned phase5-reveal" aria-label="${name}: Earned">
 <div class="certificate-earned-copy"><p class="view-eyebrow">COURSE COMPLETION / 01</p><span class="phase5-certificate-status">Earned</span>
 <h2>${name}</h2><p class="certificate-issuer">${escapeHTML(c.issuer)}</p>
 <dl><div><dt>Recipient</dt><dd>${escapeHTML(c.recipient)}</dd></div><div><dt>Awarded</dt><dd><time datetime="${c.date}">${escapeHTML(c.dateLabel)}</time></dd></div><div><dt>Certificate ID</dt><dd>${escapeHTML(c.certificateId)}</dd></div></dl>
 <p>${escapeHTML(c.program)}</p>
 <div class="certificate-actions"><button type="button" data-certificate-open aria-haspopup="dialog" aria-controls="certificate-preview">View certificate</button><a href="${original}" download="Md_Saad_Certificate.png">Download original</a><a href="${escapeHTML(c.verificationUrl)}" target="_blank" rel="noopener noreferrer">Verify with issuer ↗</a></div>
 <p class="certificate-evidence">Original supplied by recipient. Use certificate ID ${escapeHTML(c.certificateId)} on the issuer’s verification page.</p></div>
 <button class="certificate-preview-button" type="button" data-certificate-open aria-haspopup="dialog" aria-controls="certificate-preview" aria-label="Preview ${name} certificate"><img src="${original}" width="1123" height="794" alt="Certificate of Completion awarded to MD SAAD for Ethical Hacking for Beginners by Byte Capsule" loading="lazy"><span>Explore the original certificate ↗</span></button>
 <dialog id="certificate-preview" class="certificate-dialog" aria-labelledby="certificate-dialog-title" aria-describedby="certificate-dialog-description"><div class="certificate-dialog-heading"><h2 id="certificate-dialog-title">${escapeHTML(c.title)}</h2><button type="button" data-certificate-close autofocus>Close preview</button></div><p id="certificate-dialog-description">${name} · ${escapeHTML(c.recipient)} · ${escapeHTML(c.dateLabel)}</p><img src="${original}" width="1123" height="794" alt="Original certificate, including issuer signature, QR code and certification ID ${escapeHTML(c.certificateId)}"><a href="${original}" download="Md_Saad_Certificate.png">Download original certificate</a></dialog>
 </article>`;
}
export function render(){
 const cards=certificates.filter(c=>c.status==="Planned").map((certificate,index)=>`<article class="hud-panel phase5-certificate-card phase5-reveal" style="--phase5-delay:${index*55}ms" aria-label="${escapeHTML(certificate.name)}: ${escapeHTML(certificate.emptyLabel)}, ${escapeHTML(certificate.status)}"><div class="phase5-certificate-card-top"><span class="phase5-certificate-lock" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><rect x="5" y="10" width="14" height="11" rx="1.5"></rect><path d="M8 10V7a4 4 0 0 1 8 0v3"></path><path d="M12 14v3"></path></svg></span><span class="phase5-certificate-status">${escapeHTML(certificate.status)}</span></div><p class="phase5-certificate-empty">${escapeHTML(certificate.emptyLabel)}</p><h2>${escapeHTML(certificate.name)}</h2></article>`).join("");
 return `<section class="view-page phase5-view phase5-certificates" aria-labelledby="view-heading">${renderPhase5Header(certificateContent)}<div class="phase5-earned-summary phase5-reveal"><span class="phase5-earned-dot" aria-hidden="true"></span><strong>${escapeHTML(certificateContent.earnedLabel)}: ${Number(stats.certificatesEarned)||0}</strong><span>${escapeHTML(certificateContent.goalLabel)}</span></div>${certificates.filter(c=>c.status==="Earned").map(renderEarned).join("")}<h2 class="certificate-planned-heading">Future qualifications <span>Planned</span></h2><div class="phase5-certificate-grid">${cards}</div><p class="phase5-certificate-note">${escapeHTML(certificateContent.note)}</p></section>`;
}
export function mount(root,options={}){
 const dispose=mountPhase5View(root,options);
 const dialog=root.querySelector?.("#certificate-preview");
 let trigger=null;
 function click(event){
  const open=event.target.closest?.("[data-certificate-open]");
  if(open && dialog){trigger=open;dialog.showModal();}
  if(event.target.closest?.("[data-certificate-close]"))dialog?.close();
  if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}
 }
 function trapTab(event){
  if(event.key!=="Tab")return;
  const items=[...dialog.querySelectorAll('button,a[href]')],first=items[0],last=items.at(-1);
  if(event.shiftKey && dialog.ownerDocument.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey && dialog.ownerDocument.activeElement===last){event.preventDefault();first.focus();}
 }
 function restore(){if(trigger?.isConnected)trigger.focus();}
 root.addEventListener?.("click",click);
 dialog?.addEventListener("close",restore);
 dialog?.addEventListener("keydown",trapTab);
 return ()=>{dialog?.removeEventListener("keydown",trapTab);dialog?.removeEventListener("close",restore);if(dialog?.open)dialog.close();root.removeEventListener?.("click",click);dispose();};
}
