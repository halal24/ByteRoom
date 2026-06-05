import { StateField, StateEffect } from '@codemirror/state';
import { EditorView, Decoration, WidgetType } from '@codemirror/view';

// Define the effect that we will use to update remote cursors
export const updateRemoteCursors = StateEffect.define<RemoteCursor[]>();

export interface RemoteCursor {
  id: string; // Socket ID or User ID
  pos: number; // Document position
  name: string; // User's name
  color: string; // Hex color code
}

// Custom widget to render the cursor line and the floating name tag
class CursorWidget extends WidgetType {
  name: string;
  color: string;

  constructor(name: string, color: string) {
    super();
    this.name = name;
    this.color = color;
  }

  toDOM() {
    const span = document.createElement('span');
    span.style.borderLeft = `2px solid ${this.color}`;
    span.style.position = 'relative';
    span.style.display = 'inline-block';
    span.style.height = '1.2em';
    span.style.verticalAlign = 'middle';
    span.style.marginLeft = '-1px'; // Center the border over the gap
    span.style.marginRight = '-1px';

    const tag = document.createElement('span');
    tag.textContent = this.name;
    tag.style.position = 'absolute';
    tag.style.top = '-1.5em';
    tag.style.left = '0';
    tag.style.background = this.color;
    tag.style.color = '#fff';
    tag.style.fontSize = '10px';
    tag.style.fontFamily = 'monospace';
    tag.style.padding = '2px 4px';
    tag.style.borderRadius = '2px';
    tag.style.whiteSpace = 'nowrap';
    tag.style.zIndex = '10';
    tag.style.pointerEvents = 'none';

    span.appendChild(tag);
    return span;
  }
}

// The StateField that manages the decorations based on cursor updates
export const remoteCursorsField = StateField.define<Decoration[]>({
  create() {
    return Decoration.none as unknown as Decoration[];
  },
  update(cursors, tr) {
    // We map existing cursors so they move if text is inserted BEFORE them locally
    // However, since we re-dispatch all cursors on change anyway, this is a safety net.
    let mapped = (cursors as any).map(tr.changes);
    
    for (let e of tr.effects) {
      if (e.is(updateRemoteCursors)) {
        // e.value is RemoteCursor[]
        const decos = e.value.map(c => 
          Decoration.widget({
            widget: new CursorWidget(c.name, c.color),
            side: 1 // Render after the character at pos
          }).range(c.pos)
        );
        
        // Decorations MUST be sorted by position
        decos.sort((a, b) => a.from - b.from);
        
        return Decoration.set(decos) as unknown as Decoration[];
      }
    }
    return mapped;
  },
  provide: f => EditorView.decorations.from(f as any)
});
