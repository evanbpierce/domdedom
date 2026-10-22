type DomProxy<TReturn> = {
  (selector: string): TReturn;
  [key: string]: TReturn;
};

export interface DOMInterface {
  /** Query element by ID via function call or destructuring */
  id: DomProxy<HTMLElement | null>;
  /** Query live HTMLCollection by class name */
  class: DomProxy<HTMLCollectionOf<Element>>;
  /** Query live HTMLCollection by tag name */
  tag: DomProxy<HTMLCollectionOf<Element>>;
  /** Query live NodeList by element name attribute */
  name: DomProxy<NodeList>;
  /** Query first matching element via CSS selector */
  qs: DomProxy<Element | null>;
  /** Query all matching elements via CSS selector */
  qsa: DomProxy<NodeListOf<Element>>;
}

export const DOM: DOMInterface;
export default DOM;