const validFilename = /^[A-Za-z0-9][A-Za-z0-9._-]{0,119}\.pdf$/i;

export function safePublicData(data, defaults) {
  const contact = { ...defaults };
  const values = data && typeof data === "object" && !Array.isArray(data) ? data.contact : null;
  if (values && typeof values === "object" && !Array.isArray(values)) {
    if (typeof values.email === "string" && values.email.length <= 254 && !/[\r\n?#]/.test(values.email) && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(values.email)) contact.email = values.email;
    if (typeof values.phone === "string" && /^\+?[0-9 ()-]{7,24}$/.test(values.phone) && values.phone.replace(/\D/g, "").length >= 7) contact.phone = values.phone;
    if (typeof values.instagram === "string" && values.instagram.length <= 2048) {
      try {
        const url = new URL(values.instagram);
        if (url.protocol === "https:" && ["instagram.com", "www.instagram.com"].includes(url.hostname) && !url.username && !url.password && !url.port) contact.instagram = url.href;
      } catch { /* Keep the known profile when the API value is invalid. */ }
    }
  }
  const downloads = Array.isArray(data?.downloads) ? data.downloads.filter((item) => item && typeof item.file === "string" && validFilename.test(item.file) && typeof item.titleFa === "string" && item.titleFa.length <= 360 && typeof item.titleEn === "string" && item.titleEn.length <= 360).slice(0, 200).map((item) => ({ file: item.file, titleFa: item.titleFa, titleEn: item.titleEn })) : [];
  return { contact, downloads };
}
