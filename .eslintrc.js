/* eslint-env node */
module.exports = {
  env: {
    node: true, // to mówi ESLint, że kod działa w Node.js i zna 'module', 'require', itp.
  },
  ignorePatterns: ["node_modules", "dist", "build", "coverage", "test-reports", "*.min.js", "*.bundle.js"],
  // ... existing code ...
};
