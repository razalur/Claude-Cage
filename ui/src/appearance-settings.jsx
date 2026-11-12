import { uiFormat, uiText } from "./ui-language.mjs";
import { InlineSelect } from "./inline-select";
import React, { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Download,
  LoaderCircle,
  Monitor,
  Moon,
  Sun,
  Upload,
  RotateCcw,
  CircleCheck,
  TriangleAlert,
  CircleX,
} from "lucide-react";
import { api, native, nativeAvailable } from "./api";
import { useAppearance } from "./appearance";
import {
  colorGroups,
  colorTokens,
  terminalColorGroups,
  terminalTheme,
  customThemeLimit,
  themeFileLimit,
  parseThemeDocument,
  themeDocument,
  validateThemeName,
  sameTheme,
  presets,
  presetNames,
  presetInfo,
  presetGroups,
  themeCatalog,
  applyThemePreset,
  systemUIFont,
  systemCodeFont,
  themeVariables,
} from "./appearance-state.mjs";

function SettingRow({ label, description, children }) {
  return (
    <div className="appearance-row">
      <div>
        <span>{label}</span>
        {description && <p>{uiText(description)}</p>}
      </div>
      <div className="appearance-control">{children}</div>
    </div>
  );
}
function FontSizeInput({ label, value, min, onChange }) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  return (
    <div className="font-size-control">
      <input
        aria-label={uiText(label)}
        type="number"
        min={min}
        max="24"
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          const number = Number(event.target.value);
          if (Number.isInteger(number) && number >= min && number <= 24)
            onChange(number);
        }}
        onBlur={() => setText(String(value))}
      />
      <span>px</span>
    </div>
  );
}
function ColorField({ label, accessibleLabel, value, onChange, onReset }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const invalid = !/^#[0-9a-fA-F]{6}$/.test(text);
  const commit = () => {
    if (!invalid && text !== value) onChange(text.toLowerCase());
  };
  return (
    <div className="theme-color-field">
      <span>{uiText(label)}</span>
      <div className="theme-color-value">
        <input
          type="color"
          aria-label={uiFormat("{0}取色", accessibleLabel)}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          type="text"
          aria-label={accessibleLabel}
          aria-invalid={invalid}
          value={text}
          maxLength={7}
          spellCheck={false}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
            if (e.key === "Escape") {
              e.stopPropagation();
              setText(value);
            }
          }}
        />
        {onReset && (
          <button
            className="icon-button"
            aria-label={uiFormat("{0}恢复自动", accessibleLabel)}
            title={uiText("恢复自动颜色")}
            onClick={onReset}
          >
            <RotateCcw size={13} />
          </button>
        )}
      </div>
      {invalid && (
        <small className="theme-color-error">{uiText("请输入 # 加六位十六进制颜色")}</small>
      )}
    </div>
  );
}
function ThemeCard({ variant, value, active, onChange }) {
  const [advanced, setAdvanced] = useState(false);
  const label = variant === "light" ? "浅色主题" : "深色主题";
  const options = presets[variant];
  const patch = (delta) => onChange({ ...value, preset: "custom", ...delta });
  const vars = themeVariables(value, variant);
  const terminal = terminalTheme(value, variant);
  const setColor = (field, key, color) => {
    const next = { ...value[field] };
    if (color === undefined) delete next[key];
    else next[key] = color;
    patch({ [field]: next });
  };
  return (
    <section
      className={`appearance-theme-card ${active ? "current" : ""}`}
      aria-label={uiText(label)}
    >
      <div className="theme-card-heading">
        <strong>{uiText(label)}</strong>
        {active && <small>{uiText("当前使用")}</small>}
        <InlineSelect
          aria-label={uiFormat("{0}预设", uiText(label))}
          value={value.preset}
          onValueChange={(next) =>
            onChange(applyThemePreset(value, variant, next))
          }
        >
          {presetGroups.map((group) => (
            <optgroup key={group} label={uiText(group)}>
              {themeCatalog
                .filter((item) => item.group === group && options[item.id])
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {uiText(item.name)}
                  </option>
                ))}
            </optgroup>
          ))}
          {!options[value.preset] && (
            <option value={value.preset} disabled>
              {uiText(presetNames[value.preset] || "自定义")}
            </option>
          )}
        </InlineSelect>
      </div>
      <div
        className="theme-miniature"
        aria-hidden="true"
        style={{ ...vars, background: value.surface, color: value.ink }}
      >
        <div className="mini-sidebar" style={{ background: vars["--sidebar"] }}>
          <i />
          <i />
          <i />
        </div>
        <div className="mini-content">
          <span style={{ background: vars["--strong"] }} />
          <span />
          <div
            style={{ borderColor: vars["--line"], background: vars["--input"] }}
          >
            <i />
            <b style={{ background: value.accent }} />
          </div>
        </div>
      </div>
      <div className="theme-preset-summary">
        <p>
          {uiText(presetInfo[value.preset]?.description) ||
            uiText("自定义配色，可另存为主题以便下次使用。")}
        </p>
        <div
          className="theme-status-preview"
          aria-label={uiFormat("{0}状态配色预览", uiText(label))}
          style={{ background: value.surface }}
        >
          <span style={{ color: vars["--success"] }}>
            <CircleCheck size={13} />{uiText("成功")}</span>
          <span style={{ color: vars["--warning"] }}>
            <TriangleAlert size={13} />{uiText("警告")}</span>
          <span style={{ color: vars["--danger"] }}>
            <CircleX size={13} />{uiText("错误")}</span>
        </div>
      </div>
      <div className="theme-base-colors">
        {[
          ["accent", "强调色"],
          ["surface", "背景"],
          ["ink", "文字"],
        ].map(([key, name]) => (
          <ColorField
            key={key}
            label={name}
            accessibleLabel={uiFormat("{0}{1}", uiText(label), uiText(name))}
            value={value[key]}
            onChange={(color) => patch({ [key]: color })}
          />
        ))}
      </div>
      <button
        className="theme-customize"
        onClick={() => setAdvanced(!advanced)}
        aria-expanded={advanced}
      >{uiText("自定义")}<ChevronDown size={14} className={advanced ? "rotated" : ""} />
      </button>
      {advanced && (
        <div className="theme-options">
          <p className="theme-options-hint">{uiText("未单独设置的颜色随基础配色自动调整。")}</p>
          {colorGroups.map((group) => (
            <details className="theme-color-group" key={group.label}>
              <summary>{uiText(group.label)}</summary>
              {group.entries.map(([key, name]) => (
                <ColorField
                  key={key}
                  label={name}
                  accessibleLabel={uiFormat("{0}{1}", uiText(label), uiText(name))}
                  value={vars[colorTokens[key]]}
                  onChange={(color) => setColor("colors", key, color)}
                  onReset={
                    value.colors?.[key]
                      ? () => setColor("colors", key)
                      : undefined
                  }
                />
              ))}
            </details>
          ))}
          {terminalColorGroups.map((group) => (
            <details className="theme-color-group" key={group.label}>
              <summary>{uiText(group.label)}</summary>
              {group.entries.map(([key, name]) => (
                <ColorField
                  key={key}
                  label={name}
                  accessibleLabel={uiFormat("{0}终端{1}", uiText(label), uiText(name))}
                  value={terminal[key]}
                  onChange={(color) => setColor("terminal", key, color)}
                  onReset={
                    value.terminal?.[key]
                      ? () => setColor("terminal", key)
                      : undefined
                  }
                />
              ))}
            </details>
          ))}
          <div
            className="theme-terminal-preview"
            style={{
              background: terminal.background,
              color: terminal.foreground,
            }}
            aria-label={uiFormat("{0}终端预览", uiText(label))}
          >
            <span style={{ color: terminal.green }}>~/cage</span> ${" "}
            <span style={{ color: terminal.blue }}>echo</span> hello
            <i style={{ background: terminal.cursor }} />
          </div>
          <button
            className="theme-reset-colors"
            disabled={
              !Object.keys(value.colors || {}).length &&
              !Object.keys(value.terminal || {}).length
            }
            onClick={() => patch({ colors: {}, terminal: {} })}
          >
            <RotateCcw size={13} />{uiText("恢复全部自动颜色")}</button>
          <label>{uiText("对比度")} <output>{value.contrast}</output>
            <input
              aria-label={uiFormat("{0}对比度", uiText(label))}
              type="range"
              min="0"
              max="100"
              value={value.contrast}
              onChange={(e) => patch({ contrast: Number(e.target.value) })}
            />
          </label>
          <label>{uiText("界面字体")}<InlineSelect editable
              aria-label={uiFormat("{0}界面字体", uiText(label))}
              value={value.fonts.ui}
              placeholder={uiText("系统默认")}
              onValueChange={(next) =>
                patch({ fonts: { ...value.fonts, ui: next } })
              }
            >
              <option value="system-ui" />
              <option value="PingFang SC" />
              <option value="Helvetica Neue" />
              <option value="Arial" />
            </InlineSelect>
          </label>
          <label>{uiText("代码字体")}<InlineSelect editable
              aria-label={uiFormat("{0}代码字体", uiText(label))}
              value={value.fonts.code}
              placeholder={uiText("系统等宽字体")}
              onValueChange={(next) =>
                patch({ fonts: { ...value.fonts, code: next } })
              }
            >
              <option value="SF Mono" />
              <option value="Menlo" />
              <option value="Monaco" />
              <option value="JetBrains Mono" />
            </InlineSelect>
          </label>
          <label className="appearance-switch">
            <span>{uiText("半透明侧栏")}</span>
            <input
              type="checkbox"
              role="switch"
              aria-label={uiFormat("{0}半透明侧栏", uiText(label))}
              checked={!value.opaqueWindows}
              onChange={(e) => patch({ opaqueWindows: !e.target.checked })}
            />
          </label>
        </div>
      )}
    </section>
  );
}
function ThemeLibrary({ appearance, update, saving, onError }) {
  const themes = appearance.customThemes;
  const matching = themes.find((item) => sameTheme(item, appearance));
  const [selectedId, setSelectedId] = useState(matching?.id || "");
  const [name, setName] = useState(matching?.name || "");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const input = useRef(null);
  const selected = themes.find((item) => item.id === selectedId);
  const current = selected || matching;
  const dirty = current && !sameTheme(current, appearance);
  const run = async (task) => {
    setBusy(true);
    setNotice("");
    onError("");
    try {
      await task();
    } catch (e) {
      onError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const apply = (item) => {
    setSelectedId(item.id);
    setName(item.name);
    setNotice("");
    onError("");
    void update((previous) => ({
      ...previous,
      lightTheme: structuredClone(item.lightTheme),
      darkTheme: structuredClone(item.darkTheme),
    }));
  };
  const save = (replace) =>
    run(async () => {
      const title = validateThemeName(name);
      if (!replace && themes.length >= customThemeLimit)
        throw new Error("最多保存 50 个自定义主题，请先删除不需要的主题");
      const document = themeDocument(title, appearance);
      const item = {
        id: replace ? current.id : crypto.randomUUID(),
        name: title,
        lightTheme: document.lightTheme,
        darkTheme: document.darkTheme,
      };
      if (
        await update((previous) => ({
          ...previous,
          customThemes: replace
            ? previous.customThemes.map((old) =>
                old.id === item.id ? item : old,
              )
            : [...previous.customThemes, item],
        }))
      ) {
        setSelectedId(item.id);
        setName(title);
        setNotice("主题已保存");
      }
    });
  const importText = async (text) => {
    const document = parseThemeDocument(text);
    if (themes.length >= customThemeLimit)
      throw new Error("最多保存 50 个自定义主题，请先删除不需要的主题");
    const item = {
      id: crypto.randomUUID(),
      name: document.name,
      lightTheme: document.lightTheme,
      darkTheme: document.darkTheme,
    };
    if (
      await update((previous) => ({
        ...previous,
        lightTheme: item.lightTheme,
        darkTheme: item.darkTheme,
        customThemes: [...previous.customThemes, item],
      }))
    ) {
      setSelectedId(item.id);
      setName(item.name);
      setNotice("主题已导入并应用");
    }
  };
  const importFile = () => {
    if (!nativeAvailable()) {
      input.current.click();
      return;
    }
    void run(async () => {
      const text = await native("importTheme");
      if (text) await importText(text);
    });
  };
  const exportFile = () =>
    run(async () => {
      const title = name.trim() || matching?.name || "我的主题";
      const text =
        JSON.stringify(themeDocument(title, appearance), null, 2) + "\n";
      const filename =
        title
          .replace(/[<>:"/\\|?*\x00-\x1f]/g, "_")
          .replace(/[. ]+$/, "")
          .slice(0, 80) + ".cage-theme.json";
      if (nativeAvailable()) {
        if (await native("exportTheme", { text, filename }))
          setNotice("主题已导出");
      } else {
        const url = URL.createObjectURL(
          new Blob([text], { type: "application/json" }),
        );
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        setNotice("已开始下载主题文件");
      }
    });
  return (
    <section className="theme-library" aria-label={uiText("我的主题")}>
      <div className="theme-library-heading">
        <div>
          <h4>{uiText("我的主题")}</h4>
          <p>{uiText("保存浅色、深色两套配色与字体，随时切换或分享。")}</p>
        </div>
        <div className="theme-file-actions">
          <button disabled={busy || saving} onClick={importFile}>
            <Upload size={14} />{uiText("导入主题")}</button>
          <button disabled={busy} onClick={exportFile}>
            <Download size={14} />{uiText("导出主题")}</button>
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept=".json,application/json"
        hidden
        aria-label={uiText("选择主题文件")}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file)
            void run(async () => {
              if (file.size > themeFileLimit)
                throw new Error("主题文件不能超过 256 KB");
              await importText(await file.text());
            });
        }}
      />
      <div className="theme-library-fields">
        <InlineSelect
          aria-label={uiText("已保存的主题")}
          value={current?.id || ""}
          disabled={busy || saving}
          onValueChange={(next) => {
            const item = themes.find((theme) => theme.id === next);
            if (item) apply(item);
          }}
        >
          <option value="" disabled>
            {themes.length ? uiText("选择已保存的主题") : uiText("尚无自定义主题")}
          </option>
          {themes.map((item) => (
            <option key={item.id} value={item.id}>
              {uiText(item.name)}
              {item.id === current?.id && dirty ? uiText(" · 已修改") : ""}
            </option>
          ))}
        </InlineSelect>
        <input
          aria-label={uiText("主题名称")}
          placeholder={uiText("为当前配色命名")}
          value={name}
          maxLength={80}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          disabled={busy || saving || !name.trim()}
          onClick={() => save(false)}
        >{uiText("另存为主题")}</button>
      </div>
      {current && (
        <div className="theme-library-manage">
          <span>
            {dirty ? uiText("当前配色有未存入主题的修改") : uiText("当前配色与已保存主题一致")}
          </span>
          {dirty && (
            <button disabled={busy || saving} onClick={() => apply(current)}>{uiText("恢复已保存配色")}</button>
          )}
          <button
            disabled={busy || saving || !name.trim()}
            onClick={() => save(true)}
          >{uiText("更新此主题")}</button>
          <button
            disabled={busy || saving}
            onClick={() =>
              run(async () => {
                if (!confirm(uiFormat("删除主题“{0}”？当前配色会保留。", current.name)))
                  return;
                if (
                  await update((previous) => ({
                    ...previous,
                    customThemes: previous.customThemes.filter(
                      (item) => item.id !== current.id,
                    ),
                  }))
                ) {
                  setSelectedId("");
                  setName("");
                  setNotice("主题已删除，当前配色已保留");
                }
              })
            }
          >{uiText("删除")}</button>
        </div>
      )}
      {notice && (
        <p className="theme-library-notice" role="status">
          {uiText(notice)}
        </p>
      )}
    </section>
  );
}
export function AppearanceSettings() {
  const { appearance, theme, variant, loading, saving, error, update, retry } =
    useAppearance();
  const [syncing, setSyncing] = useState(false),
    [syncError, setSyncError] = useState(""),
    [synced, setSynced] = useState(false),
    [themeError, setThemeError] = useState("");
  const patch = (delta) => update((previous) => ({ ...previous, ...delta }));
  const sync = async () => {
    setSyncing(true);
    setSyncError("");
    setSynced(false);
    try {
      const value = await api("/appearance/codex");
      if (
        await update((previous) => ({
          ...value,
          customThemes: previous.customThemes,
        }))
      )
        setSynced(true);
    } catch (e) {
      setSyncError(e.message);
    } finally {
      setSyncing(false);
    }
  };
  return (
    <div className="appearance-settings">
      <div className="section-title">
        <h3>{uiText("外观")}</h3>
        <p>{uiText("更改自动保存并即时生效，无需重启项目。")}</p>
      </div>
      <fieldset disabled={loading || syncing} className="appearance-fields">
        <SettingRow
          label={uiText("主题")}
          description={uiText("跟随系统，或固定使用浅色、深色外观。")}
        >
          <div className="appearance-mode" role="group" aria-label={uiText("主题模式")}>
            {[
              ["light", "浅色", Sun],
              ["dark", "深色", Moon],
              ["system", "跟随系统", Monitor],
            ].map(([mode, label, Icon]) => (
              <button
                key={mode}
                aria-pressed={appearance.mode === mode}
                onClick={() => patch({ mode })}
              >
                <Icon size={15} />
                {uiText(label)}
              </button>
            ))}
          </div>
        </SettingRow>
        <ThemeLibrary
          key={String(loading)}
          appearance={appearance}
          update={update}
          saving={saving}
          onError={setThemeError}
        />
        {themeError && (
          <div className="error-message" role="alert">
            {themeError}
          </div>
        )}
        <div className="theme-card-grid">
          {["light", "dark"].map((key) => (
            <ThemeCard
              key={key}
              variant={key}
              value={appearance[key + "Theme"]}
              active={variant === key}
              onChange={(value) => patch({ [key + "Theme"]: value })}
            />
          ))}
        </div>
        <h4>{uiText("字体")}</h4>
        <SettingRow
          label={uiText("界面字号")}
          description={uiText("调整导航、标签和设置中的文字大小。")}
        >
          <FontSizeInput
            label={uiText("界面字号")}
            value={appearance.uiFontSize}
            min={12}
            onChange={(value) => patch({ uiFontSize: value })}
          />
        </SettingRow>
        <SettingRow
          label={uiText("代码字号")}
          description={uiText("调整内置终端与代码预览的文字大小。")}
        >
          <FontSizeInput
            label={uiText("代码字号")}
            value={appearance.codeFontSize}
            min={10}
            onChange={(value) => patch({ codeFontSize: value })}
          />
        </SettingRow>
        <div
          className="appearance-sample"
          style={{ fontFamily: theme.fonts.ui || systemUIFont }}
        >
          <span>{uiText("在熟悉的工作区，专注下一步。")}</span>
          <code
            style={{
              fontFamily: theme.fonts.code || systemCodeFont,
              fontSize: appearance.codeFontSize,
            }}
          >
            const workspace = "Cage";
          </code>
        </div>
        <h4>{uiText("显示与交互")}</h4>
        <SettingRow
          label={uiText("使用指针光标")}
          description={uiText("悬停在按钮等可交互元素上时显示手形。")}
        >
          <label className="appearance-switch">
            <input
              type="checkbox"
              role="switch"
              aria-label={uiText("使用指针光标")}
              checked={appearance.pointerCursors}
              onChange={(e) => patch({ pointerCursors: e.target.checked })}
            />
          </label>
        </SettingRow>
        <SettingRow label={uiText("字体平滑")}>
          <label className="appearance-switch">
            <input
              type="checkbox"
              role="switch"
              aria-label={uiText("字体平滑")}
              checked={appearance.fontSmoothing}
              onChange={(e) => patch({ fontSmoothing: e.target.checked })}
            />
          </label>
        </SettingRow>
        <SettingRow label={uiText("减少动态效果")}>
          <InlineSelect
            aria-label={uiText("减少动态效果")}
            value={appearance.reducedMotion}
            onValueChange={(next) => patch({ reducedMotion: next })}
          >
            <option value="system">{uiText("跟随系统")}</option>
            <option value="on">{uiText("开启")}</option>
            <option value="off">{uiText("关闭")}</option>
          </InlineSelect>
        </SettingRow>
        <div className="appearance-import">
          <div>
            <strong>{uiText("沿用 Codex 的外观")}</strong>
            <p>{uiText("导入本机 Codex 当前的主题、配色与字体偏好。")}</p>
          </div>
          <button onClick={sync}>
            {syncing ? (
              <LoaderCircle size={15} className="spin" />
            ) : (
              <Download size={15} />
            )}{uiText("从本机 Codex 同步")}</button>
        </div>
      </fieldset>
      <div className="appearance-save-state" role="status">
        {saving ? (
          <>
            <LoaderCircle size={13} className="spin" />{uiText("正在保存…")}</>
        ) : error ? (
          <>
            <span>{uiText("未保存")}</span>
            <button className="text-button" onClick={retry}>{uiText("重试保存")}</button>
          </>
        ) : (
          <>
            <Check size={14} />
            {synced ? uiText("已同步 Codex 外观") : uiText("更改自动保存，即时生效")}
          </>
        )}
      </div>
      {(error || syncError) && (
        <div className="error-message" role="alert">
          {uiText(syncError || error)}
        </div>
      )}
    </div>
  );
}
