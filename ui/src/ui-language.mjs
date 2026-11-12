import english from "./locales/en.json" with { type: "json" };

export const uiLanguage =
  import.meta.env?.VITE_CAGE_UI_LANGUAGE === "en" ? "en" : "zh-CN";

export function uiText(message) {
  if (uiLanguage === "en" && typeof message === "string" && Object.hasOwn(english, message)) {
    return english[message];
  }
  return message;
}

export function uiFormat(message, ...values) {
  return uiText(message).replace(/\{(\d+)\}/g, (placeholder, index) =>
    Number(index) < values.length ? String(values[index]) : placeholder);
}
