# Phase 5: Original certificate integration

Base: Phase 4 identity branch, dd6cbe108fab59736917bfda6507029b77dbd25d.

The first card at `#/certificates` displays the supplied original, with an accessible native dialog, original download, and issuer verification link. Dashboard certificate totals derive from earned records. CEH, OSCP and the two other future qualifications remain Planned.

## Document inspection
- Heading: Certificate of Completion
- Course: Ethical Hacking for Beginners
- Recipient: MD SAAD
- Issuer printed on document: Byte Capsule
- Awarded: November 01, 2026
- Certification ID: 7482ZWKQ
- Programme: 100 Days Challenge Live Online Training Program
- Signature: Sakib Haque Zisan, CEO, Byte Capsule
- Visible details: handwritten signature, ISO 27001 emblem, Byte Capsule watermark, shield/lock illustration, QR code labelled Scan to Verify.
- QR decoded to https://bytecapsuleit.com/verify-certificate. No independent issuer database result was obtained; earned status reflects the document and recipient confirmation. The emblem is not treated as evidence of accreditation.
- Original SHA-256: `0ab9dcc9d047ed8bd78fa61e2b6d000ae0784201ce0dc73c7db3f3095287fbfa`.

## Verification
Existing repository checks and JavaScript syntax validation pass. Browser verification covers desktop, 390px and 320px mobile layouts, dialog focus containment/restoration, Escape and close button, original download, dashboard count, and browser errors. The original file is intentionally exempted from the 250 KB illustration budget (715606 bytes); its exact hash is tested.

To repeat browser checks, install Playwright, serve the repository on localhost:4173, then run `node tests/certificate-browser-check.cjs`. Set CHROME_PATH only when using an installed Chromium. Screenshots go to artifacts/certificate-qa.

The supplied wallpaper was used only as a color reference. No production merge or deployment is included.
