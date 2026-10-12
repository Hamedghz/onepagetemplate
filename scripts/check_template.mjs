import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { copy, defaultContact, siteConfig } from "../src/copy.js";

assert.equal(copy.en.brand, "Your Name");
assert.equal(copy.fa.brand, "نام شما");
assert.equal(defaultContact.email, "hello@example.com");
assert.equal(defaultContact.phone, "+12025550123");
for (const language of ["fa", "en"]) {
  const t = copy[language];
  assert.equal(t.nav.length, 7);
  assert.ok(t.projects.items.every((project) => new URL(project.url).hostname === "example.com"));
  assert.ok(t.experience.jobs.every((job) => language === "fa" ? job.org.includes("نمونه") : job.org.startsWith("Example")));
  assert.ok(t.education.degrees.every((degree) => language === "fa" ? degree.note.includes("نمونه") : degree.note.startsWith("Example")));
}
assert.equal(new URL(siteConfig.qualificationUrl).hostname, "example.com");
assert.equal(new URL(siteConfig.projectsUrl).hostname, "example.com");
assert.ok(existsSync(`public${siteConfig.logo}`));
const backend = readFileSync("admin/bootstrap.php", "utf8");
assert.ok(backend.includes(defaultContact.email) && backend.includes(defaultContact.phone));
assert.ok(backend.includes("__Host-TemplateAdmin"));
console.log("17 sample-content, logo, contact-default and internal-name checks passed.");
