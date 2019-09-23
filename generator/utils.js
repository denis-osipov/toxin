// Helper functions
// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set#Implementing_basic_set_operations

function symmetricDifference(setA, setB) {
  const difference = new Set(setA);
  if (!setB) {
    return difference;
  }
  setB.forEach(elem => {
    if (_difference.has(elem)) {
      difference.delete(elem);
    }
    else {
      difference.add(elem);
    }
  })
  return difference;
}

function difference(setA, setB) {
  const difference = new Set(setA);
  if (!setB) {
    return difference;
  }
  setB.forEach(elem => {
    difference.delete(elem);
  });
  return difference;
}

function union(setA, setB) {
  const union = new Set(setA);
  if (!setB) {
    return union;
  }
  setB.forEach(elem => {
    union.add(elem);
  });
  return union;
}


module.exports = { difference, symmetricDifference, union };