module.exports = function (api) {
  api.cache(true);
  return {
    exclude: ['node_modules/libram/kolmafia.d.ts'],
    presets: [
      '@babel/preset-typescript',
      [
        '@babel/preset-env',
        {
          targets: { rhino: '1.7.13' },
        },
      ],
    ],
    plugins: [
      [
        '@babel/plugin-proposal-decorators',
        {
          decoratorsBeforeExport: true,
        },
      ],
      '@babel/plugin-proposal-class-properties',
      '@babel/plugin-proposal-object-rest-spread',
    ],
  };
};
