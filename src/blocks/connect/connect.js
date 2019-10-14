// Connector for control block.
// target - jQuery object for target DOM element
// controlSelector - jQuery selector for control DOM element
// readyParams - object which pass to control when terget is ready
// initAction - function called after control initialization

function connect(target, controlSelector, readyParams, initAction) {
  let controlElement = target.siblings(controlSelector).first();
  if (!controlElement.length) {
    controlElement = target.find(controlSelector).first();
  }
  controlElement.one('control:ready', (event) => {
    target.trigger('target:ready', readyParams);
  });
  if (initAction) {
    controlElement.one('control:inited', initAction);
  }
  target.trigger('target:ready', readyParams);
}

function toDashString(string) {
  const chars = Array.from(string);
  chars.forEach((char, index, array) => {
    if (char === char.toUpperCase()) {
      array[index] = `-${char.toLowerCase()}`;
    }
  });
  return chars.join('');
}

// Converts object keys to data-attrs
function toDataAttrs(object) {
  const convObject = {};
  Object.entries(object).forEach(entry => {
    const [name, value] = entry;
    convObject[`data-${toDashString(name)}`] = value;
  });
  return convObject;
}

module.exports = { connect, toDataAttrs };