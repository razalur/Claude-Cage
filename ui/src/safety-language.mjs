import { uiFormat, uiLanguage, uiText } from "./ui-language.mjs";

// Saved reports and older controllers send diagnostic text in Chinese.
const details = [
  [/^常规 IPv6 查路由明确不可达；(\d+) 条接口限定的默认路由逐个绑定检查，均未连通或发现外部源地址。唯一客机网卡 (\S+) 对本轮随机 IPv6 UDP 探针在以太帧入口实施丢弃。?$/, "常规 IPv6 查路由明确不可达；{0} 条接口限定的默认路由逐个绑定检查，均未连通或发现外部源地址。唯一客机网卡 {1} 对本轮随机 IPv6 UDP 探针在以太帧入口实施丢弃。"],
  [/^IPv6 默认路由记录为 (\d+)。普通连接、逐接口观测与当前 VZ 网卡丢弃证据尚未全部匹配。?$/, "IPv6 默认路由记录为 {0}。普通连接、逐接口观测与当前 VZ 网卡丢弃证据尚未全部匹配。"],
  [/^环境未能完成代理出口查询（检测通道 HTTP (\d+)），尚不能确认代理连接可用$/, "环境未能完成代理出口查询（检测通道 HTTP {0}），尚不能确认代理连接可用"],
];

const quoted = String.raw`("(?:[^"\\]|\\.)*")`;
const browserDetails = [
  [new RegExp(`^时区不一致（期望 ${quoted}，实际 ${quoted}）$`), "时区不一致（期望 {0}，实际 {1}）"],
  [new RegExp(`^语言不一致（期望 ${quoted}，实际 ${quoted}）$`), "语言不一致（期望 {0}，实际 {1}）"],
  [new RegExp(`^系统标识不一致（期望 Linux，实际 ${quoted}）$`), "系统标识不一致（期望 Linux，实际 {0}）"],
];

export function safetyText(message) {
  if (uiLanguage !== "en" || typeof message !== "string") return message;

  const translated = uiText(message);
  if (translated !== message) return translated;

  for (const [pattern, key] of [...details, ...browserDetails]) {
    const match = pattern.exec(message);
    if (match) return uiFormat(key, ...match.slice(1));
  }

  const browserMismatch = /^浏览器配置检查未通过：(.*)$/.exec(message);
  if (browserMismatch) {
    const fields = browserMismatch[1].split("；").map(safetyText);
    return uiFormat("浏览器配置检查未通过：{0}", fields.join(" "));
  }

  const missing = /^联网检查缺少有效证据：(.+?)的记录缺失、过期或不完整。请重新检测；仍失败时在设置中导出诊断包。外网保持关闭。$/.exec(message);
  if (missing) {
    return uiFormat("联网检查缺少有效证据：{0}的记录缺失、过期或不完整。请重新检测；仍失败时在设置中导出诊断包。外网保持关闭。", uiText(missing[1]));
  }

  const failed = /^联网检查未通过：(.+?)(未通过|未能确认)。(.+)外网保持关闭。$/.exec(message);
  if (failed) {
    // The controller assembles these messages with Chinese full stops and
    // strips trailing punctuation from each evidence and remedy field.
    const reportDetails = failed[3].split("。").filter(Boolean).map((part) => {
      const localized = safetyText(part);
      return localized === part ? safetyText(part + "。") : localized;
    });
    return uiFormat("联网检查未通过：{0}{1}。{2}外网保持关闭。", uiText(failed[1]), uiText(failed[2]), reportDetails.join(" ") + " ");
  }

  if (message.includes("；")) {
    const fields = message.split("；");
    const localized = fields.map(uiText);
    if (localized.every((field, index) => field !== fields[index])) return localized.join(" ");
    // Browser mismatches contain quoted values rather than fixed text.
    if (fields.every((field) => browserDetails.some(([pattern]) => pattern.test(field)))) {
      return fields.map(safetyText).join(" ");
    }
  }
  return message;
}
