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
      name: 'storybook-addon-sass-postcss',
      options: {
        test: /\.(scss|sass)$/i,
      },
    },
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
  }
};
export default config;