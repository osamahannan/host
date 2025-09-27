const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  entry: './src/index.tsx',
  mode: 'development',
  devServer: {
    port: 3000,
    headers: { 'Access-Control-Allow-Origin': '*' },
    historyApiFallback: { index: '/index.html' },
    static: path.resolve(__dirname, 'public'),
  },
  output: {
    publicPath: '/',
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
  ],
  stats: {
    errorDetails: true,
  },
};