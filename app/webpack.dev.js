const HtmlWebPackPlugin = require("html-webpack-plugin");

const htmlPlugin = new HtmlWebPackPlugin({
  template: "./src/index.html",
});

module.exports = {
  mode: "development",
  entry: "./src/main.ts",
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".json", ".css"]
  },
  module: {
    rules: [
      // Route typescript files to the appropriate loader
      { test: /\.tsx?$/i, loader: "ts-loader" },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ]
  },
  plugins: [
    htmlPlugin,
  ],
  devServer: {
    port: 8001,
    proxy: {
      "/api": "http://host.docker.internal:8000",
    },
  },
};
