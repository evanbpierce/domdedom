const p = fn =>
  new Proxy(() => {}, {
    apply: (_, __, [arg]) => fn(arg),
    get: (_, arg) => fn(arg)
  });

export const DOM = {
  id: p(id => document.getElementById(id)),
  class: p(c => document.getElementsByClassName(c)),
  tag: p(t => document.getElementsByTagName(t)),
  name: p(n => document.getElementsByName(n)),
  qs: p(q => document.querySelector(q)),
  qsa: p(qa => document.querySelectorAll(qa))
};

export default DOM;