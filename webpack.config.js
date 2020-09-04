const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");

module.exports = {
    context: path.resolve(__dirname, './'),
    entry: {
      main: './src/index.js'
    },
    module: {
      rules: [
          {
            test: /\.css$/,
                use: ["style-loader", "css-loader"]
          }
      ]
    },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "src", "index.html")
    })
  ]
};