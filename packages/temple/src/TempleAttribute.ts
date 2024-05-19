import TempleElement from './TempleElement';

export type AttributeInitializer = (element: TempleElement) => void;
export type Iterative<T = any> = T[]|Record<string, T>;

export class TempleAttribute {
  /**
   * Adds a helper to the document
   */
  public static register(name: string, init: AttributeInitializer) {
    // register the callback
    TempleElement.onReady(() => {
      TempleElement.filter(
        temple => temple.hasAttribute(name)
      ).forEach(init);
    });
  }
}

TempleAttribute.register('if', element => {
  const condition = element.getAttribute('if');
  if (condition === false || condition === 'false') {
    element.element.remove();
  } else if (typeof condition === 'function' && !condition()) {
    element.element.remove();
  }
});
