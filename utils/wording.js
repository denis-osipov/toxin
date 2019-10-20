// Function for appropriate wording with numeric in Russian
// value - numeric value
// words - an array of words for different numeric values:
//   words[0] - for 0
//   words[1] - for value ending with 1, except those ending with 11
//   words[2] - for value ending with 2, 3 or 4, except those ending with 12, 13 or 14
//   words[3] - for all other values
function wording(value, words) {
  if (value == 0) {
    return words[0];
  }
  else if (value === 1 || (value % 100 !== 11 && value % 10 === 1)) {
    return `${value} ${words[1]}`;
  }
  else if ((function() {
    const remMain = value % 100;
    const remSub = remMain % 10;
    return remSub > 1 && remSub < 5 && !(remMain > 11 && remMain < 15);
  })()) {
    return `${value} ${words[2]}`;
  }
  else {
    return `${value} ${words[3]}`;
  }
}

module.exports = wording;