// Helper functions
// Tuned functions from
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set#Implementing_basic_set_operations

function symmetricDifference(setA, setB) {
  if (!setB) {
    return Array.from(setA);
  }
  const difference = new Set(setA);
  setB.forEach(elem => {
    if (difference.has(elem)) {
      difference.delete(elem);
    }
    else {
      difference.add(elem);
    }
  })
  return Array.from(difference);
}

function difference(setA, setB) {
  if (!setB) {
    return Array.from(setA);
  }
  const difference = new Set(setA);
  setB.forEach(elem => {
    difference.delete(elem);
  });
  return Array.from(difference);
}

function union(setA, setB) {
  if (!setB) {
    return Array.from(setA);
  }
  const union = new Set(setA);
  setB.forEach(elem => {
    union.add(elem);
  });
  return Array.from(union);
}

function intersection(setA, setB) {
  if (!setB) {
    return [];
  }
  const intersection = new Set();
  setA = new Set(setA);
  setB.forEach(elem => {
    if (setA.has(elem)) {
      intersection.add(elem)
    }
  });
  return Array.from(intersection);
}

module.exports = { difference, symmetricDifference, union, intersection };