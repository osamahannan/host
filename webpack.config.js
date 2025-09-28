const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env) => {
  const isProduction = !!env.production;

  return {
    entry: './src/index.tsx',
    mode: isProduction ? 'production' : 'development',
    devServer: {
      port: 3000,
      headers: { 'Access-Control-Allow-Origin': '*' },
      historyApiFallback: { index: '/index.html', disableDotRule: true, },
      static: path.resolve(__dirname, 'public'),
    },
    output: {
      publicPath: '/',
      path: path.resolve(__dirname, 'dist'),
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
    },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
    plugins: [
      new ModuleFederationPlugin({
        name: 'host',
        shared: {
          react: {
            singleton: true,
            eager: true,
            requiredVersion: '^18.2.0',
          },
          'react-dom': {
            singleton: true,
            eager: true,
            requiredVersion: '^18.2.0',
          },
          'react-dom/client': {
            singleton: true,
            eager: true,
            requiredVersion: '^18.2.0',
          },
          'react/jsx-runtime': {
            singleton: true,
            eager: true,
            requiredVersion: '^18.2.0',
          },
          'react-router-dom': {
            singleton: true,
            eager: true,
            requiredVersion: '^6.4.0',
          },
        },
      }),
      new HtmlWebpackPlugin({
        template: './public/index.html',
      }),
      new CopyWebpackPlugin({
        patterns: [
          { from: 'public/config.json', to: 'config.json' },
        ],
      }),
    ],
    stats: {
      errorDetails: true,
    },
  };
};