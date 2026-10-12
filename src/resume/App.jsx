import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useTransform } from "motion/react";
import { copy, defaultContact } from "../copy.js";
import { safePublicData } from "../publicData.js";
import { useContinuousScenes, useLiveReducedMotion } from "../useContinuousScenes.js";

const sceneIds = ["profile", "projects", "experience", "expertise", "qualification", "education", "downloads"];
const SCENE_COUNT = sceneIds.length;
const numberFormatters = {
  fa: new Intl.NumberFormat("fa-IR", { useGrouping: false }),
  en: new Intl.NumberFormat("en-US", { useGrouping: false }),
};
function formatNumber(value, language, padded = false) {
  const text = numberFormatters[language].format(Number(value));
  return padded ? text.padStart(2, language === "fa" ? "۰" : "0") : text;
}
function displayDigits(value, language) {
  return language === "fa" ? String(value).replace(/[0-9]/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[digit]) : String(value);
}

function Icon({ name, size = 18 }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  const paths = {
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    phone: <><path d="M7 3h10v18H7z" /><path d="M10 17h4" /></>,
    instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".7" fill="currentColor" /></>,
    download: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></>,
    network: <><circle cx="12" cy="12" r="2" /><circle cx="4" cy="5" r="1.5" /><circle cx="20" cy="5" r="1.5" /><circle cx="4" cy="19" r="1.5" /><circle cx="20" cy="19" r="1.5" /><path d="m10.5 10.5-5-4M13.5 10.5l5-4m-8 9-5 3m8-3 5 3" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
  };
  return <svg {...common}>{paths[name] || null}</svg>;
}

function SectionHeader({ index, language, label, title, summary, titleId }) {
  return (
    <header className="section-header">
      <p className="eyebrow"><span className="section-index" aria-hidden="true">{formatNumber(index, language, true)}</span>{label}</p>
      <h2 id={titleId}>{title}</h2>
      {summary && <p className="section-summary">{summary}</p>}
    </header>
  );
}

function AbstractNetwork() {
  return (
    <div className="network-art" aria-hidden="true">
      <div className="art-arc art-arc-one" /><div className="art-arc art-arc-two" />
      <div className="art-core"><span>H</span></div>
      <span className="art-node node-one" /><span className="art-node node-two" />
      <span className="art-node node-three" /><span className="art-node node-four" />
      <span className="art-label label-one">DATA</span><span className="art-label label-two">NETWORK</span>
      <div className="art-grid" />
    </div>
  );
}

function App() {
  const [language, setLanguage] = useState("fa");
  const [contact, setContact] = useState(defaultContact);
  const [downloads, setDownloads] = useState([]);
  const [downloadPage, setDownloadPage] = useState(0);
  const [paused, setPaused] = useState(false);
  const [desktop, setDesktop] = useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 960px) and (orientation: landscape)").matches);
  const [announcement, setAnnouncement] = useState("");
  const stageRef = useRef(null);
  const sceneRefs = useRef([]);
  const reducedMotion = useLiveReducedMotion();
  const { activeScene, progress, goTo, pauseInteraction } = useContinuousScenes({ stageRef, sceneRefs, count: SCENE_COUNT, desktop, reducedMotion, paused });
  const journeyProgress = useTransform(progress, [0, SCENE_COUNT - 1], [0, 1]);
  const t = copy[language];
  const downloadPageCount = Math.max(1, Math.ceil(downloads.length / 4));
  const visibleDownloads = desktop ? downloads.slice(downloadPage * 4, downloadPage * 4 + 4) : downloads;

  const go = useCallback((index) => {
    const bounded = Math.max(0, Math.min(index, SCENE_COUNT - 1));
    const current = formatNumber(bounded + 1, language);
    const total = formatNumber(SCENE_COUNT, language);
    setAnnouncement(copy[language].footer.count.replace("{current}", current).replace("{total}", total));
    goTo(bounded);
  }, [language, goTo]);

  useEffect(() => {
    const onResize = () => setDesktop(window.matchMedia("(min-width: 960px) and (orientation: landscape)").matches);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    let alive = true;
    fetch("/api/public-settings.php", { headers: { Accept: "application/json" }, cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!alive || !data) return;
        const safe = safePublicData(data, defaultContact);
        setContact(safe.contact);
        setDownloads(safe.downloads);
        setDownloadPage(0);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "fa" ? "rtl" : "ltr";
  }, [language]);

  const slides = [
    <section className="scene scene-profile" id="profile" aria-labelledby="title-profile">
      <div className="scene-copy">
        <p className="eyebrow"><span className="eyebrow-mark" />{t.hero.eyebrow}</p>
        <h1 id="title-profile">{t.hero.title}</h1>
        <p className="hero-subtitle">{t.hero.subtitle}</p>
        <p className="hero-summary">{t.hero.summary}</p>
        <div className="hero-license"><span className="grade-seal">{formatNumber(3, language)}</span><span><strong>{t.hero.license}</strong><small>{t.qualification.issuer}</small></span></div>
        <div className="hero-tags">{t.hero.chips.map((chip) => <span key={chip}>{chip}</span>)}</div>
        <div className="hero-actions"><button className="button button-gold" onClick={() => go(1)}>{t.hero.cta}<Icon name="arrow" /></button><a className="button button-outline" href={`mailto:${encodeURIComponent(contact.email)}`}>{t.hero.contact}<Icon name="mail" /></a></div>
      </div>
      <AbstractNetwork />
    </section>,
    <section className="scene scene-projects" id="projects" aria-labelledby="title-projects">
      <div className="scene-main">
        <SectionHeader index={2} language={language} titleId="title-projects" label={t.projects.eyebrow} title={t.projects.title} summary={t.projects.summary} />
        <div className="project-stack">
          {t.projects.items.map((project, index) => <a className={index === 0 ? "project-card project-featured" : "project-card"} href={project.url} key={project.name} target="_blank" rel="noopener noreferrer">
            <div className="project-card-top"><span className="project-kind">{index === 0 ? t.projects.featured : t.projects.repository}</span><span className="project-arrow" aria-hidden="true">↗</span></div>
            <h3>{project.name}</h3>
            <p>{project.description}</p>
            <div className="project-tags">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
            {index === 0 && <span className="project-view">{t.projects.viewCode}<Icon name="arrow" /></span>}
          </a>)}
        </div>
        <a className="projects-all-link" href="https://github.com/Hamedghz?tab=repositories" target="_blank" rel="noopener noreferrer">{t.projects.allProjects}<Icon name="arrow" /></a>
      </div>
      <div className="projects-art" aria-hidden="true"><AbstractNetwork /><span>AGENT<br />SYSTEM</span></div>
    </section>,
    <section className="scene scene-experience" id="experience" aria-labelledby="title-experience">
      <div className="scene-main">
        <SectionHeader index={3} language={language} titleId="title-experience" label={t.experience.eyebrow} title={t.experience.title} summary={t.experience.summary} />
        <div className="timeline">
          {t.experience.jobs.map((job, index) => <article className={job.current ? "job-card job-current" : "job-card"} key={job.title}>
            <div className="job-dot" />
            <div className="job-content"><div className="job-heading"><h3>{job.title}</h3>{job.current && <span className="current-badge">{t.experience.current}</span>}</div><p>{job.org}</p></div>
            {job.date && <time>{job.date}</time>}
          </article>)}
        </div>
      </div>
    </section>,
    <section className="scene scene-expertise" id="expertise" aria-labelledby="title-expertise">
      <div className="scene-main">
        <SectionHeader index={4} language={language} titleId="title-expertise" label={t.expertise.eyebrow} title={t.expertise.title} summary={t.expertise.summary} />
        <div className="expertise-grid">
          {t.expertise.items.map((item) => <article className="expertise-card" key={item.code}><span>{formatNumber(item.code, language, true)}</span><div><h3>{item.title}</h3><p>{item.body}</p></div><Icon name="network" /></article>)}
        </div>
      </div>
      <div className="expertise-art"><AbstractNetwork /></div>
    </section>,
    <section className="scene scene-qualification" id="qualification" aria-labelledby="title-qualification">
      <div className="credential-card">
        <div className="credential-top"><SectionHeader index={5} language={language} titleId="title-qualification" label={t.qualification.eyebrow} title={t.qualification.title} /><span className="credential-stamp"><Icon name="check" /></span></div>
        <p className="credential-body">{t.qualification.body}</p>
        <div className="credential-rank"><span>{t.qualification.rank}</span><strong>{formatNumber(3, language)}</strong></div>
        <div className="credential-fields">{t.qualification.fields.map((field, index) => <div key={field}><span>{formatNumber(index + 1, language, true)}</span><strong>{field}</strong></div>)}</div>
        <p className="credential-issuer">{t.qualification.issuer}</p>
        <a className="credential-link" href="https://sb.irannsr.org/index.php?module=web_directory&amp;wd_id=107358&amp;ctp_id=1087&amp;id=33003" target="_blank" rel="noopener noreferrer">
          {t.qualification.verificationLink}<span aria-hidden="true">↗</span>
        </a>
      </div>
      <div className="credential-art"><AbstractNetwork /></div>
    </section>,
    <section className="scene scene-education" id="education" aria-labelledby="title-education">
      <div className="scene-main">
        <SectionHeader index={6} language={language} titleId="title-education" label={t.education.eyebrow} title={t.education.title} />
        <div className="degree-list">
          {t.education.degrees.map((degree) => <article className="degree-card" key={degree.code}><span>{degree.code}</span><div><small>{degree.level}</small><h3>{degree.field}</h3>{degree.note && <p>{degree.note}</p>}</div></article>)}
        </div>
        <div className="training-block"><p>{t.education.training}</p><div>{t.education.certificates.map((item) => <span key={item}>{item}</span>)}</div></div>
      </div>
      <div className="education-art"><AbstractNetwork /></div>
    </section>,
    <section className="scene scene-downloads" id="downloads" aria-labelledby="title-downloads">
      <div className="scene-main">
        <SectionHeader index={7} language={language} titleId="title-downloads" label={t.downloads.eyebrow} title={t.downloads.title} summary={t.downloads.summary} />
        <div className="download-grid">
          {visibleDownloads.length ? visibleDownloads.map((item) => <a className="download-card" href={`/dl/${encodeURIComponent(item.file)}`} download={item.file} key={item.file} title={language === "fa" ? item.titleFa : item.titleEn}><Icon name="download" /><span><strong>{language === "fa" ? item.titleFa : item.titleEn}</strong><small>{item.file}</small></span><Icon name="arrow" /></a>) : <p className="empty-downloads">{t.downloads.empty}</p>}
        </div>
        {desktop && downloadPageCount > 1 && <nav className="download-pages" aria-label={t.downloads.pages}>
          <button type="button" disabled={downloadPage === 0} onClick={() => setDownloadPage((page) => Math.max(0, page - 1))}>{t.downloads.previous}</button>
          <span aria-live="polite">{formatNumber(downloadPage + 1, language)} / {formatNumber(downloadPageCount, language)}</span>
          <button type="button" disabled={downloadPage === downloadPageCount - 1} onClick={() => setDownloadPage((page) => Math.min(downloadPageCount - 1, page + 1))}>{t.downloads.next}</button>
        </nav>}
        <div className="contact-row">
          <a href={`mailto:${encodeURIComponent(contact.email)}`}><Icon name="mail" /><span><small>{t.downloads.email}</small><strong>{contact.email}</strong></span></a>
          <a href={`tel:${contact.phone.replace(/[ ()-]+/g, "")}`}><Icon name="phone" /><span><small>{t.downloads.phone}</small><strong>{displayDigits(contact.phone, language)}</strong></span></a>
          <a href={contact.instagram || defaultContact.instagram} target="_blank" rel="noopener noreferrer"><Icon name="instagram" /><span><small>{t.downloads.instagram}</small><strong>@ghasemzadeh.hamed</strong></span></a>
        </div>
      </div>
    </section>,
  ];

  const changeLanguage = () => setLanguage((value) => value === "fa" ? "en" : "fa");
  const step = (delta) => go(activeScene + delta);

  return (
    <div className="site-shell" data-language={language} dir={language === "fa" ? "rtl" : "ltr"} onMouseEnter={() => pauseInteraction("hover", true)} onMouseLeave={() => pauseInteraction("hover", false)} onFocusCapture={() => pauseInteraction("focus", true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) pauseInteraction("focus", false); }}>
      <a className="skip-link" href="#scene-stage">{t.controls.skip}</a>
      <header className="site-header">
        <a className="wordmark" href="#profile" onClick={(event) => { event.preventDefault(); go(0); }} aria-label={t.brand}>
          <img className="brand-mark-image" src="/assets/hamed-calligraphy-logo.png" alt="" width="48" height="48" /><span><strong>{t.brand}</strong><small>{t.role}</small></span>
        </a>
        <nav className="scene-nav" aria-label={language === "fa" ? "بخش‌های رزومه" : "Résumé sections"}>
          {t.nav.map((label, index) => <button key={sceneIds[index]} className={activeScene === index ? "scene-link active" : "scene-link"} type="button" aria-current={activeScene === index ? "step" : undefined} onClick={() => go(index)}><span>{formatNumber(index + 1, language)}</span>{label}</button>)}
        </nav>
        <div className="header-actions"><button className="language-button" type="button" onClick={changeLanguage} aria-label={t.controls.language}>{language === "fa" ? "EN" : "فا"}</button><button className="motion-button" type="button" onClick={() => setPaused((value) => !value)} disabled={reducedMotion} aria-pressed={paused || reducedMotion}>{reducedMotion ? t.controls.reduced : paused ? t.controls.play : t.controls.pause}</button></div>
      </header>

      <main className={desktop ? "scene-stage desktop-stage" : "scene-stage"} id="scene-stage" ref={stageRef} tabIndex={-1} aria-label={language === "fa" ? "رزومهٔ حامد قاسم‌زاده" : "Hamed Ghasemzadeh résumé"}>
        {slides.map((slide, index) => <div className={activeScene === index ? "scene-frame active" : "scene-frame"} key={sceneIds[index]} ref={(node) => { sceneRefs.current[index] = node; }}>
          <div className="scene-motion" dir={language === "fa" ? "rtl" : "ltr"}>{slide}</div>
        </div>)}
      </main>

      <footer className="site-footer">
        <div className="journey-rail" aria-hidden="true"><motion.span style={{ scaleX: journeyProgress }} /></div>
        <div className="footer-controls"><button type="button" onClick={() => step(-1)} disabled={activeScene === 0} aria-label={t.controls.previous}>→</button><span>{formatNumber(activeScene + 1, language)} / {formatNumber(SCENE_COUNT, language)}</span><button type="button" onClick={() => step(1)} disabled={activeScene === SCENE_COUNT - 1} aria-label={t.controls.next}>←</button></div>
        <p>{t.footer.hint}</p>
      </footer>
      <p className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</p>
    </div>
  );
}

export default App;
