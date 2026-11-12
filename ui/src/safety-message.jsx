import { uiText } from "./ui-language.mjs";
import React, { createContext, useContext } from "react";
import { isSafetyCheckMessage } from "./safety-state.mjs";
import { safetyText } from "./safety-language.mjs";

export const SafetyChecklistContext = createContext(null);

export function SafetyMessage({ message }) {
  const openChecklist = useContext(SafetyChecklistContext);
  if (!openChecklist || !isSafetyCheckMessage(message)) return safetyText(message);
  return <>
    <span className="safety-message-text">{safetyText(message)}</span>
    <button type="button" className="text-button safety-checklist-link" onClick={openChecklist}>
      {uiText("查看检查清单")}
    </button>
  </>;
}
