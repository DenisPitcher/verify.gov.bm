module.exports = {
  transpileDependencies: [
    'vuetify'
  ],
  pwa: {
    // configure the workbox plugin
    workboxPluginMode: 'InjectManifest',
    workboxOptions: {
        // swSrc is required in InjectManifest mode.
        swSrc: 'public/service-worker.js',
        // ...other Workbox options...

    },
  }
}
