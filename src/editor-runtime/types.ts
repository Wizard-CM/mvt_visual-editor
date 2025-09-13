export type Patch =
  | { kind: 'setText'; selector: string; oldText: string; newText: string }
  | { kind: 'setAttr'; selector: string; name: string; oldValue: string | null; newValue: string | null }
  | { kind: 'setHTML'; selector: string; oldHTML: string; newHTML: string }
  | { kind: 'addClass'; selector: string; className: string }
  | { kind: 'removeClass'; selector: string; className: string }
  | { kind: 'deleteNode'; selector: string; parentSelector: string; index: number; oldHTML: string }
  | { kind: 'wrapNode'; selector: string; wrapperHTML: string };

export interface EditorState {
  isSelecting: boolean;
  selectedElement: HTMLElement | null;
  selectedSelector: string | null;
  undoStack: Patch[];
  redoStack: Patch[];
  injectedCSS: string;
  isEditorReady: boolean;
}

export interface EditorConfig {
  sessionId: string;
  parentOrigin: string;
  enableTelemetry: boolean;
}

export type EditorCommand =
  | { type: 'SET_TEXT'; selector: string; newText: string }
  | { type: 'SET_ATTR'; selector: string; name: string; newValue: string | null }
  | { type: 'SET_HTML'; selector: string; newHTML: string }
  | { type: 'ADD_CLASS'; selector: string; className: string }
  | { type: 'REMOVE_CLASS'; selector: string; className: string }
  | { type: 'DELETE_NODE'; selector: string }
  | { type: 'WRAP_NODE'; selector: string; wrapperHTML: string }
  | { type: 'INJECT_CSS'; css: string; scoped?: boolean }
  | { type: 'HIGHLIGHT_SELECTOR'; selector: string }
  | { type: 'GET_HTML_SNAPSHOT' }
  | { type: 'TOGGLE_SELECTION' }
  | { type: 'UNDO' }
  | { type: 'REDO' };

export type TelemetryEvent =
  | { type: 'EDITOR_READY'; sessionId: string }
  | { type: 'SELECTION_CHANGED'; selector: string }
  | { type: 'PATCH_APPLIED'; patch: Patch }
  | { type: 'CSS_INJECTED'; css: string; scoped: boolean }
  | { type: 'MODE_CHANGED'; mode: string }
  | { type: 'SAVE_REQUESTED' }
  | { type: 'VIEW_CHANGED'; view: string }
  | { type: 'CODE_VIEW_REQUESTED' }
  | { type: 'HISTORY_REQUESTED' }
  | { type: 'SETTINGS_REQUESTED' }
  | { type: 'LIBRARY_REQUESTED' }
  | { type: 'HELP_REQUESTED' }
  | { type: 'SAVE_AND_CONTINUE_REQUESTED' }
  | { type: 'ERROR'; error: string; context: string };
