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

module.exports = connect;