import type { StorybookConfig } from '@storybook/web-components-webpack5';
import remarkGfm from 'remark-gfm';

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-webpack5-compiler-swc",
    "@storybook/addon-essentials",
    '@storybook/addon-controls',
    '@storybook/addon-actions',
    '@storybook/addon-links',
    {
      name: '@storybook/addon-docs',
      options: {
        mdxPluginOptions: {
          mdxCompileOptions: {
            remarkPlugins: [remarkGfm],
          },
        },
      },
    },
  ],
  "framework": {
    "name": "@storybook/web-components-webpack5",
    "options": {}
  },
  webpackFinal: async (config) => {
    const TailwindCSSPlugin = require('tailwindcss');
    const AutoprefixerPlugin = require('autoprefixer');
    const MiniCssExtractPlugin = require('mini-css-extract-plugin');

    config.module?.rules?.push(
      {
      test: /\.scss$/,
      use: [
        MiniCssExtractPlugin.loader,
        'css-loader',
        {
        loader: 'postcss-loader',
        options: {
          postcssOptions: {
          plugins: [TailwindCSSPlugin, AutoprefixerPlugin],
          },
        },
        },
        'sass-loader',
      ],
      },
    );

    // Remove the output path override to let Storybook use its default location
    // This ensures iframe.html will be generated correctly

    config.plugins?.push(
      new MiniCssExtractPlugin({
        filename: 'components.bundle.css',
        chunkFilename: 'components.bundle.css' // This ensures chunk CSS files also use the same name
      }),
    );

    return config;
  },
};
export default config;