// Sample test for lib.js

const lib = require('../lib/lib.js');

test('getDate returns a string', () => {
  expect(typeof lib.getDate()).toBe('string');
});
