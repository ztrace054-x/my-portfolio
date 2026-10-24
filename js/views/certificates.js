import {certificates,certificateContent} from "../data/certificates.js?v=20261024.3";
import {stats} from "../data/stats.js?v=20261019.2";
import {escapeHTML} from "../utils.js?v=20261016.1";
import {mountPhase5View,renderPhase5Header} from "./phase5-view.js?v=20261020.2";
export function render(){
 const cards=certificates.map((certificate,index)=>`<article class="hud-panel phase5-certificate-card phase5-reveal" style="--phase5-delay:${index*55}ms" aria-label="${escapeHTML(certificate.name)}: ${escapeHTML(certificate.emptyLabel)}, ${escapeHTML(certificate.status)}"><div class="phase5-certificate-card-top"><span class="phase5-certificate-lock" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><rect x="5" y="10" width="14" height="11" rx="1.5"></rect><path d="M8 10V7a4 4 0 0 1 8 0v3"></path><path d="M12 14v3"></path></svg></span><span class="phase5-certificate-status">${escapeHTML(certificate.status)}</span></div><p class="phase5-certificate-empty">${escapeHTML(certificate.emptyLabel)}</p><h2>${escapeHTML(certificate.name)}</h2></article>`).join("");
 return `<section class="view-page phase5-view phase5-certificates" aria-labelledby="view-heading">${renderPhase5Header(certificateContent)}<div class="phase5-earned-summary phase5-reveal"><span class="phase5-earned-dot" aria-hidden="true"></span><strong>${escapeHTML(certificateContent.earnedLabel)}: ${Number(stats.certificatesEarned)||0}</strong><span>${escapeHTML(certificateContent.goalLabel)}</span></div><div class="phase5-certificate-grid">${cards}</div><p class="phase5-certificate-note">${escapeHTML(certificateContent.note)}</p></section>`;
}
export function mount(root,options={}){return mountPhase5View(root,options);}
