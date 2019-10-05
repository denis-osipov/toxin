// Connector for control block.
// target - jQuery object for target DOM element
// controlSelector - jQuery selector for control DOM element
// initAction - function called after control initialization

function connect(target, controlSelector, initAction) {
  target.trigger('target:ready');
  let controlElement = target.siblings(controlSelector).first();
  if (!controlElement.length) {
    controlElement = target.find(controlSelector).first();
  }
  controlElement.one('control:ready', (event) => {
    target.trigger('target:ready');
  });
  if (initAction) {
    controlElement.one('control:inited', initAction);
  }
}

module.exports = connect;