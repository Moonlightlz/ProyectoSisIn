module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Disable CSS minification to avoid the slash error
      if (webpackConfig.optimization && webpackConfig.optimization.minimizer) {
        webpackConfig.optimization.minimizer = webpackConfig.optimization.minimizer.filter(
          (plugin) => plugin.constructor.name !== 'CssMinimizerPlugin'
        );
      }
      
      return webpackConfig;
    },
  },
};
