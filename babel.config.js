module.exports = {
  plugins: ["lodash"],
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          node: "12",
        },
      },
    ],
  ],
};
