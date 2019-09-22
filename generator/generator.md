```JS
// bemsFiles:
{
  block: {
    files: {
      pug: {
        path: 'path',
        mtime: 123,
        depFile: 'path'
      },
      scss: {
        path: 'path',
        mtime: 123,
        depFile: 'path'
      }
    },
    internalDependencies: [element, modifier]
  }
}

// dependencies
{
  block: {
    folder: internalDependencies,
    content: externalDependencies
  }
}
```

```JS
if (bemsFiles === previousBemsFiles) {
  // If nothing was changed, exit
  return;
}
else {
  // Check each block
  for (block in Object.entry(bemsFiles)) {
    const { name, info } = block;
    if (bemsFiles[name] === previousBemsFiles[name]) {
      // If block wasn't changed, check if dependencies were changed
      let changedFiles = new Set();
      dependencies[name].forEach(depName => {
        changedFiles.add(symmetricDifference(
          Object.keys(bemsFiles[depName].files),
          Object.keys(previousBemsFiles[depName].files)
        ));
      });
      changedFiles.forEach(ext => {
        // Regenerate dependencies for each extension
      })
    }
    else {
      // Block was changed
      if (info.files['.pug'] === previousBemsFiles[name].files['.pug']) {
        // Template wasn't changed, so don't re-parse
      }
      else {
        // Re-parse template and add dependencies
      }

      if (currentDependencies === previousDependencies) {
        // Check if dependencies file list were changed and regenerate for some extensions
      }
      else {
        // Regenerate dependencies
      }
    }
  }
}
```

```JS
// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set#Implementing_basic_set_operations
function symmetricDifference(setA, setB) {
    let difference = new Set(setA);
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
    let difference = new Set(setA);
    setB.forEach(elem => {
      difference.delete(elem);
    });
    return difference;
}
```