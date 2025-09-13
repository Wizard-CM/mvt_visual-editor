import { PatchEngine } from './patch-engine';
import { Patch } from './types';

describe('Editor Runtime', () => {
  describe('PatchEngine', () => {
    it('should create and invert text patches', () => {
      const patch: Patch = {
        kind: 'setText',
        selector: 'h1',
        oldText: 'Old Title',
        newText: 'New Title'
      };

      const inversePatch = PatchEngine.invertPatch(patch);
      expect(inversePatch).toEqual({
        kind: 'setText',
        selector: 'h1',
        oldText: 'New Title',
        newText: 'Old Title'
      });
    });

    it('should create and invert attribute patches', () => {
      const patch: Patch = {
        kind: 'setAttr',
        selector: 'button',
        name: 'disabled',
        oldValue: null,
        newValue: 'true'
      };

      const inversePatch = PatchEngine.invertPatch(patch);
      expect(inversePatch).toEqual({
        kind: 'setAttr',
        selector: 'button',
        name: 'disabled',
        oldValue: 'true',
        newValue: null
      });
    });

    it('should create and invert class patches', () => {
      const addClassPatch: Patch = {
        kind: 'addClass',
        selector: 'div',
        className: 'highlight'
      };

      const removeClassPatch: Patch = {
        kind: 'removeClass',
        selector: 'div',
        className: 'highlight'
      };

      const invertedAdd = PatchEngine.invertPatch(addClassPatch);
      const invertedRemove = PatchEngine.invertPatch(removeClassPatch);

      expect(invertedAdd).toEqual({
        kind: 'removeClass',
        selector: 'div',
        className: 'highlight'
      });

      expect(invertedRemove).toEqual({
        kind: 'addClass',
        selector: 'div',
        className: 'highlight'
      });
    });
  });
});
