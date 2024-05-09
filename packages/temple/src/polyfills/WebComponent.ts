import HTMLElement from './HTMLElement';

/**
 * Returns a web component template
 */
export default function makeComponent(
  name: string, 
  shadow: boolean, 
  attributes: string[],
  scripts: string,
  body: string
) {
  return shadow
    ? makeShadowComponent(name, attributes, scripts, body)
    : makeLightComponent(name, attributes, scripts, body)
};

/**
 * Returns a regular web component template
 */
export function makeLightComponent(
  name: string, 
  attributes: string[],
  scripts: string,
  body: string
) {
  const template = class CustomWebComponent extends HTMLElement {
    connectedCallback() {
      //@ts-ignore
      const children = this.innerHTML;
      `{attributes}`;
      `{scripts}`;
      this.innerHTML = `{template}`;
    }
  }.toString();
  return render(template, name, false, attributes, scripts, body);
};

/**
 * Returns a shadow dom web component template
 */
export function makeShadowComponent(
  name: string, 
  attributes: string[],
  scripts: string,
  body: string
) {
  const template = class CustomWebComponent extends HTMLElement {
    connectedCallback() {
      //@ts-ignore
      const children = this.innerHTML;
      const __shadow = this.attachShadow({ mode: 'open' }); 
      `{attributes}`;
      `{scripts}`;
      __shadow.innerHTML = `{template}`;
    }
  }.toString();

  return render(template, name, true, attributes, scripts, body);
};

function render(
  template: string, 
  name: string, 
  shadow: boolean, 
  attributes: string[],
  scripts: string,
  body: string
) {
  const slug = slugify(name, true);
  const fragments = attributes.map(
    name => name === 'className' && shadow
      ? `let className = this.className;`
      : name === 'children' 
      ? ''
      : `let ${slugify(name)} = this.getAttribute('${name}');`
  ).filter(name => name.length > 0);
  
  return template
    .replace('HTMLElement_1.default', 'HTMLElement')
    .replace('CustomWebComponent', slug)
    .replace('`{attributes}`;', fragments.join('\n'))
    .replace('`{scripts}`;', scripts)
    .replace('{template}', body) + `;customElements.define('${name}', ${slug});`;
}

function slugify(name: string, titlize = false) {
  //change some_thing-good to SomeThingGood
  const title = name.split(/[_-\s]+/g).map(
    word => word.charAt(0).toUpperCase() + word.slice(1)
  ).join('');

  if (!titlize) {
    return title[0].toLowerCase() + title.slice(1);
  }

  return title;
}