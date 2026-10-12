import assert from "node:assert/strict";
import { safePublicData } from "../src/publicData.js";
import { defaultContact } from "../src/copy.js";

let checks = 0;
function check(input, expected, label) {
  assert.deepEqual(safePublicData(input, defaultContact), expected, label);
  checks++;
}
const empty = { contact: defaultContact, downloads: [] };
check(null, empty, "Missing API data uses known safe defaults");
check({ contact: { phone: {}, email: [], instagram: "javascript:alert(1)" } }, empty, "Malformed fields and script URL rejected");
for (const instagram of ["https://instagram.com.evil.test/u", "https://instagram.com@evil.test/u", "http://www.instagram.com/u", "https://www.instagram.com:8443/u", "data:text/html,test"]) {
  check({ contact: { instagram } }, empty, "Only the expected HTTPS Instagram authority is accepted");
}
check({ contact: { email: "user@example.com?body=unwanted", phone: "(-------)" } }, empty, "Contact query injection and empty phone rejected");
check({ contact: { email: "u@example.com\r\nBcc:x@example.com" } }, empty, "CRLF email injection rejected");
const valid = { file: "example.pdf", titleFa: "رزومه", titleEn: "Résumé" };
check({ downloads: [valid, { ...valid, file: "../bad.pdf" }, { ...valid, file: "bad%2f.pdf" }, { ...valid, file: "bad.pdf.php" }, { ...valid, titleFa: {} }, { ...valid, file: ".hidden.pdf" }] }, { contact: defaultContact, downloads: [valid] }, "Traversal, encoded separators, extensions and malformed titles rejected");
check({ contact: { email: "new@example.com", phone: "+12025550123", instagram: "https://www.instagram.com/example/" }, downloads: [{ ...valid, internal: "private" }] }, { contact: { email: "new@example.com", phone: "+12025550123", instagram: "https://www.instagram.com/example/" }, downloads: [valid] }, "Valid public fields accepted; extra properties omitted");
console.log(`${checks} public API boundary checks passed`);
