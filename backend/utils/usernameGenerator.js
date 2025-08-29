const adjectives = ['Quick', 'Lazy', 'Clever', 'Brave'];
const nouns = ['Fox', 'Bear', 'Eagle', 'Wolf'];
let counter = 0;

module.exports = {
  generateUsername() {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adj}${noun}${counter++}`;
  },
};