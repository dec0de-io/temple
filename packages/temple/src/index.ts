import type { ComponentOptions, Attributes } from './types';

import TempleMarkup from './compilers/Markup';
import TempleComponent from './compilers/Component';
import TempleDocument from './compilers/Document';

import Exception from './utils/Exception';
import Loader from './utils/Loader';
import { DOCUMENT_MODE, NS } from './enums';

export type * from './types';

export {
  TempleDocument,
  TempleComponent,
  TempleMarkup,
  Exception,
  Loader,
  DOCUMENT_MODE,
  NS
};

export default function app(options: ComponentOptions) {
  const temple = new TempleDocument(options);
  return function render(route: string, path: string, slots: Attributes = {}) {
    return temple.render(route, path, slots);
  }
};