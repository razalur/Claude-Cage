import { uiText, uiFormat } from "./ui-language.mjs";
import { shortcut } from "./platform.mjs";
import React, { useEffect, useRef, useState } from "react";
import {
  CircleAlert,
  ExternalLink,
  Folder,
  FolderOpen,
  Globe2,
  Home,
  Monitor,
  Network,
  MessageCircle,
  PanelLeftClose,
  Plus,
  RefreshCw,
  Settings,
  Server,
  SquareTerminal,
} from "lucide-react";
import { EnvironmentShield } from "./environment-shield";
import logo from "./logo.png";
import { projectName } from "./workspace-state.mjs";
import { WorkspaceTabs } from "./workspace-tabs";
import { projectSessionRows, sessionKey } from "./session-order.mjs";
import { AccountMenu } from "./account";
import { useSSHNavigation } from "./remote-hosts";
import { GuestSystemIcon } from "./guest-system-icon";

export function WorkspaceSidebar({
  workspace,
  guestSystem,
  defaultWorkspace,
  projects,
  tabs,
  sessions = [],
  sessionError,
  sessionRefreshing,
  onSessionRefresh,
  onSessionOpen,
  openingSession,
  sessionOpenError,
  onSessionArchive,
  onSessionPin,
  onSessionRename,
  saved,
  active,
  home,
  busy,
  ready,
  running,
  runtimeLabel,
  network,
  onHome,
  onOpenProject,
  onProjectSelect,
  onSelect,
  onClose,
  onRename,
  onPin,
  onSessionReorder,
  splitDrag,
  onNewTerminal,
  terminalMenuAt,
  onBrowser,
  onTailscale,
  downloadAction,
  onClaudeWeb,
  onClaudeDesktop,
  desktopOpen,
  onEditor,
  onSettings,
  onAccountConfirm,
  onAccountStatus,
  onSafety,
  onCollapse,
  updateAction,
}) {
  const ssh = useSSHNavigation();
  const [collapsed, setCollapsed] = useState({});
  const sessionBaseline = useRef(new Map());
  const activeWorkspace = tabs.find((tab) => tab.id === active)?.workspace;
  useEffect(() => {
    if (activeWorkspace)
      setCollapsed((previous) => ({ ...previous, [activeWorkspace]: false }));
  }, [active, activeWorkspace]);
  if (ssh?.expanded) return null;
  const healthy = ready && network.mode === "open";
  return (
    <aside className="workspace-sidebar" aria-label={uiText("项目与终端")}>
      <div className="sidebar-top">
        <span className="sidebar-brand">
          <img className="brand-logo" src={logo} alt="" />
          Cage
                <GuestSystemIcon system={guestSystem} />
        </span>
        <button
          className="icon-button"
          onClick={onCollapse}
          aria-label={uiText("收起侧栏")}
          title={uiText("收起侧栏")}
        >
          <PanelLeftClose size={17} />
        </button>
      </div>
      <nav className="sidebar-navigation" aria-label={uiText("主导航")}>
        <button
          className={`sidebar-link ${home ? "selected" : ""}`}
          onClick={onHome}
        >
          <Home size={17} />
          {uiText("工作台")}
        </button>
        <button
          className={`sidebar-link ${!desktopOpen && !home && tabs.some((tab) => tab.id === active && tab.kind !== "terminal") ? "selected" : ""}`}
          onClick={onBrowser}
          disabled={!ready || busy}
          aria-label={uiText("打开浏览器")}
          title={uiText("打开浏览器")}
        >
          <Globe2 size={17} />
          {uiText("浏览器")}
        </button>
        <button className="sidebar-link" onClick={onTailscale} aria-label={uiText("打开 Tailscale")}><Network size={17} />Tailscale</button>
        {ssh && <button className="sidebar-link ssh-navigation" onClick={ssh.open} aria-label={uiText("SSH 主机")}><Server size={17} />SSH</button>}
        <div className="claude-shortcuts">
          <button className="sidebar-link" onClick={onClaudeWeb} disabled={!ready || busy} title={uiText("在 Cage 浏览器打开 claude.ai")}><MessageCircle size={17} />claude.ai</button>
          <button className={`sidebar-link ${desktopOpen ? "selected" : ""}`} onClick={onClaudeDesktop} disabled={!running || busy} title={uiText("安装或打开 Claude Desktop")}><Monitor size={17} />Claude Desktop</button>
        </div>
        {downloadAction}
      </nav>
      <div className="sidebar-scroll">
        <div className="sidebar-section-heading">
          <span>{uiText("项目")}</span>
          <button
            className="icon-button"
            onClick={() => onOpenProject()}
            aria-label={uiText("添加项目")}
            title={uiText("添加项目")}
            disabled={busy}
          >
            <Plus size={15} />
          </button>
        </div>
        {sessionError && (
          <div className="sidebar-session-error">
            <div role="alert">
              <div className="sidebar-session-error-heading">
                <CircleAlert size={16} aria-hidden="true" />
                <strong>{uiText("会话列表暂未更新")}</strong>
              </div>
              <p>{sessionError}</p>
            </div>
            <button
              onClick={onSessionRefresh}
              disabled={sessionRefreshing || busy || !running}
              aria-busy={sessionRefreshing || undefined}
            >
              <RefreshCw size={14} aria-hidden="true" />
              {sessionRefreshing ? uiText("正在读取…") : uiText("重新读取会话")}
            </button>
          </div>
        )}
        {projects.map((path) => {
          const project = projectName(path, defaultWorkspace);
          const rows = projectSessionRows(tabs.filter(tab => tab.kind === "terminal" && tab.workspace === path),
            sessions.filter(session => session.workspace === path), saved, saved.sessionOrder?.[path], sessionBaseline.current);
          const rowMetadata = { ...saved };
          for (const row of rows) rowMetadata[row.id] = { ...saved[row.id], pinned: row.sessionPinned };
          const expanded = !collapsed[path];
          return (
            <section
              className="sidebar-project"
              key={path}
              aria-label={uiFormat("项目 {0}", project)}
            >
              <div
                className={`project-heading ${workspace === path ? "current-project" : ""}`}
              >
                <button
                  className="project-disclosure"
                  title={path}
                  aria-expanded={expanded}
                  onClick={() => {
                    setCollapsed((previous) => ({
                      ...previous,
                      [path]: expanded,
                    }));
                    onProjectSelect(path);
                  }}
                >
                  {expanded ? <FolderOpen size={16} /> : <Folder size={16} />}
                  <span>{project}</span>
                </button>
                <button
                  className="icon-button"
                  aria-label={uiFormat("打开 {0} 的编辑器", project)}
                  title={uiText("在 code-server 中打开项目目录")}
                  disabled={!ready || busy}
                  onClick={() => onEditor(path)}
                >
                  <ExternalLink size={15} />
                </button>
                <button
                  className="icon-button"
                  aria-label={uiFormat("在 {0} 新建终端", project)}
                  title={uiText("新建终端")}
                  aria-haspopup="menu"
                  data-terminal-location={path}
                  disabled={!running || busy}
                  onClick={(event) => {
                    setCollapsed((previous) => ({
                      ...previous,
                      [path]: false,
                    }));
                    onNewTerminal(path, event.currentTarget);
                  }}
                >
                  <SquareTerminal size={15} />
                </button>
              </div>
              {terminalMenuAt(path)}
              <div
                className={`project-children ${expanded ? "expanded" : ""}`}
                inert={!expanded}
              >
                <div>
                  {!!rows.length && (
                    <WorkspaceTabs
                      tabs={rows}
                      saved={rowMetadata}
                      openingSession={openingSession}
                      sessionOpenError={sessionOpenError}
                      active={home || desktopOpen ? "" : active}
                      label={uiFormat("{0} 的终端", project)}
                      busy={busy}
                      ready={ready}
                      onSelect={(id, ...args) => {
                        const row = rows.find(row => row.id === id);
                        if (row?.historySession) onSessionOpen(row.historySession);
                        else onSelect(id, ...args);
                      }}
                      onClose={(row, anchor) => row.historySession ? onSessionArchive(row.historySession, anchor) : onClose(row, anchor)}
                      onRename={row => row.historySession ? onSessionRename(row.historySession) : onRename(row)}
                      onPin={id => {
                        const row = rows.find(row => row.id === id);
                        if (row?.historySession) onSessionPin(row.historySession);
                        else onPin(id);
                      }}
                      onReorder={(from, to) => {
                        const targetIndex = rows.findIndex(row => row.id === to);
                        const order = rows.map(row => row.id).filter(id => id !== from);
                        order.splice(targetIndex, 0, from);
                        onSessionReorder(path, order.map(id => sessionKey(rows.find(row => row.id === id))));
                      }}
                      splitDrag={splitDrag}
                    />
                  )}
                  {!rows.length && !running && (
                    <p className="sidebar-empty">{uiText("启动后可新建终端")}</p>
                  )}
                </div>
              </div>
            </section>
          );
        })}
        {!projects.length && (
          <p className="sidebar-empty">{uiText("打开本地文件夹开始工作")}</p>
        )}
      </div>
      <div className="sidebar-bottom">
        <button className="sidebar-status" onClick={onSafety}>
          <i className={`status-dot ${network.mode}`} />
          <span>{healthy ? uiText("环境运行正常") : runtimeLabel}</span>
          <EnvironmentShield size={17} healthy={healthy} />
        </button>
        <div className="sidebar-footer-actions">
          <AccountMenu onSettings={onSettings} onConfirm={onAccountConfirm} onStatus={onAccountStatus} busy={busy} />
          <button className="icon-button" aria-label={uiText("设置")} title={shortcut(uiText("设置 ⌘,"))} onClick={() => onSettings("keyboard")}><Settings size={17} /></button>
          {updateAction}
        </div>
      </div>
    </aside>
  );
}
