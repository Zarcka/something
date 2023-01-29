module.exports = {
   entry: "./routes/index.ts",
   output: {
      filename: "./dist/index.js",
   },
   devtool: "source-map",
   resolve: {
      extensions: ["", ".webpack.js", ".web.js", ".ts", ".tsx", ".js"],
   },
   module: {
      rules: [{
            test: /\.tsx?$/,
            loader: "ts-loader"
         },
         {
            test: /\.js$/,
            loader: "source-map-loader"
         },
      ],
   },
};