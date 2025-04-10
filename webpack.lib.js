const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production';
  
  return {
    mode: isProd ? 'production' : 'development',
    entry: './src/index.ts',
    devtool: isProd ? false : 'source-map',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'index.js',
      library: {
        name: 'OdysseyComponents',
        type: 'umd',
        export: 'default',
      },
      umdNamedDefine: true,
      globalObject: 'this',
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [
                    require('tailwindcss'),
                    require('autoprefixer'),
                  ],
                },
              },
            },
          ],
        },
        {
          test: /\.scss$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [
                    require('tailwindcss'),
                    require('autoprefixer'),
                  ],
                },
              },
            },
            'sass-loader',
          ],
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js', '.css', '.scss'],
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: 'components.bundle.css',
      }),
    ],
    externals: {
      lit: {
        commonjs: 'lit',
        commonjs2: 'lit',
        amd: 'lit',
        root: 'lit',
      }
    },
  };
};