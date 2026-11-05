const fs = require('node:fs'),
  path = require('node:path');
const files = {
  VOYAGES: 'voyages',
  FIELD_GUIDE: 'field-guide',
  ITEMS: 'items',
  RECIPES: 'recipes',
  NPCS: 'guardians',
  CHALLENGES: 'trials',
  KNOWLEDGE: 'discoveries',
};
module.exports = function contentSource() {
  return Object.entries(files)
    .map(([key, name]) => {
      const data = JSON.parse(
        fs.readFileSync(
          path.join(__dirname, 'content', name + '.json'),
          'utf8',
        ),
      );
      return 'const ' + key + '=' + JSON.stringify(data) + ';';
    })
    .join('\n');
};
