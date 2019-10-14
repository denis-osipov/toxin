// Helper functions for converting JS naming to dashed.

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

module.exports = { toDashString, toDataAttrs };